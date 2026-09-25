import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { SessionContext } from '@/lib/session';

const DECIMAL_10_2_MAX = new Prisma.Decimal('99999999.99');

export const invoiceItemInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  quantity: z.number().finite().positive().max(99999999.99),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z.number().finite().min(0).max(99999999.99),
  vatRate: z.number().finite().min(0).max(999.99),
}).superRefine((value, ctx) => {
  const { subtotal, vatAmount, total } = computeItemAmounts(value.quantity, value.unitPrice, value.vatRate);
  if (subtotal.gt(DECIMAL_10_2_MAX)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quantity'], message: 'Částka položky je příliš vysoká.' });
  if (vatAmount.gt(DECIMAL_10_2_MAX)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vatRate'], message: 'DPH u položky je příliš vysoké.' });
  if (total.gt(DECIMAL_10_2_MAX)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unitPrice'], message: 'Celková částka položky je příliš vysoká.' });
});

export type ValidatedInvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;

export function validateInvoiceItemInput(input: unknown): ValidatedInvoiceItemInput {
  const result = invoiceItemInputSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Neplatné údaje položky faktury');
  return result.data;
}

function round2Decimal(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Výpočet každé položky: základ, DPH a celkem se zaokrouhlují na 2 desetinná místa. */
export function computeItemAmounts(quantity: number, unitPrice: number, vatRate: number) {
  const subtotal = round2Decimal(new Prisma.Decimal(quantity).mul(unitPrice));
  const vatAmount = round2Decimal(subtotal.mul(new Prisma.Decimal(vatRate).div(100)));
  const total = round2Decimal(subtotal.add(vatAmount));
  return { subtotal, vatAmount, total };
}

export function computeInvoiceTotals(items: { subtotal: Prisma.Decimal.Value; vatAmount: Prisma.Decimal.Value; total: Prisma.Decimal.Value }[]) {
  return {
    subtotal: round2Decimal(items.reduce((sum, i) => sum.add(new Prisma.Decimal(i.subtotal)), new Prisma.Decimal(0))),
    vatTotal: round2Decimal(items.reduce((sum, i) => sum.add(new Prisma.Decimal(i.vatAmount)), new Prisma.Decimal(0))),
    total: round2Decimal(items.reduce((sum, i) => sum.add(new Prisma.Decimal(i.total)), new Prisma.Decimal(0))),
  };
}

export type VatBreakdown = { rate: Prisma.Decimal; base: Prisma.Decimal; vat: Prisma.Decimal; total: Prisma.Decimal };

export function computeVatBreakdown(items: { vatRate: Prisma.Decimal.Value; subtotal: Prisma.Decimal.Value; vatAmount: Prisma.Decimal.Value; total: Prisma.Decimal.Value }[]): VatBreakdown[] {
  const groups = new Map<string, VatBreakdown>();
  for (const item of items) {
    const rate = round2Decimal(new Prisma.Decimal(item.vatRate));
    const key = rate.toFixed(2);
    const current = groups.get(key);
    if (current) {
      current.base = round2Decimal(current.base.add(new Prisma.Decimal(item.subtotal)));
      current.vat = round2Decimal(current.vat.add(new Prisma.Decimal(item.vatAmount)));
      current.total = round2Decimal(current.total.add(new Prisma.Decimal(item.total)));
    } else {
      groups.set(key, {
        rate,
        base: round2Decimal(new Prisma.Decimal(item.subtotal)),
        vat: round2Decimal(new Prisma.Decimal(item.vatAmount)),
        total: round2Decimal(new Prisma.Decimal(item.total)),
      });
    }
  }
  return [...groups.values()].sort((x, y) => x.rate.comparedTo(y.rate));
}

/**
 * Vytvoří návrh faktury (DRAFT) ze zakázky - položky se namapují z JobItem
 * (ne z JobTask checklistu), dodavatel a odběratel se předvyplní z Garage/
 * Customer. Je idempotentní: pokud už zakázka má nezrušenou fakturu, vrátí
 * tu existující místo vytvoření duplicity.
 */
export async function createInvoiceDraftFromJob(context: SessionContext, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, garageId: context.garageId },
    include: {
      customer: true,
      items: true,
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!job) throw new Error('Zakázka nenalezena');
  if (job.status !== 'DONE') throw new Error('Fakturu lze vystavit jen u dokončené zakázky');

  const existingActive = job.invoices.find((inv) => inv.status !== 'CANCELLED');
  if (existingActive) return existingActive;

  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });
  if (!garage) throw new Error('Servis nenalezen');

  const vatRate = garage.isVatPayer ? Number(garage.defaultVatRate ?? 0) : 0;

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + garage.invoiceDueDays);

  const itemsData = job.items.map((item) => {
    const input = validateInvoiceItemInput({
      title: item.title,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      vatRate,
    });
    const amounts = computeItemAmounts(input.quantity, input.unitPrice, input.vatRate);
    return {
      garageId: context.garageId,
      title: input.title,
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      vatRate: input.vatRate,
      ...amounts,
    };
  });

  const totals = computeInvoiceTotals(itemsData);

  const invoice = await prisma.invoice.create({
    data: {
      jobId: job.id,
      customerId: job.customerId,
      garageId: context.garageId,
      status: 'DRAFT',

      supplierName: garage.companyName || garage.name,
      supplierIco: garage.ico,
      supplierDic: garage.dic,
      supplierStreet: garage.street,
      supplierCity: garage.city,
      supplierZip: garage.zip,

      customerName: job.customer.companyName || job.customer.name,
      customerIco: job.customer.ico,
      customerDic: job.customer.dic,
      customerStreet: job.customer.street,
      customerCity: job.customer.city,
      customerZip: job.customer.zip,

      issueDate,
      dueDate,
      ...totals,

      items: { create: itemsData },
    },
  });

  return invoice;
}

export type InvoiceListFilters = {
  query?: string;
  status?: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  page?: number;
};

export const INVOICE_PAGE_SIZE = 25;

export async function listInvoices(context: SessionContext, filters: InvoiceListFilters = {}) {
  const q = filters.query?.trim();
  const safePage = Number.isInteger(filters.page) && (filters.page ?? 0) > 0 ? filters.page! : 1;

  const where = {
    garageId: context.garageId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(q ? { OR: [
      { number: { contains: q, mode: 'insensitive' as const } },
      { customerName: { contains: q, mode: 'insensitive' as const } },
      { job: { vehicle: { licensePlate: { contains: q, mode: 'insensitive' as const } } } },
    ] } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.invoice.findMany({
    where,
    take: INVOICE_PAGE_SIZE,
    skip: (safePage - 1) * INVOICE_PAGE_SIZE,
    include: {
      job: { include: { vehicle: { select: { licensePlate: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { items, total, page: safePage, pageSize: INVOICE_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / INVOICE_PAGE_SIZE)) };
}

export async function getInvoiceDetail(context: SessionContext, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, garageId: context.garageId },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
      job: { select: { id: true, number: true } },
    },
  });
}

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

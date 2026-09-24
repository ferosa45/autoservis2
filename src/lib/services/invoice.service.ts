import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { SessionContext } from '@/lib/session';

const DECIMAL_10_2_MAX = 99999999.99;

export const invoiceItemInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  quantity: z.number().finite().positive().max(DECIMAL_10_2_MAX),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z.number().finite().min(0).max(DECIMAL_10_2_MAX),
  vatRate: z.number().finite().min(0).max(999.99),
}).superRefine((value, ctx) => {
  const subtotal = round2(value.quantity * value.unitPrice);
  const vatAmount = round2(subtotal * (value.vatRate / 100));
  const total = round2(subtotal + vatAmount);
  if (!Number.isFinite(subtotal) || subtotal > DECIMAL_10_2_MAX) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quantity'], message: 'Částka položky je příliš vysoká.' });
  }
  if (!Number.isFinite(vatAmount) || vatAmount > DECIMAL_10_2_MAX) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vatRate'], message: 'DPH u položky je příliš vysoké.' });
  }
  if (!Number.isFinite(total) || total > DECIMAL_10_2_MAX) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unitPrice'], message: 'Celková částka položky je příliš vysoká.' });
  }
});

export type ValidatedInvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;

export function validateInvoiceItemInput(input: unknown): ValidatedInvoiceItemInput {
  const result = invoiceItemInputSchema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Neplatné údaje položky faktury');
  return result.data;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Dopočítá subtotal/vatAmount/total jedné položky. Vždy volat na serveru -
 * nikdy nevěřit částkám poslaným z klienta.
 */
export function computeItemAmounts(quantity: number, unitPrice: number, vatRate: number) {
  const subtotal = round2(quantity * unitPrice);
  const vatAmount = round2(subtotal * (vatRate / 100));
  const total = round2(subtotal + vatAmount);
  return { subtotal, vatAmount, total };
}

/**
 * Přepočítá součty celé faktury ze součtu jejích položek. Volat po každé
 * změně položky, nikdy nepočítat na klientovi.
 */
export function computeInvoiceTotals(
  items: { subtotal: unknown; vatAmount: unknown; total: unknown }[]
) {
  const subtotal = round2(items.reduce((sum, i) => sum + Number(i.subtotal), 0));
  const vatTotal = round2(items.reduce((sum, i) => sum + Number(i.vatAmount), 0));
  const total = round2(items.reduce((sum, i) => sum + Number(i.total), 0));
  return { subtotal, vatTotal, total };
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
};

export async function listInvoices(context: SessionContext, filters: InvoiceListFilters = {}) {
  const q = filters.query?.trim();

  return prisma.invoice.findMany({
    where: {
      garageId: context.garageId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { job: { vehicle: { licensePlate: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: {
      job: { include: { vehicle: { select: { licensePlate: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
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

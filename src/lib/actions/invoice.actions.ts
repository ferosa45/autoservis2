'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess } from '@/lib/session';
import {
  createInvoiceDraftFromJob,
  computeItemAmounts,
  computeInvoiceTotals,
} from '@/lib/services/invoice.service';

export async function startInvoiceDraft(jobId: string): Promise<{ invoiceId: string }> {
  const context = await getSessionContext();
  assertWriteAccess(context);
  const invoice = await createInvoiceDraftFromJob(context, jobId);
  revalidatePath(`/jobs/${jobId}`);
  return { invoiceId: invoice.id };
}

async function assertDraftOwnership(invoiceId: string, garageId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, garageId } });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status !== 'DRAFT') throw new Error('Vystavenou fakturu už nelze upravovat');
  return invoice;
}

async function recalculateInvoiceTotals(invoiceId: string) {
  const items = await prisma.invoiceItem.findMany({ where: { invoiceId } });
  const totals = computeInvoiceTotals(items);
  await prisma.invoice.update({ where: { id: invoiceId }, data: totals });
}

export type InvoiceItemInput = {
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
};

export async function addInvoiceItem(invoiceId: string, input: InvoiceItemInput) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertDraftOwnership(invoiceId, context.garageId);

  const title = input.title.trim();
  if (!title) return;

  const amounts = computeItemAmounts(input.quantity, input.unitPrice, input.vatRate);
  await prisma.invoiceItem.create({
    data: {
      invoiceId,
      garageId: context.garageId,
      title,
      quantity: input.quantity > 0 ? input.quantity : 1,
      unit: input.unit.trim() || 'ks',
      unitPrice: input.unitPrice >= 0 ? input.unitPrice : 0,
      vatRate: input.vatRate >= 0 ? input.vatRate : 0,
      ...amounts,
    },
  });

  await recalculateInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function updateInvoiceItem(
  itemId: string,
  invoiceId: string,
  input: InvoiceItemInput
) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertDraftOwnership(invoiceId, context.garageId);

  const title = input.title.trim();
  if (!title) return;

  const amounts = computeItemAmounts(input.quantity, input.unitPrice, input.vatRate);
  await prisma.invoiceItem.updateMany({
    where: { id: itemId, garageId: context.garageId, invoiceId },
    data: {
      title,
      quantity: input.quantity > 0 ? input.quantity : 1,
      unit: input.unit.trim() || 'ks',
      unitPrice: input.unitPrice >= 0 ? input.unitPrice : 0,
      vatRate: input.vatRate >= 0 ? input.vatRate : 0,
      ...amounts,
    },
  });

  await recalculateInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function removeInvoiceItem(itemId: string, invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertDraftOwnership(invoiceId, context.garageId);

  await prisma.invoiceItem.deleteMany({
    where: { id: itemId, garageId: context.garageId, invoiceId },
  });

  await recalculateInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function updateInvoiceMeta(
  invoiceId: string,
  input: { dueDate: string; note: string }
) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  await assertDraftOwnership(invoiceId, context.garageId);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      dueDate: new Date(input.dueDate),
      note: input.note.trim() || null,
    },
  });

  revalidatePath(`/invoices/${invoiceId}`);
}

export async function issueInvoice(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const issued = await prisma.$transaction(
    async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, garageId: context.garageId },
        include: { items: true },
      });
      if (!invoice) throw new Error('Faktura nenalezena');
      if (invoice.status !== 'DRAFT') throw new Error('Faktura už byla vystavena');
      if (invoice.items.length === 0) throw new Error('Faktura nemá žádné položky');

      const garage = await tx.garage.findUnique({ where: { id: context.garageId } });
      if (!garage) throw new Error('Servis nenalezen');
      if (garage.isVatPayer && garage.defaultVatRate == null) {
        throw new Error('Jako plátce DPH musíte v Nastavení doplnit výchozí sazbu DPH');
      }

      // Atomický zápis dalšího čísla přímo v transakci - i při dvojkliku
      // nebo dvou současně vystavovaných fakturách je bezpečné díky
      // row-level locku na UPDATE v rámci transakce.
      const updatedGarage = await tx.garage.update({
        where: { id: context.garageId },
        data: { nextInvoiceNumber: { increment: 1 } },
      });
      const assignedNumber = updatedGarage.nextInvoiceNumber - 1;
      const formattedNumber = garage.invoicePrefix
        ? `${garage.invoicePrefix}${String(assignedNumber).padStart(4, '0')}`
        : String(assignedNumber);

      const totals = computeInvoiceTotals(invoice.items);

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          number: formattedNumber,
          status: 'ISSUED',
          ...totals,
        },
      });
    },
    { timeout: 15000, maxWait: 10000 }
  );

  revalidatePath(`/invoices/${invoiceId}`);
  if (issued.jobId) revalidatePath(`/jobs/${issued.jobId}`);
  revalidatePath('/invoices');

  return { number: issued.number };
}

export async function cancelInvoice(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, garageId: context.garageId } });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status === 'PAID') throw new Error('Zaplacenou fakturu nelze zrušit');

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'CANCELLED' } });

  revalidatePath(`/invoices/${invoiceId}`);
  if (invoice.jobId) revalidatePath(`/jobs/${invoice.jobId}`);
  revalidatePath('/invoices');
}

export async function markInvoicePaid(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, garageId: context.garageId } });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status !== 'ISSUED') throw new Error('Označit jako zaplacené lze jen vystavenou fakturu');

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });

  revalidatePath(`/invoices/${invoiceId}`);
  if (invoice.jobId) revalidatePath(`/jobs/${invoice.jobId}`);
  revalidatePath('/invoices');
}

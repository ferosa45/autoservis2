'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionContext, assertWriteAccess, assertPermission } from '@/lib/session';
import { createInvoiceDraftFromJob, computeItemAmounts, computeInvoiceTotals } from '@/lib/services/invoice.service';

export async function startInvoiceDraft(jobId: string): Promise<{ invoiceId: string }> {
  const context = await getSessionContext();
  assertWriteAccess(context);
  assertPermission(context, 'canInvoice');
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
  await prisma.invoice.update({ where: { id: invoiceId }, data: computeInvoiceTotals(items) });
}
export type InvoiceItemInput = { title: string; quantity: number; unit: string; unitPrice: number; vatRate: number };

export async function addInvoiceItem(invoiceId: string, input: InvoiceItemInput) {
  const context = await getSessionContext(); assertWriteAccess(context); assertPermission(context, 'canInvoice'); await assertDraftOwnership(invoiceId, context.garageId);
  const title = input.title.trim(); if (!title) return;
  const amounts = computeItemAmounts(input.quantity, input.unitPrice, input.vatRate);
  await prisma.invoiceItem.create({ data: { invoiceId, garageId: context.garageId, title, quantity: input.quantity > 0 ? input.quantity : 1, unit: input.unit.trim() || 'ks', unitPrice: input.unitPrice >= 0 ? input.unitPrice : 0, vatRate: input.vatRate >= 0 ? input.vatRate : 0, ...amounts } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}
export async function updateInvoiceItem(itemId: string, invoiceId: string, input: InvoiceItemInput) {
  const context = await getSessionContext(); assertWriteAccess(context); assertPermission(context, 'canInvoice'); await assertDraftOwnership(invoiceId, context.garageId);
  const title = input.title.trim(); if (!title) return;
  const amounts = computeItemAmounts(input.quantity, input.unitPrice, input.vatRate);
  await prisma.invoiceItem.updateMany({ where: { id: itemId, garageId: context.garageId, invoiceId }, data: { title, quantity: input.quantity > 0 ? input.quantity : 1, unit: input.unit.trim() || 'ks', unitPrice: input.unitPrice >= 0 ? input.unitPrice : 0, vatRate: input.vatRate >= 0 ? input.vatRate : 0, ...amounts } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}
export async function removeInvoiceItem(itemId: string, invoiceId: string) {
  const context = await getSessionContext(); assertWriteAccess(context); assertPermission(context, 'canInvoice'); await assertDraftOwnership(invoiceId, context.garageId);
  await prisma.invoiceItem.deleteMany({ where: { id: itemId, garageId: context.garageId, invoiceId } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}
export async function updateInvoiceMeta(invoiceId: string, input: { dueDate: string; note: string }) {
  const context = await getSessionContext(); assertWriteAccess(context); assertPermission(context, 'canInvoice'); await assertDraftOwnership(invoiceId, context.garageId);
  await prisma.invoice.update({ where: { id: invoiceId }, data: { dueDate: new Date(input.dueDate), note: input.note.trim() || null } }); revalidatePath(`/invoices/${invoiceId}`);
}
export async function issueInvoice(invoiceId: string) {
  const context = await getSessionContext(); assertWriteAccess(context); assertPermission(context, 'canInvoice');
  const issued = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, garageId: context.garageId }, include: { items: true } });
    if (!invoice) throw new Error('Faktura nenalezena');
    if (invoice.status !== 'DRAFT') throw new Error('Faktura už byla vystavena');
    if (invoice.items.length === 0) throw new Error('Faktura nemá žádné položky');
    const garage = await tx.garage.findUnique({ where: { id: context.garageId } });
    if (!garage) throw new Error('Servis nenalezen');
    if (garage.isVatPayer && garage.defaultVatRate == null) throw new Error('Jako plátce DPH musíte v Nastavení doplnit výchozí sazbu DPH');
    const updatedGarage = await tx.garage.update({ where: { id: context.garageId }, data: { nextInvoiceNumber: { increment: 1 } } });
    const assignedNumber = updatedGarage.nextInvoiceNumber - 1;
    const formattedNumber = garage.invoicePrefix ? `${garage.invoicePrefix}${String(assignedNumber).padStart(4, '0')}` : String(assignedNumber);
    return tx.invoice.update({ where: { id: invoiceId }, data: { number: formattedNumber, status: 'ISSUED', ...computeInvoiceTotals(invoice.items) } });
  }, { timeout: 15000, maxWait: 10000 });
  revalidatePath(`/invoices/${invoiceId}`); if (issued.jobId) revalidatePath(`/jobs/${issued.jobId}`); revalidatePath('/invoices'); return { number: issued.number };
}

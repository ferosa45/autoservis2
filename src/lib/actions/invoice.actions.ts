'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext, assertWriteAccess, requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createInvoiceDraftFromJob, computeItemAmounts, computeInvoiceTotals, validateInvoiceItemInput } from '@/lib/services/invoice.service';

export type StartInvoiceDraftResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string };

export async function startInvoiceDraft(jobId: string): Promise<StartInvoiceDraftResult> {
  const context = await getSessionContext();

  try {
    assertWriteAccess(context);
    requirePermission(context, 'canInvoice');
    const invoice = await createInvoiceDraftFromJob(context, jobId);
    revalidatePath(`/jobs/${jobId}`);
    return { ok: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Nepodařilo se založit fakturu.',
    };
  }
}

async function assertDraftOwnership(invoiceId: string, garageId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, garageId } });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status !== 'DRAFT') throw new Error('Vystavenou fakturu už nelze upravovat');
  return invoice;
}

async function requireInvoiceEditAccess(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requirePermission(context, 'canInvoice');
  await assertDraftOwnership(invoiceId, context.garageId);
  return context;
}

async function recalculateInvoiceTotals(invoiceId: string) {
  const items = await prisma.invoiceItem.findMany({ where: { invoiceId } });
  await prisma.invoice.update({ where: { id: invoiceId }, data: computeInvoiceTotals(items) });
}

export type InvoiceItemInput = { title: string; quantity: number; unit: string; unitPrice: number; vatRate: number };

export async function addInvoiceItem(invoiceId: string, input: InvoiceItemInput) {
  const context = await requireInvoiceEditAccess(invoiceId);
  const valid = validateInvoiceItemInput(input);
  const amounts = computeItemAmounts(valid.quantity, valid.unitPrice, valid.vatRate);
  await prisma.invoiceItem.create({ data: { invoiceId, garageId: context.garageId, ...valid, ...amounts } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}

export async function updateInvoiceItem(itemId: string, invoiceId: string, input: InvoiceItemInput) {
  const context = await requireInvoiceEditAccess(invoiceId);
  const valid = validateInvoiceItemInput(input);
  const amounts = computeItemAmounts(valid.quantity, valid.unitPrice, valid.vatRate);
  await prisma.invoiceItem.updateMany({ where: { id: itemId, garageId: context.garageId, invoiceId }, data: { ...valid, ...amounts } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}

export async function removeInvoiceItem(itemId: string, invoiceId: string) {
  const context = await requireInvoiceEditAccess(invoiceId);
  await prisma.invoiceItem.deleteMany({ where: { id: itemId, garageId: context.garageId, invoiceId } });
  await recalculateInvoiceTotals(invoiceId); revalidatePath(`/invoices/${invoiceId}`);
}

export async function updateInvoiceMeta(invoiceId: string, input: { dueDate: string; note: string }) {
  await requireInvoiceEditAccess(invoiceId);
  await prisma.invoice.update({ where: { id: invoiceId }, data: { dueDate: new Date(input.dueDate), note: input.note.trim() || null } }); revalidatePath(`/invoices/${invoiceId}`);
}

export async function issueInvoice(invoiceId: string): Promise<{ ok: true; number: string | null } | { ok: false; error: string }> {
  const context = await getSessionContext(); assertWriteAccess(context); requirePermission(context, 'canInvoice');

  class InvoiceIssueValidationError extends Error {}

  try {
    const issued = await prisma.$transaction(async (tx) => {
    const claimed = await tx.invoice.updateMany({
      where: { id: invoiceId, garageId: context.garageId, status: 'DRAFT' },
      data: { status: 'ISSUED' },
    });
    if (claimed.count !== 1) {
      throw new InvoiceIssueValidationError('Faktura už byla vystavena nebo neexistuje.');
    }

    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, garageId: context.garageId },
      include: { items: true },
    });
    if (!invoice) throw new InvoiceIssueValidationError('Faktura nenalezena.');
    if (invoice.items.length === 0) throw new InvoiceIssueValidationError('Faktura nemá žádné položky.');

    const garage = await tx.garage.findUnique({ where: { id: context.garageId } });
    if (!garage) throw new InvoiceIssueValidationError('Servis nenalezen.');
    if (!garage.ico?.trim()) throw new InvoiceIssueValidationError('Před vystavením faktury doplňte IČO servisu.');
    if (!garage.street?.trim() || !garage.city?.trim() || !garage.zip?.trim()) {
      throw new InvoiceIssueValidationError('Před vystavením faktury doplňte úplnou adresu servisu.');
    }
    if (garage.isVatPayer && !garage.dic?.trim()) {
      throw new InvoiceIssueValidationError('Před vystavením faktury plátce DPH doplňte DIČ.');
    }

    const normalizedItems = invoice.items.map((item) => {
      const valid = validateInvoiceItemInput({
        title: item.title,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
      });
      return { item, valid, amounts: computeItemAmounts(valid.quantity, valid.unitPrice, valid.vatRate) };
    });

    await Promise.all(
      normalizedItems.map(({ item, valid, amounts }) =>
        tx.invoiceItem.update({
          where: { id: item.id },
          data: { ...valid, ...amounts },
        })
      )
    );

    const invoiceTotals = computeInvoiceTotals(
      normalizedItems.map(({ amounts }) => amounts)
    );

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + garage.invoiceDueDays);

    const updatedGarage = await tx.garage.update({
      where: { id: context.garageId },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const assignedNumber = updatedGarage.nextInvoiceNumber - 1;
    const formattedNumber = garage.invoicePrefix ? `${garage.invoicePrefix}${String(assignedNumber).padStart(4, '0')}` : String(assignedNumber);
    const issuedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        number: formattedNumber,
        status: 'ISSUED',
        supplierName: garage.companyName || garage.name,
        supplierIco: garage.ico,
        supplierDic: garage.dic,
        supplierStreet: garage.street,
        supplierCity: garage.city,
        supplierZip: garage.zip,
        supplierBankAccount: garage.bankAccount,
        supplierIban: garage.iban,
        supplierIsVatPayer: garage.isVatPayer,
        issueDate,
        dueDate,
        ...invoiceTotals,
      },
    });
    if (issuedInvoice.jobId) {
      await tx.jobEvent.create({
        data: {
          type: 'INVOICE_ISSUED',
          message: `Vystavena faktura ${formattedNumber}`,
          jobId: issuedInvoice.jobId,
          userId: context.userId,
          garageId: context.garageId,
        },
      });
    }
    return issuedInvoice;
    }, { timeout: 15000, maxWait: 10000 });
    revalidatePath(`/invoices/${invoiceId}`); if (issued.jobId) revalidatePath(`/jobs/${issued.jobId}`); revalidatePath('/invoices');
    return { ok: true, number: issued.number };
  } catch (error) {
    if (error instanceof InvoiceIssueValidationError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Vystavení faktury se nezdařilo. Zkuste to prosím znovu.' };
  }
}

export async function cancelInvoice(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requirePermission(context, 'canInvoice');

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, garageId: context.garageId },
    select: { id: true, jobId: true, status: true },
  });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status === 'PAID') throw new Error('Zaplacenou fakturu nelze zrušit');
  if (invoice.status === 'CANCELLED') throw new Error('Faktura už byla zrušena');

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: 'CANCELLED' },
    });
    if (invoice.jobId) {
      await tx.jobEvent.create({
        data: {
          type: 'INVOICE_CANCELLED',
          message: 'Faktura zrušena',
          jobId: invoice.jobId,
          userId: context.userId,
          garageId: context.garageId,
        },
      });
    }
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
  if (invoice.jobId) revalidatePath(`/jobs/${invoice.jobId}`);
}

export async function markInvoicePaid(invoiceId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requirePermission(context, 'canInvoice');

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, garageId: context.garageId },
    select: { id: true, jobId: true, status: true },
  });
  if (!invoice) throw new Error('Faktura nenalezena');
  if (invoice.status !== 'ISSUED') throw new Error('Zaplacenou lze označit pouze vystavenou fakturu');

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' },
    });
    if (invoice.jobId) {
      await tx.jobEvent.create({
        data: {
          type: 'INVOICE_PAID',
          message: 'Faktura označena jako zaplacená',
          jobId: invoice.jobId,
          userId: context.userId,
          garageId: context.garageId,
        },
      });
    }
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
  if (invoice.jobId) revalidatePath(`/jobs/${invoice.jobId}`);
}

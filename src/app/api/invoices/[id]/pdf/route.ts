import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/session';
import { getInvoiceDetail } from '@/lib/services/invoice.service';
import { prisma } from '@/lib/prisma';
import { buildInvoiceDocument, type InvoicePdfData } from '@/lib/pdf/invoice-document';

// @react-pdf/renderer potřebuje Node.js APII (fs pro čtení fontů) - ne Edge runtime.
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();

  const [invoice, garage] = await Promise.all([
    getInvoiceDetail(context, id),
    prisma.garage.findUnique({
      where: { id: context.garageId },
      select: { isVatPayer: true, bankAccount: true },
    }),
  ]);

  if (!invoice) {
    return new NextResponse('Faktura nenalezena', { status: 404 });
  }
  if (invoice.status === 'DRAFT') {
    return new NextResponse('Koncept faktury zatím nelze stáhnout jako PDF - nejdřív ji vystavte.', {
      status: 400,
    });
  }

  const data: InvoicePdfData = {
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    supplierName: invoice.supplierName,
    supplierIco: invoice.supplierIco,
    supplierDic: invoice.supplierDic,
    supplierStreet: invoice.supplierStreet,
    supplierCity: invoice.supplierCity,
    supplierZip: invoice.supplierZip,
    supplierBankAccount: garage?.bankAccount ?? null,
    customerName: invoice.customerName,
    customerIco: invoice.customerIco,
    customerDic: invoice.customerDic,
    customerStreet: invoice.customerStreet,
    customerCity: invoice.customerCity,
    customerZip: invoice.customerZip,
    isVatPayer: garage?.isVatPayer ?? false,
    items: invoice.items.map((item) => ({
      title: item.title,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      subtotal: Number(item.subtotal),
      vatAmount: Number(item.vatAmount),
      total: Number(item.total),
    })),
    subtotal: Number(invoice.subtotal),
    vatTotal: Number(invoice.vatTotal),
    total: Number(invoice.total),
    note: invoice.note,
  };

  // buildInvoiceDocument vrací hotový element strom sestavený uvnitř
  // invoice-document.ts přes syrový Node require('react') - viz poznámka
  // tam. Tady se s Reactem vůbec nepracuje, jen se předá výsledek dál.
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const element = buildInvoiceDocument(data) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="faktura-${invoice.number ?? invoice.id}.pdf"`,
    },
  });
}

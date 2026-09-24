import { notFound } from 'next/navigation';
import { getSessionContext, requirePermission } from '@/lib/session';
import { getInvoiceDetail } from '@/lib/services/invoice.service';
import { prisma } from '@/lib/prisma';
import { serializeInvoiceItems } from '@/lib/serialize';
import { InvoiceHeader } from '@/components/invoices/invoice-header';
import { InvoiceParties } from '@/components/invoices/invoice-parties';
import { InvoiceItemsEditor } from '@/components/invoices/invoice-items-editor';
import { InvoiceMetaEditor } from '@/components/invoices/invoice-meta-editor';
import { InvoiceActions } from '@/components/invoices/invoice-actions';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getSessionContext();
  requirePermission(context, 'canViewInvoices');
  const [invoice, garage] = await Promise.all([
    getInvoiceDetail(context, id),
    prisma.garage.findUnique({ where: { id: context.garageId }, select: { isVatPayer: true } }),
  ]);
  if (!invoice) notFound();
  const isEditable = invoice.status === 'DRAFT' && (context.role === 'OWNER' || context.permissions.canInvoice);
  const isVatPayer = garage?.isVatPayer ?? false;
  const serializedItems = serializeInvoiceItems(invoice.items);
  return <div className="mx-auto max-w-4xl space-y-6 p-6">
    <InvoiceHeader number={invoice.number} status={invoice.status} issueDate={invoice.issueDate} dueDate={invoice.dueDate} jobId={invoice.jobId} />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <InvoiceParties supplier={{ name: invoice.supplierName, ico: invoice.supplierIco, dic: invoice.supplierDic, street: invoice.supplierStreet, city: invoice.supplierCity, zip: invoice.supplierZip }} customer={{ name: invoice.customerName, ico: invoice.customerIco, dic: invoice.customerDic, street: invoice.customerStreet, city: invoice.customerCity, zip: invoice.customerZip }} />
      <InvoiceItemsEditor invoiceId={invoice.id} items={serializedItems} isVatPayer={isVatPayer} isEditable={isEditable} subtotal={Number(invoice.subtotal)} vatTotal={Number(invoice.vatTotal)} total={Number(invoice.total)} />
      <InvoiceMetaEditor invoiceId={invoice.id} dueDate={invoice.dueDate} initialNote={invoice.note} isEditable={isEditable} />
    </div><div className="space-y-6"><InvoiceActions invoiceId={invoice.id} status={invoice.status} /></div></div>
  </div>;
}

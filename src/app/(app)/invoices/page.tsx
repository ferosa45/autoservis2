import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { listInvoices } from '@/lib/services/invoice.service';
import { formatShortDate, formatCurrency } from '@/lib/format';
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_CLASS } from '@/lib/invoice-status';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@prisma/client';

const STATUS_TABS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Všechny' },
  { value: 'DRAFT', label: 'Koncept' },
  { value: 'ISSUED', label: 'Vystavené' },
  { value: 'PAID', label: 'Zaplacené' },
  { value: 'CANCELLED', label: 'Zrušené' },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const context = await getSessionContext();

  const validStatus = STATUS_TABS.find((t) => t.value === status)?.value || undefined;
  const invoices = await listInvoices(context, { query: q, status: validStatus || undefined });

  function tabHref(value: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (value) params.set('status', value);
    const qs = params.toString();
    return qs ? `/invoices?${qs}` : '/invoices';
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Faktury</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                (status ?? '') === tab.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-elevated'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Obyčejný GET formulář - zachovává filtr stavu jako hidden pole */}
        <form method="GET" className="relative w-full max-w-xs sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Číslo, zákazník, SPZ..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">
            <FileText className="mx-auto mb-2 h-8 w-8 text-text-muted" />
            {q || status ? 'Nic nenalezeno.' : 'Zatím žádné faktury.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-medium">Číslo</th>
                <th className="px-4 py-3 font-medium">Zákazník</th>
                <th className="px-4 py-3 font-medium">Vystaveno</th>
                <th className="px-4 py-3 font-medium">Splatnost</th>
                <th className="px-4 py-3 text-right font-medium">Částka</th>
                <th className="px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-elevated">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${invoice.id}`} className="font-mono text-text-primary hover:text-primary">
                      {invoice.number ?? 'koncept'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {invoice.customerName}
                    {invoice.job?.vehicle?.licensePlate && (
                      <span className="ml-2 font-mono text-xs text-text-muted">
                        {invoice.job.vehicle.licensePlate}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatShortDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatShortDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3 text-right text-text-primary">{formatCurrency(Number(invoice.total))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-xs font-semibold',
                        INVOICE_STATUS_CLASS[invoice.status]
                      )}
                    >
                      {INVOICE_STATUS_LABEL[invoice.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

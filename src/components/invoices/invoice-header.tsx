import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { formatShortDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_CLASS } from '@/lib/invoice-status';
import type { InvoiceStatus } from '@prisma/client';

export function InvoiceHeader({
  number,
  status,
  issueDate,
  dueDate,
  jobId,
}: {
  number: string | null;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  jobId: string | null;
}) {
  return (
    <div>
      <Link
        href={jobId ? `/jobs/${jobId}` : '/invoices'}
        className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        {jobId ? 'Zpět na zakázku' : 'Zpět na faktury'}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            {number ? (
              <>
                Faktura <span className="font-mono">{number}</span>
              </>
            ) : (
              'Koncept faktury'
            )}
          </h1>
          <p className="text-sm text-text-secondary">
            Vystaveno {formatShortDate(issueDate)} · Splatnost {formatShortDate(dueDate)}
          </p>
        </div>
        <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase', INVOICE_STATUS_CLASS[status])}>
          {INVOICE_STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}

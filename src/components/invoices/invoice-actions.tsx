'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, XCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { issueInvoice, cancelInvoice, markInvoicePaid } from '@/lib/actions/invoice.actions';
import { getActionErrorMessage } from '@/lib/action-errors';
import type { InvoiceStatus } from '@prisma/client';

export function InvoiceActions({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleIssue() {
    setError(null);
    startTransition(async () => {
      try {
        await issueInvoice(invoiceId);
        router.refresh();
      } catch (e) {
        setError(getActionErrorMessage(e, 'Vystavení se nezdařilo'));
      }
    });
  }

  function handleCancel() {
    if (!confirm('Opravdu zrušit tuto fakturu?')) return;
    setError(null);
    startTransition(async () => {
      try {
        await cancelInvoice(invoiceId);
        router.refresh();
      } catch (e) {
        setError(getActionErrorMessage(e, 'Zrušení se nezdařilo'));
      }
    });
  }

  function handleMarkPaid() {
    setError(null);
    startTransition(async () => {
      try {
        await markInvoicePaid(invoiceId);
        router.refresh();
      } catch (e) {
        setError(getActionErrorMessage(e, 'Označení se nezdařilo'));
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Akce</h3>

      <div className="space-y-2">
        {status === 'DRAFT' && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={handleIssue}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
              Vystavit fakturu
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Zrušit koncept
            </button>
          </>
        )}

        {status === 'ISSUED' && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkPaid}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-status-done-text px-3 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Označit jako zaplacené
            </button>
            <a
              href={`/api/invoices/${invoiceId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border"
            >
              <Download className="h-4 w-4" />
              Stáhnout PDF
            </a>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-border disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Zrušit fakturu
            </button>
          </>
        )}

        {status === 'PAID' && (
          <a
            href={`/api/invoices/${invoiceId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border"
          >
            <Download className="h-4 w-4" />
            Stáhnout PDF
          </a>
        )}

        {status === 'CANCELLED' && <p className="text-sm text-text-muted">Tato faktura byla zrušena.</p>}
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
          {error}
        </p>
      )}
    </div>
  );
}

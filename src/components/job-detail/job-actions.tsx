'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PackageX,
  CheckCircle2,
  MessageSquareText,
  Loader2,
  FileText,
  FileCheck,
  Play,
} from 'lucide-react';
import { setJobStatus, sendJobSms } from '@/lib/actions/today.actions';
import { startInvoiceDraft } from '@/lib/actions/invoice.actions';
import type { JobStatus, InvoiceStatus } from '@prisma/client';

type LatestInvoice = { id: string; number: string | null; status: InvoiceStatus } | null;

export function JobActions({
  jobId,
  status,
  latestInvoice,
}: {
  jobId: string;
  status: JobStatus;
  latestInvoice: LatestInvoice;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(nextStatus: JobStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await setJobStatus(jobId, nextStatus);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nepodařilo se změnit stav zakázky');
      }
    });
  }

  function handleStartInvoice() {
    setError(null);
    startTransition(async () => {
      try {
        const { invoiceId } = await startInvoiceDraft(jobId);
        router.push(`/invoices/${invoiceId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nepodařilo se založit fakturu');
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Akce</h3>

      {status === 'WAITING' && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange('IN_PROGRESS')}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Zahájit práci
        </button>
      )}

      {status === 'IN_PROGRESS' && (
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange('BLOCKED')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageX className="h-4 w-4" />}
            Čeká na díl / zákazníka
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange('DONE')}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-status-done-text px-3 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Hotovo
          </button>
        </div>
      )}

      {status === 'BLOCKED' && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange('IN_PROGRESS')}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Pokračovat v práci
        </button>
      )}

      {status === 'DONE' && (
        <div className="space-y-2">
          {!latestInvoice && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleStartInvoice}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Vystavit fakturu
            </button>
          )}

          {latestInvoice?.status === 'DRAFT' && (
            <Link
              href={`/invoices/${latestInvoice.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <FileText className="h-4 w-4" />
              Pokračovat v konceptu faktury
            </Link>
          )}

          {(latestInvoice?.status === 'ISSUED' || latestInvoice?.status === 'PAID') && (
            <div className="rounded-lg border border-border bg-elevated p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                  <FileCheck className="h-4 w-4 text-status-done-text" />
                  Faktura {latestInvoice.number}
                </span>
                {latestInvoice.status === 'PAID' && (
                  <span className="text-xs font-semibold text-status-done-text">ZAPLACENO</span>
                )}
              </div>
              <Link
                href={`/invoices/${latestInvoice.id}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-border"
              >
                Zobrazit fakturu
              </Link>
            </div>
          )}

          <button
            type="button"
            disabled={isPending || smsSent}
            onClick={() =>
              startTransition(async () => {
                await sendJobSms(jobId);
                setSmsSent(true);
              })
            }
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
            {smsSent ? 'SMS odeslána (mock)' : 'Poslat SMS zákazníkovi'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
          {error}
        </p>
      )}
    </div>
  );
}

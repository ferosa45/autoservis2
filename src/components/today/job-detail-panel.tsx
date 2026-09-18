'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, PackageX, CheckCircle2, MessageSquareText, Pencil, X, Play, Receipt, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { formatDateTime, formatTime, formatCurrency } from '@/lib/format';
import { setJobStatus, sendJobSms } from '@/lib/actions/today.actions';
import { startInvoiceDraft } from '@/lib/actions/invoice.actions';
import { getActionErrorMessage, READ_ONLY_ACCESS_MESSAGE } from '@/lib/action-errors';
import { JOB_STATUS_LABEL } from '@/lib/job-status';
import { cn } from '@/lib/utils';

import type { SerializedJobItem } from '@/lib/serialize';
import type { JobStatus } from '@prisma/client';

type Job = {
  id: string;
  status: JobStatus;
  createdAt: Date;
  scheduledEnd: Date | null;
  customerRequest: string;
  note: string | null;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string | null;
  };
  assignedUser: {
    name: string;
  } | null;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  items: SerializedJobItem[];
  activeInvoice: {
    id: string;
    status: 'DRAFT' | 'ISSUED' | 'PAID';
  } | null;
};

const TABS = ['Přehled', 'Práce a díly'] as const;
type Tab = (typeof TABS)[number];

export function JobDetailPanel({ job }: { job: Job }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Přehled');
  const [localStatus, setLocalStatus] = useState<JobStatus>(job.status);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalStatus(job.status);
  }, [job.status]);
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsTotal = job.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleInvoice = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (job.activeInvoice) {
          router.push(`/invoices/${job.activeInvoice.id}`);
          return;
        }

        const { invoiceId } = await startInvoiceDraft(job.id);
        router.push(`/invoices/${invoiceId}`);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Fakturu se nepodařilo otevřít.'));
      }
    });
  };

  const handleStatusChange = (status: JobStatus) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await setJobStatus(job.id, status);
        if (!result.success) {
          if (result.error === 'READ_ONLY_ACCESS') {
            setError(READ_ONLY_ACCESS_MESSAGE);
          }
          return;
        }
        router.refresh();
      } catch (err) {
        setError(getActionErrorMessage(err, 'Stav zakázky se nepodařilo změnit.'));
      }
    });
  };

  const handleSendSms = () => {
    setError(null);
    startTransition(async () => {
      try {
        await sendJobSms(job.id);
        setSmsSent(true);
      } catch (err) {
        setError(getActionErrorMessage(err, 'SMS se nepodařilo odeslat.'));
      }
    });
  };

  const invoiceButtonLabel =
    job.activeInvoice?.status === 'DRAFT'
      ? 'Pokračovat ve faktuře'
      : job.activeInvoice
        ? 'Otevřít fakturu'
        : 'Vystavit fakturu';

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <StatusBadge status={localStatus} />
        <div className="flex items-center gap-1">
          <Link
            href={`/jobs/${job.id}`}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-elevated"
          >
            <Pencil className="h-3.5 w-3.5" />
            Upravit
          </Link>
          <Link
            href="/today"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Zavřít"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated">
          <Car className="h-8 w-8 text-text-muted" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {job.vehicle.brand} {job.vehicle.model}
          </h2>
          {job.vehicle.licensePlate ? (
            <span className="mt-1 inline-block rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-secondary">
              {job.vehicle.licensePlate}
            </span>
          ) : (
            <span className="mt-1 inline-block text-xs text-text-muted">SPZ nedoplněna</span>
          )}
          <p className="mt-1.5 text-sm text-text-secondary">{job.customer.name}</p>
          <p className="text-sm text-text-muted">{job.customer.phone}</p>
        </div>
      </div>

      <div className="flex border-b border-border px-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {(job.status === 'WAITING' || job.status === 'IN_PROGRESS' || job.status === 'BLOCKED' || job.status === 'DONE') && (
        <div className="shrink-0 border-b border-border bg-surface p-4">
          {error && (
            <p className="mb-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
              {error}
            </p>
          )}

          {localStatus === 'WAITING' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isPending ? 'Spouštím…' : 'Zahájit práci'}
            </button>
          )}

          {localStatus === 'IN_PROGRESS' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange('BLOCKED')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageX className="h-4 w-4" />}
                {isPending ? 'Ukládám…' : 'Čeká na díl'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange('DONE')}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-status-done-text px-3 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isPending ? 'Dokončuji…' : 'Hotovo'}
              </button>
            </div>
          )}

          {localStatus === 'BLOCKED' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isPending ? 'Spouštím…' : 'Pokračovat v práci'}
            </button>
          )}

          {localStatus === 'DONE' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleInvoice}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                <Receipt className="h-4 w-4" />
                {isPending ? 'Otevírám…' : invoiceButtonLabel}
              </button>
              <button
                type="button"
                disabled={isPending || smsSent}
                onClick={handleSendSms}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50"
              >
                <MessageSquareText className="h-4 w-4" />
                {smsSent ? 'SMS odeslána (mock)' : 'Poslat SMS'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Přehled' ? (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Informace o zakázce
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Přijato</dt>
                  <dd className="text-text-primary">{formatDateTime(job.createdAt)}</dd>
                </div>
                {job.scheduledEnd && (
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Předpokládaný konec</dt>
                    <dd className="text-text-primary">{formatTime(job.scheduledEnd)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Stav</dt>
                  <dd className="text-text-primary">{JOB_STATUS_LABEL[localStatus]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Mechanik</dt>
                  <dd className="text-text-primary">{job.assignedUser?.name ?? 'Nepřiřazeno'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Co zákazník nahlásil
              </h3>
              <p className="text-sm text-text-primary">{job.customerRequest}</p>
            </div>

            {job.note && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Poznámka
                </h3>
                <p className="text-sm text-text-primary">{job.note}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Práce</h3>
              <ul className="space-y-1.5">
                {job.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm text-text-primary">
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border',
                        t.completed ? 'border-status-done-text bg-status-done-bg' : 'border-border'
                      )}
                    >
                      {t.completed && <CheckCircle2 className="h-3 w-3 text-status-done-text" />}
                    </span>
                    <span className={t.completed ? 'line-through text-text-muted' : ''}>{t.title}</span>
                  </li>
                ))}
                {job.tasks.length === 0 && <p className="text-sm text-text-muted">Žádné položky</p>}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Položky</h3>
              <div className="space-y-2">
                {job.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-muted">
                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-text-primary">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                ))}
                {job.items.length === 0 && <p className="text-sm text-text-muted">Žádné položky</p>}
              </div>
              {job.items.length > 0 && (
                <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span className="text-text-primary">Celkem</span>
                  <span className="text-text-primary">{formatCurrency(itemsTotal)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

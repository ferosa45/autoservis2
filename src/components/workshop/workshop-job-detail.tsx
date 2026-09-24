'use client';

import { useState, useTransition } from 'react';
import { Car, Phone, PackageX, CheckCircle2, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { setJobStatus } from '@/lib/actions/today.actions';
import { toggleJobTask } from '@/lib/actions/job-detail.actions';
import { getActionErrorMessage, READ_ONLY_ACCESS_MESSAGE } from '@/lib/action-errors';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SerializedJobItem } from '@/lib/serialize';
import type { JobStatus } from '@prisma/client';

type WorkshopJob = {
  id: string;
  status: JobStatus;
  customerRequest: string;
  note: string | null;
  customer: { name: string; phone: string };
  vehicle: { brand: string; model: string; licensePlate: string | null };
  tasks: { id: string; title: string; completed: boolean }[];
  items: SerializedJobItem[];
};

export function WorkshopJobDetail({ job, showFinancials }: { job: WorkshopJob; showFinancials: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = job.items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0);

  const handleStatusChange = (status: JobStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await setJobStatus(job.id, status);
        if (!result.success && result.error === 'READ_ONLY_ACCESS') {
          setError(READ_ONLY_ACCESS_MESSAGE);
        }
      } catch (err) {
        setError(getActionErrorMessage(err, 'Stav zakázky se nepodařilo změnit.'));
      }
    });
  };

  const handleToggleTask = (task: WorkshopJob['tasks'][number]) => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleJobTask(task.id, !task.completed, job.id);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Práci se nepodařilo upravit.'));
      }
    });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated">
            <Car className="h-7 w-7 text-text-muted" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-text-primary">
              {job.vehicle.brand} {job.vehicle.model}
            </h2>
            {job.vehicle.licensePlate ? (
              <span className="inline-block rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-sm text-text-secondary">
                {job.vehicle.licensePlate}
              </span>
            ) : (
              <span className="text-sm text-text-muted">SPZ nedoplněna</span>
            )}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mb-4 flex items-center gap-4 text-base text-text-secondary">
        <span>{job.customer.name}</span>
        <span className="flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-text-muted" />
          {job.customer.phone}
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Co zákazník nahlásil
        </h3>
        <p className="text-base text-text-primary">{job.customerRequest}</p>
      </div>

      {job.tasks.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Práce</h3>
          <ul className="space-y-1">
            {job.tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleTask(task)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-elevated"
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                      task.completed ? 'border-status-done-text bg-status-done-bg' : 'border-border'
                    )}
                  >
                    {task.completed && <CheckCircle2 className="h-4 w-4 text-status-done-text" />}
                  </span>
                  <span
                    className={cn(
                      'text-base',
                      task.completed ? 'text-text-muted line-through' : 'text-text-primary'
                    )}
                  >
                    {task.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.items.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Položky</h3>
          <div className="space-y-1.5">
            {job.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  {item.title} ({item.quantity} {item.unit})
                </span>
                {showFinancials && item.unitPrice !== null && (
                  <span className="text-text-primary">{formatCurrency(item.quantity * item.unitPrice)}</span>
                )}
              </div>
            ))}
          </div>
          {showFinancials && (
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
            <span className="text-text-primary">Celkem</span>
            <span className="text-text-primary">{formatCurrency(total)}</span>
          </div>
        )}
        </div>
      )}

      {job.note && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Poznámka</h3>
          <p className="text-sm text-text-primary">{job.note}</p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {error}
        </p>
      )}

      {job.status !== 'DONE' && (
        <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange('BLOCKED')}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 border-border bg-elevated text-base font-bold text-text-primary hover:bg-border disabled:opacity-50"
          >
            <PackageX className="h-5 w-5" />
            ČEKÁ NA DÍL
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange('DONE')}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-status-done-text text-base font-bold text-background hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            HOTOVO
          </button>
        </div>
      )}
    </div>
  );
}

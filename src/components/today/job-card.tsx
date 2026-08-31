'use client';

import Link from 'next/link';
import { Phone, User, Play, Package, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { JOB_STATUS_COLOR } from '@/lib/job-status';
import { formatTime, formatShortDate } from '@/lib/format';
import { setJobStatus } from '@/lib/actions/today.actions';
import { cn } from '@/lib/utils';
import type { JobForDay } from '@/lib/services/today.service';

function rightSideLabel(job: JobForDay): string {
  switch (job.status) {
    case 'DONE': return job.scheduledEnd ? `Konec: ${formatTime(job.scheduledEnd)}` : 'Hotovo';
    case 'IN_PROGRESS': return job.scheduledEnd ? `Předpoklad: ${formatTime(job.scheduledEnd)}` : 'Pracuje se';
    case 'BLOCKED': return `Od: ${formatShortDate(job.updatedAt)}`;
    case 'WAITING':
    default: return `Start: ${formatTime(job.scheduledStart)}`;
  }
}

export function JobCard({ job, isSelected }: { job: JobForDay; isSelected: boolean }) {
  const primaryTask = job.tasks[0]?.title ?? job.customerRequest;
  const secondaryTask = job.tasks[1]?.title;
  const colors = JOB_STATUS_COLOR[job.status];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeStatus = (event: React.MouseEvent<HTMLButtonElement>, status: JobForDay['status']) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      await setJobStatus(job.id, status);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:brightness-110 sm:flex-row sm:gap-4 sm:p-4',
        colors.bg,
        colors.border,
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <Link href={`/today?job=${job.id}`} className="flex min-w-0 flex-1 gap-2 sm:gap-4">
        <div className={cn('w-12 shrink-0 pt-1 text-sm font-medium sm:w-14', colors.text)}>
          {formatTime(job.scheduledStart)}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="min-w-0 truncate font-heading text-sm font-bold uppercase tracking-wide text-text-primary">
                {job.vehicle.brand} {job.vehicle.model}
              </h3>
              {job.vehicle.licensePlate && (
                <span className="shrink-0 rounded border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                  {job.vehicle.licensePlate}
                </span>
              )}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-sm text-text-secondary">
              <li className="truncate">&middot; {primaryTask}</li>
              {secondaryTask && <li className="truncate">&middot; {secondaryTask}</li>}
            </ul>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <span className="flex items-center gap-1 truncate"><User className="h-3 w-3 shrink-0" /> {job.customer.name}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {job.customer.phone}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
            <StatusBadge status={job.status} className="border-white/10 bg-black/20" />
            <span className={cn('text-xs', colors.text)}>{rightSideLabel(job)}</span>
          </div>
        </div>
      </Link>

      {job.status !== 'DONE' && (
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
          {(job.status === 'WAITING' || job.status === 'BLOCKED') && (
            <button
              type="button"
              disabled={isPending}
              onClick={(event) => changeStatus(event, 'IN_PROGRESS')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {isPending ? 'Spouštím…' : job.status === 'WAITING' ? 'Zahájit' : 'Pokračovat'}
            </button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={(event) => changeStatus(event, 'BLOCKED')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-black/30 disabled:opacity-50"
          >
            <Package className="h-3.5 w-3.5" />
            Čeká na díl
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={(event) => changeStatus(event, 'DONE')}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-status-done-text px-3 py-2.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50 sm:col-span-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Hotovo
          </button>
        </div>
      )}
    </div>
  );
}

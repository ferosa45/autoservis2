'use client';

import Link from 'next/link';
import { Phone, User, Play } from 'lucide-react';
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
    case 'DONE':
      return job.scheduledEnd ? `Konec: ${formatTime(job.scheduledEnd)}` : 'Hotovo';
    case 'IN_PROGRESS':
      return job.scheduledEnd ? `Předpoklad: ${formatTime(job.scheduledEnd)}` : 'Pracuje se';
    case 'BLOCKED':
      return `Od: ${formatShortDate(job.updatedAt)}`;
    case 'WAITING':
    default:
      return `Start: ${formatTime(job.scheduledStart)}`;
  }
}

export function JobCard({ job, isSelected }: { job: JobForDay; isSelected: boolean }) {
  const primaryTask = job.tasks[0]?.title ?? job.customerRequest;
  const secondaryTask = job.tasks[1]?.title;
  const colors = JOB_STATUS_COLOR[job.status];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      await setJobStatus(job.id, 'IN_PROGRESS');
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border p-4 transition-colors hover:brightness-110',
        colors.bg,
        colors.border,
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <Link href={`/today?job=${job.id}`} className="flex min-w-0 flex-1 gap-4">
        <div className={cn('w-14 shrink-0 pt-1 text-sm font-medium', colors.text)}>
          {formatTime(job.scheduledStart)}
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
          <div className="min-w-[180px] flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-text-primary">
                {job.vehicle.brand} {job.vehicle.model}
              </h3>
              {job.vehicle.licensePlate && (
                <span className="rounded border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                  {job.vehicle.licensePlate}
                </span>
              )}
            </div>
            <ul className="mt-1.5 space-y-0.5 text-sm text-text-secondary">
              <li>&middot; {primaryTask}</li>
              {secondaryTask && <li>&middot; {secondaryTask}</li>}
            </ul>
            <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {job.customer.name}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {job.customer.phone}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={job.status} className="border-white/10 bg-black/20" />
            <span className={cn('text-xs', colors.text)}>{rightSideLabel(job)}</span>
          </div>
        </div>
      </Link>

      {job.status === 'WAITING' && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleStart}
          className="flex shrink-0 items-center gap-1.5 self-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          {isPending ? 'Spouštím…' : 'Zahájit'}
        </button>
      )}

      {job.status === 'BLOCKED' && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleStart}
          className="flex shrink-0 items-center gap-1.5 self-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          {isPending ? 'Spouštím…' : 'Pokračovat'}
        </button>
      )}
    </div>
  );
}

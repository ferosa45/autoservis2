import Link from 'next/link';
import { Phone, User } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { JOB_STATUS_BORDER_ACCENT } from '@/lib/job-status';
import { formatTime, formatShortDate } from '@/lib/format';
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

  return (
    <Link
      href={`/today?job=${job.id}`}
      className={cn(
        'flex gap-4 rounded-lg border-l-4 border border-border bg-surface p-4 transition-colors hover:border-primary/40',
        JOB_STATUS_BORDER_ACCENT[job.status],
        isSelected && 'ring-1 ring-primary'
      )}
    >
      <div className="w-14 shrink-0 pt-1 text-sm font-medium text-text-secondary">
        {formatTime(job.scheduledStart)}
      </div>

      <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-text-primary">
              {job.vehicle.brand} {job.vehicle.model}
            </h3>
            {job.vehicle.licensePlate && (
              <span className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-secondary">
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

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={job.status} />
          <span className="text-xs text-text-muted">{rightSideLabel(job)}</span>
        </div>
      </div>
    </Link>
  );
}

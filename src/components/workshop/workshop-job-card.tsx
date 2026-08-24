import Link from 'next/link';
import { StatusBadge } from '@/components/ui/badge';
import { JOB_STATUS_COLOR } from '@/lib/job-status';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { JobForDay } from '@/lib/services/today.service';

export function WorkshopJobCard({
  job,
  isSelected,
  dateParam,
}: {
  job: JobForDay;
  isSelected: boolean;
  dateParam: string | undefined;
}) {
  const colors = JOB_STATUS_COLOR[job.status];
  const href = dateParam ? `/workshop?job=${job.id}&date=${dateParam}` : `/workshop?job=${job.id}`;

  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-[64px] items-center gap-4 rounded-xl border-2 p-4 transition-colors',
        colors.bg,
        isSelected ? 'border-primary' : colors.border
      )}
    >
      <div className={cn('w-16 shrink-0 text-base font-bold', colors.text)}>
        {formatTime(job.scheduledStart)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-base font-bold uppercase text-text-primary">
            {job.vehicle.brand} {job.vehicle.model}
          </h3>
          {job.vehicle.licensePlate && (
            <span className="shrink-0 rounded border border-white/10 bg-black/20 px-1.5 py-0.5 font-mono text-xs text-text-secondary">
              {job.vehicle.licensePlate}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-text-secondary">{job.customerRequest}</p>
      </div>

      <StatusBadge status={job.status} className="shrink-0 border-white/10 bg-black/20" />
    </Link>
  );
}

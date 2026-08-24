import Link from 'next/link';
import { Clock, Loader2, PackageX, CheckCircle2 } from 'lucide-react';
import { JOB_STATUS_COLOR } from '@/lib/job-status';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { WeekJob } from '@/lib/services/calendar.service';

type WeekJobForCard = Omit<WeekJob, 'items'>;
import type { JobStatus } from '@prisma/client';

const STATUS_ICON: Record<JobStatus, React.ComponentType<{ className?: string }>> = {
  WAITING: Clock,
  IN_PROGRESS: Loader2,
  BLOCKED: PackageX,
  DONE: CheckCircle2,
};

export function CalendarJobCard({
  job,
  top,
  height,
}: {
  job: WeekJobForCard;
  top: number;
  height: number;
}) {
  const mainTask = job.customerRequest.split(',')[0]?.trim() || job.customerRequest;
  const colors = JOB_STATUS_COLOR[job.status];
  const Icon = STATUS_ICON[job.status];
  const isCompact = height < 70;

  return (
    <Link
      href={`/jobs/${job.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{ top, height: Math.max(height, 40) }}
      className={cn(
        'absolute left-1 right-1 overflow-hidden rounded-md border p-1.5 text-left shadow-sm transition-all hover:z-10 hover:brightness-110',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={cn('text-[10px] font-medium', colors.text)}>
          {formatTime(job.scheduledStart)}
          {job.scheduledEnd && ` – ${formatTime(job.scheduledEnd)}`}
        </span>
        <Icon className={cn('h-3 w-3 shrink-0', colors.text, job.status === 'IN_PROGRESS' && 'animate-spin')} />
      </div>
      <p className="mt-0.5 truncate text-xs font-bold text-text-primary">
        {job.vehicle.brand} {job.vehicle.model}
      </p>
      {!isCompact && job.vehicle.licensePlate && (
        <p className="truncate font-mono text-[10px] text-text-secondary">{job.vehicle.licensePlate}</p>
      )}
      {!isCompact && <p className="truncate text-[11px] text-text-secondary">{mainTask}</p>}
    </Link>
  );
}

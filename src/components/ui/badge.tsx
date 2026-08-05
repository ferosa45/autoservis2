import type { JobStatus } from '@prisma/client';
import { Clock, Loader2, PackageX, CheckCircle2 } from 'lucide-react';
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR } from '@/lib/job-status';
import { cn } from '@/lib/utils';

const STATUS_ICON: Record<JobStatus, React.ComponentType<{ className?: string }>> = {
  WAITING: Clock,
  IN_PROGRESS: Loader2,
  BLOCKED: PackageX,
  DONE: CheckCircle2,
};

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const colors = JOB_STATUS_COLOR[status];
  const Icon = STATUS_ICON[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide',
        colors.bg,
        colors.border,
        colors.text,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'IN_PROGRESS' && 'animate-spin')} />
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

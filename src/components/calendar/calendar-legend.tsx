import { JOB_STATUS_LABEL } from '@/lib/job-status';
import type { JobStatus } from '@prisma/client';

const LEGEND_DOT: Record<JobStatus, string> = {
  DONE: 'bg-status-done-text',
  IN_PROGRESS: 'bg-status-progress-text',
  BLOCKED: 'bg-status-blocked-text',
  WAITING: 'bg-status-waiting-text',
};

const ORDER: JobStatus[] = ['DONE', 'IN_PROGRESS', 'BLOCKED', 'WAITING'];

export function CalendarLegend() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">Legenda</h3>
      <ul className="space-y-2">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm text-text-secondary">
            <span className={`h-2.5 w-2.5 rounded-full ${LEGEND_DOT[status]}`} />
            {JOB_STATUS_LABEL[status]}
          </li>
        ))}
        <li className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-text-muted" />
          Volný termín
        </li>
      </ul>
    </div>
  );
}

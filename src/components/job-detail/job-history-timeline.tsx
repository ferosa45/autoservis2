import {
  CheckCircle2,
  CircleDot,
  FileCheck2,
  FileX2,
  Play,
  Receipt,
  Wrench,
  Clock3,
} from 'lucide-react';
import type { JobEventType } from '@prisma/client';

type TimelineEvent = {
  id: string;
  type: JobEventType;
  message: string;
  createdAt: Date;
  user: { name: string } | null;
};

const EVENT_ICON: Record<JobEventType, typeof CircleDot> = {
  CREATED: CircleDot,
  WORK_STARTED: Play,
  WAITING_FOR_PART: Clock3,
  WORK_RESUMED: Wrench,
  COMPLETED: CheckCircle2,
  INVOICE_ISSUED: Receipt,
  INVOICE_PAID: FileCheck2,
  INVOICE_CANCELLED: FileX2,
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function JobHistoryTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Historie zakázky</h3>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-muted">Historie zatím není k dispozici.</p>
      ) : (
        <div className="relative space-y-0">
          {events.map((event, index) => {
            const Icon = EVENT_ICON[event.type];
            return (
              <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < events.length - 1 && (
                  <span className="absolute left-[11px] top-7 h-[calc(100%-14px)] w-px bg-border" aria-hidden="true" />
                )}
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <p className="text-sm font-medium text-text-primary">{event.message}</p>
                    <time className="shrink-0 text-xs text-text-muted">{formatDateTime(event.createdAt)}</time>
                  </div>
                  {event.user && <p className="mt-0.5 text-xs text-text-muted">{event.user.name}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

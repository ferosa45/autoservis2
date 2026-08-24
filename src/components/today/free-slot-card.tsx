'use client';

import { Clock, Plus } from 'lucide-react';
import { formatTime } from '@/lib/format';
import { useQuickJob } from '@/components/quick-job/quick-job-provider';

export function FreeSlotCard({ time, endTime }: { time: Date; endTime: Date }) {
  const { openQuickJob } = useQuickJob();

  function handleClick() {
    const cappedEnd = new Date(Math.min(time.getTime() + 60 * 60000, endTime.getTime()));
    openQuickJob({ scheduledStart: time, scheduledEnd: cappedEnd });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between rounded-lg border border-dashed border-border bg-transparent p-4 text-left text-text-muted transition-colors hover:border-primary/40 hover:text-text-secondary"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 shrink-0 text-sm font-medium">{formatTime(time)}</div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <div>
            <p className="text-sm font-medium text-text-secondary">VOLNÝ TERMÍN</p>
            <p className="text-xs">Kliknutím vytvoříte novou zakázku</p>
          </div>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border">
        <Plus className="h-4 w-4" />
      </div>
    </button>
  );
}

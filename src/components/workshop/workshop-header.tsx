import { Wrench } from 'lucide-react';
import { WorkshopClock } from './workshop-clock';
import { WorkshopNewJobButton } from './workshop-new-job-button';
import { WorkshopDayNav } from './workshop-day-nav';

export function WorkshopHeader({ garageName, date }: { garageName: string; date: Date }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 shrink-0 text-primary" />
        <span className="font-heading text-xl font-bold text-text-primary">{garageName}</span>
      </div>

      <WorkshopDayNav date={date} />

      <div className="flex items-center gap-4">
        <WorkshopClock />
        <WorkshopNewJobButton />
      </div>
    </header>
  );
}

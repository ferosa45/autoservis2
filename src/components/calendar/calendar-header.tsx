import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatWeekRange, isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { addPragueDays, getPragueDateParts, toPragueDateParam } from '@/lib/date-time';

export function CalendarHeader({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const prevWeek = addPragueDays(weekStart, -7);
  const nextWeek = addPragueDays(weekStart, 7);

  const today = new Date();
  const currentParts = getPragueDateParts(today);
  const currentWeekStart = addPragueDays(today, currentParts.dayOfWeek === 0 ? -6 : 1 - currentParts.dayOfWeek);
  const isCurrentWeek = isSameDay(currentWeekStart, weekStart);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Kalendář</h1>
        <div className="mt-1 flex items-center gap-4">
          <span className="border-b-2 border-primary pb-0.5 text-sm font-medium text-primary">Týden</span>
          <Link href="/today" className="pb-0.5 text-sm font-medium text-text-secondary hover:text-text-primary">
            Den
          </Link>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-lg border border-border bg-surface p-1 sm:flex-none">
          <Link
            href={`/calendar?week=${toPragueDateParam(prevWeek)}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Předchozí týden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="flex min-w-0 items-center justify-center gap-1.5 truncate px-1 text-xs font-medium text-text-primary sm:px-2 sm:text-sm">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="truncate">{formatWeekRange(weekStart, weekEnd)}</span>
          </span>
          <Link
            href={`/calendar?week=${toPragueDateParam(nextWeek)}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Následující týden"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <Link
          href="/calendar"
          className={cn(
            'shrink-0 rounded-lg border px-3 py-2 text-sm font-medium',
            isCurrentWeek
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface text-text-secondary hover:bg-elevated'
          )}
        >
          Dnes
        </Link>
      </div>
    </div>
  );
}

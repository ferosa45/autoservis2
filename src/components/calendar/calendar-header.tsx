import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatWeekRange, isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CalendarHeader({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const today = new Date();
  const currentWeekStart = new Date(today);
  const day = currentWeekStart.getDay();
  currentWeekStart.setDate(currentWeekStart.getDate() + (day === 0 ? -6 : 1 - day));
  const isCurrentWeek = isSameDay(currentWeekStart, weekStart);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Kalendář</h1>
        {/* "Den" vede na existující obrazovku Dnes - samostatný Měsíční pohled
            není v MVP scope, proto tu záměrně není třetí tab. */}
        <div className="mt-1 flex items-center gap-4">
          <span className="border-b-2 border-primary pb-0.5 text-sm font-medium text-primary">Týden</span>
          <Link href="/today" className="pb-0.5 text-sm font-medium text-text-secondary hover:text-text-primary">
            Den
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <Link
            href={`/calendar?week=${toDateParam(prevWeek)}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Předchozí týden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="flex items-center gap-1.5 px-2 text-sm font-medium text-text-primary">
            <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
            {formatWeekRange(weekStart, weekEnd)}
          </span>
          <Link
            href={`/calendar?week=${toDateParam(nextWeek)}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Následující týden"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <Link
          href="/calendar"
          className={cn(
            'rounded-lg border px-3 py-2 text-sm font-medium',
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

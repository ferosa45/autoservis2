import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';

const MONTHS_FULL = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];
const WEEKDAY_LETTERS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWithinWeek(day: Date, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return day >= weekStart && day < weekEnd;
}

export function MiniMonthCalendar({ weekStart }: { weekStart: Date }) {
  // Měsíc se odvozuje od čtvrtka aktuálně zobrazeného týdne - u týdnů
  // přesahujících přelom měsíce tak ukazuje ten měsíc, kam spadá většina dní.
  const anchor = new Date(weekStart);
  anchor.setDate(anchor.getDate() + 3);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const firstGridDay = new Date(firstOfMonth);
  const firstWeekday = firstOfMonth.getDay();
  firstGridDay.setDate(firstGridDay.getDate() - (firstWeekday === 0 ? 6 : firstWeekday - 1));

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstGridDay);
    d.setDate(d.getDate() + i);
    return d;
  });

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const today = new Date();

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-text-primary">
          {MONTHS_FULL[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?week=${toDateParam(prevMonth)}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Předchozí měsíc"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/calendar?week=${toDateParam(nextMonth)}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
            aria-label="Následující měsíc"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LETTERS.map((label) => (
          <span key={label} className="text-[10px] font-medium text-text-muted">
            {label}
          </span>
        ))}

        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const isSelectedWeek = isWithinWeek(day, weekStart);

          return (
            <Link
              key={day.toISOString()}
              href={`/calendar?week=${toDateParam(day)}`}
              className="flex items-center justify-center py-0.5"
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  !isCurrentMonth && 'text-text-muted/50',
                  isCurrentMonth && !isToday && !isSelectedWeek && 'text-text-secondary hover:bg-elevated',
                  isSelectedWeek && !isToday && 'border border-primary text-text-primary',
                  isToday && 'bg-primary font-semibold text-white'
                )}
              >
                {day.getDate()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

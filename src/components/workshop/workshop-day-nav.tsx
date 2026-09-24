import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatShortDate, isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { addPragueDays, getPragueDateParts, toPragueDateParam } from '@/lib/date-time';

const WEEKDAYS_SHORT = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

export function WorkshopDayNav({ date }: { date: Date }) {
  const prev = addPragueDays(date, -1);
  const next = addPragueDays(date, 1);

  const today = new Date();
  const isToday = isSameDay(date, today);

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-elevated p-1">
      <Link
        href={`/workshop?date=${toPragueDateParam(prev)}`}
        className="flex h-12 w-12 items-center justify-center rounded-lg text-text-secondary hover:bg-border active:scale-95"
        aria-label="Předchozí den"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>

      <div className="flex min-w-[140px] flex-col items-center px-2">
        <span className="text-sm font-bold text-text-primary">
          {isToday ? 'Dnes' : WEEKDAYS_SHORT[getPragueDateParts(date).dayOfWeek]}
        </span>
        <span className="text-xs text-text-muted">{formatShortDate(date)}</span>
      </div>

      <Link
        href={`/workshop?date=${toPragueDateParam(next)}`}
        className="flex h-12 w-12 items-center justify-center rounded-lg text-text-secondary hover:bg-border active:scale-95"
        aria-label="Následující den"
      >
        <ChevronRight className="h-6 w-6" />
      </Link>

      {!isToday && (
        <Link
          href="/workshop"
          className={cn(
            'ml-1 flex h-12 items-center rounded-lg px-3 text-sm font-semibold',
            'bg-primary text-white hover:bg-primary-hover'
          )}
        >
          Dnes
        </Link>
      )}
    </div>
  );
}

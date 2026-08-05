import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatFullDate, isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function TodayHeader({ date }: { date: Date }) {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const today = new Date();
  const isToday = isSameDay(date, today);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Dnes</h1>
        <p className="text-sm text-text-secondary">{formatFullDate(date)}</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1">
        <Link
          href={`/today?date=${toDateParam(prev)}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
          aria-label="Předchozí den"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href="/today"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium',
            isToday ? 'bg-primary text-white' : 'text-text-secondary hover:bg-elevated'
          )}
        >
          Dnes
        </Link>
        <Link
          href={`/today?date=${toDateParam(next)}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated"
          aria-label="Následující den"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

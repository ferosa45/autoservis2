'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatFullDate, formatShortDate, isSameDay } from '@/lib/format';
import { cn } from '@/lib/utils';

function toDateParam(date: Date): string {
  // Nepoužívat toISOString(): v českém časovém pásmu může lokální půlnoc
  // spadnout do předchozího UTC dne.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TodayHeader({ date }: { date: Date }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

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
        <button
          type="button"
          onClick={() => navigate(`/today?date=${toDateParam(prev)}`)}
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated disabled:cursor-wait disabled:opacity-60"
          aria-label="Předchozí den"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => navigate('/today')}
          disabled={isPending}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-wait disabled:opacity-60',
            isToday ? 'bg-primary text-white' : 'text-text-secondary hover:bg-elevated'
          )}
          aria-label="Přejít na dnešek"
        >
          {isPending ? <Loader2 className="mx-2 h-4 w-4 animate-spin" /> : (isToday ? 'Dnes' : formatShortDate(date))}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/today?date=${toDateParam(next)}`)}
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-elevated disabled:cursor-wait disabled:opacity-60"
          aria-label="Následující den"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

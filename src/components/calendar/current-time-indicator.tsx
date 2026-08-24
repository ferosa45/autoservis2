'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/lib/format';
import { HOUR_HEIGHT } from './calendar-grid';

export function CurrentTimeIndicator({ startHour, endHour }: { startHour: number; endHour: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const minutesFromStart = (now.getHours() - startHour) * 60 + now.getMinutes();
  const totalVisibleMinutes = (endHour - startHour) * 60;
  if (minutesFromStart < 0 || minutesFromStart > totalVisibleMinutes) return null;

  const top = (minutesFromStart / 60) * HOUR_HEIGHT;

  return (
    <div className="pointer-events-none absolute left-0 right-0 z-20 flex items-center" style={{ top }}>
      <span className="-ml-1 rounded bg-red-500 px-1 py-0.5 text-[9px] font-semibold text-white">
        {formatTime(now)}
      </span>
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}

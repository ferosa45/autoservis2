'use client';

import { useEffect, useState } from 'react';

export function WorkshopClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-3xl font-bold tabular-nums text-text-primary">
      {now ? now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
    </span>
  );
}

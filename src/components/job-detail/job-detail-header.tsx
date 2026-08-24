import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { formatFullDate, formatTime } from '@/lib/format';
import type { JobStatus } from '@prisma/client';

export function JobDetailHeader({
  number,
  scheduledStart,
  status,
}: {
  number: string;
  scheduledStart: Date;
  status: JobStatus;
}) {
  return (
    <div>
      <Link
        href="/today"
        className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Zpět
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Zakázka <span className="font-mono">#{number}</span>
          </h1>
          <p className="text-sm text-text-secondary">
            {formatFullDate(scheduledStart)} · {formatTime(scheduledStart)}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

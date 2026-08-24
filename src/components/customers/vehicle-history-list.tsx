'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, ChevronDown } from 'lucide-react';
import type { JobStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/badge';
import { formatShortDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type VehicleJob = {
  id: string;
  number: string;
  scheduledStart: Date;
  status: JobStatus;
  customerRequest: string;
};

type VehicleWithJobs = {
  id: string;
  brand: string;
  model: string;
  licensePlate: string | null;
  year: number | null;
  mileage: number | null;
  jobs: VehicleJob[];
};

export function VehicleHistoryList({ vehicles }: { vehicles: VehicleWithJobs[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(vehicles[0]?.id ?? null);

  if (vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
        Zákazník zatím nemá žádné vozidlo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => {
        const isExpanded = expandedId === vehicle.id;
        const lastVisit = vehicle.jobs[0]?.scheduledStart;

        return (
          <div key={vehicle.id} className="overflow-hidden rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : vehicle.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-elevated"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                    {vehicle.licensePlate && <span className="font-mono">{vehicle.licensePlate}</span>}
                    {vehicle.year && <span>{vehicle.year}</span>}
                    {lastVisit && <span>Poslední návštěva {formatShortDate(lastVisit)}</span>}
                    {!lastVisit && <span>Zatím žádná zakázka</span>}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-text-muted transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>

            {isExpanded && (
              <div className="border-t border-border">
                {vehicle.jobs.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted">Zatím žádné zakázky.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {vehicle.jobs.map((job) => (
                      <li key={job.id}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-elevated"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-text-primary">
                              <span className="font-mono text-text-muted">#{job.number}</span>{' '}
                              {job.customerRequest}
                            </p>
                            <p className="text-xs text-text-muted">
                              {formatShortDate(job.scheduledStart)} · {formatTime(job.scheduledStart)}
                            </p>
                          </div>
                          <StatusBadge status={job.status} className="shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

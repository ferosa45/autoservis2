'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, ChevronDown, Gauge, History, Wrench } from 'lucide-react';
import type { JobStatus } from '@prisma/client';
import { StatusBadge } from '@/components/ui/badge';
import { formatShortDate, formatTime, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { VehicleEdit } from './vehicle-edit';

type VehicleJob = {
  id: string;
  number: string;
  scheduledStart: Date;
  status: JobStatus;
  customerRequest: string;
  invoice: { total: number } | null;
};

type VehicleWithJobs = {
  id: string;
  brand: string;
  model: string;
  licensePlate: string | null;
  year: number | null;
  mileage: number | null;
  note?: string | null;
  jobs: VehicleJob[];
};

export function VehicleHistoryList({ customerId, vehicles }: { customerId: string; vehicles: VehicleWithJobs[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(vehicles[0]?.id ?? null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><VehicleEdit customerId={customerId} /></div>
      {vehicles.length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">Zákazník zatím nemá žádné vozidlo.</div>}
      {vehicles.map((vehicle) => {
        const isExpanded = expandedId === vehicle.id;
        const lastVisit = vehicle.jobs[0]?.scheduledStart;
        const totalVisits = vehicle.jobs.length;
        const totalSpent = vehicle.jobs.reduce((sum, job) => sum + (job.invoice?.total ?? 0), 0);

        return (
          <div key={vehicle.id} className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : vehicle.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 text-left hover:bg-elevated">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary"><Car className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">{vehicle.brand} {vehicle.model}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                      {vehicle.licensePlate && <span className="font-mono">{vehicle.licensePlate}</span>}
                      {vehicle.year && <span>{vehicle.year}</span>}
                      {vehicle.mileage != null && <span>{vehicle.mileage.toLocaleString('cs-CZ')} km</span>}
                      {lastVisit ? <span>Poslední návštěva {formatShortDate(lastVisit)}</span> : <span>Zatím žádná zakázka</span>}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', isExpanded && 'rotate-180')} />
              </button>
              <div className="pr-3"><VehicleEdit customerId={customerId} vehicle={vehicle} /></div>
            </div>

            {isExpanded && (
              <div className="border-t border-border">
                {vehicle.jobs.length > 0 && (
                  <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-3">
                    <div className="bg-surface p-3">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted"><History className="h-3.5 w-3.5" /> Návštěvy</div>
                      <p className="mt-1 text-sm font-bold text-text-primary">{totalVisits}</p>
                    </div>
                    <div className="bg-surface p-3">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted"><Gauge className="h-3.5 w-3.5" /> Aktuální nájezd</div>
                      <p className="mt-1 text-sm font-bold text-text-primary">{vehicle.mileage != null ? `${vehicle.mileage.toLocaleString('cs-CZ')} km` : '—'}</p>
                    </div>
                    <div className="col-span-2 bg-surface p-3 sm:col-span-1">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted"><Wrench className="h-3.5 w-3.5" /> Vyfakturováno</div>
                      <p className="mt-1 text-sm font-bold text-text-primary">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                )}

                {vehicle.jobs.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted">Zatím žádné zakázky.</p>
                ) : (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Servisní historie</div>
                    <ul className="divide-y divide-border">
                      {vehicle.jobs.map((job) => (
                        <li key={job.id}>
                          <Link href={`/jobs/${job.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-elevated">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-text-primary"><span className="font-mono text-text-muted">#{job.number}</span>{' '}{job.customerRequest}</p>
                              <p className="mt-0.5 text-xs text-text-muted">{formatShortDate(job.scheduledStart)} · {formatTime(job.scheduledStart)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {job.invoice && <span className="text-xs font-medium text-text-secondary">{formatCurrency(job.invoice.total)}</span>}
                              <StatusBadge status={job.status} />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

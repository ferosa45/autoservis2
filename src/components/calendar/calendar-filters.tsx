'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { JOB_STATUS_LABEL } from '@/lib/job-status';
import type { JobStatus } from '@prisma/client';

const STATUS_OPTIONS: JobStatus[] = ['WAITING', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

export function CalendarFilters({
  mechanics,
}: {
  mechanics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendar?${params.toString()}`);
  }

  const currentStatus = searchParams.get('status') ?? '';
  const currentMechanic = searchParams.get('mechanic') ?? '';
  const isWorkingHoursOnly = searchParams.get('fullDay') !== '1';

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">Filtry</h3>
      <div className="space-y-2">
        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value || null)}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="">Všechny stavy</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {JOB_STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        <select
          value={currentMechanic}
          onChange={(e) => updateParam('mechanic', e.target.value || null)}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="">Všichni mechanici</option>
          {mechanics.map((mechanic) => (
            <option key={mechanic.id} value={mechanic.id}>
              {mechanic.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 pt-1 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isWorkingHoursOnly}
            onChange={(e) => updateParam('fullDay', e.target.checked ? null : '1')}
            className="h-4 w-4 rounded border-border bg-elevated accent-primary"
          />
          Zobrazit pouze pracovní dobu
        </label>
      </div>
    </div>
  );
}

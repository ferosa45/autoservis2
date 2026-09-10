'use client';

import { useState, useTransition } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { assignMechanic } from '@/lib/actions/today.actions';
import { getActionErrorMessage } from '@/lib/action-errors';

export type MechanicOption = {
  id: string;
  name: string;
  active: boolean;
};

export function MechanicAssignment({
  jobId,
  current,
  mechanics,
}: {
  jobId: string;
  current: { id: string; name: string; active: boolean } | null;
  mechanics: MechanicOption[];
}) {
  const [value, setValue] = useState(current?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextValue: string) {
    const previous = value;
    setValue(nextValue);
    setError(null);

    startTransition(async () => {
      try {
        await assignMechanic(jobId, nextValue || null);
      } catch (err) {
        setValue(previous);
        setError(getActionErrorMessage(err, 'Mechanika se nepodařilo přiřadit.'));
      }
    });
  }

  const options = current && !current.active && !mechanics.some((mechanic) => mechanic.id === current.id)
    ? [current, ...mechanics]
    : mechanics;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <UserRound className="h-3.5 w-3.5" />
        Mechanik
      </div>
      <div className="relative">
        <select
          value={value}
          disabled={isPending}
          onChange={(event) => handleChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-elevated px-3 py-2.5 pr-9 text-sm text-text-primary focus:border-primary focus:outline-none disabled:opacity-60"
        >
          <option value="">Nepřiřazeno</option>
          {options.map((mechanic) => (
            <option key={mechanic.id} value={mechanic.id}>
              {mechanic.name}{!mechanic.active ? ' (neaktivní)' : ''}
            </option>
          ))}
        </select>
        {isPending && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
      </div>
      {error && <p className="mt-2 text-xs text-status-blocked-text">{error}</p>}
    </div>
  );
}

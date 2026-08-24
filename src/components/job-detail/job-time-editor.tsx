'use client';

import { useState, useTransition } from 'react';
import { Clock, Check } from 'lucide-react';
import { updateJobTimes } from '@/lib/actions/job-detail.actions';
import { formatForDatetimeLocal } from '@/lib/format';

export function JobTimeEditor({
  jobId,
  scheduledStart,
  scheduledEnd,
}: {
  jobId: string;
  scheduledStart: Date;
  scheduledEnd: Date | null;
}) {
  const [start, setStart] = useState(formatForDatetimeLocal(scheduledStart));
  const [end, setEnd] = useState(scheduledEnd ? formatForDatetimeLocal(scheduledEnd) : '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateJobTimes(jobId, new Date(start).toISOString(), end ? new Date(end).toISOString() : null);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Uložení se nezdařilo');
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        Termín
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs text-text-muted">Začátek</span>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-muted">Předpokládaný konec</span>
          <input
            type="datetime-local"
            value={end}
            min={start}
            onChange={(e) => {
              setEnd(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-status-blocked-text">{error}</p>}

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saved || isPending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-elevated disabled:opacity-40"
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Uloženo
            </>
          ) : (
            'Uložit termín'
          )}
        </button>
      </div>
    </div>
  );
}

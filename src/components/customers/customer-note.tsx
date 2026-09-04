'use client';

import { useState, useTransition } from 'react';
import { StickyNote, Check } from 'lucide-react';
import { updateCustomerNote } from '@/lib/actions/customer.actions';
import { getActionErrorMessage } from '@/lib/action-errors';

export function CustomerNote({
  customerId,
  initialNote,
}: {
  customerId: string;
  initialNote: string | null;
}) {
  const [note, setNote] = useState(initialNote ?? '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomerNote(customerId, note);
        setSaved(true);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Poznámku se nepodařilo uložit.'));
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <StickyNote className="h-3.5 w-3.5" />
        Poznámka
      </div>
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Volitelná poznámka k zákazníkovi..."
        className="w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
      />
      {error && (
        <p className="mt-2 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
          {error}
        </p>
      )}
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
            'Uložit poznámku'
          )}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { StickyNote, Check } from 'lucide-react';
import { updateCustomerNote } from '@/lib/actions/customer.actions';

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

  function handleSave() {
    startTransition(async () => {
      await updateCustomerNote(customerId, note);
      setSaved(true);
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

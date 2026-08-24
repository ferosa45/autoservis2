'use client';

import { useState, useTransition } from 'react';
import { Check, Clock } from 'lucide-react';
import { updateInvoiceMeta } from '@/lib/actions/invoice.actions';
import { formatForDatetimeLocal } from '@/lib/format';

export function InvoiceMetaEditor({
  invoiceId,
  dueDate,
  initialNote,
  isEditable,
}: {
  invoiceId: string;
  dueDate: Date;
  initialNote: string | null;
  isEditable: boolean;
}) {
  const [due, setDue] = useState(formatForDatetimeLocal(dueDate).slice(0, 10));
  const [note, setNote] = useState(initialNote ?? '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  if (!isEditable) {
    return note ? (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Poznámka</h3>
        <p className="text-sm text-text-primary">{note}</p>
      </div>
    ) : null;
  }

  function handleSave() {
    startTransition(async () => {
      await updateInvoiceMeta(invoiceId, { dueDate: due, note });
      setSaved(true);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        Splatnost a poznámka
      </div>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs text-text-muted">Splatnost</span>
        <input
          type="date"
          value={due}
          onChange={(e) => {
            setDue(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-text-muted">Poznámka</span>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </label>
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
            'Uložit'
          )}
        </button>
      </div>
    </div>
  );
}

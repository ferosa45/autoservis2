'use client';

import { useState, useTransition } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { addJobItem, removeJobItem } from '@/lib/actions/job-detail.actions';
import { formatCurrency } from '@/lib/format';
import type { SerializedJobItem } from '@/lib/serialize';

type JobItem = SerializedJobItem;

const UNITS = ['ks', 'h', 'l', 'm', 'sada'];

export function JobItemsList({ jobId, items }: { jobId: string; items: JobItem[] }) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ks');
  const [unitPrice, setUnitPrice] = useState('');
  const [isPending, startTransition] = useTransition();

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function handleAdd() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    startTransition(() =>
      addJobItem(jobId, {
        title: trimmedTitle,
        quantity: parseFloat(quantity.replace(',', '.')) || 1,
        unit,
        unitPrice: parseFloat(unitPrice.replace(',', '.')) || 0,
      })
    );
    setTitle('');
    setQuantity('1');
    setUnitPrice('');
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <ClipboardList className="h-3.5 w-3.5" />
        Práce a díly
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="group flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">{item.title}</p>
              <p className="text-xs text-text-muted">
                {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-text-primary">
              {formatCurrency(item.quantity * item.unitPrice)}
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeJobItem(item.id, jobId))}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 hover:bg-elevated hover:text-text-primary group-hover:opacity-100"
              aria-label="Odebrat položku"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-text-muted">Zatím žádné položky.</p>}
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
          <span className="text-text-primary">Celkem</span>
          <span className="text-text-primary">{formatCurrency(total)}</span>
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název položky (např. Olejový filtr)"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2 sm:flex sm:items-center">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Množství"
            inputMode="decimal"
            className="min-w-0 w-full rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none sm:w-20"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="min-w-0 w-full rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary focus:border-primary focus:outline-none sm:w-auto"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <input
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Cena/jedn. (Kč)"
            inputMode="decimal"
            className="col-span-1 min-w-0 w-full rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none sm:flex-1"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!title.trim() || isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary hover:bg-border disabled:opacity-40"
            aria-label="Přidat položku"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

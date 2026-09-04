'use client';

import { useState, useTransition } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { addInvoiceItem, removeInvoiceItem } from '@/lib/actions/invoice.actions';
import { getActionErrorMessage } from '@/lib/action-errors';
import { formatCurrency } from '@/lib/format';

type InvoiceItem = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
};

const UNITS = ['ks', 'h', 'l', 'm', 'sada'];

export function InvoiceItemsEditor({
  invoiceId,
  items,
  isVatPayer,
  isEditable,
  subtotal,
  vatTotal,
  total,
}: {
  invoiceId: string;
  items: InvoiceItem[];
  isVatPayer: boolean;
  isEditable: boolean;
  subtotal: number;
  vatTotal: number;
  total: number;
}) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ks');
  const [unitPrice, setUnitPrice] = useState('');
  const [vatRate, setVatRate] = useState('21');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setError(null);
    startTransition(async () => {
      try {
        await addInvoiceItem(invoiceId, {
          title: trimmedTitle,
          quantity: parseFloat(quantity.replace(',', '.')) || 1,
          unit,
          unitPrice: parseFloat(unitPrice.replace(',', '.')) || 0,
          vatRate: isVatPayer ? parseFloat(vatRate.replace(',', '.')) || 0 : 0,
        });
        setTitle('');
        setQuantity('1');
        setUnitPrice('');
      } catch (err) {
        setError(getActionErrorMessage(err, 'Položku se nepodařilo přidat.'));
      }
    });
  }

  function handleRemove(itemId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeInvoiceItem(itemId, invoiceId);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Položku se nepodařilo odebrat.'));
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <ClipboardList className="h-3.5 w-3.5" />
        Položky
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">{item.title}</p>
              <p className="text-xs text-text-muted">
                {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                {isVatPayer && ` · DPH ${item.vatRate}%`}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-text-primary">{formatCurrency(item.total)}</p>
            {isEditable && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(item.id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 hover:bg-elevated hover:text-text-primary group-hover:opacity-100"
                aria-label="Odebrat položku"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-text-muted">Zatím žádné položky.</p>}
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        {isVatPayer && (
          <>
            <div className="flex justify-between text-text-secondary">
              <span>Základ</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>DPH</span>
              <span>{formatCurrency(vatTotal)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-base font-bold text-text-primary">
          <span>Celkem</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
          {error}
        </p>
      )}

      {isEditable && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Název položky"
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Množství"
              inputMode="decimal"
              className="w-20 rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
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
              placeholder="Cena/jedn."
              inputMode="decimal"
              className="flex-1 rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            {isVatPayer && (
              <input
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                placeholder="DPH %"
                inputMode="decimal"
                className="w-16 rounded-lg border border-border bg-elevated px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            )}
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
      )}
    </div>
  );
}

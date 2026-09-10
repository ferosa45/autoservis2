'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Plus, Trash2, UserRound, X } from 'lucide-react';
import { createMechanic, deleteMechanic, updateMechanicPermissions } from '@/lib/actions/user.actions';

type Mechanic = { id: string; name: string; email: string; role: 'OWNER' | 'MECHANIC'; active: boolean; canInvoice: boolean; canViewInvoices: boolean; canViewFinancials: boolean };

export function MechanicsSettings({ initial }: { initial: Mechanic[] }) {
  const [users, setUsers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', canInvoice: false, canViewInvoices: false, canViewFinancials: false });

  function create() {
    setError(null);
    startTransition(async () => {
      try {
        await createMechanic(form);
        setOpen(false);
        setForm({ name: '', email: '', password: '', canInvoice: false, canViewInvoices: false, canViewFinancials: false });
        window.location.reload();
      } catch (e) { setError(e instanceof Error ? e.message : 'Vytvoření se nezdařilo.'); }
    });
  }

  function update(user: Mechanic, field: keyof Pick<Mechanic, 'active' | 'canInvoice' | 'canViewInvoices' | 'canViewFinancials'>, value: boolean) {
    const next = { ...user, [field]: value };
    setUsers((current) => current.map((u) => u.id === user.id ? next : u));
    startTransition(async () => {
      try {
        await updateMechanicPermissions(user.id, { active: next.active, canInvoice: next.canInvoice, canViewInvoices: next.canViewInvoices, canViewFinancials: next.canViewFinancials });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Uložení se nezdařilo.');
        setUsers((current) => current.map((u) => u.id === user.id ? user : u));
      }
    });
  }

  function remove(user: Mechanic) {
    if (!window.confirm(`Opravdu chcete úplně smazat mechanika „${user.name}“? Zakázky zůstanou zachované, ale zruší se jeho přiřazení a smažou se jeho záznamy odpracovaného času.`)) return;

    setError(null);
    setDeletingId(user.id);
    startTransition(async () => {
      try {
        await deleteMechanic(user.id);
        setUsers((current) => current.filter((u) => u.id !== user.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Smazání se nezdařilo.');
      } finally {
        setDeletingId(null);
      }
    });
  }

  return <section className="rounded-lg border border-border bg-surface p-5">
    <div className="flex items-start justify-between gap-4">
      <div><h2 className="font-heading text-sm font-bold text-text-primary">Mechanici a přístupy</h2><p className="mt-1 text-xs leading-5 text-text-muted">Přidejte zaměstnance a určete, ke kterým citlivým funkcím má přístup.</p></div>
      <button onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"><Plus className="h-4 w-4" /> Přidat mechanika</button>
    </div>

    <div className="mt-5 space-y-3">{users.map((user) => user.role === 'MECHANIC' ? <div key={user.id} className="rounded-lg border border-border bg-elevated p-4">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-primary">{user.name}</p><p className="truncate text-xs text-text-muted">{user.email}</p></div><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={user.active} onChange={(e) => update(user, 'active', e.target.checked)} className="accent-primary" /> Aktivní</label></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3"><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={user.canInvoice} onChange={(e) => update(user, 'canInvoice', e.target.checked)} className="accent-primary" /> Vystavovat faktury</label><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={user.canViewInvoices} onChange={(e) => update(user, 'canViewInvoices', e.target.checked)} className="accent-primary" /> Vidět faktury</label><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={user.canViewFinancials} onChange={(e) => update(user, 'canViewFinancials', e.target.checked)} className="accent-primary" /> Vidět finanční přehled</label></div>
      <div className="mt-4 flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => remove(user)}
          disabled={isPending || deletingId !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-status-blocked-border px-3 py-2 text-xs font-semibold text-status-blocked-text hover:bg-status-blocked-bg disabled:opacity-50"
        >
          {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Smazat mechanika
        </button>
      </div>
    </div> : null)}</div>

    {error && <p className="mt-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">{error}</p>}

    {open && <div className="mt-5 rounded-lg border border-primary/30 bg-background p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-heading text-sm font-bold">Nový mechanik</h3><button onClick={() => setOpen(false)}><X className="h-4 w-4 text-text-muted" /></button></div><div className="grid gap-3 sm:grid-cols-2"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jméno a příjmení" className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm outline-none" /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm outline-none" /><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Dočasné heslo (min. 8 znaků)" type="password" className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm outline-none sm:col-span-2" /></div><div className="mt-4 space-y-2"><p className="text-xs font-semibold text-text-secondary">Volitelná oprávnění</p><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={form.canInvoice} onChange={(e) => setForm({ ...form, canInvoice: e.target.checked })} className="accent-primary" /> Může vystavovat faktury</label><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={form.canViewInvoices} onChange={(e) => setForm({ ...form, canViewInvoices: e.target.checked })} className="accent-primary" /> Může vidět faktury</label><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={form.canViewFinancials} onChange={(e) => setForm({ ...form, canViewFinancials: e.target.checked })} className="accent-primary" /> Může vidět finanční přehled</label></div><button disabled={isPending} onClick={create} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Vytvořit mechanika</button></div>}
  </section>;
}

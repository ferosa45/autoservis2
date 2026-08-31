'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pencil, Plus, X } from 'lucide-react';
import { createVehicle, updateVehicle } from '@/lib/actions/customer.actions';

type VehicleData = { id?: string; brand: string; model: string; licensePlate: string | null; year: number | null; mileage: number | null; note?: string | null };

export function VehicleEdit({ customerId, vehicle }: { customerId: string; vehicle?: VehicleData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState(''); const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState(''); const [year, setYear] = useState('');
  const [mileage, setMileage] = useState(''); const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setError(null); setBrand(vehicle?.brand ?? ''); setModel(vehicle?.model ?? '');
      setLicensePlate(vehicle?.licensePlate ?? ''); setYear(vehicle?.year?.toString() ?? '');
      setMileage(vehicle?.mileage?.toString() ?? ''); setNote(vehicle?.note ?? '');
    }
  }, [open, vehicle]);

  function save() {
    setError(null);
    const data = { brand, model, licensePlate, year: year ? Number(year) : null, mileage: mileage ? Number(mileage) : null, note };
    startTransition(async () => {
      try {
        if (vehicle?.id) await updateVehicle(vehicle.id, data);
        else await createVehicle(customerId, data);
        setOpen(false); router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : 'Nepodařilo se uložit vozidlo'); }
    });
  }

  const input = 'w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none';
  const label = 'mb-1.5 block text-xs font-medium text-text-secondary';

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={vehicle ? 'Upravit vozidlo' : 'Přidat vozidlo'} className={vehicle ? 'rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text-primary' : 'inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover'}>
      {vehicle ? <Pencil className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Přidat vozidlo</>}
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-heading text-lg font-bold text-text-primary">{vehicle ? 'Upravit vozidlo' : 'Přidat vozidlo'}</h2><p className="mt-0.5 text-xs text-text-muted">Údaje vozidla</p></div><button type="button" onClick={() => setOpen(false)} disabled={isPending} className="rounded-lg p-2 text-text-muted hover:bg-elevated"><X className="h-5 w-5" /></button></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={label}>Značka *</label><input className={input} value={brand} onChange={e => setBrand(e.target.value)} /></div>
          <div><label className={label}>Model *</label><input className={input} value={model} onChange={e => setModel(e.target.value)} /></div>
          <div><label className={label}>SPZ</label><input className={input} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} /></div>
          <div><label className={label}>Rok výroby</label><input className={input} inputMode="numeric" value={year} onChange={e => setYear(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label}>Nájezd (km)</label><input className={input} inputMode="numeric" value={mileage} onChange={e => setMileage(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label}>Poznámka k vozidlu</label><textarea className={`${input} min-h-24 resize-y`} value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        {error && <p className="mt-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} disabled={isPending} className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated">Zrušit</button><button type="button" onClick={save} disabled={isPending || !brand.trim() || !model.trim()} className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{isPending ? 'Ukládám…' : 'Uložit'}</button></div>
      </div>
    </div>}
  </>;
}

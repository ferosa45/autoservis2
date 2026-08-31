'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { updateCustomer } from '@/lib/actions/customer.actions';

export function CustomerEdit({
  customer,
}: {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    companyName: string | null;
    ico: string | null;
    dic: string | null;
    street: string | null;
    city: string | null;
    zip: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? '');
  const [companyName, setCompanyName] = useState(customer.companyName ?? '');
  const [ico, setIco] = useState(customer.ico ?? '');
  const [dic, setDic] = useState(customer.dic ?? '');
  const [street, setStreet] = useState(customer.street ?? '');
  const [city, setCity] = useState(customer.city ?? '');
  const [zip, setZip] = useState(customer.zip ?? '');

  function openEditor() {
    setError(null);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email ?? '');
    setCompanyName(customer.companyName ?? '');
    setIco(customer.ico ?? '');
    setDic(customer.dic ?? '');
    setStreet(customer.street ?? '');
    setCity(customer.city ?? '');
    setZip(customer.zip ?? '');
    setOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomer(customer.id, {
          name,
          phone,
          email,
          companyName,
          ico,
          dic,
          street,
          city,
          zip,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nepodařilo se uložit zákazníka');
      }
    });
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-medium text-text-secondary';

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-elevated hover:text-text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
        Upravit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-xl sm:max-w-2xl sm:rounded-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-text-primary">Upravit zákazníka</h2>
                <p className="mt-0.5 text-xs text-text-muted">Změny se uloží do karty zákazníka.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                aria-label="Zavřít"
                className="rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="customer-name">Jméno *</label>
                  <input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass} htmlFor="customer-phone">Telefon *</label>
                  <input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="customer-email">E-mail</label>
                  <input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Firemní údaje</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className={labelClass} htmlFor="customer-company">Název firmy</label>
                    <input id="customer-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="customer-ico">IČO</label>
                    <input id="customer-ico" value={ico} onChange={(e) => setIco(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="customer-dic">DIČ</label>
                    <input id="customer-dic" value={dic} onChange={(e) => setDic(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Adresa</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label className={labelClass} htmlFor="customer-street">Ulice a číslo</label>
                    <input id="customer-street" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="customer-zip">PSČ</label>
                    <input id="customer-zip" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-6">
                    <label className={labelClass} htmlFor="customer-city">Město</label>
                    <input id="customer-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !name.trim() || !phone.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isPending ? 'Ukládám…' : 'Uložit změny'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

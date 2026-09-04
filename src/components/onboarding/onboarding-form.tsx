'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, CheckCircle2, FileText, Wrench } from 'lucide-react';
import { saveOnboardingDetails, skipOnboarding } from '@/lib/actions/onboarding.actions';

export function OnboardingForm({ garage }: {
  garage: {
    name: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    zip: string | null;
    companyName: string | null;
    ico: string | null;
    dic: string | null;
    bankAccount: string | null;
    iban: string | null;
    isVatPayer: boolean;
    defaultVatRate: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveOnboardingDetails(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/today');
      router.refresh();
    });
  }

  function skip() {
    setError(null);
    startTransition(async () => {
      const result = await skipOnboarding();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/today');
      router.refresh();
    });
  }

  const input = 'mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary';
  const label = 'block text-sm font-medium text-text-primary';

  return (
    <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center p-4 sm:p-8">
      <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"><Wrench className="h-5 w-5" /></div>
          <div><p className="font-heading font-bold text-text-primary">Garazio</p><p className="text-xs text-text-muted">Nastavení servisu</p></div>
        </div>

        <div className="mb-7">
          <p className="mb-2 text-sm font-medium text-primary">Ještě pár údajů</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Nastavte si svůj servis</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">Doplňte údaje, které se vám později budou hodit například na fakturách. Všechno je volitelné a můžete to kdykoliv doplnit v Nastavení.</p>
        </div>

        <form action={submit} className="space-y-7">
          <section>
            <div className="mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><h2 className="font-heading font-semibold text-text-primary">Základní údaje</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Název servisu<input name="name" className={input} defaultValue={garage.name} /></label>
              <label className={label}>E-mail<input name="email" type="email" className={input} defaultValue={garage.email ?? ''} /></label>
              <label className={label}>Telefon<input name="phone" type="tel" className={input} defaultValue={garage.phone ?? ''} placeholder="777 123 456" /></label>
              <label className={label}>Ulice<input name="street" className={input} defaultValue={garage.street ?? ''} placeholder="Servisní 12" /></label>
              <label className={label}>Město<input name="city" className={input} defaultValue={garage.city ?? ''} placeholder="Ostrava" /></label>
              <label className={label}>PSČ<input name="zip" className={input} defaultValue={garage.zip ?? ''} placeholder="700 00" /></label>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><h2 className="font-heading font-semibold text-text-primary">Fakturační údaje</h2><p className="mt-0.5 text-xs text-text-muted">Volitelné — můžete je doplnit později.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Název firmy<input name="companyName" className={input} defaultValue={garage.companyName ?? ''} /></label>
              <label className={label}>IČO<input name="ico" className={input} defaultValue={garage.ico ?? ''} /></label>
              <label className={label}>DIČ<input name="dic" className={input} defaultValue={garage.dic ?? ''} /></label>
              <label className={label}>Bankovní účet<input name="bankAccount" className={input} defaultValue={garage.bankAccount ?? ''} /></label>
              <label className={label}>IBAN<input name="iban" className={input} defaultValue={garage.iban ?? ''} /></label>
              <label className={label}>Výchozí sazba DPH (%)<input name="defaultVatRate" type="number" min="0" max="100" step="0.01" className={input} defaultValue={garage.defaultVatRate ?? ''} placeholder="21" /></label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-text-primary"><input name="isVatPayer" type="checkbox" defaultChecked={garage.isVatPayer} className="h-4 w-4 rounded border-border text-primary" /> Jsem plátce DPH</label>
          </section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">{isPending ? 'Ukládám…' : 'Uložit a pokračovat'} <ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={skip} disabled={isPending} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-elevated disabled:opacity-60">Přeskočit</button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-text-muted"><CheckCircle2 className="h-3.5 w-3.5" /> Nic z tohoto nastavení není povinné.</p>
        </form>
      </div>
    </div>
  );
}

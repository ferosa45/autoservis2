'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, CheckCircle2, ChevronLeft, Wrench } from 'lucide-react';
import { completeOnboarding, createOnboardingCustomer } from '@/lib/actions/onboarding.actions';

export function OnboardingWizard({ garageName }: { garageName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [customerCreated, setCustomerCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function finishOnboarding(destination = '/today') {
    startTransition(async () => {
      await completeOnboarding();
      router.push(destination);
      router.refresh();
    });
  }

  function handleCustomerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createOnboardingCustomer(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setCustomerCreated(true);
        setStep(3);
      } catch {
        setError('Zákazníka se nepodařilo vytvořit. Zkuste to prosím znovu.');
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center p-4 sm:p-8">
      <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-bold">Garazio</span>
          </div>
          <span className="text-sm text-text-muted">Krok {step} ze 3</span>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Vítejte v Garaziu</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-text-primary">
                Nastavíme váš servis během chvilky.
              </h1>
              <p className="mt-3 text-text-secondary">
                Servis <strong>{garageName}</strong> už máte založený. Teď si jen vytvoříme první data, abyste si mohl Garazio hned vyzkoušet v praxi.
              </p>
            </div>

            <div className="rounded-xl bg-elevated p-4 text-sm text-text-secondary">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-text-primary">Bez dlouhého nastavování</p>
                  <p className="mt-1">Základ servisu doplníte později v nastavení. Teď rovnou do práce.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Pokračovat <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => finishOnboarding()} disabled={isPending} className="w-full text-sm text-text-muted hover:text-text-primary">
              Přeskočit nastavení
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCustomerSubmit} className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">První zákazník</p>
              <h1 className="font-heading text-2xl font-bold text-text-primary">Přidejte si prvního zákazníka a auto.</h1>
              <p className="mt-2 text-sm text-text-secondary">Stačí základní údaje. Všechno ostatní můžete doplnit později.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-primary">Jméno zákazníka<input name="customerName" required autoFocus className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="Jan Novák" /></label>
              <label className="block text-sm font-medium text-text-primary">Telefon<input name="phone" required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="777 123 456" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-text-primary">Značka<input name="brand" required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="Škoda" /></label>
                <label className="block text-sm font-medium text-text-primary">Model<input name="model" required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" placeholder="Octavia" /></label>
              </div>
              <label className="block text-sm font-medium text-text-primary">SPZ <span className="font-normal text-text-muted">(volitelné)</span><input name="licensePlate" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm uppercase outline-none focus:border-primary" placeholder="1AB 2345" /></label>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-elevated"><ChevronLeft className="h-4 w-4" /> Zpět</button>
              <button type="submit" disabled={isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isPending ? 'Vytvářím…' : 'Vytvořit zákazníka a auto'} <ArrowRight className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => setStep(3)} className="w-full text-sm text-text-muted hover:text-text-primary">Přeskočit</button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-primary"><Car className="h-7 w-7" /></div>
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Skoro hotovo</p>
              <h1 className="font-heading text-2xl font-bold text-text-primary">Teď vytvořte první zakázku.</h1>
              <p className="mt-2 text-text-secondary">Použijte běžný formulář zakázky. Je stejně jednoduchý jako vždy: zákazník, vozidlo, požadavek a termín.</p>
            </div>
            {customerCreated && <div className="rounded-xl bg-elevated p-4 text-sm text-text-secondary"><strong className="text-text-primary">Zákazník a vozidlo jsou připravené.</strong><br />Teď už jen založte první zakázku.</div>}
            <button type="button" onClick={() => finishOnboarding('/calendar')} disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isPending ? 'Otevírám…' : 'Vytvořit první zakázku'} <ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => finishOnboarding()} disabled={isPending} className="w-full text-sm text-text-muted hover:text-text-primary">Přejít rovnou do Garazia</button>
          </div>
        )}
      </div>
    </div>
  );
}

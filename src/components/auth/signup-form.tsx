'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Wrench } from 'lucide-react';
import { register, type RegisterState } from '@/lib/actions/registration.actions';

const initialState: RegisterState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Vytvořit účet a začít
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(register, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">G</div>
          <span className="font-heading text-xl font-extrabold tracking-tight text-text-primary">Garazio</span>
        </div>

        <form action={formAction} className="rounded-xl border border-border bg-surface p-6 shadow-xl shadow-black/10 sm:p-8">
          <h1 className="font-heading text-xl font-bold text-text-primary">Začněte s Garazio</h1>
          <p className="mt-1.5 text-sm leading-6 text-text-secondary">
            30 dní zdarma. Potom jen 299 Kč měsíčně.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="garageName" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Název servisu
              </label>
              <input
                id="garageName"
                name="garageName"
                type="text"
                required
                autoFocus
                placeholder="Autoservis Novák"
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ownerName" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Vaše jméno
              </label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                required
                autoComplete="name"
                placeholder="Jan Novák"
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jan@autoservisnovak.cz"
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="alespoň 8 znaků"
                className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {state.error && (
            <p className="mt-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p className="mt-4 text-center text-xs leading-5 text-text-muted">
            Už máte účet?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Přihlásit se
            </Link>
          </p>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
          <Wrench className="h-3.5 w-3.5" />
          Bez instalace · bez platební karty
        </div>
      </div>
    </div>
  );
}

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Wrench, Loader2 } from 'lucide-react';
import { register, type RegisterState } from '@/lib/actions/registration.actions';

const initialState: RegisterState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Vytvořit účet
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(register, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold text-text-primary">
            Auto<span className="text-primary">Servis</span>
          </span>
        </div>

        <form action={formAction} className="rounded-lg border border-border bg-surface p-8">
          <h1 className="mb-1 font-heading text-lg font-bold text-text-primary">Vytvořit účet</h1>
          <p className="mb-6 text-sm text-text-secondary">
            30 dní zdarma, bez platební karty.
          </p>

          <div className="mb-4">
            <label htmlFor="garageName" className="mb-1.5 block text-xs font-medium text-text-secondary">
              Název servisu
            </label>
            <input
              id="garageName"
              name="garageName"
              type="text"
              required
              placeholder="Autoservis Novák"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="ownerName" className="mb-1.5 block text-xs font-medium text-text-secondary">
              Vaše jméno
            </label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              placeholder="Jan Novák"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-5">
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

          {state.error && (
            <p className="mb-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p className="mt-4 text-center text-xs text-text-muted">
            Už máte účet?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Přihlásit se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

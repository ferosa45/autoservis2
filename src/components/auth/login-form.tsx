'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { authenticate, type LoginState } from '@/lib/actions/auth.actions';

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Přihlásit se
    </button>
  );
}

export function LoginForm({ resetSuccess = false }: { resetSuccess?: boolean }) {
  const [state, formAction] = useFormState(authenticate, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">G</div>
          <span className="font-heading text-xl font-extrabold tracking-tight text-text-primary">Garazio</span>
        </div>

        <form action={formAction} className="rounded-lg border border-border bg-surface p-8">
          <h1 className="mb-1 font-heading text-lg font-bold text-text-primary">Přihlášení</h1>
          <p className="mb-6 text-sm text-text-secondary">
            Přihlaste se ke svému autoservisu.
          </p>

          {resetSuccess && (
            <p className="mb-4 rounded-lg border border-status-done-border bg-status-done-bg px-3 py-2 text-sm text-status-done-text">
              Heslo bylo změněno. Nyní se můžete přihlásit.
            </p>
          )}

          <input type="hidden" name="redirectTo" value="/today" />

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

          <div className="mb-2">
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-text-secondary">
              Heslo
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mb-5 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Zapomněli jste heslo?
            </Link>
          </div>

          {state.error && (
            <p className="mb-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p className="mt-4 text-center text-xs text-text-muted">
            Nemáte účet?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Vytvořit účet (30 dní zdarma)
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

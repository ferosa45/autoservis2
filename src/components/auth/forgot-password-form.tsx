'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { requestPasswordReset, type PasswordResetRequestState } from '@/lib/actions/password-reset.actions';

const initialState: PasswordResetRequestState = { sent: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Poslat odkaz pro obnovení
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-status-done-bg text-status-done-text">
          <MailCheck className="h-5 w-5" />
        </div>
        <h1 className="mb-2 font-heading text-lg font-bold text-text-primary">Zkontrolujte svůj email</h1>
        <p className="text-sm leading-6 text-text-secondary">
          Pokud je tento email registrovaný v Garaziu, poslali jsme na něj odkaz pro obnovení hesla.
          Odkaz platí 30 minut.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Zpět na přihlášení
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-8">
      <h1 className="mb-1 font-heading text-lg font-bold text-text-primary">Zapomenuté heslo</h1>
      <p className="mb-6 text-sm leading-6 text-text-secondary">
        Zadejte email, kterým se do Garazia přihlašujete. Pošleme vám odkaz pro nastavení nového hesla.
      </p>

      <div className="mb-5">
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-text-secondary">Email</label>
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

      {state.error && (
        <p className="mb-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {state.error}
        </p>
      )}

      <SubmitButton />
      <p className="mt-4 text-center text-xs text-text-muted">
        <Link href="/login" className="text-primary hover:underline">Zpět na přihlášení</Link>
      </p>
    </form>
  );
}

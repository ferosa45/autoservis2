'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, LockKeyhole } from 'lucide-react';
import { resetPassword, type PasswordResetState } from '@/lib/actions/password-reset.actions';

const initialState: PasswordResetState = { success: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Nastavit nové heslo
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPassword, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-8">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-elevated text-primary">
        <LockKeyhole className="h-5 w-5" />
      </div>
      <h1 className="mb-1 font-heading text-lg font-bold text-text-primary">Nastavit nové heslo</h1>
      <p className="mb-6 text-sm leading-6 text-text-secondary">
        Zvolte si nové heslo. Musí mít alespoň 8 znaků.
      </p>

      <input type="hidden" name="token" value={token} />

      <div className="mb-4">
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-text-secondary">Nové heslo</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-5">
        <label htmlFor="passwordConfirmation" className="mb-1.5 block text-xs font-medium text-text-secondary">Potvrzení hesla</label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="mb-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { verifyEmail, type EmailVerificationState } from '@/lib/actions/email-verification.actions';

const initialState: EmailVerificationState = { success: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Ověřit email
    </button>
  );
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(verifyEmail, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-8 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-status-done-bg text-status-done-text">
        <MailCheck className="h-5 w-5" />
      </div>
      <h1 className="mb-2 font-heading text-lg font-bold text-text-primary">Ověření emailu</h1>
      <p className="text-sm leading-6 text-text-secondary">
        Kliknutím níže ověříte emailovou adresu a aktivujete přihlášení k účtu.
      </p>
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <p className="mt-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <Link href="/login" className="mt-4 inline-block text-xs text-text-muted hover:text-text-primary">
        Zpět na přihlášení
      </Link>
    </form>
  );
}

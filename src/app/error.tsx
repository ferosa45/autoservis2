'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';
import { logout } from '@/lib/actions/auth.actions';
import { READ_ONLY_ACCESS_MESSAGE } from '@/lib/action-errors';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleSession = error.message === 'STALE_SESSION';
  const isReadOnly = error.message === READ_ONLY_ACCESS_MESSAGE;

  useEffect(() => {
    if (!isStaleSession && !isReadOnly) {
      console.error(error);
    }
  }, [error, isStaleSession, isReadOnly]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-status-blocked-bg">
          {isReadOnly ? (
            <Lock className="h-5 w-5 text-status-blocked-text" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-status-blocked-text" />
          )}
        </div>

        {isStaleSession ? (
          <>
            <h1 className="font-heading text-lg font-bold text-text-primary">
              Relace už neplatí
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Váš účet odkazuje na servis, který v databázi už neexistuje - typicky po obnovení
              nebo resetu databáze. Přihlaste se prosím znovu.
            </p>
            <form action={logout} className="mt-5">
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Odhlásit se a přihlásit znovu
              </button>
            </form>
          </>
        ) : isReadOnly ? (
          <>
            <h1 className="font-heading text-lg font-bold text-text-primary">
              Zkušební období vypršelo
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {READ_ONLY_ACCESS_MESSAGE}
            </p>
            <Link
              href="/billing"
              className="mt-5 block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Aktivovat předplatné
            </Link>
            <button
              type="button"
              onClick={reset}
              className="mt-2 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated"
            >
              Zpět
            </button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-lg font-bold text-text-primary">Něco se nepovedlo</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Zkuste to prosím znovu. Pokud problém přetrvává, zkontrolujte připojení k databázi.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Zkusit znovu
            </button>
          </>
        )}
      </div>
    </div>
  );
}

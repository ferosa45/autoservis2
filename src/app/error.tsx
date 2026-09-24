'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-status-blocked-bg">
          <AlertTriangle className="h-5 w-5 text-status-blocked-text" />
        </div>

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
      </div>
    </div>
  );
}

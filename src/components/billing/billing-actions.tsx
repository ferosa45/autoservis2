'use client';

import { useState, useTransition } from 'react';
import { Loader2, CreditCard, Settings } from 'lucide-react';
import { startCheckout, openBillingPortal } from '@/lib/actions/billing.actions';

export function BillingActions({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout();
      if (result?.error) setError(result.error);
    });
  }

  function handleManage() {
    setError(null);
    startTransition(async () => {
      const result = await openBillingPortal();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      {hasActiveSubscription ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handleManage}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-border disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          Spravovat předplatné
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubscribe}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Aktivovat předplatné - 299 Kč / měsíc
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {error}
        </p>
      )}
    </div>
  );
}

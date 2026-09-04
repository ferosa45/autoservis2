import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatShortDate } from '@/lib/format';
import { BillingActions } from '@/components/billing/billing-actions';
import { cn } from '@/lib/utils';

const STATUS_DISPLAY = {
  TRIALING: { label: 'Zkušební období', icon: Clock, className: 'text-status-waiting-text' },
  ACTIVE: { label: 'Aktivní předplatné', icon: CheckCircle2, className: 'text-status-done-text' },
  PAST_DUE: { label: 'Platba se nezdařila', icon: AlertTriangle, className: 'text-status-blocked-text' },
  CANCELED: { label: 'Předplatné zrušeno', icon: XCircle, className: 'text-status-blocked-text' },
} as const;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const { success, canceled } = await searchParams;
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });

  if (!garage) return null;

  const display = STATUS_DISPLAY[garage.subscriptionStatus];
  const Icon = display.icon;
  const now = new Date();
  const trialDaysLeft = Math.ceil((garage.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const subscriptionEndsAt = garage.subscriptionEndsAt;
  const cancelAtPeriodEnd = garage.subscriptionCancelAtPeriodEnd;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Předplatné</h1>

      {success === '1' && (
        <div className="rounded-lg border border-status-done-border bg-status-done-bg px-4 py-3 text-sm text-status-done-text">
          Platba proběhla úspěšně. Aktivace předplatného se potvrzuje po přijetí platby od Stripe.
        </div>
      )}
      {canceled === '1' && (
        <div className="rounded-lg border border-status-waiting-border bg-status-waiting-bg px-4 py-3 text-sm text-status-waiting-text">
          Platba byla zrušena. Předplatné se neaktivovalo.
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Icon className={cn('h-5 w-5', display.className)} />
          <span className={cn('font-heading text-lg font-bold', display.className)}>{display.label}</span>
        </div>

        <dl className="space-y-2 text-sm">
          {garage.subscriptionStatus === 'TRIALING' && (
            <div className="flex justify-between">
              <dt className="text-text-secondary">Zkušební období končí</dt>
              <dd className="text-text-primary">
                {formatShortDate(garage.trialEndsAt)}
                {trialDaysLeft > 0
                  ? ` (za ${trialDaysLeft} ${trialDaysLeft === 1 ? 'den' : trialDaysLeft < 5 ? 'dny' : 'dní'})`
                  : ' (dnes)'}
              </dd>
            </div>
          )}

          {subscriptionEndsAt && (garage.subscriptionStatus === 'ACTIVE' || garage.subscriptionStatus === 'CANCELED') && (
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">
                {cancelAtPeriodEnd || garage.subscriptionStatus === 'CANCELED' ? 'Předplatné skončí' : 'Další období'}
              </dt>
              <dd className="text-right text-text-primary">
                {formatShortDate(subscriptionEndsAt)}
                {cancelAtPeriodEnd && garage.subscriptionStatus === 'ACTIVE' ? ' (zrušeno)' : ''}
              </dd>
            </div>
          )}

          <div className="flex justify-between">
            <dt className="text-text-secondary">Cena</dt>
            <dd className="text-text-primary">299 Kč / měsíc</dd>
          </div>
        </dl>

        {cancelAtPeriodEnd && garage.subscriptionStatus === 'ACTIVE' && subscriptionEndsAt && (
          <p className="mt-4 rounded-lg border border-status-waiting-border bg-status-waiting-bg px-3 py-2 text-xs text-status-waiting-text">
            Předplatné je zrušené, ale zůstává aktivní do {formatShortDate(subscriptionEndsAt)}. Do té doby můžete Garazio normálně používat.
          </p>
        )}

        {!context.hasWriteAccess && (
          <p className="mt-4 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
            Účet je momentálně pouze ke čtení – pro úpravy a nové zakázky aktivujte předplatné.
          </p>
        )}
      </div>

      <BillingActions
        hasActiveSubscription={!!garage.stripeSubscriptionId && garage.subscriptionStatus !== 'CANCELED'}
      />
    </div>
  );
}

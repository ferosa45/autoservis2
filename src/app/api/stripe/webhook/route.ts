import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Potřebuje Node.js runtime (ne Edge) kvůli ověření podpisu a Prisma.
export const runtime = 'nodejs';

function mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    default:
      return 'CANCELED';
  }
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  if (typeof itemPeriodEnd === 'number') return new Date(itemPeriodEnd * 1000);
  if (typeof subscription.cancel_at === 'number') return new Date(subscription.cancel_at * 1000);
  return null;
}

function isScheduledCancellation(subscription: Stripe.Subscription): boolean {
  if (subscription.cancel_at_period_end) return true;

  // Stripe Billing Portal může u některých subscription nastavit konkrétní
  // cancel_at timestamp místo cancel_at_period_end=true.
  return (
    typeof subscription.cancel_at === 'number' &&
    subscription.cancel_at * 1000 > Date.now() &&
    subscription.status !== 'canceled'
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse('Chybí Stripe webhook konfigurace', { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return new NextResponse(`Neplatný webhook podpis: ${(err as Error).message}`, { status: 400 });
  }

  // Stripe může stejný event doručit vícekrát. Pokud už jsme ho úspěšně
  // zpracovali, nic dalšího nedělejme.
  const alreadyProcessed = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id },
    select: { id: true },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const garageId = session.metadata?.garageId;
      if (garageId && typeof session.subscription === 'string') {
        await prisma.garage.update({
          where: { id: garageId },
          data: {
            subscriptionStatus: 'ACTIVE',
            stripeSubscriptionId: session.subscription,
            ...(typeof session.customer === 'string' ? { stripeCustomerId: session.customer } : {}),
          },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const garage = await prisma.garage.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (garage) {
        const subscriptionEndsAt = getSubscriptionPeriodEnd(subscription);
        const scheduledCancellation = isScheduledCancellation(subscription);
        await prisma.garage.update({
          where: { id: garage.id },
          data: {
            subscriptionStatus: mapStripeStatus(subscription.status),
            subscriptionCancelAtPeriodEnd: scheduledCancellation,
            ...(subscriptionEndsAt ? { subscriptionEndsAt } : {}),
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const garage = await prisma.garage.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (garage) {
        const endedAt = typeof subscription.ended_at === 'number'
          ? new Date(subscription.ended_at * 1000)
          : garage.subscriptionEndsAt;
        await prisma.garage.update({
          where: { id: garage.id },
          data: {
            subscriptionStatus: 'CANCELED',
            subscriptionCancelAtPeriodEnd: false,
            ...(endedAt ? { subscriptionEndsAt: endedAt } : {}),
          },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id ?? null;
      if (subscriptionId) {
        const garage = await prisma.garage.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (garage) {
          await prisma.garage.update({
            where: { id: garage.id },
            data: { subscriptionStatus: 'PAST_DUE' },
          });
        }
      }
      break;
    }

    default:
      break;
  }

  // Event ukládáme až po úspěšném zpracování. Když zpracování selže,
  // Stripe dostane chybu a může event bezpečně doručit znovu.
  try {
    await prisma.stripeEvent.create({
      data: { eventId: event.id, type: event.type },
    });
  } catch (error) {
    // Paralelní doručení stejného eventu může narazit na unique constraint.
    // Stav garáže je v takovém případě už zpracovaný, takže odpovíme OK.
    if (!isUniqueConstraintError(error)) throw error;
  }

  return NextResponse.json({ received: true });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

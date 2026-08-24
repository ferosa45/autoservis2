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

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse('Chybí Stripe webhook konfigurace', { status: 400 });
  }

  // Ověření podpisu potřebuje SUROVÉ tělo požadavku (ne JSON.parse) -
  // Next.js App Router route handlery ho automaticky neparsují, takže
  // request.text() dá přesně to, co Stripe očekává.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return new NextResponse(`Neplatný webhook podpis: ${(err as Error).message}`, { status: 400 });
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
        await prisma.garage.update({
          where: { id: garage.id },
          data: { subscriptionStatus: mapStripeStatus(subscription.status) },
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
        await prisma.garage.update({
          where: { id: garage.id },
          data: { subscriptionStatus: 'CANCELED' },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // Stripe SDK v22+ přesunulo subscription referenci z Invoice.subscription
      // (už neexistuje) do Invoice.parent.subscription_details.subscription.
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
      // Ostatní typy událostí (jsou jich desítky) záměrně ignorujeme -
      // nic v appce na nich nezávisí.
      break;
  }

  return NextResponse.json({ received: true });
}

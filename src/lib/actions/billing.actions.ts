'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export type BillingActionState = { error: string | null };

async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

  if (host) {
    const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${protocol}://${host}`;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return new URL(configuredUrl).origin;
}

function friendlyStripeError(e: unknown): string {
  if (e instanceof Error && e.message === 'STRIPE_NOT_CONFIGURED') {
    return 'Platby zatím nejsou nastavené (chybí Stripe klíče). Kontaktujte podporu.';
  }
  return 'Nepodařilo se spustit platbu. Zkuste to prosím znovu.';
}

export async function startCheckout(): Promise<BillingActionState> {
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });
  if (!garage) return { error: 'Servis nenalezen.' };

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return { error: 'Platby zatím nejsou nastavené (chybí cena předplatného). Kontaktujte podporu.' };
  }

  let sessionUrl: string | null;

  try {
    const stripe = getStripeClient();
    const baseUrl = await getBaseUrl();

    let customerId = garage.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: garage.name,
        email: garage.email ?? undefined,
        metadata: { garageId: garage.id },
      });
      customerId = customer.id;
      await prisma.garage.update({ where: { id: garage.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/predplatne?success=1`,
      cancel_url: `${baseUrl}/predplatne?canceled=1`,
      metadata: { garageId: garage.id },
      subscription_data: { metadata: { garageId: garage.id } },
    });

    sessionUrl = session.url;
  } catch (e) {
    return { error: friendlyStripeError(e) };
  }

  if (!sessionUrl) {
    return { error: 'Nepodařilo se vytvořit platební session.' };
  }

  // redirect() musí být MIMO try/catch - interně vyhazuje speciální
  // NEXT_REDIRECT, který musí propadnout dál, ne být zachycen jako chyba.
  redirect(sessionUrl);
}

export async function openBillingPortal(): Promise<BillingActionState> {
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });

  if (!garage?.stripeCustomerId) {
    return { error: 'Servis zatím nemá žádné předplatné ke správě.' };
  }

  let sessionUrl: string | null;

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: garage.stripeCustomerId,
      return_url: `${await getBaseUrl()}/predplatne`,
    });
    sessionUrl = session.url;
  } catch (e) {
    return { error: friendlyStripeError(e) };
  }

  if (!sessionUrl) {
    return { error: 'Nepodařilo se otevřít správu předplatného.' };
  }

  redirect(sessionUrl);
}

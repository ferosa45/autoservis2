import Stripe from 'stripe';

let cachedClient: Stripe | null = null;

/**
 * Vrátí Stripe klienta, nebo vyhodí jasnou chybu, pokud STRIPE_SECRET_KEY
 * není v .env nastavený. Appka musí jít spustit i bez Stripe klíčů (jen
 * platby nebudou fungovat, dokud je nedoplníš) - proto lazy inicializace
 * místo pádu hned při startu/importu.
 */
export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_NOT_CONFIGURED');
  }

  cachedClient = new Stripe(secretKey);
  return cachedClient;
}

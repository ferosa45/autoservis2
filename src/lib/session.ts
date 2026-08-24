import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { SubscriptionStatus } from '@prisma/client';

export type SessionContext = {
  userId: string;
  garageId: string;
  role: 'OWNER' | 'MECHANIC';
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date;
  /**
   * true = plné oprávnění zapisovat (aktivní předplatné NEBO stále běžící
   * trial). false = zápisy jsou zakázané, appka je jen ke čtení (vypršelý
   * trial bez platby, nebo zrušené/nezaplacené předplatné).
   */
  hasWriteAccess: boolean;
};

/**
 * Vyhozena, když JWT session odkazuje na servis (garageId), který v databázi
 * už neexistuje - typicky po obnovení/resetu databáze (např. nová Railway
 * instance), kdy staré ID v cookie neodpovídá nově vygenerovaným záznamům.
 * Bez téhle kontroly by první DB operace spadla na kryptickou FK chybu
 * hluboko v Prisma transakci.
 */
export class StaleSessionError extends Error {
  constructor() {
    super('STALE_SESSION');
    this.name = 'StaleSessionError';
  }
}

/**
 * Vyhozena z assertWriteAccess(), když se servis pokusí o zápis bez
 * platného přístupu (vypršelý trial, zrušené/nezaplacené předplatné).
 * Zachytává ji error.tsx a nabídne odkaz na /billing.
 */
export class ReadOnlyAccessError extends Error {
  constructor() {
    super('READ_ONLY_ACCESS');
    this.name = 'ReadOnlyAccessError';
  }
}

function computeHasWriteAccess(subscriptionStatus: SubscriptionStatus, trialEndsAt: Date): boolean {
  if (subscriptionStatus === 'ACTIVE') return true;
  if (subscriptionStatus === 'TRIALING') return trialEndsAt.getTime() > Date.now();
  // PAST_DUE, CANCELED - bez ohledu na trialEndsAt
  return false;
}

/**
 * Jediné bezpečné místo, odkud se v aplikaci čte garageId.
 *
 * DŮLEŽITÉ: garageId se NIKDY nesmí brát z requestu/payloadu poslaného
 * klientem. Vždy se čte výhradně ze server-side session (JWT).
 * Každá service funkce, která pracuje s daty, musí na začátku zavolat
 * tento helper a použít vrácené garageId pro všechny Prisma dotazy
 * (where i create).
 *
 * Vyhodí chybu, pokud uživatel není přihlášen - server actions a
 * route handlery ji nechávají probublat, middleware by ale za normálních
 * okolností neautentizovaného uživatele na chráněné routy vůbec nepustil.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const session = await auth();

  if (!session?.user?.id || !session.user.garageId) {
    throw new Error('UNAUTHENTICATED');
  }

  const garage = await prisma.garage.findUnique({
    where: { id: session.user.garageId },
    select: { id: true, subscriptionStatus: true, trialEndsAt: true },
  });

  if (!garage) {
    throw new StaleSessionError();
  }

  return {
    userId: session.user.id,
    garageId: session.user.garageId,
    role: session.user.role,
    subscriptionStatus: garage.subscriptionStatus,
    trialEndsAt: garage.trialEndsAt,
    hasWriteAccess: computeHasWriteAccess(garage.subscriptionStatus, garage.trialEndsAt),
  };
}

/**
 * Zavolat na začátku KAŽDÉ mutující server action (vytvoření/úprava/mazání
 * čehokoliv). Čtení (GET dat pro zobrazení) tímhle procházet nemusí -
 * appka má v režimu vypršelého trialu/předplatného zůstat čitelná, jen
 * needitovatelná.
 */
export function assertWriteAccess(context: SessionContext): void {
  if (!context.hasWriteAccess) {
    throw new ReadOnlyAccessError();
  }
}

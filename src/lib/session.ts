import { auth } from '@/lib/auth';

export type SessionContext = {
  userId: string;
  garageId: string;
  role: 'OWNER' | 'MECHANIC';
};

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

  return {
    userId: session.user.id,
    garageId: session.user.garageId,
    role: session.user.role,
  };
}

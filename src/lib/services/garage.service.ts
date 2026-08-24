import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

export async function getGarage(context: SessionContext) {
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });
  if (!garage) throw new Error('Servis nenalezen');
  return garage;
}

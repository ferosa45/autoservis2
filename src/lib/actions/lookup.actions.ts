'use server';

import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/session';

export type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string;
};

export type VehicleSuggestion = {
  id: string;
  brand: string;
  model: string;
  licensePlate: string | null;
  customerId: string;
};

export async function searchCustomers(query: string): Promise<CustomerSuggestion[]> {
  const context = await getSessionContext();
  const q = query.trim();
  if (q.length === 0) return [];

  const words = q.split(/\s+/).filter(Boolean);

  return prisma.customer.findMany({
    where: {
      garageId: context.garageId,
      AND: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: 'insensitive' as const } },
          { phone: { contains: word } },
          { email: { contains: word, mode: 'insensitive' as const } },
          { companyName: { contains: word, mode: 'insensitive' as const } },
          { ico: { contains: word, mode: 'insensitive' as const } },
        ],
      })),
    },
    orderBy: { name: 'asc' },
    take: 6,
    select: { id: true, name: true, phone: true },
  });
}

/**
 * Pokud je zadané customerId, hledá jen mezi vozidly toho zákazníka (a bez
 * dotazu rovnou nabídne všechna jeho vozidla - typicky jedno až dvě).
 * Bez customerId hledá napříč celým servisem podle značky/modelu/SPZ.
 */
export async function searchVehicles(
  query: string,
  customerId: string | null
): Promise<VehicleSuggestion[]> {
  const context = await getSessionContext();
  const q = query.trim();

  if (customerId) {
    return prisma.vehicle.findMany({
      where: {
        garageId: context.garageId,
        customerId,
        ...(q.length > 0
          ? {
              OR: [
                { brand: { contains: q, mode: 'insensitive' } },
                { model: { contains: q, mode: 'insensitive' } },
                { licensePlate: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, brand: true, model: true, licensePlate: true, customerId: true },
    });
  }

  if (q.length === 0) return [];

  return prisma.vehicle.findMany({
    where: {
      garageId: context.garageId,
      OR: [
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { licensePlate: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: { id: true, brand: true, model: true, licensePlate: true, customerId: true },
  });
}

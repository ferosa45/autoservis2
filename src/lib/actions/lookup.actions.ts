'use server';

import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/session';
import { normalizeSearchText, normalizeCompactSearchText } from '@/lib/search-normalize';

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
  const normalizedWords = words.map(normalizeSearchText).filter(Boolean);
  const compactWords = words.map(normalizeCompactSearchText).filter(Boolean);

  return prisma.customer.findMany({
    where: {
      garageId: context.garageId,
      AND: normalizedWords.map((word, index) => ({
        OR: [
          { nameNormalized: { contains: word } },
          { companyNameNormalized: { contains: word } },
          { emailNormalized: { contains: word } },
          { phoneNormalized: { contains: compactWords[index] ?? word } },
          { icoNormalized: { contains: compactWords[index] ?? word } },
        ],
      })),
    },
    orderBy: { name: 'asc' },
    take: 6,
    select: { id: true, name: true, phone: true },
  });
}

export async function searchVehicles(
  query: string,
  customerId: string | null
): Promise<VehicleSuggestion[]> {
  const context = await getSessionContext();
  const q = query.trim();
  const normalized = normalizeSearchText(q);
  const compact = normalizeCompactSearchText(q);

  const searchFilter = q.length > 0
    ? {
        OR: [
          { brandNormalized: { contains: normalized } },
          { modelNormalized: { contains: normalized } },
          { licensePlateNormalized: { contains: compact } },
        ],
      }
    : {};

  return prisma.vehicle.findMany({
    where: {
      garageId: context.garageId,
      ...(customerId ? { customerId } : {}),
      ...searchFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: { id: true, brand: true, model: true, licensePlate: true, customerId: true },
  });
}

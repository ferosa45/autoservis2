import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

export async function listCustomers(context: SessionContext, query?: string) {
  const q = query?.trim();

  return prisma.customer.findMany({
    where: {
      garageId: context.garageId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { vehicles: { some: { licensePlate: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: {
      vehicles: { select: { id: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCustomerDetail(context: SessionContext, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, garageId: context.garageId },
    include: {
      vehicles: {
        orderBy: { createdAt: 'desc' },
        include: {
          // Posledních 5 zakázek stačí na "historii" u malého servisu -
          // není to reporting nástroj, jen rychlý přehled.
          jobs: {
            orderBy: { scheduledStart: 'desc' },
            take: 5,
            select: {
              id: true,
              number: true,
              scheduledStart: true,
              status: true,
              customerRequest: true,
            },
          },
        },
      },
    },
  });
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

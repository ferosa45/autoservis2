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
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, garageId: context.garageId },
    include: {
      vehicles: {
        orderBy: { createdAt: 'desc' },
        include: {
          jobs: {
            orderBy: { scheduledStart: 'desc' },
            select: {
              id: true,
              number: true,
              scheduledStart: true,
              status: true,
              customerRequest: true,
              invoices: {
                orderBy: { createdAt: 'desc' },
                select: {
                  total: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  return {
    ...customer,
    vehicles: customer.vehicles.map((vehicle) => ({
      ...vehicle,
      jobs: vehicle.jobs.map((job) => {
        const validInvoices = job.invoices.filter((invoice) => invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT');
        const latestInvoice = validInvoices[0];

        return {
          id: job.id,
          number: job.number,
          scheduledStart: job.scheduledStart,
          status: job.status,
          customerRequest: job.customerRequest,
          invoice: latestInvoice ? { total: Number(latestInvoice.total) } : null,
        };
      }),
    })),
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

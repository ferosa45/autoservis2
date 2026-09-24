import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';
import { addPragueDays, getPragueDateParts, startOfPragueDay } from '@/lib/date-time';

/** Vrátí pondělí týdne, do kterého spadá zadané datum, s časem na půlnoci. */
export function getWeekStart(date: Date): Date {
  const local = getPragueDateParts(date);
  const diffToMonday = local.dayOfWeek === 0 ? -6 : 1 - local.dayOfWeek;
  return startOfPragueDay(addPragueDays(date, diffToMonday));
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addPragueDays(weekStart, i));
}

export type WeekFilters = {
  status?: JobStatus;
  mechanicId?: string;
};

export async function getJobsForWeek(
  context: SessionContext,
  weekStart: Date,
  filters: WeekFilters = {}
) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const jobs = await prisma.job.findMany({
    where: {
      garageId: context.garageId,
      scheduledStart: { gte: weekStart, lt: weekEnd },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.mechanicId ? { assignedUserId: filters.mechanicId } : {}),
    },
    select: {
      id: true,
      number: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      customerRequest: true,
      vehicle: {
        select: { brand: true, model: true, licensePlate: true },
      },
      // Statistiky potřebují pouze cenu a množství, ne celé položky.
      items: context.permissions.canViewFinancials
        ? { select: { quantity: true, unitPrice: true } }
        : { select: { quantity: true } },
      invoices: {
        where: { status: { in: ['ISSUED', 'PAID'] }, issueDate: { gte: weekStart, lt: weekEnd } },
        select: { total: true },
      },
    },
    orderBy: { scheduledStart: 'asc' },
  });

  return jobs.map((job) => ({
    ...job,
    items: job.items.map((item) => ({
      ...item,
      unitPrice: 'unitPrice' in item ? item.unitPrice : null,
    })),
  }));
}

export type WeekJob = Awaited<ReturnType<typeof getJobsForWeek>>[number];

export function calculateWeekStats(jobs: WeekJob[]) {
  const totalThisWeek = jobs.length;
  const waitingForPart = jobs.filter((j) => j.status === 'BLOCKED').length;
  const done = jobs.filter((j) => j.status === 'DONE').length;

  const revenueThisWeek = jobs
    .filter((job) => job.status === 'DONE')
    .reduce((sum, job) => sum + job.items.reduce((itemSum, item) => itemSum + Number(item.quantity) * Number(item.unitPrice ?? 0), 0), 0);

  return { totalThisWeek, waitingForPart, done, revenueThisWeek };
}

export async function getMechanics(context: SessionContext) {
  return prisma.user.findMany({
    where: {
      garageId: context.garageId,
      role: 'MECHANIC',
      active: true,
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

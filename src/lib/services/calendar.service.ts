import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

/** Vrátí pondělí týdne, do kterého spadá zadané datum, s časem na půlnoci. */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
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

  return prisma.job.findMany({
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
      items: {
        select: { quantity: true, unitPrice: true },
      },
    },
    orderBy: { scheduledStart: 'asc' },
  });
}

export type WeekJob = Awaited<ReturnType<typeof getJobsForWeek>>[number];

export function calculateWeekStats(jobs: WeekJob[]) {
  const totalThisWeek = jobs.length;
  const waitingForPart = jobs.filter((j) => j.status === 'BLOCKED').length;
  const done = jobs.filter((j) => j.status === 'DONE').length;

  const revenueThisWeek = jobs
    .filter((j) => j.status === 'DONE')
    .reduce((sum, job) => {
      const jobTotal = job.items.reduce(
        (itemSum, item) => itemSum + Number(item.quantity) * Number(item.unitPrice),
        0
      );
      return sum + jobTotal;
    }, 0);

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

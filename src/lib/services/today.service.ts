import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getJobsForDay(context: SessionContext, date: Date) {
  const { start, end } = dayRange(date);

  return prisma.job.findMany({
    where: {
      garageId: context.garageId,
      scheduledStart: { gte: start, lte: end },
    },
    include: {
      customer: true,
      vehicle: true,
      tasks: true,
      items: true,
    },
    orderBy: { scheduledStart: 'asc' },
  });
}

export type JobForDay = Awaited<ReturnType<typeof getJobsForDay>>[number];

export async function getJobDetail(context: SessionContext, jobId: string) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      garageId: context.garageId, // nikdy nevěřit, že uživatel může vyžádat cizí zakázku
    },
    include: {
      customer: true,
      vehicle: true,
      tasks: true,
      items: true,
      assignedUser: true,
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
}

export async function getTasksForDay(context: SessionContext, date: Date) {
  const { end } = dayRange(date);

  // "Úkoly na dnes" = nesplněné úkoly s termínem do konce dneška (včetně po termínu)
  // plus úkoly bez termínu, ale zatím nedokončené.
  return prisma.task.findMany({
    where: {
      garageId: context.garageId,
      completed: false,
      OR: [{ dueDate: { lte: end } }, { dueDate: null }],
    },
    include: { job: { include: { vehicle: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    take: 10,
  });
}

export function calculateTodayStats(jobs: JobForDay[]) {
  const totalToday = jobs.length;
  const waitingForPart = jobs.filter((j) => j.status === 'BLOCKED').length;
  const done = jobs.filter((j) => j.status === 'DONE').length;

  const revenueToday = jobs
    .filter((j) => j.status === 'DONE')
    .reduce((sum, job) => {
      const jobTotal = job.items.reduce(
        (itemSum, item) => itemSum + Number(item.quantity) * Number(item.unitPrice),
        0
      );
      return sum + jobTotal;
    }, 0);

  return { totalToday, waitingForPart, done, revenueToday };
}

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
    where: { garageId: context.garageId, scheduledStart: { gte: start, lte: end } },
    select: {
      id: true, number: true, scheduledStart: true, scheduledEnd: true, status: true,
      customerRequest: true, updatedAt: true,
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { brand: true, model: true, licensePlate: true } },
      assignedUser: { select: { id: true, name: true } },
      tasks: { select: { id: true, title: true, completed: true } },
      items: { select: { quantity: true, unitPrice: true } },
    },
    orderBy: { scheduledStart: 'asc' },
  });
}

export type JobForDay = Awaited<ReturnType<typeof getJobsForDay>>[number];

export async function getJobDetail(context: SessionContext, jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, garageId: context.garageId },
    include: {
      customer: true,
      vehicle: true,
      tasks: true,
      items: true,
      assignedUser: true,
      workSessions: { include: { user: true }, orderBy: { startedAt: 'asc' } },
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
}

export async function getTasksForDay(context: SessionContext, date: Date) {
  const { end } = dayRange(date);
  return prisma.task.findMany({
    where: { garageId: context.garageId, completed: false, OR: [{ dueDate: { lte: end } }, { dueDate: null }] },
    select: {
      id: true, title: true, completed: true, dueDate: true,
      job: { select: { id: true, number: true, vehicle: { select: { brand: true, model: true } } } },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }], take: 10,
  });
}

export function calculateTodayStats(jobs: JobForDay[]) {
  const totalToday = jobs.length;
  const waitingForPart = jobs.filter((j) => j.status === 'BLOCKED').length;
  const done = jobs.filter((j) => j.status === 'DONE').length;
  const revenueToday = jobs.filter((j) => j.status === 'DONE').reduce((sum, job) => {
    const jobTotal = job.items.reduce((itemSum, item) => itemSum + Number(item.quantity) * Number(item.unitPrice), 0);
    return sum + jobTotal;
  }, 0);
  return { totalToday, waitingForPart, done, revenueToday };
}

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

  const jobs = await prisma.job.findMany({
    where: { garageId: context.garageId, scheduledStart: { gte: start, lte: end } },
    select: {
      id: true,
      number: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      customerRequest: true,
      updatedAt: true,
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { brand: true, model: true, licensePlate: true } },
      assignedUser: { select: { id: true, name: true, active: true } },
      tasks: { select: { id: true, title: true, completed: true }, orderBy: { createdAt: 'asc' } },
      items: context.permissions.canViewFinancials
        ? { select: { quantity: true, unitPrice: true } }
        : { select: { quantity: true } },
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

export type JobForDay = Awaited<ReturnType<typeof getJobsForDay>>[number];

export async function getJobDetail(context: SessionContext, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, garageId: context.garageId },
    select: {
      id: true,
      number: true,
      status: true,
      createdAt: true,
      scheduledStart: true,
      scheduledEnd: true,
      customerRequest: true,
      note: true,
      customer: { select: { id: true, name: true, phone: true, email: true } },
      vehicle: { select: { brand: true, model: true, licensePlate: true, year: true, mileage: true } },
      assignedUser: { select: { id: true, name: true, active: true } },
      tasks: { select: { id: true, title: true, completed: true }, orderBy: { createdAt: 'asc' } },
      items: context.permissions.canViewFinancials
        ? { select: { id: true, title: true, quantity: true, unit: true, unitPrice: true }, orderBy: { createdAt: 'asc' } }
        : { select: { id: true, title: true, quantity: true, unit: true }, orderBy: { createdAt: 'asc' } },
      invoices: {
        where: { status: { in: ['DRAFT', 'ISSUED', 'PAID'] } },
        select: { id: true, number: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      workSessions: {
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { startedAt: 'asc' },
      },
      events: {
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) return null;

  return {
    ...job,
    items: job.items.map((item) => ({
      ...item,
      unitPrice: 'unitPrice' in item ? item.unitPrice : null,
    })),
  };
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
  const inProgress = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const revenueToday = jobs.filter((j) => j.status === 'DONE').reduce((sum, job) => {
    const jobTotal = job.items.reduce((itemSum, item) => itemSum + Number(item.quantity) * Number(item.unitPrice ?? 0), 0);
    return sum + jobTotal;
  }, 0);
  return { totalToday, waitingForPart, inProgress, revenueToday };
}

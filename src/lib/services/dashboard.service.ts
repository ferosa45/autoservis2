import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export async function getDashboardData(context: SessionContext, now = new Date(), monthKey?: string) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const parsedMonth = monthKey?.match(/^(\\d{4})-(\\d{2})$/);
  const selectedYear = parsedMonth ? Number(parsedMonth[1]) : now.getFullYear();
  const selectedMonth = parsedMonth ? Number(parsedMonth[2]) - 1 : now.getMonth();
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = endOfDay(new Date(selectedYear, selectedMonth + 1, 0));
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const monthDataEnd = isCurrentMonth ? todayEnd : monthEnd;
  const historyStart = new Date(todayStart);
  historyStart.setDate(historyStart.getDate() - 29);

  const [todayJobs, monthJobs, historyJobs, mechanics, monthWorkSessions] = await Promise.all([
    prisma.job.findMany({
      where: { garageId: context.garageId, scheduledStart: { gte: todayStart, lte: todayEnd } },
      select: {
        id: true,
        status: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    }),
    prisma.job.findMany({
      where: { garageId: context.garageId, scheduledStart: { gte: monthStart, lte: monthDataEnd } },
      select: {
        id: true,
        status: true,
        items: { select: { quantity: true, unitPrice: true } },
        invoices: { where: { status: { in: ['ISSUED', 'PAID'] } }, select: { total: true } },
      },
    }),
    prisma.job.findMany({
      where: { garageId: context.garageId, scheduledStart: { gte: historyStart, lte: todayEnd } },
      select: {
        id: true,
        scheduledStart: true,
        status: true,
        assignedUser: { select: { id: true, name: true } },
        workSessions: { select: { userId: true, startedAt: true, endedAt: true } },
        invoices: { where: { status: { in: ['ISSUED', 'PAID'] } }, select: { total: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    }),
    prisma.user.findMany({
      where: { garageId: context.garageId, role: 'MECHANIC', active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.workSession.findMany({
      where: {
        garageId: context.garageId,
        startedAt: { lt: monthDataEnd },
        OR: [{ endedAt: null }, { endedAt: { gte: monthStart } }],
      },
      select: { userId: true, startedAt: true, endedAt: true },
    }),
  ]);

  const jobItemsTotal = (items: { quantity: unknown; unitPrice: unknown }[]) =>
    items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

  const invoiceTotal = (invoices: { total: unknown }[]) =>
    invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

  const workMinutesForMonth = (sessions: { startedAt: Date; endedAt: Date | null }[]) =>
    sessions.reduce((sum, session) => {
      const start = Math.max(session.startedAt.getTime(), monthStart.getTime());
      const end = Math.min((session.endedAt ?? monthDataEnd).getTime(), monthDataEnd.getTime());
      return sum + Math.max(0, end - start) / 60000;
    }, 0);

  const workMinutesForDay = (sessions: { startedAt: Date; endedAt: Date | null }[]) =>
    sessions.reduce((sum, session) => {
      const start = Math.max(session.startedAt.getTime(), todayStart.getTime());
      const end = Math.min((session.endedAt ?? now).getTime(), now.getTime());
      return sum + Math.max(0, end - start) / 60000;
    }, 0);

  const mechanicStats = mechanics.map((mechanic) => {
    const sessions = monthWorkSessions.filter((session) => session.userId === mechanic.id);
    return { id: mechanic.id, name: mechanic.name, minutes: Math.round(workMinutesForMonth(sessions)) };
  });

  const daily = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(historyStart);
    date.setDate(historyStart.getDate() + index);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    const jobs = historyJobs.filter((job) => job.scheduledStart >= date && job.scheduledStart < next);
    return {
      date: date.toISOString().slice(0, 10),
      jobs: jobs.length,
      revenue: jobs.reduce((sum, job) => sum + invoiceTotal(job.invoices), 0),
    };
  });

  const monthRevenue = invoiceTotal(monthJobs.flatMap((job) => job.invoices));
  const todayRevenue = todayJobs
    .filter((job) => job.status === 'DONE')
    .reduce((sum, job) => sum + jobItemsTotal(job.items), 0);
  const todayMinutes = Math.round(workMinutesForDay(historyJobs.flatMap((job) => job.workSessions)));
  const doneMonth = monthJobs.filter((job) => job.status === 'DONE').length;
  const averageJobValue = doneMonth > 0 ? monthRevenue / doneMonth : 0;

  return {
    today: {
      total: todayJobs.length,
      inProgress: todayJobs.filter((job) => job.status === 'IN_PROGRESS').length,
      waitingForPart: todayJobs.filter((job) => job.status === 'BLOCKED').length,
      done: todayJobs.filter((job) => job.status === 'DONE').length,
      revenue: todayRevenue,
      workMinutes: todayMinutes,
    },
    month: {
      key: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`,
      jobs: monthJobs.length,
      done: doneMonth,
      revenue: monthRevenue,
      averageJobValue,
    },
    mechanics: mechanicStats,
    daily,
  };
}

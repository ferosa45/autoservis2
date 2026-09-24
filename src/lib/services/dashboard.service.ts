import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionContext } from '@/lib/session';
import { addPragueDays, endOfPragueDay, endOfPragueMonth, getPragueDateParts, startOfPragueDay, startOfPragueMonth } from '@/lib/date-time';

export async function getDashboardData(context: SessionContext, now = new Date(), monthKey?: string) {
  const todayStart = startOfPragueDay(now);
  const todayEnd = endOfPragueDay(now);

  const parsedMonth = monthKey?.match(/^(\d{4})-(\d{2})$/);
  const nowParts = getPragueDateParts(now);
  const selectedYear = parsedMonth ? Number(parsedMonth[1]) : nowParts.year;
  const selectedMonth = parsedMonth ? Number(parsedMonth[2]) - 1 : nowParts.month;
  const monthStart = startOfPragueMonth(selectedYear, selectedMonth);
  const monthEnd = endOfPragueMonth(selectedYear, selectedMonth);
  const isCurrentMonth = selectedYear === nowParts.year && selectedMonth === nowParts.month;
  const monthDataEnd = isCurrentMonth ? todayEnd : monthEnd;
  const historyStart = startOfPragueDay(addPragueDays(now, -29));

  const [todayJobs, monthJobs, historyJobs, mechanics, monthWorkSessions, revenueInvoices] = await Promise.all([
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
      },
    }),
    prisma.job.findMany({
      where: { garageId: context.garageId, scheduledStart: { gte: historyStart, lte: todayEnd } },
      select: {
        id: true,
        scheduledStart: true,
        status: true,
        assignedUser: { select: { id: true, name: true } },
        items: { select: { quantity: true, unitPrice: true } },
        workSessions: { select: { userId: true, startedAt: true, endedAt: true } },
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
    prisma.invoice.findMany({
      where: {
        garageId: context.garageId,
        status: { in: ['ISSUED', 'PAID'] },
        issueDate: { gte: monthStart, lte: monthDataEnd },
      },
      select: { subtotal: true, issueDate: true },
      orderBy: { issueDate: 'asc' },
    }),
  ]);

  const jobItemsTotal = (items: { quantity: unknown; unitPrice: unknown }[]) =>
    items.reduce(
      (sum, item) => sum.add(new Prisma.Decimal(item.quantity).mul(new Prisma.Decimal(item.unitPrice))),
      new Prisma.Decimal(0)
    );

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
    const date = addPragueDays(historyStart, index);
    const next = addPragueDays(date, 1);
    const jobs = historyJobs.filter((job) => job.scheduledStart >= date && job.scheduledStart < next);
    return {
      date: `${getPragueDateParts(date).year}-${String(getPragueDateParts(date).month + 1).padStart(2, '0')}-${String(getPragueDateParts(date).day).padStart(2, '0')}`,
      jobs: jobs.length,
      revenue: jobs
        .filter((job) => job.status === 'DONE')
        .reduce((sum, job) => sum.add(jobItemsTotal(job.items)), new Prisma.Decimal(0)),
    };
  });

  const todayRevenue = todayJobs
    .filter((job) => job.status === 'DONE')
    .reduce((sum, job) => sum.add(jobItemsTotal(job.items)), new Prisma.Decimal(0));
  const monthRevenue = monthJobs
    .filter((job) => job.status === 'DONE')
    .reduce((sum, job) => sum.add(jobItemsTotal(job.items)), new Prisma.Decimal(0));
  const monthInvoiced = revenueInvoices.reduce(
    (sum, invoice) => sum.add(new Prisma.Decimal(invoice.subtotal)),
    new Prisma.Decimal(0)
  );
  const todayMinutes = Math.round(workMinutesForDay(historyJobs.flatMap((job) => job.workSessions)));
  const doneMonth = monthJobs.filter((job) => job.status === 'DONE').length;

  return {
    today: {
      total: todayJobs.length,
      inProgress: todayJobs.filter((job) => job.status === 'IN_PROGRESS').length,
      waitingForPart: todayJobs.filter((job) => job.status === 'BLOCKED').length,
      done: todayJobs.filter((job) => job.status === 'DONE').length,
      revenue: Number(todayRevenue),
      workMinutes: todayMinutes,
    },
    month: {
      key: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`,
      jobs: monthJobs.length,
      done: doneMonth,
      revenue: Number(monthRevenue),
      invoiced: Number(monthInvoiced),
      averageJobValue: Number(doneMonth > 0 ? monthRevenue.div(doneMonth) : new Prisma.Decimal(0)),
    },
    mechanics: mechanicStats,
    daily,
  };
}

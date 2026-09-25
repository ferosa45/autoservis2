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

  const [todayJobs, monthJobCount, doneMonth, monthJobItems, historyJobs, mechanics, monthWorkSessions, revenueInvoices] = await Promise.all([
    prisma.job.findMany({
      where: { garageId: context.garageId, scheduledStart: { gte: todayStart, lte: todayEnd } },
      select: {
        id: true,
        status: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    }),
    prisma.job.count({
      where: { garageId: context.garageId, scheduledStart: { gte: monthStart, lte: monthDataEnd } },
    }),
    prisma.job.count({
      where: { garageId: context.garageId, scheduledStart: { gte: monthStart, lte: monthDataEnd }, status: 'DONE' },
    }),
    prisma.$queryRawUnsafe<{ total: Prisma.Decimal }[]>(
      'SELECT COALESCE(SUM(ji."quantity" * ji."unitPrice"), 0) AS total ' +
      'FROM "JobItem" ji ' +
      'INNER JOIN "Job" j ON j."id" = ji."jobId" ' +
      'WHERE ji."garageId" = $1 ' +
      'AND j."garageId" = $1 ' +
      'AND j."scheduledStart" >= $2 ' +
      'AND j."scheduledStart" <= $3 ' +
      'AND j."status" = \'DONE\'',
      context.garageId,
      monthStart,
      monthDataEnd,
    ),
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
        createdAt: { gte: monthStart, lte: monthDataEnd },
        status: { in: ['ISSUED', 'PAID'] },
      },
      select: { total: true, status: true },
    }),
  ]);

  const monthRevenue = monthJobItems[0]?.total ?? new Prisma.Decimal(0);
  const invoiceRevenue = revenueInvoices.reduce((sum, invoice) => sum.plus(invoice.total), new Prisma.Decimal(0));

  const todayRevenue = todayJobs.reduce(
    (sum, job) => sum.plus(job.items.reduce((jobSum, item) => jobSum.plus(item.quantity * item.unitPrice), new Prisma.Decimal(0))),
    new Prisma.Decimal(0),
  );

  const dailyRevenue = new Map<string, Prisma.Decimal>();
  const dailyJobs = new Map<string, number>();
  for (const job of historyJobs) {
    const key = getPragueDateParts(job.scheduledStart);
    const dateKey = `${key.year}-${String(key.month + 1).padStart(2, '0')}-${String(key.day).padStart(2, '0')}`;
    dailyJobs.set(dateKey, (dailyJobs.get(dateKey) ?? 0) + 1);
    const revenue = job.items.reduce(
      (sum, item) => sum.plus(item.quantity * item.unitPrice),
      new Prisma.Decimal(0),
    );
    dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) ?? new Prisma.Decimal(0)).plus(revenue));
  }

  const dailySeries = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = addPragueDays(now, -i);
    const parts = getPragueDateParts(date);
    const key = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    dailySeries.push({
      date: key,
      jobs: dailyJobs.get(key) ?? 0,
      revenue: dailyRevenue.get(key) ?? new Prisma.Decimal(0),
    });
  }

  const mechanicStats = mechanics.map((mechanic) => {
    let minutes = 0;
    for (const session of monthWorkSessions) {
      if (session.userId !== mechanic.id) continue;
      const end = session.endedAt ?? now;
      const start = session.startedAt < monthStart ? monthStart : session.startedAt;
      const effectiveEnd = end > monthDataEnd ? monthDataEnd : end;
      if (effectiveEnd > start) {
        minutes += Math.round((effectiveEnd.getTime() - start.getTime()) / 60000);
      }
    }
    return { id: mechanic.id, name: mechanic.name, minutes };
  });

  return {
    monthRevenue,
    invoiceRevenue,
    todayRevenue,
    monthJobCount,
    doneMonth,
    dailySeries,
    mechanicStats,
  };
}

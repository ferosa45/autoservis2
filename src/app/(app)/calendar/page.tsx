import { getSessionContext } from '@/lib/session';
import {
  getWeekStart,
  getWeekDays,
  getJobsForWeek,
  calculateWeekStats,
  getMechanics,
} from '@/lib/services/calendar.service';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { WeekOverviewPanel } from '@/components/calendar/week-overview-panel';
import { MiniMonthCalendar } from '@/components/calendar/mini-month-calendar';
import { CalendarFilters } from '@/components/calendar/calendar-filters';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import type { JobStatus } from '@prisma/client';
import { parsePragueDateParam } from '@/lib/date-time';

const VALID_STATUSES: JobStatus[] = ['WAITING', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; status?: string; mechanic?: string; fullDay?: string }>;
}) {
  const { week: weekParam, status: statusParam, mechanic: mechanicParam, fullDay } = await searchParams;
  // Prague-aware week parameter parsing.
  const referenceDate = parsePragueDateParam(weekParam);
  const context = await getSessionContext();

  const weekStart = getWeekStart(referenceDate);
  const weekDays = getWeekDays(weekStart);
  const weekEnd = weekDays[6]!;

  const status = VALID_STATUSES.find((s) => s === statusParam);
  const mechanicId = mechanicParam || undefined;

  const [jobs, mechanics] = await Promise.all([
    getJobsForWeek(context, weekStart, { status, mechanicId }),
    getMechanics(context),
  ]);

  const stats = calculateWeekStats(jobs);
  const startHour = fullDay === '1' ? 0 : 6;
  const endHour = fullDay === '1' ? 24 : 19;

  // CalendarGrid je Client Component a Prisma Decimal (u items) nejde přes
  // server/client hranici poslat přímo. CalendarJobCard položky stejně
  // nevykresluje, takže je pro klientskou část prostě neposíláme.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const jobsForGrid = jobs.map(({ items, ...job }) => job);
  // TZDate nelze bezpečně poslat přes Server -> Client hranici v Next.js.
  // CalendarGrid dostane obyčejné nativní Date instance.
  const weekDaysForGrid = weekDays.map((day) => new Date(day.getTime()));

  return (
    <div className="flex min-w-0 flex-col gap-4 p-3 sm:p-4 md:flex-row md:gap-6 md:p-6">
      <div className="min-w-0 flex-1 space-y-4 md:space-y-6">
        <CalendarHeader weekStart={weekStart} weekEnd={weekEnd} />
        <CalendarGrid weekDays={weekDaysForGrid} jobs={jobsForGrid} startHour={startHour} endHour={endHour} />
      </div>

      <div className="w-full shrink-0 space-y-4 md:w-72">
        <WeekOverviewPanel
          totalThisWeek={stats.totalThisWeek}
          waitingForPart={stats.waitingForPart}
          done={stats.done}
          revenueThisWeek={stats.revenueThisWeek}
          showRevenue={context.permissions.canViewFinancials}
        />
        <MiniMonthCalendar weekStart={weekStart} />
        <CalendarFilters mechanics={mechanics} />
        <CalendarLegend />
      </div>
    </div>
  );
}

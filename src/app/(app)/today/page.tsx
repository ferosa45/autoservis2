import { getSessionContext } from '@/lib/session';
import {
  getJobsForDay,
  getJobDetail,
  getTasksForDay,
  calculateTodayStats,
} from '@/lib/services/today.service';
import { TodayHeader } from '@/components/today/today-header';
import { StatsCards } from '@/components/today/stats-cards';
import { JobTimeline } from '@/components/today/job-timeline';
import { JobDetailPanel } from '@/components/today/job-detail-panel';
import { TasksPanel } from '@/components/today/tasks-panel';
import { QuickActions } from '@/components/today/quick-actions';

function parseDate(dateParam: string | undefined): Date {
  if (!dateParam) return new Date();
  const parsed = new Date(`${dateParam}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; job?: string }>;
}) {
  const { date: dateParam, job: jobParam } = await searchParams;
  const date = parseDate(dateParam);
  const context = await getSessionContext();

  const [jobs, tasks] = await Promise.all([
    getJobsForDay(context, date),
    getTasksForDay(context, date),
  ]);

  const stats = calculateTodayStats(jobs);

  const selectedJobId = jobParam ?? jobs.find((j) => j.status === 'IN_PROGRESS')?.id ?? jobs[0]?.id ?? null;
  const selectedJob = selectedJobId ? await getJobDetail(context, selectedJobId) : null;

  // ZDE JE OPRAVA: Převedeme Prisma Decimal objekty na klasická čísla (number)
  // Předpokládám, že chybová pole (quantity, unitPrice) jsou v poli `items` uvnitř `selectedJob`.
  const serializedJob = selectedJob ? {
    ...selectedJob,
    items: selectedJob.items?.map((item: any) => ({
      ...item,
      // Funkce Number() bezpečně převede Prisma Decimal na klasické číslo
      quantity: item.quantity ? Number(item.quantity) : 0,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
    }))
  } : null;

  return (
    <div className="flex h-full">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <TodayHeader date={date} />
        <StatsCards
          totalToday={stats.totalToday}
          waitingForPart={stats.waitingForPart}
          done={stats.done}
          revenueToday={stats.revenueToday}
        />
        <JobTimeline jobs={jobs} date={date} selectedJobId={selectedJobId} />
        <QuickActions />
      </div>

      <div className="w-[380px] shrink-0 space-y-4 overflow-y-auto border-l border-border p-4">
        {/* ZDE JE ZMĚNA: Předáváme pročištěný objekt serializedJob místo surového selectedJob */}
        {serializedJob ? (
          <JobDetailPanel job={serializedJob} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
            Vyberte zakázku pro zobrazení detailu.
          </div>
        )}
        <TasksPanel tasks={tasks} />
      </div>
    </div>
  );
}
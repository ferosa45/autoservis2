import { serializeJobItems } from '@/lib/serialize';
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
  const rawSelectedJob = selectedJobId ? await getJobDetail(context, selectedJobId) : null;

  // JobDetailPanel je Client Component - posíláme jen pole, která skutečně
  // potřebuje. rawSelectedJob obsahuje navíc invoices s Decimal částkami,
  // které přes server/client hranici neprojdou (spread ...rawSelectedJob
  // by je tam propašoval, i když je komponenta vůbec nepoužívá).
  const selectedJob = rawSelectedJob
    ? {
        id: rawSelectedJob.id,
        status: rawSelectedJob.status,
        createdAt: rawSelectedJob.createdAt,
        scheduledEnd: rawSelectedJob.scheduledEnd,
        customerRequest: rawSelectedJob.customerRequest,
        note: rawSelectedJob.note,
        customer: { name: rawSelectedJob.customer.name, phone: rawSelectedJob.customer.phone },
        vehicle: {
          brand: rawSelectedJob.vehicle.brand,
          model: rawSelectedJob.vehicle.model,
          licensePlate: rawSelectedJob.vehicle.licensePlate,
        },
        assignedUser: rawSelectedJob.assignedUser ? { name: rawSelectedJob.assignedUser.name } : null,
        tasks: rawSelectedJob.tasks.map((t) => ({ id: t.id, title: t.title, completed: t.completed })),
        items: serializeJobItems(rawSelectedJob.items),
        activeInvoice: (() => {
          const invoice = rawSelectedJob.invoices.find((inv) => inv.status !== 'CANCELLED');
          return invoice ? { id: invoice.id, status: invoice.status } : null;
        })(),
      }
    : null;

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
        {selectedJob ? (
          <JobDetailPanel job={selectedJob} />
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

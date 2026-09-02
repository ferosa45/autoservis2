import Link from 'next/link';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { serializeJobItems } from '@/lib/serialize';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { completeOnboarding } from '@/lib/actions/onboarding.actions';
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

  const [jobs, tasks, garage, jobCount] = await Promise.all([
    getJobsForDay(context, date),
    getTasksForDay(context, date),
    prisma.garage.findUnique({
      where: { id: context.garageId },
      select: { name: true, onboardingCompletedAt: true },
    }),
    prisma.job.count({ where: { garageId: context.garageId } }),
  ]);

  const showWelcome = Boolean(garage && !garage.onboardingCompletedAt && jobCount === 0);
  const stats = calculateTodayStats(jobs);

  const selectedJobId = jobParam ?? jobs.find((j) => j.status === 'IN_PROGRESS')?.id ?? jobs[0]?.id ?? null;
  const rawSelectedJob = selectedJobId ? await getJobDetail(context, selectedJobId) : null;

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
          const invoice = rawSelectedJob.invoices.find(
            (inv) => inv.status === 'DRAFT' || inv.status === 'ISSUED' || inv.status === 'PAID'
          );
          if (!invoice) return null;
          if (invoice.status === 'DRAFT') return { id: invoice.id, status: 'DRAFT' as const };
          if (invoice.status === 'ISSUED') return { id: invoice.id, status: 'ISSUED' as const };
          if (invoice.status === 'PAID') return { id: invoice.id, status: 'PAID' as const };
          return null;
        })(),
      }
    : null;

  const taskJobs = jobs.map((job) => ({
    id: job.id,
    number: job.number,
    vehicle: { brand: job.vehicle.brand, model: job.vehicle.model },
  }));

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <div className="min-w-0 flex-1 space-y-5 overflow-visible p-3 sm:space-y-6 sm:p-6 md:overflow-y-auto">
        <TodayHeader date={date} />

        {showWelcome && (
          <section className="overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-sm">
            <div className="flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Vítejte v Garaziu</span>
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  {garage?.name ? `Servis ${garage.name} je připravený.` : 'Váš servis je připravený.'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                  Nemusíte nic složitě nastavovat. Začněte vytvořením první zakázky a Garazio si osaháte rovnou v praxi.
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-muted sm:text-sm">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Účet vytvořen</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 30 dní zdarma</span>
                  <span className="flex items-center gap-1.5"><Plus className="h-4 w-4 text-primary" /> První zakázka čeká na vás</span>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:min-w-52">
                <Link
                  href="/calendar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Vytvořit první zakázku
                </Link>
                <form action={completeOnboarding}>
                  <button type="submit" className="w-full rounded-xl px-5 py-2.5 text-sm text-text-muted hover:bg-elevated hover:text-text-primary">
                    Prohlédnout Garazio
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        <StatsCards
          totalToday={stats.totalToday}
          waitingForPart={stats.waitingForPart}
          done={stats.done}
          revenueToday={stats.revenueToday}
        />
        <JobTimeline jobs={jobs} date={date} selectedJobId={selectedJobId} />
        <QuickActions />
      </div>

      <div className="w-full shrink-0 space-y-4 border-t border-border p-3 sm:p-4 md:w-[380px] md:overflow-y-auto md:border-l md:border-t-0">
        {selectedJob ? (
          <JobDetailPanel job={selectedJob} />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
            Vyberte zakázku pro zobrazení detailu.
          </div>
        )}
        <TasksPanel tasks={tasks} jobs={taskJobs} />
      </div>
    </div>
  );
}

import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getJobsForDay, getJobDetail } from '@/lib/services/today.service';
import { serializeJobItems } from '@/lib/serialize';
import { WorkshopHeader } from '@/components/workshop/workshop-header';
import { WorkshopJobList } from '@/components/workshop/workshop-job-list';
import { WorkshopJobDetail } from '@/components/workshop/workshop-job-detail';
import { parsePragueDateParam } from '@/lib/date-time';

export default async function WorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; date?: string }>;
}) {
  const { job: jobParam, date: dateParam } = await searchParams;
  const date = parseDate(dateParam);
  const context = await getSessionContext();

  const [garage, jobs] = await Promise.all([
    prisma.garage.findUnique({ where: { id: context.garageId }, select: { name: true } }),
    getJobsForDay(context, date),
  ]);

  const selectedJobId = jobParam ?? jobs.find((j) => j.status === 'IN_PROGRESS')?.id ?? jobs[0]?.id ?? null;
  const rawSelectedJob = selectedJobId ? await getJobDetail(context, selectedJobId) : null;

  // WorkshopJobDetail je Client Component - posíláme jen pole, která
  // skutečně potřebuje. rawSelectedJob obsahuje navíc např. invoices
  // s Decimal částkami, které by přes server/client hranici neprošly
  // (spread ...rawSelectedJob by je tam propašoval, i když je komponenta
  // nepoužívá).
  const selectedJob = rawSelectedJob
    ? {
        id: rawSelectedJob.id,
        status: rawSelectedJob.status,
        customerRequest: rawSelectedJob.customerRequest,
        note: rawSelectedJob.note,
        customer: { name: rawSelectedJob.customer.name, phone: rawSelectedJob.customer.phone },
        vehicle: {
          brand: rawSelectedJob.vehicle.brand,
          model: rawSelectedJob.vehicle.model,
          licensePlate: rawSelectedJob.vehicle.licensePlate,
        },
        tasks: rawSelectedJob.tasks.map((t) => ({ id: t.id, title: t.title, completed: t.completed })),
        items: serializeJobItems(rawSelectedJob.items),
      }
    : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <WorkshopHeader garageName={garage?.name ?? 'Autoservis'} date={date} />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[60%] border-r border-border">
          <WorkshopJobList jobs={jobs} selectedJobId={selectedJobId} dateParam={dateParam} />
        </div>
        <div className="w-[40%]">
          {selectedJob ? (
            <WorkshopJobDetail job={selectedJob} showFinancials={context.permissions.canViewFinancials} />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-text-muted">
              <p className="text-lg">Vyberte zakázku vlevo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

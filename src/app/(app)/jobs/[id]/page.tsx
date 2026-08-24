import { notFound } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getJobDetail } from '@/lib/services/today.service';
import { serializeJobItems } from '@/lib/serialize';
import { JobDetailHeader } from '@/components/job-detail/job-detail-header';
import { CustomerInfoCard } from '@/components/job-detail/customer-info-card';
import { VehicleInfoCard } from '@/components/job-detail/vehicle-info-card';
import { TaskChecklist } from '@/components/job-detail/task-checklist';
import { JobItemsList } from '@/components/job-detail/job-items-list';
import { JobNote } from '@/components/job-detail/job-note';
import { JobActions } from '@/components/job-detail/job-actions';
import { JobTimeEditor } from '@/components/job-detail/job-time-editor';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getSessionContext();
  const job = await getJobDetail(context, id);

  if (!job) {
    notFound();
  }

  // JobItemsList je Client Component - Prisma Decimal (quantity/unitPrice)
  // nejde přes server/client hranici poslat přímo, musí se serializovat.
  const serializedItems = serializeJobItems(job.items);

  // Poslední NEZRUŠENÁ faktura - pokud je nejnovější CANCELLED, hledáme
  // starší platnou (viz riziko zmíněné a odsouhlasené ve Fázi 1).
  const fullActiveInvoice = job.invoices.find((inv) => inv.status !== 'CANCELLED') ?? null;

  // JobActions je Client Component a potřebuje jen id/number/status -
  // fullActiveInvoice má navíc Decimal pole (subtotal/vatTotal/total),
  // která přes server/client hranici projít nemůžou, proto posíláme jen
  // vydestrukturovanou podmnožinu.
  const activeInvoice = fullActiveInvoice
    ? { id: fullActiveInvoice.id, number: fullActiveInvoice.number, status: fullActiveInvoice.status }
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <JobDetailHeader number={job.number} scheduledStart={job.scheduledStart} status={job.status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomerInfoCard customer={job.customer} />
            <VehicleInfoCard vehicle={job.vehicle} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Co zákazník nahlásil
            </h3>
            <p className="text-sm text-text-primary">{job.customerRequest}</p>
          </div>

          <TaskChecklist jobId={job.id} tasks={job.tasks} />
          <JobItemsList jobId={job.id} items={serializedItems} />
          <JobNote jobId={job.id} initialNote={job.note} />
        </div>

        <div className="space-y-6">
          <JobTimeEditor jobId={job.id} scheduledStart={job.scheduledStart} scheduledEnd={job.scheduledEnd} />
          <JobActions jobId={job.id} status={job.status} latestInvoice={activeInvoice} />
        </div>
      </div>
    </div>
  );
}

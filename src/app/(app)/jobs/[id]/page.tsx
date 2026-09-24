import { notFound } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listActiveMechanics } from '@/lib/actions/user.actions';
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
import { JobWorkTimeCard } from '@/components/job-detail/job-work-time-card';
import { JobHistoryTimeline } from '@/components/job-detail/job-history-timeline';
import { MechanicAssignment } from '@/components/job-detail/mechanic-assignment';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getSessionContext();
  const [job, mechanics] = await Promise.all([
    getJobDetail(context, id),
    listActiveMechanics(),
  ]);

  if (!job) notFound();

  const serializedItems = serializeJobItems(job.items);
  const fullActiveInvoice = job.invoices.find((inv) => inv.status !== 'CANCELLED') ?? null;
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Co zákazník nahlásil</h3>
            <p className="text-sm text-text-primary">{job.customerRequest}</p>
          </div>

          <TaskChecklist jobId={job.id} tasks={job.tasks} />
          <JobItemsList jobId={job.id} items={serializedItems} showFinancials={context.permissions.canViewFinancials} />
          <JobNote jobId={job.id} initialNote={job.note} />
          <JobHistoryTimeline events={job.events} />
        </div>

        <div className="space-y-6">
          {context.role === 'OWNER' && (
            <MechanicAssignment
              jobId={job.id}
              current={job.assignedUser ? { id: job.assignedUser.id, name: job.assignedUser.name, active: job.assignedUser.active } : null}
              mechanics={mechanics}
            />
          )}
          <JobTimeEditor jobId={job.id} scheduledStart={job.scheduledStart} scheduledEnd={job.scheduledEnd} />
          <JobWorkTimeCard sessions={job.workSessions} />
          <JobActions jobId={job.id} status={job.status} latestInvoice={activeInvoice} />
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Search, ClipboardList } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { listJobs } from '@/lib/services/job.service';
import { formatShortDate, formatTime } from '@/lib/format';
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR } from '@/lib/job-status';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@prisma/client';

const STATUS_TABS: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'Všechny' },
  { value: 'WAITING', label: 'Čeká' },
  { value: 'IN_PROGRESS', label: 'Pracuje se' },
  { value: 'BLOCKED', label: 'Čeká na díl' },
  { value: 'DONE', label: 'Hotovo' },
];

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const context = await getSessionContext();

  const validStatus = STATUS_TABS.find((t) => t.value === status)?.value || undefined;
  const jobs = await listJobs(context, { query: q, status: validStatus || undefined });

  function tabHref(value: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (value) params.set('status', value);
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Zakázky</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                (status ?? '') === tab.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-elevated'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Obyčejný GET formulář - zachovává filtr stavu jako hidden pole */}
        <form method="GET" className="relative w-full max-w-xs sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Číslo, zákazník, vozidlo, SPZ..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">
            <ClipboardList className="mx-auto mb-2 h-8 w-8 text-text-muted" />
            {q || status ? 'Nic nenalezeno.' : 'Zatím žádné zakázky.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-medium">Číslo</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Zákazník</th>
                <th className="px-4 py-3 font-medium">Vozidlo</th>
                <th className="px-4 py-3 font-medium">Požadavek</th>
                <th className="px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const colors = JOB_STATUS_COLOR[job.status];
                return (
                  <tr key={job.id} className="hover:bg-elevated">
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-mono text-text-primary hover:text-primary">
                        #{job.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatShortDate(job.scheduledStart)} · {formatTime(job.scheduledStart)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{job.customer.name}</td>
                    <td className="px-4 py-3 text-text-primary">
                      {job.vehicle.brand} {job.vehicle.model}
                      {job.vehicle.licensePlate && (
                        <span className="ml-2 font-mono text-xs text-text-muted">
                          {job.vehicle.licensePlate}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-text-secondary">{job.customerRequest}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs font-semibold',
                          colors.bg,
                          colors.border,
                          colors.text
                        )}
                      >
                        {JOB_STATUS_LABEL[job.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

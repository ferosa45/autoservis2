import Link from 'next/link';
import { Search, ClipboardList, Car, User, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
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
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const context = await getSessionContext();

  const validStatus = STATUS_TABS.find((t) => t.value === status)?.value || undefined;
  const requestedPage = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
  const result = await listJobs(context, {
    query: q,
    status: validStatus || undefined,
    page: requestedPage,
    pageSize: 20,
  });
  const { jobs, total, page, pageSize, totalPages } = result;

  function tabHref(value: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (value) params.set('status', value);
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  }

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (validStatus) params.set('status', validStatus);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  }

  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => {
      if (totalPages <= 5) return index + 1;
      if (page <= 3) return index + 1;
      if (page >= totalPages - 2) return totalPages - 4 + index;
      return page - 2 + index;
    }
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Zakázky</h1>

      <div className="space-y-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                (status ?? '') === tab.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-elevated'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form method="GET" className="relative w-full sm:max-w-md">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Číslo, zákazník, vozidlo, SPZ..."
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </form>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-text-muted">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          {q || status ? 'Nic nenalezeno.' : 'Zatím žádné zakázky.'}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{firstItem}–{lastItem} z {total} zakázek</span>
            <span>20 na stránku</span>
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Číslo</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Zákazník</th>
                  <th className="px-4 py-3 font-medium">Vozidlo</th>
                  <th className="px-4 py-3 font-medium">Požadavek</th>
                  <th className="px-4 py-3 font-medium">Mechanik</th>
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
                      <td className="px-4 py-3 text-text-secondary">
                        {job.assignedUser ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-text-muted" />
                            {job.assignedUser.name}
                          </span>
                        ) : (
                          <span className="text-text-muted">Nepřiřazeno</span>
                        )}
                      </td>
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
          </div>

          <div className="space-y-3 md:hidden">
            {jobs.map((job) => {
              const colors = JOB_STATUS_COLOR[job.status];

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-border bg-surface p-4 transition-colors active:bg-elevated"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-semibold text-text-primary">#{job.number}</span>
                        <span className="text-sm text-text-muted">·</span>
                        <span className="text-sm text-text-secondary">
                          {formatShortDate(job.scheduledStart)} · {formatTime(job.scheduledStart)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-1 text-xs font-semibold',
                        colors.bg,
                        colors.border,
                        colors.text
                      )}
                    >
                      {JOB_STATUS_LABEL[job.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Zákazník</div>
                        <div className="truncate font-medium text-text-primary">{job.customer.name}</div>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-muted">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Vozidlo</div>
                        <div className="truncate font-medium text-text-primary">
                          {job.vehicle.brand} {job.vehicle.model}
                          {job.vehicle.licensePlate && (
                            <span className="ml-2 font-mono text-xs text-text-muted">
                              {job.vehicle.licensePlate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-muted">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Mechanik</div>
                        <div className="truncate font-medium text-text-primary">
                          {job.assignedUser?.name ?? 'Nepřiřazeno'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.customerRequest && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="text-xs text-text-muted">Požadavek</div>
                      <div className="mt-1 line-clamp-2 text-sm text-text-secondary">{job.customerRequest}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1" aria-label="Stránkování zakázek">
              <Link
                href={pageHref(page - 1)}
                aria-disabled={page === 1}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors',
                  page === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-elevated hover:text-text-primary'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Předchozí stránka</span>
              </Link>

              {pageNumbers.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={pageHref(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                    pageNumber === page
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
                  )}
                >
                  {pageNumber}
                </Link>
              ))}

              <Link
                href={pageHref(page + 1)}
                aria-disabled={page === totalPages}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors',
                  page === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-elevated hover:text-text-primary'
                )}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Další stránka</span>
              </Link>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

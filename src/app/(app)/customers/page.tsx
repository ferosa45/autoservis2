import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { listCustomers } from '@/lib/services/customer.service';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? '1', 10) || 1;
  const context = await getSessionContext();
  const customers = await listCustomers(context, q, page);

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Zákazníci</h1>

      {/* Obyčejný GET formulář - žádný JS potřeba, funguje i s reloadem/sdílením URL */}
      <form method="GET" className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Hledat podle jména, telefonu nebo SPZ..."
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {customers.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {q ? `Nic nenalezeno pro "${q}".` : 'Zatím žádní zákazníci.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {customers.items.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-elevated"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-text-secondary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{customer.name}</p>
                      <p className="text-xs text-text-muted">{customer.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">
                    {customer.vehicles.length}{' '}
                    {customer.vehicles.length === 1 ? 'vozidlo' : 'vozidel'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {customers.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            Stránka {customers.page} z {customers.totalPages} · {customers.total} zákazníků
          </span>
          <div className="flex gap-2">
            {customers.page > 1 && (
              <Link
                href={`/customers?q=${encodeURIComponent(q ?? '')}&page=${customers.page - 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-elevated"
              >
                Předchozí
              </Link>
            )}
            {customers.page < customers.totalPages && (
              <Link
                href={`/customers?q=${encodeURIComponent(q ?? '')}&page=${customers.page + 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-elevated"
              >
                Další
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

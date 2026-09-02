import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { Building2, CheckCircle2, Clock3, CreditCard, Search, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin } from '@/lib/admin';

const DAY_MS = 24 * 60 * 60 * 1000;
type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
type StatusFilter = 'ALL' | SubscriptionStatus;

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / DAY_MS));
}

function statusLabel(status: string, suspendedAt: Date | null) {
  if (suspendedAt) return ['Pozastaveno', 'border-red-500/20 bg-red-500/10 text-red-400'];
  if (status === 'ACTIVE') return ['Aktivní', 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'];
  if (status === 'PAST_DUE') return ['Po splatnosti', 'border-amber-500/20 bg-amber-500/10 text-amber-400'];
  if (status === 'CANCELED') return ['Zrušeno', 'border-red-500/20 bg-red-500/10 text-red-400'];
  return ['Trial', 'border-primary/20 bg-primary/10 text-primary'];
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  if (!(await isPlatformAdmin())) redirect('/today');
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const status = params.status ?? 'ALL';
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * DAY_MS);

  const validStatuses: StatusFilter[] = ['ALL', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];
  const safeStatus: StatusFilter = validStatuses.includes(status as StatusFilter) ? status as StatusFilter : 'ALL';

  const where: Prisma.GarageWhereInput = {
    ...(safeStatus !== 'ALL' ? { subscriptionStatus: safeStatus } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { ico: { contains: q, mode: 'insensitive' } },
    ] } : {}),
  };

  const [total, trialing, active, pastDue, canceled, expiring, new7, new30, totalCustomers, totalJobs, garages] = await Promise.all([
    prisma.garage.count(),
    prisma.garage.count({ where: { subscriptionStatus: 'TRIALING' } }),
    prisma.garage.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.garage.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
    prisma.garage.count({ where: { subscriptionStatus: 'CANCELED' } }),
    prisma.garage.count({ where: { subscriptionStatus: 'TRIALING', trialEndsAt: { gt: now, lte: sevenDays } } }),
    prisma.garage.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } } }),
    prisma.garage.count({ where: { createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } } }),
    prisma.customer.count(),
    prisma.job.count(),
    prisma.garage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { users: true, customers: true, vehicles: true, jobs: true, invoices: true } } },
    }),
  ]);

  const statCards = [
    ['Celkem servisů', total, Building2],
    ['Aktivní', active, CheckCircle2],
    ['Ve zkušební době', trialing, Clock3],
    ['Končí do 7 dnů', expiring, ShieldAlert],
    ['Po splatnosti', pastDue, CreditCard],
  ] as const;

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-white">G</div><div><p className="font-heading text-lg font-extrabold">Garazio Admin</p><p className="text-xs text-text-muted">Správa platformy</p></div></div>
          <Link href="/today" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-hover hover:text-text-primary">Zpět do Garazia</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-primary">Přehled</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">Garazio v kostce</h1><p className="mt-2 text-sm text-text-secondary">Stav servisů, předplatného a používání platformy.</p></div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold text-text-muted">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
              <p className="mt-3 font-heading text-3xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-text-muted">Nové za 7 dní</p><p className="mt-1 text-xl font-extrabold">{new7}</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-text-muted">Nové za 30 dní</p><p className="mt-1 text-xl font-extrabold">{new30}</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-text-muted">Zákazníci celkem</p><p className="mt-1 text-xl font-extrabold">{totalCustomers}</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-text-muted">Zakázky celkem</p><p className="mt-1 text-xl font-extrabold">{totalJobs}</p></div>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-heading text-xl font-bold">Servisy</h2><p className="text-sm text-text-muted">{garages.length} zobrazených · celkem {total}</p></div><form className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input name="q" defaultValue={q} placeholder="Hledat servis, email, IČO…" className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary sm:w-72" /></div><select name="status" defaultValue={safeStatus} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="ALL">Všechny stavy</option><option value="TRIALING">Trial</option><option value="ACTIVE">Aktivní</option><option value="PAST_DUE">Po splatnosti</option><option value="CANCELED">Zrušené</option></select><button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">Filtrovat</button></form></div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-elevated text-xs text-text-muted"><tr><th className="px-5 py-3 font-semibold">Servis</th><th className="px-5 py-3 font-semibold">Registrace</th><th className="px-5 py-3 font-semibold">Stav</th><th className="px-5 py-3 font-semibold">Trial</th><th className="px-5 py-3 font-semibold">Používání</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-border">{garages.map((garage) => { const [label, cls] = statusLabel(garage.subscriptionStatus, garage.suspendedAt); return <tr key={garage.id} className="hover:bg-surface-hover"><td className="px-5 py-4"><p className="font-bold">{garage.name}</p><p className="mt-0.5 text-xs text-text-muted">{garage.email || 'Bez emailu'}{garage.ico ? ` · IČO ${garage.ico}` : ''}</p></td><td className="px-5 py-4 text-text-secondary">{garage.createdAt.toLocaleDateString('cs-CZ')}</td><td className="px-5 py-4"><span className={`rounded-md border px-2 py-1 text-xs font-bold ${cls}`}>{label}</span></td><td className="px-5 py-4">{garage.subscriptionStatus === 'TRIALING' ? <span className={daysLeft(garage.trialEndsAt) <= 7 ? 'font-bold text-amber-400' : 'text-text-secondary'}>{daysLeft(garage.trialEndsAt)} dní</span> : <span className="text-text-muted">—</span>}</td><td className="px-5 py-4 text-xs text-text-secondary">{garage._count.users} uživ. · {garage._count.customers} zákaz. · {garage._count.jobs} zakázek</td><td className="px-5 py-4 text-right"><Link href={`/admin/garages/${garage.id}`} className="font-semibold text-primary hover:underline">Detail</Link></td></tr> })}</tbody></table></div>
            <div className="divide-y divide-border md:hidden">{garages.map((garage) => { const [label, cls] = statusLabel(garage.subscriptionStatus, garage.suspendedAt); return <Link key={garage.id} href={`/admin/garages/${garage.id}`} className="block p-4 hover:bg-surface-hover"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{garage.name}</p><p className="mt-1 text-xs text-text-muted">{garage.email || 'Bez emailu'}</p></div><span className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-bold ${cls}`}>{label}</span></div><div className="mt-3 flex gap-4 text-xs text-text-secondary"><span>{garage._count.users} uživ.</span><span>{garage._count.customers} zákaz.</span><span>{garage._count.jobs} zakázek</span>{garage.subscriptionStatus === 'TRIALING' && <span className="font-bold">{daysLeft(garage.trialEndsAt)} dní</span>}</div></Link> })}</div>
          </div>
          {garages.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-muted">Žádný servis neodpovídá filtru.</div>}
        </section>
      </div>
    </main>
  );
}

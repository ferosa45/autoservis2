import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, CreditCard, Mail, Phone, ShieldAlert, Users, Wrench } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin } from '@/lib/admin';
import { activateGarage, extendGarageTrial, resetGarageTrial, suspendGarage } from '@/lib/actions/admin.actions';
import { ResetPasswordButton } from '@/components/admin/reset-password-button';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / DAY_MS));
}

export default async function AdminGarageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isPlatformAdmin())) redirect('/today');
  const { id } = await params;
  const garage = await prisma.garage.findUnique({
    where: { id },
    include: {
      users: { orderBy: [{ role: 'asc' }, { createdAt: 'asc' }] },
      _count: { select: { users: true, customers: true, vehicles: true, jobs: true, invoices: true } },
    },
  });
  if (!garage) notFound();

  const owner = garage.users.find((user) => user.role === 'OWNER');
  const trialDays = daysLeft(garage.trialEndsAt);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5 lg:px-8"><Link href="/admin" className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-xs font-semibold text-text-muted">Garazio Admin / Servisy</p><h1 className="font-heading text-xl font-extrabold">{garage.name}</h1></div></div></header>
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Účet</p><h2 className="mt-2 font-heading text-2xl font-extrabold">{garage.name}</h2>{garage.companyName && <p className="mt-1 text-sm text-text-secondary">{garage.companyName}</p>}</div><Building2 className="h-6 w-6 text-primary" /></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-text-muted" /><div><p className="text-xs text-text-muted">Email</p><p className="text-sm font-semibold">{garage.email || owner?.email || '—'}</p></div></div><div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-text-muted" /><div><p className="text-xs text-text-muted">Telefon</p><p className="text-sm font-semibold">{garage.phone || '—'}</p></div></div><div><p className="text-xs text-text-muted">Majitel</p><p className="text-sm font-semibold">{owner?.name || '—'}</p></div><div><p className="text-xs text-text-muted">IČO</p><p className="text-sm font-semibold">{garage.ico || '—'}</p></div><div><p className="text-xs text-text-muted">Registrace</p><p className="text-sm font-semibold">{garage.createdAt.toLocaleDateString('cs-CZ')}</p></div><div><p className="text-xs text-text-muted">Onboarding</p><p className="text-sm font-semibold">{garage.onboardingCompletedAt ? `Dokončen ${garage.onboardingCompletedAt.toLocaleDateString('cs-CZ')}` : 'Nedokončen'}</p></div></div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">Předplatné</p><div className="mt-3 flex items-center gap-2"><span className="font-heading text-xl font-extrabold">{garage.subscriptionStatus === 'ACTIVE' ? 'Aktivní' : garage.subscriptionStatus === 'PAST_DUE' ? 'Po splatnosti' : garage.subscriptionStatus === 'CANCELED' ? 'Zrušeno' : 'Trial'}</span>{garage.suspendedAt && <span className="rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-400">Pozastaveno</span>}</div><div className="mt-5 rounded-lg border border-border bg-background p-4"><p className="text-xs text-text-muted">Konec trialu</p><p className="mt-1 text-2xl font-extrabold">{garage.trialEndsAt.toLocaleDateString('cs-CZ')}</p><p className="mt-1 text-xs font-semibold text-text-secondary">{garage.subscriptionStatus === 'TRIALING' ? `${trialDays} dní zbývá` : 'Trial se nyní nepoužívá'}</p></div><div className="mt-4 space-y-2"><form action={resetGarageTrial}><input type="hidden" name="garageId" value={garage.id} /><button className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white">Resetovat na 30 dní</button></form><form action={extendGarageTrial.bind(null, garage.id, 7)}><button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-bold hover:bg-surface-hover">Přidat 7 dní</button></form>{garage.suspendedAt ? <form action={activateGarage}><input type="hidden" name="garageId" value={garage.id} /><button className="w-full rounded-lg border border-emerald-500/30 px-3 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10">Aktivovat servis</button></form> : <form action={suspendGarage}><input type="hidden" name="garageId" value={garage.id} /><button className="w-full rounded-lg border border-red-500/30 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10">Pozastavit servis</button></form>}</div></section>
        </div>

        <section className="mt-4 rounded-xl border border-border bg-surface p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">Používání</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Uživatelé', garage._count.users, Users], ['Zákazníci', garage._count.customers, Users], ['Vozidla', garage._count.vehicles, Wrench], ['Zakázky', garage._count.jobs, CalendarDays], ['Faktury', garage._count.invoices, CreditCard]].map(([label, value, Icon]) => <div key={label as string} className="rounded-lg border border-border bg-background p-4"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-text-muted">{label as string}</p><p className="mt-1 text-xl font-extrabold">{value as number}</p></div>)}</div></section>

        <section className="mt-4 rounded-xl border border-border bg-surface p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Uživatelé</p><h2 className="mt-2 font-heading text-xl font-bold">Přístupy do servisu</h2></div><Users className="h-5 w-5 text-primary" /></div><div className="mt-5 divide-y divide-border">{garage.users.map((user) => <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{user.name}</p><p className="mt-0.5 text-xs text-text-muted">{user.email} · {user.role === 'OWNER' ? 'Majitel' : 'Mechanik'}{!user.active ? ' · neaktivní' : ''}</p></div><ResetPasswordButton userId={user.id} /></div>)}</div></section>
      </div>
    </main>
  );
}

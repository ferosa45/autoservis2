import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getDashboardData } from '@/lib/services/dashboard.service';
import { formatCurrency } from '@/lib/format';
import { CalendarDays, CheckCircle2, Clock3, Banknote, TrendingUp, Wrench, AlertTriangle } from 'lucide-react';

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} h ${mins} min`;
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const context = await getSessionContext();
  if (context.role !== 'OWNER') redirect('/today');

  const params = await searchParams;
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const selectedMonthKey = /^\\d{4}-\\d{2}$/.test(params.month ?? '') ? params.month! : currentMonthKey;
  const data = await getDashboardData(context, new Date(), selectedMonthKey);
  const maxJobs = Math.max(...data.daily.map((day) => day.jobs), 1);
  const maxRevenue = Math.max(...data.daily.map((day) => day.revenue), 1);
  const firstDay = data.daily[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Majitel servisu</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-text-primary">Přehled servisu</h1>
        <p className="mt-1 text-sm text-text-muted">Rychlý přehled dnešního provozu a výsledků za vybraný měsíc.</p>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-sm font-bold text-text-primary">Dnes</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: CalendarDays, value: data.today.total, label: 'zakázek dnes' },
            { icon: Wrench, value: data.today.inProgress, label: 'právě se opravuje' },
            { icon: CheckCircle2, value: data.today.done, label: 'hotových' },
            { icon: Banknote, value: formatCurrency(data.today.revenue), label: 'dnešní obrat' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-surface p-4">
              <item.icon className="h-5 w-5 text-text-secondary" />
              <p className="mt-3 font-heading text-2xl font-bold text-text-primary">{item.value}</p>
              <p className="text-xs text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-sm font-bold text-text-primary">{formatMonth(data.month.key)}</h2>
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="dashboard-month" className="text-xs text-text-muted">Měsíc</label>
            <input id="dashboard-month" name="month" type="month" defaultValue={data.month.key} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
            <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">Zobrazit</button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: CalendarDays, value: data.month.jobs, label: 'zakázek' },
            { icon: CheckCircle2, value: data.month.done, label: 'dokončených' },
            { icon: TrendingUp, value: formatCurrency(data.month.revenue), label: 'vyfakturováno' },
            { icon: Wrench, value: formatCurrency(data.month.averageJobValue), label: 'průměrná zakázka' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-surface p-4">
              <item.icon className="h-5 w-5 text-text-secondary" />
              <p className="mt-3 font-heading text-xl font-bold text-text-primary">{item.value}</p>
              <p className="text-xs text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-text-secondary" /><h2 className="font-heading text-sm font-bold text-text-primary">Práce mechaniků</h2></div>
          <p className="mt-1 text-xs text-text-muted">Odpracovaný čas za vybraný kalendářní měsíc.</p>
          <div className="mt-4 divide-y divide-border">
            {data.mechanics.length === 0 ? <p className="py-4 text-sm text-text-muted">Zatím nejsou evidováni žádní aktivní mechanici.</p> : data.mechanics.map((mechanic) => <div key={mechanic.id} className="flex items-center justify-between py-3"><span className="text-sm font-medium text-text-primary">{mechanic.name}</span><span className="text-sm font-semibold text-text-secondary">{formatMinutes(mechanic.minutes)}</span></div>)}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-text-secondary" /><h2 className="font-heading text-sm font-bold text-text-primary">Na co se podívat</h2></div>
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-elevated p-3"><p className="text-sm font-medium text-text-primary">{data.today.waitingForPart} zakázek čeká na díl</p><p className="mt-0.5 text-xs text-text-muted">Tyto zakázky mohou blokovat kapacitu servisu.</p></div>
            <div className="rounded-md bg-elevated p-3"><p className="text-sm font-medium text-text-primary">{data.today.workMinutes > 0 ? formatMinutes(data.today.workMinutes) : '0 h'} práce dnes</p><p className="mt-0.5 text-xs text-text-muted">Čas se počítá automaticky z pracovních relací mechaniků.</p></div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div><h2 className="font-heading text-sm font-bold text-text-primary">Posledních 30 dní</h2><p className="mt-1 text-xs text-text-muted">Počet zakázek a vyfakturovaná částka podle dne.</p></div>
        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-[620px] items-end gap-1" style={{ height: 190 }}>
            {data.daily.map((day) => (
              <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full rounded-t-sm bg-primary/30" style={{ height: `${Math.max((day.jobs / maxJobs) * 105, day.jobs ? 4 : 0)}px` }} title={`${day.jobs} zakázek`} />
                <div className="w-full rounded-t-sm bg-primary" style={{ height: `${Math.max((day.revenue / maxRevenue) * 55, day.revenue ? 3 : 0)}px` }} title={formatCurrency(day.revenue)} />
                {([0, 6, 13, 20, 27, 29].includes(Number(day.date.slice(-2))) || day.date === firstDay?.date) && <span className="text-[10px] text-text-muted">{formatDay(day.date)}</span>}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-text-muted"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/30" /> zakázky</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> obrat</span></div>
        </div>
      </section>
    </div>
  );
}

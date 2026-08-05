import { Wrench, CalendarDays, ClipboardList, Users, FileText, Settings, Plus } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SidebarNavLink } from './sidebar-nav-link';

const NAV_ITEMS = [
  { href: '/today', label: 'Dnes', icon: CalendarDays },
  { href: '/calendar', label: 'Kalendář', icon: CalendarDays },
  { href: '/jobs', label: 'Zakázky', icon: ClipboardList },
  { href: '/customers', label: 'Zákazníci', icon: Users },
  { href: '/invoices', label: 'Faktury', icon: FileText },
  { href: '/settings', label: 'Nastavení', icon: Settings },
];

export async function Sidebar() {
  const context = await getSessionContext();
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <Wrench className="h-5 w-5 text-primary" />
        <span className="font-heading text-lg font-bold text-text-primary">
          Auto<span className="text-primary">Servis</span>
        </span>
      </div>

      <div className="px-4">
        {/* Skutečné otevření Quick Job modalu je zapojeno ve Fázi 4 */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Nová zakázka
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-elevated p-3">
          <p className="truncate text-sm font-medium text-text-primary">{garage?.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">{context.role === 'OWNER' ? 'Majitel servisu' : 'Mechanik'}</p>
        </div>
      </div>
    </aside>
  );
}

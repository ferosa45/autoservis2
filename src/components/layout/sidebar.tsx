import { Wrench, CalendarDays, ClipboardList, Users, FileText, Settings, CreditCard, BarChart3, ShieldCheck } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { SidebarNavLink } from './sidebar-nav-link';
import { NewJobButton } from '@/components/quick-job/new-job-button';

const NAV_ITEMS = [
  { href: '/today', label: 'Dnes', icon: CalendarDays },
  { href: '/dashboard', label: 'Přehled', icon: BarChart3, ownerOnly: true },
  { href: '/calendar', label: 'Kalendář', icon: CalendarDays },
  { href: '/jobs', label: 'Zakázky', icon: ClipboardList },
  { href: '/customers', label: 'Zákazníci', icon: Users },
  { href: '/invoices', label: 'Faktury', icon: FileText, permission: 'canViewInvoices' as const },
  { href: '/billing', label: 'Předplatné', icon: CreditCard, ownerOnly: true },
  { href: '/settings', label: 'Nastavení', icon: Settings, ownerOnly: true },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, platformAdminOnly: true },
];

export async function Sidebar() {
  const context = await getSessionContext();
  const platformAdmin = await isPlatformAdmin();
  const garage = await prisma.garage.findUnique({ where: { id: context.garageId } });
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && context.role !== 'OWNER') return false;
    if (item.permission && context.role !== 'OWNER' && !context.permissions[item.permission]) return false;
    if (item.platformAdminOnly && !platformAdmin) return false;
    return true;
  });

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5"><Wrench className="h-5 w-5 text-primary" /><span className="font-heading text-lg font-bold text-text-primary">Auto<span className="text-primary">Servis</span></span></div>
      <div className="px-4"><NewJobButton /></div>
      <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">{visibleItems.map((item) => <SidebarNavLink key={item.href} href={item.href} label={item.label} icon={<item.icon className="h-4 w-4" />} />)}</nav>
      <div className="border-t border-border p-4"><div className="rounded-lg border border-border bg-elevated p-3"><p className="truncate text-sm font-medium text-text-primary">{garage?.name}</p><p className="mt-0.5 text-xs text-text-muted">{context.role === 'OWNER' ? 'Majitel servisu' : 'Mechanik'}</p></div></div>
    </aside>
  );
}

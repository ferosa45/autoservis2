import Link from 'next/link';
import { CalendarDays, ClipboardList, Users, FileText, BarChart3 } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { NewJobButton } from '@/components/quick-job/new-job-button';

const NAV_ITEMS = [
  { href: '/today', label: 'Dnes', icon: CalendarDays },
  { href: '/dashboard', label: 'Přehled', icon: BarChart3, ownerOnly: true },
  { href: '/calendar', label: 'Kalendář', icon: CalendarDays },
  { href: '/jobs', label: 'Zakázky', icon: ClipboardList },
  { href: '/customers', label: 'Zákazníci', icon: Users },
  { href: '/invoices', label: 'Faktury', icon: FileText, permission: 'canViewInvoices' as const },
];

export async function MobileNav() {
  const context = await getSessionContext();
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && context.role !== 'OWNER') return false;
    if (item.permission && context.role !== 'OWNER' && !context.permissions[item.permission]) return false;
    return true;
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex h-16 items-stretch overflow-x-auto">
        <div className="flex min-w-full items-stretch justify-around gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-w-[68px] flex-1 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium text-text-secondary active:bg-elevated">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="flex min-w-[76px] flex-1 items-center px-1"><NewJobButton /></div>
        </div>
      </div>
    </nav>
  );
}

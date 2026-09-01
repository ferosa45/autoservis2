import { Search, Bell, Wrench } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { LogoutButton } from './logout-button';
import { NewJobButton } from '@/components/quick-job/new-job-button';

export async function Topbar() {
  const context = await getSessionContext();
  const user = await prisma.user.findUnique({ where: { id: context.userId } });

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:h-16 sm:gap-4 sm:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Wrench className="h-4 w-4 text-primary" />
        <span className="font-heading text-sm font-bold text-text-primary">
          Auto<span className="text-primary">Servis</span>
        </span>
      </div>

      <form method="GET" action="/customers" className="relative hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          name="q"
          placeholder="Hledat zákazníka, vozidlo, SPZ..."
          aria-label="Hledat zákazníka, vozidlo nebo SPZ"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-4">
        <div className="sm:hidden">
          <NewJobButton />
        </div>

        <button
          type="button"
          aria-label="Notifikace"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 sm:border-l sm:border-border sm:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold text-text-primary sm:h-9 sm:w-9 sm:text-xs">
            {initials}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted">
              {context.role === 'OWNER' ? 'Majitel servisu' : 'Mechanik'}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

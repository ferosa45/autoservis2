import { Search, Bell } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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
    <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-border bg-background px-6">
      <div className="relative w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Hledat zákazníka, vozidlo, SPZ..."
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Vizuální placeholder - reálný notifikační systém není v MVP scope */}
      <button
        type="button"
        aria-label="Notifikace"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2.5 border-l border-border pl-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-text-primary">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-muted">
            {context.role === 'OWNER' ? 'Majitel servisu' : 'Mechanik'}
          </p>
        </div>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { Plus, UserPlus, FileText } from 'lucide-react';

const ACTIONS = [
  { icon: Plus, label: 'Nová zakázka', description: 'Zapsat novou zakázku', href: '/today' },
  { icon: UserPlus, label: 'Nový zákazník', description: 'Přidat nového zákazníka', href: '/customers' },
  { icon: FileText, label: 'Vytvořit fakturu', description: 'Vystavit novou fakturu', href: '/invoices' },
];

export function QuickActions() {
  return (
    <div>
      <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">Rychlé akce</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-elevated"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary">
              <action.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
              <p className="text-xs text-text-muted">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

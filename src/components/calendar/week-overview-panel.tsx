import { CalendarDays, PackageX, CheckCircle2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export function WeekOverviewPanel({
  totalThisWeek,
  waitingForPart,
  done,
  revenueThisWeek,
}: {
  totalThisWeek: number;
  waitingForPart: number;
  done: number;
  revenueThisWeek: number;
}) {
  const items = [
    { icon: CalendarDays, value: String(totalThisWeek), label: 'zakázek tento týden' },
    { icon: FileText, value: formatCurrency(revenueThisWeek), label: 'obrat tento týden' },
    { icon: PackageX, value: String(waitingForPart), label: 'čeká na díl' },
    { icon: CheckCircle2, value: String(done), label: 'hotová' },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 font-heading text-sm font-bold text-text-primary">Rychlý přehled</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading text-base font-bold text-text-primary">{item.value}</p>
              <p className="text-xs text-text-muted">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

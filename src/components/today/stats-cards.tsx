import { CalendarDays, PackageX, CheckCircle2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export function StatsCards({
  totalToday,
  waitingForPart,
  inProgress,
  revenueToday,
}: {
  totalToday: number;
  waitingForPart: number;
  inProgress: number;
  revenueToday: number;
}) {
  const items = [
    { icon: CalendarDays, value: String(totalToday), label: 'zakázek dnes', iconClass: 'text-text-secondary' },
    { icon: CheckCircle2, value: String(inProgress), label: 'pracuje se', iconClass: 'text-status-done-text' },
    { icon: PackageX, value: String(waitingForPart), label: 'čeká na díl', iconClass: 'text-status-blocked-text' },
    { icon: FileText, value: formatCurrency(revenueToday), label: 'obrat dnes', iconClass: 'text-text-secondary' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
        >
          <div>
            <p className="font-heading text-2xl font-bold text-text-primary">{item.value}</p>
            <p className="text-xs text-text-muted">{item.label}</p>
          </div>
          <item.icon className={`h-5 w-5 ${item.iconClass}`} />
        </div>
      ))}
    </div>
  );
}

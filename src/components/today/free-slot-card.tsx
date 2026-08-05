import { Clock, Plus } from 'lucide-react';
import { formatTime } from '@/lib/format';

// Skutečné vytvoření zakázky předvyplněné tímto časem se zapojí ve Fázi 4
// spolu s Quick Job modalem. Zatím je karta jen vizuální.
export function FreeSlotCard({ time }: { time: Date }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-transparent p-4 text-text-muted">
      <div className="flex items-center gap-4">
        <div className="w-14 shrink-0 text-sm font-medium">{formatTime(time)}</div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <div>
            <p className="text-sm font-medium text-text-secondary">VOLNÝ TERMÍN</p>
            <p className="text-xs">Kliknutím vytvoříte novou zakázku</p>
          </div>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border">
        <Plus className="h-4 w-4" />
      </div>
    </div>
  );
}

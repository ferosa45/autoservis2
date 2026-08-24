'use client';

import { Plus } from 'lucide-react';
import { useQuickJob } from '@/components/quick-job/quick-job-provider';

export function WorkshopNewJobButton() {
  const { openQuickJob } = useQuickJob();

  return (
    <button
      type="button"
      onClick={() => openQuickJob()}
      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
    >
      <Plus className="h-6 w-6" />
      ZAPSAT AUTO
    </button>
  );
}

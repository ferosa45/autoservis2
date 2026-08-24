'use client';

import { Plus } from 'lucide-react';
import { useQuickJob } from './quick-job-provider';

export function NewJobButton() {
  const { openQuickJob } = useQuickJob();

  return (
    <button
      type="button"
      onClick={() => openQuickJob()}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
    >
      <Plus className="h-4 w-4" />
      Nová zakázka
    </button>
  );
}

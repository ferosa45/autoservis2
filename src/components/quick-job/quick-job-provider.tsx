'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { QuickJobModal } from './quick-job-modal';

export type QuickJobPrefill = {
  scheduledStart?: Date;
  scheduledEnd?: Date;
};

type QuickJobContextValue = {
  openQuickJob: (prefill?: QuickJobPrefill) => void;
};

const QuickJobContext = createContext<QuickJobContextValue | null>(null);

export function QuickJobProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<QuickJobPrefill>({});

  const openQuickJob = useCallback((next?: QuickJobPrefill) => {
    setPrefill(next ?? {});
    setOpen(true);
  }, []);

  return (
    <QuickJobContext.Provider value={{ openQuickJob }}>
      {children}
      <QuickJobModal open={open} onOpenChange={setOpen} prefill={prefill} />
    </QuickJobContext.Provider>
  );
}

export function useQuickJob() {
  const ctx = useContext(QuickJobContext);
  if (!ctx) {
    throw new Error('useQuickJob musí být použito uvnitř <QuickJobProvider>');
  }
  return ctx;
}

import type { JobStatus } from '@prisma/client';

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  WAITING: 'Čeká',
  IN_PROGRESS: 'Pracuje se',
  BLOCKED: 'Čeká na díl',
  DONE: 'Hotovo',
};

export const JOB_STATUS_COLOR: Record<
  JobStatus,
  { bg: string; border: string; text: string }
> = {
  WAITING: { bg: 'bg-status-waiting-bg', border: 'border-status-waiting-border', text: 'text-status-waiting-text' },
  IN_PROGRESS: { bg: 'bg-status-progress-bg', border: 'border-status-progress-border', text: 'text-status-progress-text' },
  BLOCKED: { bg: 'bg-status-blocked-bg', border: 'border-status-blocked-border', text: 'text-status-blocked-text' },
  DONE: { bg: 'bg-status-done-bg', border: 'border-status-done-border', text: 'text-status-done-text' },
};

// Barva levého borderu karty zakázky v timeline - odpovídá barvě stavu
export const JOB_STATUS_BORDER_ACCENT: Record<JobStatus, string> = {
  WAITING: 'border-l-status-waiting-text',
  IN_PROGRESS: 'border-l-status-progress-text',
  BLOCKED: 'border-l-status-blocked-text',
  DONE: 'border-l-status-done-text',
};

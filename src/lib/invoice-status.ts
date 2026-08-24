import type { InvoiceStatus } from '@prisma/client';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Koncept',
  ISSUED: 'Vystavená',
  PAID: 'Zaplacená',
  CANCELLED: 'Zrušená',
};

export const INVOICE_STATUS_CLASS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-status-waiting-bg border-status-waiting-border text-status-waiting-text',
  ISSUED: 'bg-status-progress-bg border-status-progress-border text-status-progress-text',
  PAID: 'bg-status-done-bg border-status-done-border text-status-done-text',
  CANCELLED: 'bg-status-blocked-bg border-status-blocked-border text-status-blocked-text',
};

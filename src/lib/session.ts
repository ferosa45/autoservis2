import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { SubscriptionStatus } from '@prisma/client';
import type { UserPermissions } from '@/lib/permissions';
import { READ_ONLY_ACCESS_MESSAGE } from '@/lib/action-errors';

export type SessionContext = {
  userId: string;
  garageId: string;
  role: 'OWNER' | 'MECHANIC';
  permissions: UserPermissions;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date;
  hasWriteAccess: boolean;
};

export class ReadOnlyAccessError extends Error {
  constructor() { super(READ_ONLY_ACCESS_MESSAGE); this.name = 'ReadOnlyAccessError'; }
}
export class ForbiddenError extends Error {
  constructor() { super('FORBIDDEN'); this.name = 'FORBIDDEN'; }
}

function computeHasWriteAccess(subscriptionStatus: SubscriptionStatus, trialEndsAt: Date): boolean {
  if (subscriptionStatus === 'ACTIVE') return true;
  if (subscriptionStatus === 'TRIALING') return trialEndsAt.getTime() > Date.now();
  return false;
}

export async function getSessionContext(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.garageId) throw new Error('UNAUTHENTICATED');

  const [garage, user] = await Promise.all([
    prisma.garage.findUnique({ where: { id: session.user.garageId }, select: { id: true, subscriptionStatus: true, trialEndsAt: true, suspendedAt: true } }),
    prisma.user.findFirst({
      where: { id: session.user.id, garageId: session.user.garageId },
      select: { id: true, role: true, active: true, emailVerifiedAt: true, passwordChangedAt: true, canInvoice: true, canViewInvoices: true, canViewFinancials: true },
    }),
  ]);
  if (!garage || !user || !user.active || !user.emailVerifiedAt || garage.suspendedAt) redirect('/login');

  const tokenPasswordChangedAt = session.user.passwordChangedAt;
  if (!tokenPasswordChangedAt || new Date(tokenPasswordChangedAt).getTime() !== user.passwordChangedAt.getTime()) {
    redirect('/login');
  }

  return {
    userId: user.id,
    garageId: garage.id,
    role: user.role,
    permissions: {
      canInvoice: user.role === 'OWNER' || user.canInvoice,
      canViewInvoices: user.role === 'OWNER' || user.canViewInvoices,
      canViewFinancials: user.role === 'OWNER' || user.canViewFinancials,
    },
    subscriptionStatus: garage.subscriptionStatus,
    trialEndsAt: garage.trialEndsAt,
    hasWriteAccess: computeHasWriteAccess(garage.subscriptionStatus, garage.trialEndsAt),
  };
}

export function assertWriteAccess(context: SessionContext): void {
  if (!context.hasWriteAccess) throw new ReadOnlyAccessError();
}
export function requireOwner(context: SessionContext): void {
  if (context.role !== 'OWNER') throw new ForbiddenError();
}

export function requirePermission(context: SessionContext, permission: keyof UserPermissions): void {
  if (context.role === 'OWNER') return;
  // Creating/issuing an invoice necessarily requires access to the invoice it creates.
  if (permission === 'canViewInvoices' && context.permissions.canInvoice) return;
  if (!context.permissions[permission]) throw new ForbiddenError();
}

// Backwards-compatible aliases while the remaining actions are migrated.
export const assertOwner = requireOwner;
export const assertPermission = requirePermission;

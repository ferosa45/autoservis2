import type { Role } from '@prisma/client';

export type UserPermissions = {
  canInvoice: boolean;
  canViewInvoices: boolean;
  canViewFinancials: boolean;
};

export const DEFAULT_MECHANIC_PERMISSIONS: UserPermissions = {
  canInvoice: false,
  canViewInvoices: false,
  canViewFinancials: false,
};

export function hasPermission(
  role: Role,
  permissions: UserPermissions,
  permission: keyof UserPermissions
): boolean {
  if (role === 'OWNER') return true;
  return permissions[permission];
}

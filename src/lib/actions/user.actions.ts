'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertOwner, getSessionContext } from '@/lib/session';

export type MechanicInput = {
  name: string;
  email: string;
  password: string;
  canInvoice: boolean;
  canViewInvoices: boolean;
  canViewFinancials: boolean;
};

export async function listGarageUsers() {
  const context = await getSessionContext();
  assertOwner(context);
  return prisma.user.findMany({
    where: { garageId: context.garageId },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, active: true, canInvoice: true, canViewInvoices: true, canViewFinancials: true },
  });
}

export async function createMechanic(input: MechanicInput) {
  const context = await getSessionContext();
  assertOwner(context);
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email || input.password.length < 8) throw new Error('Vyplňte jméno, platný email a heslo alespoň 8 znaků.');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('Uživatel s tímto emailem už existuje.');
  const password = await bcrypt.hash(input.password, 10);
  await prisma.user.create({ data: { name, email, password, role: 'MECHANIC', garageId: context.garageId, active: true, canInvoice: input.canInvoice, canViewInvoices: input.canViewInvoices, canViewFinancials: input.canViewFinancials } });
  revalidatePath('/settings');
}

export async function updateMechanicPermissions(userId: string, input: Omit<MechanicInput, 'name' | 'email' | 'password'> & { active: boolean }) {
  const context = await getSessionContext();
  assertOwner(context);
  const user = await prisma.user.findFirst({ where: { id: userId, garageId: context.garageId, role: 'MECHANIC' } });
  if (!user) throw new Error('Mechanik nenalezen.');
  await prisma.user.update({ where: { id: user.id }, data: { active: input.active, canInvoice: input.canInvoice, canViewInvoices: input.canViewInvoices, canViewFinancials: input.canViewFinancials } });
  revalidatePath('/settings');
}

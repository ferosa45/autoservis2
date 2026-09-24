'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireOwner, assertWriteAccess, getSessionContext } from '@/lib/session';

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
  requireOwner(context);
  return prisma.user.findMany({
    where: { garageId: context.garageId },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, active: true, canInvoice: true, canViewInvoices: true, canViewFinancials: true },
  });
}

export async function listActiveMechanics() {
  const context = await getSessionContext();
  if (context.role !== 'OWNER') return [];

  return prisma.user.findMany({
    where: { garageId: context.garageId, role: 'MECHANIC', active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, active: true },
  });
}

export async function createMechanic(input: MechanicInput) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email || input.password.length < 8) throw new Error('Vyplňte jméno, platný email a heslo alespoň 8 znaků.');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('Uživatel s tímto emailem už existuje.');
  const password = await bcrypt.hash(input.password, 10);
  await prisma.user.create({ data: { name, email, password, role: 'MECHANIC', garageId: context.garageId, active: true, canInvoice: input.canInvoice, canViewInvoices: input.canViewInvoices, canViewFinancials: input.canViewFinancials } });
  revalidatePath('/mechanici');
}

export async function updateMechanicPermissions(userId: string, input: Omit<MechanicInput, 'name' | 'email' | 'password'> & { active: boolean }) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);
  const user = await prisma.user.findFirst({ where: { id: userId, garageId: context.garageId, role: 'MECHANIC' } });
  if (!user) throw new Error('Mechanik nenalezen.');
  await prisma.user.update({ where: { id: user.id }, data: { active: input.active, canInvoice: input.canInvoice, canViewInvoices: input.canViewInvoices, canViewFinancials: input.canViewFinancials } });
  revalidatePath('/mechanici');
}

export async function deleteMechanic(userId: string) {
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);

  const user = await prisma.user.findFirst({
    where: { id: userId, garageId: context.garageId, role: 'MECHANIC' },
    select: { id: true },
  });

  if (!user) throw new Error('Mechanik nenalezen.');

  await prisma.$transaction(async (tx) => {
    await tx.job.updateMany({
      where: { garageId: context.garageId, assignedUserId: user.id },
      data: { assignedUserId: null },
    });

    await tx.jobEvent.updateMany({
      where: { garageId: context.garageId, userId: user.id },
      data: { userId: null },
    });

    await tx.workSession.deleteMany({
      where: { garageId: context.garageId, userId: user.id },
    });

    await tx.user.delete({ where: { id: user.id } });
  });

  revalidatePath('/mechanici');
  revalidatePath('/calendar');
}

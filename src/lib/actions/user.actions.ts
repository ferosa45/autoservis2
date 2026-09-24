'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireOwner, assertWriteAccess, getSessionContext } from '@/lib/session';
import { z } from 'zod';

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

const mechanicInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
  canInvoice: z.boolean(),
  canViewInvoices: z.boolean(),
  canViewFinancials: z.boolean(),
});

export async function createMechanic(input: MechanicInput) {
  const validInput = mechanicInputSchema.parse(input);
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);
  const name = validInput.name;
  const email = validInput.email.toLowerCase();
  if (!name || !email || validInput.password.length < 8) throw new Error('Vyplňte jméno, platný email a heslo alespoň 8 znaků.');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('Uživatel s tímto emailem už existuje.');
  const password = await bcrypt.hash(validInput.password, 10);
  await prisma.user.create({ data: { name, email, password, role: 'MECHANIC', garageId: context.garageId, active: true, canInvoice: validInput.canInvoice, canViewInvoices: validInput.canViewInvoices, canViewFinancials: validInput.canViewFinancials } });
  revalidatePath('/mechanici');
}

const mechanicPermissionsSchema = z.object({
  active: z.boolean(),
  canInvoice: z.boolean(),
  canViewInvoices: z.boolean(),
  canViewFinancials: z.boolean(),
});

export async function updateMechanicPermissions(userId: string, input: Omit<MechanicInput, 'name' | 'email' | 'password'> & { active: boolean }) {
  const validUserId = z.string().trim().min(1).max(100).parse(userId);
  const validInput = mechanicPermissionsSchema.parse(input);
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);
  const user = await prisma.user.findFirst({ where: { id: validUserId, garageId: context.garageId, role: 'MECHANIC' } });
  if (!user) throw new Error('Mechanik nenalezen.');
  await prisma.user.update({ where: { id: user.id }, data: { active: validInput.active, canInvoice: validInput.canInvoice, canViewInvoices: validInput.canViewInvoices, canViewFinancials: validInput.canViewFinancials } });
  revalidatePath('/mechanici');
}

export async function deleteMechanic(userId: string) {
  const validUserId = z.string().trim().min(1).max(100).parse(userId);
  const context = await getSessionContext();
  assertWriteAccess(context);
  requireOwner(context);

  const user = await prisma.user.findFirst({
    where: { id: validUserId, garageId: context.garageId, role: 'MECHANIC' },
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

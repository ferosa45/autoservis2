'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertPlatformAdmin } from '@/lib/admin';
import { z } from 'zod';

const platformIdSchema = z.string().trim().min(1).max(100);

export async function resetGarageTrial(garageId: string) {
  const validGarageId = platformIdSchema.parse(garageId);
  await assertPlatformAdmin();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  await prisma.garage.update({ where: { id: validGarageId }, data: { subscriptionStatus: 'TRIALING', trialEndsAt } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function extendGarageTrial(garageId: string, days: number) {
  const validGarageId = platformIdSchema.parse(garageId);
  const validDays = z.number().int().min(1).max(365).parse(days);
  await assertPlatformAdmin();
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('INVALID_DAYS');
  const garage = await prisma.garage.findUnique({ where: { id: validGarageId }, select: { trialEndsAt: true } });
  if (!garage) throw new Error('GARAGE_NOT_FOUND');
  const base = garage.trialEndsAt.getTime() > Date.now() ? garage.trialEndsAt : new Date();
  const trialEndsAt = new Date(base);
  trialEndsAt.setDate(trialEndsAt.getDate() + validDays);
  await prisma.garage.update({ where: { id: validGarageId }, data: { subscriptionStatus: 'TRIALING', trialEndsAt } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function suspendGarage(garageId: string) {
  const validGarageId = platformIdSchema.parse(garageId);
  await assertPlatformAdmin();
  await prisma.garage.update({ where: { id: validGarageId }, data: { suspendedAt: new Date() } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function activateGarage(garageId: string) {
  const validGarageId = platformIdSchema.parse(garageId);
  await assertPlatformAdmin();
  await prisma.garage.update({ where: { id: validGarageId }, data: { suspendedAt: null } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function resetUserPassword(userId: string): Promise<{ password?: string; error?: string }> {
  const validUserId = platformIdSchema.parse(userId);
  await assertPlatformAdmin();
  const user = await prisma.user.findUnique({ where: { id: validUserId }, select: { id: true } });
  if (!user) return { error: 'Uživatel nebyl nalezen.' };

  const password = randomBytes(9).toString('base64url');
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: validUserId }, data: { password: hashedPassword, passwordChangedAt: new Date() } });
  revalidatePath('/admin');
  return { password };
}

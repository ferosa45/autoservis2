'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertPlatformAdmin } from '@/lib/admin';

export async function resetGarageTrial(garageId: string) {
  await assertPlatformAdmin();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  await prisma.garage.update({
    where: { id: garageId },
    data: { subscriptionStatus: 'TRIALING', trialEndsAt, suspendedAt: null },
  });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function extendGarageTrial(garageId: string, days: number) {
  await assertPlatformAdmin();
  const garage = await prisma.garage.findUnique({ where: { id: garageId }, select: { trialEndsAt: true } });
  if (!garage) throw new Error('GARAGE_NOT_FOUND');
  const base = garage.trialEndsAt.getTime() > Date.now() ? garage.trialEndsAt : new Date();
  const trialEndsAt = new Date(base);
  trialEndsAt.setDate(trialEndsAt.getDate() + days);
  await prisma.garage.update({
    where: { id: garageId },
    data: { subscriptionStatus: 'TRIALING', trialEndsAt },
  });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function suspendGarage(garageId: string) {
  await assertPlatformAdmin();
  await prisma.garage.update({ where: { id: garageId }, data: { suspendedAt: new Date() } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function activateGarage(garageId: string) {
  await assertPlatformAdmin();
  await prisma.garage.update({ where: { id: garageId }, data: { suspendedAt: null } });
  revalidatePath('/admin');
  revalidatePath(`/admin/garages/${garageId}`);
}

export async function resetUserPassword(userId: string): Promise<{ password?: string; error?: string }> {
  await assertPlatformAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: 'Uživatel nebyl nalezen.' };

  const password = randomBytes(9).toString('base64url');
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  revalidatePath('/admin');
  return { password };
}

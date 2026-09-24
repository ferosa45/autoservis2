'use server';

import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export type EmailVerificationState = {
  success: boolean;
  error: string | null;
};

export async function verifyEmail(
  _prevState: EmailVerificationState,
  formData: FormData
): Promise<EmailVerificationState> {
  const token = String(formData.get('token') ?? '').trim();
  if (!token) return { success: false, error: 'Ověřovací odkaz není platný.' };

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt <= new Date()) {
    return { success: false, error: 'Tento ověřovací odkaz už není platný. Požádejte o nový.' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationToken.userId, id: { not: verificationToken.id } },
    }),
  ]);

  redirect('/login?verified=success');
}

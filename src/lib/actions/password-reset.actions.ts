'use server';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { consumeRateLimit, getClientIp, normalizeEmail } from '@/lib/auth-rate-limit';
import { prisma } from '@/lib/prisma';
import { appUrl, passwordChangedEmail, passwordResetEmail, sendEmail } from '@/lib/email/send';

const TOKEN_MINUTES = 30;

export type PasswordResetRequestState = {
  sent: boolean;
  error: string | null;
};

export type PasswordResetState = {
  success: boolean;
  error: string | null;
};

export async function requestPasswordReset(
  _prevState: PasswordResetRequestState,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));

  if (!email) {
    return { sent: false, error: 'Zadejte prosím emailovou adresu.' };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const ipAllowed = await consumeRateLimit('password-reset:ip:' + ip, { limit: 5, windowMs: 60 * 60 * 1000 });
  const emailAllowed = await consumeRateLimit('password-reset:email:' + email, { limit: 3, windowMs: 60 * 60 * 1000 });

  if (!ipAllowed || !emailAllowed) {
    return { sent: true, error: null };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  // Always return the same response so the form cannot be used to discover accounts.
  if (!user) {
    return { sent: true, error: null };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const sent = await sendEmail({
    to: user.email,
    subject: 'Obnovení hesla – Garazio',
    html: passwordResetEmail({ name: user.name, resetUrl }),
  });

  if (!sent) {
    console.error(`[password-reset] Failed to send reset email to ${user.email}`);
  }

  return { sent: true, error: null };
}

export async function resetPassword(
  _prevState: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

  if (!token) return { success: false, error: 'Odkaz pro obnovení hesla není platný.' };
  if (password.length < 8) return { success: false, error: 'Heslo musí mít alespoň 8 znaků.' };
  if (password !== passwordConfirmation) return { success: false, error: 'Hesla se neshodují.' };

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return { success: false, error: 'Tento odkaz pro obnovení hesla už není platný. Požádejte o nový.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: passwordHash, passwordChangedAt: new Date() } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } }),
  ]);

  await sendEmail({
    to: resetToken.user.email,
    subject: 'Heslo bylo změněno – Garazio',
    html: passwordChangedEmail({ name: resetToken.user.name }),
  });

  redirect('/login?reset=success');
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appUrl, sendEmail, trialEndingEmail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMINDERS = [
  { key: '7d', days: 7, subject: 'Vaše zkušební období v Garaziu končí za 7 dní' },
  { key: '1d', days: 1, subject: 'Vaše zkušební období v Garaziu končí zítra' },
  { key: 'expired', days: 0, subject: 'Vaše zkušební období v Garaziu dnes končí' },
] as const;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function utcDayOffset(days: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let sent = 0;
  let skipped = 0;

  for (const reminder of REMINDERS) {
    // Cron běží jednou denně, proto bereme celý cílový UTC den a ne jen
    // 24hodinové okno od okamžiku spuštění.
    const targetStart = utcDayOffset(reminder.days);
    const targetEnd = utcDayOffset(reminder.days + 1);

    const garages = await prisma.garage.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        email: { not: null },
        trialEndsAt: { gte: targetStart, lt: targetEnd },
      },
      select: { id: true, name: true, email: true, trialEndsAt: true },
    });

    for (const garage of garages) {
      if (!garage.email) continue;

      const deliveryKey = `trial:${reminder.key}:${garage.id}:${garage.trialEndsAt.toISOString()}`;
      const existing = await prisma.emailDelivery.findUnique({ where: { key: deliveryKey } });
      if (existing) {
        skipped += 1;
        continue;
      }

      const ok = await sendEmail({
        to: garage.email,
        subject: reminder.subject,
        html: trialEndingEmail({
          garageName: garage.name,
          trialEndsAt: garage.trialEndsAt,
          daysRemaining: reminder.days,
          appUrl: appUrl(),
        }),
      });

      if (!ok) continue;

      try {
        await prisma.emailDelivery.create({
          data: { key: deliveryKey, garageId: garage.id, type: `TRIAL_${reminder.key.toUpperCase()}` },
        });
        sent += 1;
      } catch (error) {
        // Paralelní spuštění cron jobu může narazit na unique key.
        if (!isUniqueConstraintError(error)) throw error;
        skipped += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, skipped });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const reminder of REMINDERS) {
    const targetStart = new Date(now.getTime() + reminder.days * 24 * 60 * 60 * 1000);
    const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000);

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

      await prisma.emailDelivery.create({
        data: { key: deliveryKey, garageId: garage.id, type: `TRIAL_${reminder.key.toUpperCase()}` },
      });
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped });
}

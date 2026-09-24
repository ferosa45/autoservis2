import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const MAX_KEY_LENGTH = 240;

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = headers.get('x-real-ip')?.trim();
  return (forwarded || realIp || 'unknown').slice(0, 120);
}

export async function consumeRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  const safeKey = key.slice(0, MAX_KEY_LENGTH);
  const now = new Date();
  const cutoff = new Date(now.getTime() - config.windowMs);

  const active = await prisma.authRateLimit.updateMany({
    where: {
      key: safeKey,
      windowStartedAt: { gte: cutoff },
      count: { lt: config.limit },
    },
    data: { count: { increment: 1 } },
  });
  if (active.count === 1) return true;

  const expired = await prisma.authRateLimit.updateMany({
    where: {
      key: safeKey,
      windowStartedAt: { lt: cutoff },
    },
    data: { count: 1, windowStartedAt: now },
  });
  if (expired.count === 1) return true;

  try {
    await prisma.authRateLimit.create({
      data: { key: safeKey, count: 1, windowStartedAt: now },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

export async function cleanupAuthRateLimits(): Promise<void> {
  await prisma.authRateLimit.deleteMany({
    where: { updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

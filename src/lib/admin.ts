import { auth } from '@/lib/auth';

function getAdminEmail(): string | null {
  const email = process.env.GARAZIO_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const session = await auth();
  const adminEmail = getAdminEmail();
  const userEmail = session?.user?.email?.trim().toLowerCase();
  return Boolean(adminEmail && userEmail && adminEmail === userEmail);
}

export async function assertPlatformAdmin(): Promise<void> {
  if (!(await isPlatformAdmin())) throw new Error('FORBIDDEN');
}

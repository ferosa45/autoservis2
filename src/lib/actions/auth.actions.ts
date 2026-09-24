'use server';

import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { signIn, signOut } from '@/lib/auth';
import { consumeRateLimit, getClientIp } from '@/lib/auth-rate-limit';

export type LoginState = { error: string | null };

export async function authenticate(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const allowed = await consumeRateLimit('login:ip:' + ip, { limit: 20, windowMs: 15 * 60 * 1000 });

  if (!allowed) {
    return { error: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.' };
  }

  try {
    await signIn('credentials', formData);
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Nesprávný email nebo heslo.' };
        default:
          return { error: 'Přihlášení se nezdařilo. Zkuste to prosím znovu.' };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/login' });
}

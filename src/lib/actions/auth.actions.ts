'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export type LoginState = { error: string | null };

export async function authenticate(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn('credentials', formData);
    return { error: null };
  } catch (error) {
    // NEXT_REDIRECT není chyba přihlášení, ale interní mechanismus přesměrování
    // po úspěšném signIn - musí propadnout dál, aby redirect proběhl.
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

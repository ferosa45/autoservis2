'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { registerGarageWithOwner } from '@/lib/services/registration.service';

export type RegisterState = { error: string | null };

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const garageName = String(formData.get('garageName') ?? '').trim();
  const ownerName = String(formData.get('ownerName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!garageName || !ownerName || !email || !password) {
    return { error: 'Vyplňte prosím všechna pole.' };
  }
  if (password.length < 8) {
    return { error: 'Heslo musí mít alespoň 8 znaků.' };
  }

  try {
    await registerGarageWithOwner({ garageName, ownerName, email, password });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Registrace se nezdařila. Zkuste to prosím znovu.' };
  }

  try {
    // Po úspěšné registraci rovnou přihlásit a otevřít hlavní stránku Dnes.
    await signIn('credentials', { email, password, redirectTo: '/today' });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: 'Účet byl vytvořen, ale automatické přihlášení se nezdařilo. Zkuste se přihlásit ručně.',
      };
    }
    throw error;
  }
}

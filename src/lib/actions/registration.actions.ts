'use server';

import { headers } from 'next/headers';
import { emailVerificationEmail, sendEmail } from '@/lib/email/send';
import { registerGarageWithOwner } from '@/lib/services/registration.service';
import { consumeRateLimit, getClientIp, normalizeEmail } from '@/lib/auth-rate-limit';

export type RegisterState = {
  error: string | null;
  verificationSent: boolean;
};

const initialState = { error: null, verificationSent: false } satisfies RegisterState;

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const garageName = String(formData.get('garageName') ?? '').trim();
  const ownerName = String(formData.get('ownerName') ?? '').trim();
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const password = String(formData.get('password') ?? '');

  if (!garageName || !ownerName || !email || !password) {
    return { ...initialState, error: 'Vyplňte prosím všechna pole.' };
  }
  if (password.length < 8) {
    return { ...initialState, error: 'Heslo musí mít alespoň 8 znaků.' };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const ipAllowed = await consumeRateLimit('register:ip:' + ip, { limit: 5, windowMs: 60 * 60 * 1000 });
  const emailAllowed = await consumeRateLimit('register:email:' + email, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!ipAllowed || !emailAllowed) {
    return { ...initialState, error: 'Příliš mnoho pokusů o registraci. Zkuste to prosím později.' };
  }

  try {
    const { verificationToken } = await registerGarageWithOwner({
      garageName,
      ownerName,
      email,
      password,
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://garazio.cz').replace(/\/$/, '');
    const verificationUrl = appUrl + '/verify-email?token=' + encodeURIComponent(verificationToken);
    const emailSent = await sendEmail({
      to: email,
      subject: 'Ověřte svůj email – Garazio',
      html: emailVerificationEmail({ name: ownerName, verificationUrl }),
    });

    if (!emailSent) {
      console.error('[registration] Verification email was not sent to ' + email);
    }

    return { error: null, verificationSent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const userFacingErrors = new Set([
      'Tento email je vyhrazený pro správu platformy.',
      'Tento email už je zaregistrovaný. Zkuste se přihlásit.',
    ]);

    return {
      ...initialState,
      error: userFacingErrors.has(message)
        ? message
        : 'Registrace se nezdařila. Zkuste to prosím znovu.',
    };
  }
}

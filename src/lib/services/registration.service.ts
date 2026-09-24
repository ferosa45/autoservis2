import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type RegisterInput = {
  garageName: string;
  ownerName: string;
  email: string;
  password: string;
};

const TRIAL_DAYS = 30;
const VERIFICATION_HOURS = 24;
const BCRYPT_COST = 12;

export async function registerGarageWithOwner(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const adminEmail = process.env.GARAZIO_ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && email === adminEmail) {
    throw new Error('Tento email je vyhrazený pro správu platformy.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Tento email už je zaregistrovaný. Zkuste se přihlásit.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const garage = await prisma.garage.create({
    data: {
      name: input.garageName,
      email,
      subscriptionStatus: 'TRIALING',
      trialEndsAt,
      users: {
        create: {
          name: input.ownerName,
          email,
          password: passwordHash,
          role: 'OWNER',
          emailVerificationTokens: {
            create: { tokenHash, expiresAt },
          },
        },
      },
    },
  });

  return { garage, verificationToken: rawToken };
}

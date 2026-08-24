import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export type RegisterInput = {
  garageName: string;
  ownerName: string;
  email: string;
  password: string;
};

const TRIAL_DAYS = 30;

export async function registerGarageWithOwner(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Tento email už je zaregistrovaný. Zkuste se přihlásit.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const garage = await prisma.garage.create({
    data: {
      name: input.garageName,
      subscriptionStatus: 'TRIALING',
      trialEndsAt,
      users: {
        create: {
          name: input.ownerName,
          email: input.email,
          password: passwordHash,
          role: 'OWNER',
        },
      },
    },
  });

  return garage;
}

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, normalizeEmail } from '@/lib/auth-rate-limit';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LOGIN_EMAIL_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Heslo', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = normalizeEmail(parsed.data.email);
        const password = parsed.data.password;

        if (!(await consumeRateLimit(`login:email:${email}`, LOGIN_EMAIL_LIMIT))) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            garageId: true,
            active: true,
            emailVerifiedAt: true,
            passwordChangedAt: true,
          },
        });

        if (!user || !user.active || !user.emailVerifiedAt) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        const passwordChangedAt = user.passwordChangedAt;
        if (bcrypt.getRounds(user.password) !== 12) {
          const passwordHash = await bcrypt.hash(password, 12);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: passwordHash },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          garageId: user.garageId,
          passwordChangedAt: passwordChangedAt.toISOString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.garageId = (user as { garageId: string }).garageId;
        token.role = (user as { role: string }).role;
        token.passwordChangedAt = (user as { passwordChangedAt: string }).passwordChangedAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.garageId = token.garageId as string;
        session.user.role = token.role as 'OWNER' | 'MECHANIC';
        session.user.passwordChangedAt = token.passwordChangedAt as string;
      }
      return session;
    },
  },
});
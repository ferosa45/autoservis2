import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Heslo', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          garageId: user.garageId,
        };
      },
    }),
  ],
  callbacks: {
    // Uložíme garageId a role do JWT tokenu při přihlášení
    async jwt({ token, user }) {
      if (user) {
        token.garageId = (user as { garageId: string }).garageId;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    // Zpřístupníme garageId a role v session (server-side)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.garageId = token.garageId as string;
        session.user.role = token.role as 'OWNER' | 'MECHANIC';
      }
      return session;
    },
  },
});

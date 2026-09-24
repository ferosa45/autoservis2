import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      garageId: string;
      role: 'OWNER' | 'MECHANIC';
      passwordChangedAt: string;
    } & DefaultSession['user'];
  }
}

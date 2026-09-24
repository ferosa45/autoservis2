import Link from 'next/link';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">G</div>
          <span className="font-heading text-xl font-extrabold tracking-tight text-text-primary">Garazio</span>
        </div>
        {token ? (
          <VerifyEmailForm token={token} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <h1 className="mb-2 font-heading text-lg font-bold text-text-primary">Neplatný odkaz</h1>
            <p className="text-sm leading-6 text-text-secondary">Ověřovací odkaz není kompletní. Zkontrolujte email a zkuste to znovu.</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
              Zpět na přihlášení
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

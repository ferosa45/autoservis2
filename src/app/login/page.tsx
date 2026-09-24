import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; verified?: string }>;
}) {
  const { reset, verified } = await searchParams;

  return <LoginForm resetSuccess={reset === 'success'} verifiedSuccess={verified === 'success'} />;
}

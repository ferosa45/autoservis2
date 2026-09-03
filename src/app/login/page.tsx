import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return <LoginForm resetSuccess={reset === 'success'} />;
}

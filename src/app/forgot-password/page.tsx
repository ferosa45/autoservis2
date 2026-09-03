import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">G</div>
          <span className="font-heading text-xl font-extrabold tracking-tight text-text-primary">Garazio</span>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

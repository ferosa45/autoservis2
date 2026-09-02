'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { resetUserPassword } from '@/lib/actions/admin.actions';

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    if (!window.confirm('Opravdu vygenerovat nové dočasné heslo? Současné heslo přestane platit.')) return;
    setPending(true);
    setError(null);
    setPassword(null);
    try {
      const result = await resetUserPassword(userId);
      if (result.error) setError(result.error);
      else if (result.password) setPassword(result.password);
    } catch {
      setError('Reset hesla se nepodařil.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleSubmit} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-primary transition hover:bg-surface-hover disabled:opacity-50">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Resetovat heslo
      </button>
      {password && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-xs font-semibold text-amber-300">Nové dočasné heslo — zobrazí se pouze zde:</p><p className="mt-1 break-all font-mono text-sm font-bold text-text-primary">{password}</p></div>}
      {error && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
    </div>
  );
}

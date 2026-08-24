import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';
import { getSessionContext } from '@/lib/session';

const WARNING_THRESHOLD_DAYS = 5;

export async function TrialBanner() {
  const context = await getSessionContext();

  if (context.subscriptionStatus === 'ACTIVE') {
    return null;
  }

  const now = Date.now();
  const daysLeft = Math.ceil((context.trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24));

  if (!context.hasWriteAccess) {
    return (
      <div className="flex items-center justify-center gap-2 bg-status-blocked-bg px-4 py-2 text-sm text-status-blocked-text">
        <Lock className="h-4 w-4 shrink-0" />
        <span>Zkušební období vypršelo - appka je teď jen ke čtení.</span>
        <Link href="/billing" className="font-semibold underline underline-offset-2">
          Aktivovat předplatné
        </Link>
      </div>
    );
  }

  if (context.subscriptionStatus === 'TRIALING' && daysLeft <= WARNING_THRESHOLD_DAYS) {
    return (
      <div className="flex items-center justify-center gap-2 bg-status-waiting-bg px-4 py-2 text-sm text-status-waiting-text">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Zkušební období končí{' '}
          {daysLeft <= 0 ? 'dnes' : `za ${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'}`}.
        </span>
        <Link href="/billing" className="font-semibold underline underline-offset-2">
          Aktivovat předplatné
        </Link>
      </div>
    );
  }

  return null;
}

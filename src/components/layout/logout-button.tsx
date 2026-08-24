'use client';

import { LogOut } from 'lucide-react';
import { logout } from '@/lib/actions/auth.actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label="Odhlásit se"
        title="Odhlásit se"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-status-blocked-text"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}

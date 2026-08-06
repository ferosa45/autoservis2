'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { cn } from '@/lib/utils';

export function SidebarNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode; // ZMĚNA: Přijímáme vyrenderovaný element místo LucideIcon
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'border-l-2 border-primary bg-primary-muted text-primary'
          : 'border-l-2 border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary'
      )}
    >
      {/* ZMĚNA: Ikonu rovnou vypíšeme, už ji nemusíme obalovat do < /> */}
      {icon}
      {label}
    </Link>
  );
}
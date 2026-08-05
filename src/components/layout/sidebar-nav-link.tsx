'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
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
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

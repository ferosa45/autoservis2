'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SidebarNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  // Vykreslený ikonový element (JSX), ne reference na komponentu -
  // reference na komponentu (funkci/forwardRef objekt) nejde poslat
  // ze Server Componenty do Client Componenty jako prop, protože to
  // není "plain object" serializovatelný přes RSC hranici. Vykreslený
  // element (React node) serializovatelný je.
  icon: React.ReactNode;
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
      {icon}
      {label}
    </Link>
  );
}

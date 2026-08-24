import Link from 'next/link';
import { User, Phone, Mail } from 'lucide-react';

export function CustomerInfoCard({
  customer,
}: {
  customer: { id: string; name: string; phone: string; email: string | null };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <User className="h-3.5 w-3.5" />
        Zákazník
      </div>
      <Link href={`/customers/${customer.id}`} className="font-heading text-base font-bold text-text-primary hover:text-primary">
        {customer.name}
      </Link>
      <div className="mt-2 space-y-1 text-sm text-text-secondary">
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-text-muted" />
          {customer.phone}
        </p>
        {customer.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-text-muted" />
            {customer.email}
          </p>
        )}
      </div>
    </div>
  );
}

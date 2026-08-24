import Link from 'next/link';
import { ChevronLeft, Phone, Mail } from 'lucide-react';

export function CustomerDetailHeader({
  customer,
}: {
  customer: { name: string; phone: string; email: string | null };
}) {
  return (
    <div>
      <Link
        href="/customers"
        className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Zpět na zákazníky
      </Link>

      <h1 className="font-heading text-2xl font-bold text-text-primary">{customer.name}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-text-muted" />
          {customer.phone}
        </span>
        {customer.email && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-text-muted" />
            {customer.email}
          </span>
        )}
      </div>
    </div>
  );
}

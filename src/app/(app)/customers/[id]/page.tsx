import { notFound } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getCustomerDetail } from '@/lib/services/customer.service';
import { CustomerDetailHeader } from '@/components/customers/customer-detail-header';
import { CustomerNote } from '@/components/customers/customer-note';
import { VehicleHistoryList } from '@/components/customers/vehicle-history-list';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getSessionContext();
  const customer = await getCustomerDetail(context, id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <CustomerDetailHeader customer={customer} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-heading text-sm font-bold text-text-primary">Vozidla</h2>
          <VehicleHistoryList customerId={customer.id} vehicles={customer.vehicles} />
        </div>
        <div><CustomerNote customerId={customer.id} initialNote={customer.note} /></div>
      </div>
    </div>
  );
}

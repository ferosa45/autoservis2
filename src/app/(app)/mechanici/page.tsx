import { getSessionContext } from '@/lib/session';
import { MechanicsSettings } from '@/components/settings/mechanics-settings';
import { listGarageUsers } from '@/lib/actions/user.actions';

export default async function MechanicsPage() {
  const context = await getSessionContext();

  if (context.role !== 'OWNER') {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-secondary">
          Správu mechaniků může provádět pouze majitel servisu.
        </div>
      </div>
    );
  }

  const users = await listGarageUsers();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Mechanici</h1>
        <p className="mt-1 text-sm text-text-muted">Přidejte zaměstnance a nastavte jejich přístupy.</p>
      </div>
      <MechanicsSettings initial={users} />
    </div>
  );
}

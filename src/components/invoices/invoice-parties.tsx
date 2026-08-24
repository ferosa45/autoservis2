type PartySnapshot = {
  name: string;
  ico: string | null;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
};

function PartyCard({ title, party }: { title: string; party: PartySnapshot }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      <p className="font-medium text-text-primary">{party.name}</p>
      {(party.street || party.city || party.zip) && (
        <p className="text-sm text-text-secondary">
          {party.street}
          {party.street && (party.city || party.zip) && ', '}
          {party.zip} {party.city}
        </p>
      )}
      <div className="mt-1 flex gap-3 text-xs text-text-muted">
        {party.ico && <span>IČO: {party.ico}</span>}
        {party.dic && <span>DIČ: {party.dic}</span>}
      </div>
    </div>
  );
}

export function InvoiceParties({
  supplier,
  customer,
}: {
  supplier: PartySnapshot;
  customer: PartySnapshot;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PartyCard title="Dodavatel" party={supplier} />
      <PartyCard title="Odběratel" party={customer} />
    </div>
  );
}

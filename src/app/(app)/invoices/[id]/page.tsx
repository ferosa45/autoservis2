export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8 text-text-primary">
      <h1 className="font-heading text-2xl">Faktura {id} (placeholder)</h1>
    </div>
  );
}

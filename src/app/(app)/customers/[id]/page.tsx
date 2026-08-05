export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8 text-text-primary">
      <h1 className="font-heading text-2xl">Zákazník {id} (placeholder - Fáze 7)</h1>
    </div>
  );
}

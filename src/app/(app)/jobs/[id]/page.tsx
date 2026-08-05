export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8 text-text-primary">
      <h1 className="font-heading text-2xl">Zakázka {id} (placeholder - Fáze 6)</h1>
    </div>
  );
}

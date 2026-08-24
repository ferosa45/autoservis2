import { Car } from 'lucide-react';

export function VehicleInfoCard({
  vehicle,
}: {
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string | null;
    year: number | null;
    mileage: number | null;
  };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Car className="h-3.5 w-3.5" />
        Vozidlo
      </div>
      <p className="font-heading text-base font-bold text-text-primary">
        {vehicle.brand} {vehicle.model}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        {vehicle.licensePlate ? (
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs">
            {vehicle.licensePlate}
          </span>
        ) : (
          <span className="text-xs text-text-muted">SPZ nedoplněna</span>
        )}
        {vehicle.year && <span>· {vehicle.year}</span>}
        {vehicle.mileage != null && <span>· {vehicle.mileage.toLocaleString('cs-CZ')} km</span>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { searchVehicles, type VehicleSuggestion } from '@/lib/actions/lookup.actions';

export function VehicleSearchField({
  customerId,
  selectedId,
  onSelect,
}: {
  customerId: string | null;
  selectedId: string | null;
  onSelect: (vehicle: VehicleSuggestion) => void;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VehicleSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // U vybraného zákazníka rovnou nabídneme jeho vozidla i bez zadání textu
    // (typicky jedno až dvě auta) - jinak vyžadujeme aspoň nějaký text.
    if (query.trim().length === 0 && !customerId) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchVehicles(query, customerId);
      setSuggestions(results);
      setIsOpen(true);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, customerId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
            else if (customerId) {
              searchVehicles('', customerId).then((results) => {
                setSuggestions(results);
                setIsOpen(results.length > 0);
              });
            }
          }}
          placeholder={
            customerId ? 'Vybrat vozidlo zákazníka nebo hledat...' : 'Hledat podle značky, modelu nebo SPZ...'
          }
          className="w-full rounded-lg border border-border bg-elevated py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-elevated shadow-lg">
          {suggestions.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => {
                onSelect(vehicle);
                setQuery('');
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-border"
            >
              <span className="text-text-primary">
                {vehicle.brand} {vehicle.model}
              </span>
              {vehicle.licensePlate && (
                <span className="font-mono text-xs text-text-muted">{vehicle.licensePlate}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-status-done-text">
          <Check className="h-3 w-3" />
          Existující vozidlo
        </p>
      )}
    </div>
  );
}

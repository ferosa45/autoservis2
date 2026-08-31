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

    // Po výběru zákazníka zobrazíme jeho vozidla. Pokud má právě jedno,
    // můžeme ho pohodlně předvybrat. Pokud jich má více, nikdy nic
    // nevybíráme automaticky a mechanik musí konkrétní auto zvolit sám.
    if (query.trim().length === 0 && customerId) {
      if (selectedId) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const results = await searchVehicles('', customerId);
        setSuggestions(results);

        if (results.length === 1) {
          const vehicle = results[0];
          if (vehicle) {
            onSelect(vehicle);
          }
          setIsOpen(false);
        } else {
          setIsOpen(results.length > 0);
        }
      }, 150);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    if (query.trim().length === 0 && !customerId) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchVehicles(query, customerId);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, customerId, selectedId, onSelect]);

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
            else if (customerId && !selectedId) {
              searchVehicles('', customerId).then((results) => {
                setSuggestions(results);
                setIsOpen(results.length > 0);
              });
            }
          }}
          placeholder={
            customerId ? 'Vyberte vozidlo zákazníka nebo hledejte...' : 'Hledat podle značky, modelu nebo SPZ...'
          }
          className="w-full rounded-lg border border-border bg-elevated py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <>
          {suggestions.length > 1 && (
            <p className="mt-2 text-xs font-medium text-text-muted sm:hidden">
              Vyberte vozidlo
            </p>
          )}
          <div className="relative mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-elevated shadow-lg sm:absolute sm:z-10 sm:mt-1 sm:max-h-64">
            {suggestions.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  onSelect(vehicle);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-border"
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
        </>
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

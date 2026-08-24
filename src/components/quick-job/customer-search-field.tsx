'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { searchCustomers, type CustomerSuggestion } from '@/lib/actions/lookup.actions';

export function CustomerSearchField({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (customer: CustomerSuggestion) => void;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchCustomers(query);
      setSuggestions(results);
      setIsOpen(true);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Hledat podle jména nebo telefonu..."
          className="w-full rounded-lg border border-border bg-elevated py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-elevated shadow-lg">
          {suggestions.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                onSelect(customer);
                setQuery('');
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-border"
            >
              <span className="text-text-primary">{customer.name}</span>
              <span className="text-text-muted">{customer.phone}</span>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-status-done-text">
          <Check className="h-3 w-3" />
          Existující zákazník
        </p>
      )}
    </div>
  );
}

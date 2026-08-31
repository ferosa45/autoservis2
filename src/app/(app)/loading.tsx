import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-sm">Načítání…</span>
      </div>
    </div>
  );
}

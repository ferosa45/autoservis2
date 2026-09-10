function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-elevated ${className}`} />;
}

export default function TodayLoading() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <div className="min-w-0 flex-1 space-y-5 p-3 sm:space-y-6 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>

      <div className="w-full shrink-0 space-y-4 border-t border-border p-3 sm:p-4 md:w-[380px] md:border-l md:border-t-0">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

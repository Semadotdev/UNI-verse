export function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-bg-raised p-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-bg-overlay" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-24 rounded bg-bg-overlay" />
          <div className="h-2.5 w-16 rounded bg-bg-overlay" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-bg-overlay" />
        <div className="h-3 w-3/4 rounded bg-bg-overlay" />
      </div>
    </div>
  );
}

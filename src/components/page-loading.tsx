export function PageLoading({ title = "読み込み中" }: { title?: string }) {
  return (
    <div className="container space-y-5 py-6 sm:py-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" aria-label={title} />
        <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-4 rounded-md border bg-card p-5">
            <div className="flex flex-wrap gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-6 w-3/4 animate-pulse rounded-md bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

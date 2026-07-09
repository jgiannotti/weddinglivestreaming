// Directory results are fetched in an async Server Component, so without this
// file Next.js shows nothing at all between navigation and the finished
// render — a jarring blank/white flash, worst on mobile/slower connections
// (exactly the "60 seconds at work" journey). This streams in immediately and
// is replaced the moment the real page finishes loading.
export default function DirectoryLoading() {
  return (
    <div className="container py-10 md:py-14 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-20 rounded bg-muted mb-3" />
        <div className="h-9 w-64 rounded bg-muted mb-3" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>

      <div className="mb-8 h-14 rounded-full bg-muted" />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-full bg-muted" />
          ))}
        </aside>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border bg-card">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

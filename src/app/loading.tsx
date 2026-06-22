export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-5 lg:pr-72">
      <div className="mx-auto max-w-[1540px] animate-pulse space-y-6">
        <div className="h-16 rounded-2xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-muted" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-96 rounded-2xl bg-muted" />
          <div className="h-96 rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  );
}

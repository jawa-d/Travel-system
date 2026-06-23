export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F1ECE2] p-5 lg:pr-72">
      <div className="mx-auto max-w-[1540px] animate-pulse space-y-6">
        <div className="h-48 rounded-[2rem] bg-[#293545]/15" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item} className="h-36 rounded-2xl bg-white/70" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-80 rounded-2xl bg-white/70" />)}
        </div>
      </div>
    </main>
  );
}

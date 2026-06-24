export default function Loading() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F1ECE2] p-3 sm:p-4 lg:pr-[17rem] xl:pr-[19rem]">
      <div className="w-full max-w-none animate-pulse space-y-6">
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

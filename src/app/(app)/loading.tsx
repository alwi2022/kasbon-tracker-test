export default function Loading() {
  return (
    <section className="space-y-6">
      <div className="h-16 animate-pulse rounded-lg bg-white/10" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg bg-white/10" />
        <div className="h-28 animate-pulse rounded-lg bg-white/10" />
        <div className="h-28 animate-pulse rounded-lg bg-white/10" />
      </div>
      <div className="h-24 animate-pulse rounded-lg bg-white/10" />
      <div className="h-56 animate-pulse rounded-lg bg-white/10" />
    </section>
  );
}

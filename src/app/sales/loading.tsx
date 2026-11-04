export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading leads" className="animate-pulse">
      <div className="h-7 w-32 rounded bg-line" />
      <div className="mt-2 h-4 w-72 rounded bg-line/70" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-line/70" />
        ))}
      </div>
      <div className="mt-4 space-y-px overflow-hidden rounded-[var(--radius-card)] border border-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface" />
        ))}
      </div>
    </div>
  );
}

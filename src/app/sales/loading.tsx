export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading leads">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton mt-3 h-8 w-32 rounded" />
      <div className="skeleton mt-2 h-4 w-72 rounded" />
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

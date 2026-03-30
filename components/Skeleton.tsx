export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-augusta/10 ${className}`}
    />
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-augusta/10"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  dark = false,
}: {
  lines?: number;
  dark?: boolean;
}) {
  const bg = dark ? "bg-dark-green/30" : "bg-augusta/10";
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 animate-pulse rounded ${bg} ${
            i === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ dark = false }: { dark?: boolean }) {
  const bg = dark ? "bg-cream/5" : "bg-white";
  const pulse = dark ? "bg-dark-green/30" : "bg-augusta/10";
  return (
    <div className={`rounded-xl ${bg} p-6 shadow-sm`}>
      <div className={`h-3 w-24 animate-pulse rounded ${pulse}`} />
      <div className={`mt-4 h-6 w-32 animate-pulse rounded ${pulse}`} />
      <div className="mt-4 space-y-2">
        <div className={`h-3.5 w-full animate-pulse rounded ${pulse}`} />
        <div className={`h-3.5 w-5/6 animate-pulse rounded ${pulse}`} />
        <div className={`h-3.5 w-2/3 animate-pulse rounded ${pulse}`} />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  dark = false,
}: {
  rows?: number;
  cols?: number;
  dark?: boolean;
}) {
  const pulse = dark ? "bg-dark-green/30" : "bg-augusta/10";
  const border = dark ? "border-cream/5" : "border-sand";
  return (
    <div className="overflow-hidden rounded-xl">
      {/* Header */}
      <div className={`flex gap-4 border-b ${border} px-4 py-3`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className={`h-3 animate-pulse rounded ${pulse} ${
              i === 0 ? "w-12" : "flex-1"
            }`}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex items-center gap-4 border-b ${border} px-4 py-3.5`}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`h-3.5 animate-pulse rounded ${pulse} ${
                colIdx === 0 ? "w-8" : colIdx === 1 ? "flex-1" : "w-16"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

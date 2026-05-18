export function KPISkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="w-9 h-9 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-24 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 px-4 py-3.5 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`h-4 bg-slate-100 rounded flex-1 ${colIdx === 0 ? 'max-w-[80px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full bg-slate-100 rounded-lg flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 rounded-t"
            style={{ height: `${40 + Math.random() * 50}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
          <div className="h-6 bg-slate-200 rounded w-16 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
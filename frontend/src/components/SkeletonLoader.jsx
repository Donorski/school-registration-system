export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="flex items-center gap-3 mt-2">
        <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

const COL_WIDTHS = ['w-20', 'w-36', 'w-24', 'w-16', 'w-20', 'w-28', 'w-16', 'w-24'];

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 bg-gray-200 rounded animate-pulse ${COL_WIDTHS[i % COL_WIDTHS.length]}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

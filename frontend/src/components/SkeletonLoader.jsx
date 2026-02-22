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

export function SkeletonRow() {
  return (
    <tr className="border-b animate-pulse">
      <td className="py-3 pr-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="py-3 pr-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
      <td className="py-3 pr-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      <td className="py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    </tr>
  );
}

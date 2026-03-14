export default function LowStockBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
      {count}
    </span>
  );
}

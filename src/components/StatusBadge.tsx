export function StatusBadge({ s }: { s: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    closed: "bg-gray-100 text-gray-700",
    locked: "bg-orange-100 text-orange-700",
    released: "bg-green-100 text-green-700",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors[s] ?? "bg-gray-100"}`}>{s}</span>;
}

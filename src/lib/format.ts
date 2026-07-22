export function fmtMoney(amount: number, currency: "INR" | "USD") {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${Number(amount ?? 0).toFixed(4)}`;
}
export function fmtPoints(pts: number | bigint | string | null | undefined) {
  return Number(pts ?? 0).toLocaleString();
}
export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

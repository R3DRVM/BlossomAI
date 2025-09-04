export function fmtUSD(n?: number) {
  const v = Number.isFinite(n as number) ? Number(n) : 0;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
export function fmtPct(n?: number) {
  const v = Number.isFinite(n as number) ? Number(n) : 0;
  return `${v.toFixed(2)}%`;
}
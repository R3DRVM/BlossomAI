export const toNum = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const toFixedSafe = (v: any, dp = 2, d = '0.00') => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(dp) : d;
};

export const parseSize = (text: string): number | undefined => {
  const t = text.replace(/[, ]/g,'').toLowerCase();
  const m = t.match(/(\d+(\.\d+)?)([kmb])?/);
  if (!m) return;
  let n = parseFloat(m[1]);
  if (m[3]==='k') n*=1e3;
  if (m[3]==='m') n*=1e6;
  if (m[3]==='b') n*=1e9;
  return Math.round(n);
};

export const formatSize = (n: number): string => {
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`;
  return n.toString();
};
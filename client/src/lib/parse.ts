/**
 * Safe parsing utilities for user input
 */

export function parseSize(text: string): number | undefined {
  const t = text.replace(/[, ]/g, '').toLowerCase();
  const m = t.match(/(\d+(\.\d+)?)([kmb])?/);
  if (!m) return;
  let n = parseFloat(m[1]);
  if (m[3] === 'k') n *= 1e3;
  if (m[3] === 'm') n *= 1e6;
  if (m[3] === 'b') n *= 1e9;
  return Math.round(n);
}

export const parseBool = (t: string) => /\b(yes|y|true|enable|on)\b/i.test(t);

export const parseIntSafe = (t: string) => {
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};




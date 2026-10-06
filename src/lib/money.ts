/** All money is integer paise. Never use floats for amounts. */
export type Paise = number;

export const toPaise = (rupees: number): Paise => Math.round(rupees * 100);

export const formatINR = (paise: Paise): string =>
  `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Split `amount` across `weights` so the parts sum exactly to `amount`
 * (largest remainder method). Ties go to the earliest index, so output is deterministic.
 * Works for negative amounts too (e.g. discounts).
 */
export function allocate(amount: Paise, weights: number[]): Paise[] {
  const n = weights.length;
  if (n === 0) return [];
  const total = weights.reduce((a, b) => a + b, 0);
  const w = total > 0 ? weights : weights.map(() => 1);
  const wTotal = total > 0 ? total : n;

  const sign = amount < 0 ? -1 : 1;
  const abs = Math.abs(amount);
  const raw = w.map((x) => (abs * x) / wTotal);
  const parts = raw.map(Math.floor);
  let left = abs - parts.reduce((a, b) => a + b, 0);

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0; k = (k + 1) % n, left--) parts[order[k].i] += 1;

  return parts.map((p) => sign * p);
}

/** "3,280.00" (no symbol), Indian digit grouping. For mono-spaced amounts next to a ₹ drawn separately. */
export const formatNum = (paise: Paise): string =>
  (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

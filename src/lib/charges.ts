import type { ChargeKind } from "./model";
import type { Paise } from "./money";

export const ROUND_OFF = "Round-off";

export interface ChargeLike {
  label: string;
  kind: ChargeKind;
  amount: Paise;
}

export function totalsOf(charges: { kind: ChargeKind; amount: Paise }[]): { tax: Paise; service: Paise; discount: Paise } {
  const t = { tax: 0, service: 0, discount: 0 };
  for (const c of charges) t[c.kind] += c.amount;
  return t;
}

const isRoundOff = (c: ChargeLike) => c.kind === "discount" && c.label === ROUND_OFF;

export interface BillCheck {
  ok: boolean;
  /** items + charges - discounts, minus the printed total. Negative = short, positive = over. */
  diff: Paise;
  actual: Paise;
  itemsSum: Paise;
}

/**
 * The one test that decides whether a scan can be shared: items + tax + service - discount against
 * the bill's own printed total, within `tolerance` (default Rs 1). Any earlier round-off row is ignored.
 */
export function checkBill(items: { price: Paise }[], charges: ChargeLike[], total: Paise, tolerance: Paise = 100): BillCheck {
  const t = totalsOf(charges.filter((c) => !isRoundOff(c)));
  const itemsSum = items.reduce((s, i) => s + i.price, 0);
  const actual = itemsSum + t.tax + t.service - t.discount;
  const diff = actual - total;
  return { ok: Math.abs(diff) <= tolerance, diff, actual, itemsSum };
}

/**
 * Make friends pay exactly the printed total when the bill's own arithmetic is off by a little.
 * The difference is stored as a signed discount called "Round-off" (positive = friends pay less).
 * Returns the charge list to store; a bigger difference is left alone.
 */
export function withRoundOff(items: { price: Paise }[], charges: ChargeLike[], total: Paise): ChargeLike[] {
  const rest = charges.filter((c) => !isRoundOff(c));
  const { ok, diff } = checkBill(items, rest, total);
  if (!ok || diff === 0) return rest;
  return [...rest, { label: ROUND_OFF, kind: "discount", amount: diff }];
}

/** Round-off currently stored, as friends see it: negative = they pay less than items + charges. */
export function roundOffOf(charges: ChargeLike[]): Paise {
  return -charges.filter(isRoundOff).reduce((s, c) => s + c.amount, 0);
}

/** Two rows with the same name and price are probably the same line scanned twice. */
export function findDuplicate<T extends { id: string; name: string; price: Paise }>(items: T[]): T | null {
  const seen = new Map<string, T>();
  for (const it of items) {
    const k = `${it.name.trim().toLowerCase()}|${it.price}`;
    if (seen.has(k)) return it;
    seen.set(k, it);
  }
  return null;
}

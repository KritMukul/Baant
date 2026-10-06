import { toPaise, type Paise } from "./money";

/** "1,299.50", "₹ 40", "37.5" -> paise. null when it is not a plain amount with at most two decimals. */
export function parseRupees(text: string): Paise | null {
  const s = String(text).replace(/[₹,\s]/g, "");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
  return toPaise(parseFloat(s));
}

/** Paise as plain editable rupees: 6000 -> "60.00" (no thousands separators, no symbol). */
export const rupeesText = (p: Paise): string => (p / 100).toFixed(2);

import { z } from "zod";
import type { Paise } from "./money";

export const parsedBillSchema = z.object({
  merchant: z.string().default(""),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        qty: z.number().int().positive().default(1),
        /** Total line price in rupees (qty already multiplied in). */
        price: z.number().nonnegative(),
      }),
    )
    .min(1),
  taxes: z.array(z.object({ label: z.string(), amount: z.number().nonnegative() })).default([]),
  serviceCharge: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().positive(),
});
export type ParsedBill = z.infer<typeof parsedBillSchema>;

export type BillItem = { id: string; name: string; qty: number; price: Paise };
export type BillCharges = { tax: Paise; service: Paise; discount: Paise };

export type Validation =
  | { ok: true }
  | { ok: false; expected: Paise; actual: Paise; diff: Paise };

/** items + tax + service - discount must equal printed total (±₹1 rounding slack). */
export function validateBill(
  items: { price: Paise }[],
  charges: BillCharges,
  total: Paise,
  tolerance: Paise = 100,
): Validation {
  const actual =
    items.reduce((s, i) => s + i.price, 0) + charges.tax + charges.service - charges.discount;
  const diff = actual - total;
  return Math.abs(diff) <= tolerance ? { ok: true } : { ok: false, expected: total, actual, diff };
}

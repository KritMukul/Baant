import { allocate, type Paise } from "./money";
import type { BillCharges, BillItem } from "./bill";

/** itemId -> participantIds who claimed it */
export type Claims = Record<string, string[]>;

export type PersonShare = {
  subtotal: Paise;
  tax: Paise;
  service: Paise;
  discount: Paise;
  total: Paise;
};

/**
 * Items are split equally among claimants. Tax, service charge and discount are
 * then spread proportionally to each person's item subtotal. Every step uses
 * largest-remainder rounding, so shares always sum exactly to the billed amount.
 * Unclaimed items are returned separately (nobody owes them yet).
 */
export function splitBill(
  items: BillItem[],
  charges: BillCharges,
  claims: Claims,
  participantIds: string[],
): { shares: Record<string, PersonShare>; unclaimed: BillItem[] } {
  const subtotal: Record<string, Paise> = Object.fromEntries(participantIds.map((p) => [p, 0]));
  const unclaimed: BillItem[] = [];

  for (const item of items) {
    const who = [...new Set(claims[item.id] ?? [])].filter((p) => p in subtotal).sort();
    if (who.length === 0) {
      unclaimed.push(item);
      continue;
    }
    allocate(item.price, who.map(() => 1)).forEach((amt, i) => (subtotal[who[i]] += amt));
  }

  const weights = participantIds.map((p) => subtotal[p]);
  // Until somebody has claimed something, nobody owes any of the tax, service or discount.
  // (allocate() would otherwise spread them equally when every weight is zero.)
  const anyClaimed = weights.some((w) => w > 0);
  const none = weights.map(() => 0);
  const tax = anyClaimed ? allocate(charges.tax, weights) : none;
  const service = anyClaimed ? allocate(charges.service, weights) : none;
  const discount = anyClaimed ? allocate(charges.discount, weights) : none;

  const shares: Record<string, PersonShare> = {};
  participantIds.forEach((p, i) => {
    shares[p] = {
      subtotal: subtotal[p],
      tax: tax[i],
      service: service[i],
      discount: discount[i],
      total: subtotal[p] + tax[i] + service[i] - discount[i],
    };
  });
  return { shares, unclaimed };
}

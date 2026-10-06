import type { Paise } from "./money";

export type Transfer = { from: string; to: string; amount: Paise };

/**
 * Greedy min cash flow. `balances[p]` = paid - owed (positive: should receive).
 * Repeatedly settles the largest debtor against the largest creditor, which
 * finishes in at most n-1 transfers and removes at least one person each step.
 */
export function simplifyDebts(balances: Record<string, Paise>): Transfer[] {
  const net = Object.entries(balances).map(([id, amt]) => ({ id, amt }));
  const sum = net.reduce((s, x) => s + x.amt, 0);
  if (sum !== 0) throw new Error(`Balances must sum to 0, got ${sum}`);

  const out: Transfer[] = [];
  for (;;) {
    net.sort((a, b) => a.amt - b.amt || a.id.localeCompare(b.id));
    const debtor = net[0];
    const creditor = net[net.length - 1];
    if (!debtor || debtor.amt >= 0 || creditor.amt <= 0) break;
    const amount = Math.min(-debtor.amt, creditor.amt);
    out.push({ from: debtor.id, to: creditor.id, amount });
    debtor.amt += amount;
    creditor.amt -= amount;
  }
  return out;
}

/** Fold bills into per-person balances: who paid what vs. who owes what. */
export function balancesFromBills(
  bills: { paidBy: string; owed: Record<string, Paise> }[],
): Record<string, Paise> {
  const bal: Record<string, Paise> = {};
  for (const { paidBy, owed } of bills) {
    for (const [p, amt] of Object.entries(owed)) {
      bal[p] = (bal[p] ?? 0) - amt;
      bal[paidBy] = (bal[paidBy] ?? 0) + amt;
    }
  }
  return bal;
}

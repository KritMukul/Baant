import type { BillData, Participant, Payment } from "./model";
import type { BillItem } from "./bill";
import { totalsOf } from "./charges";
import type { Paise } from "./money";
import { payView, type PayView } from "./payments";
import { splitBill, type Claims, type PersonShare } from "./split";

/** Items in the shape the split engine wants. */
export const billItems = (d: BillData): BillItem[] => d.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }));

export function claimsOf(d: BillData): Claims {
  const m: Claims = {};
  for (const c of d.claims) (m[c.itemId] ??= []).push(c.participantId);
  return m;
}

/**
 * Everyone's share. Participants go in by id so the result is the same on every device and
 * matches the shared test vectors (ties in rounding go to the earliest id).
 */
export function sharesOf(d: BillData): { shares: Record<string, PersonShare>; unclaimed: BillItem[]; allClaimed: boolean } {
  const ids = d.participants.map((p) => p.id).sort();
  const { shares, unclaimed } = splitBill(billItems(d), totalsOf(d.charges), claimsOf(d), ids);
  return { shares, unclaimed, allClaimed: unclaimed.length === 0 && d.items.length > 0 };
}

export interface FriendRow {
  participant: Participant;
  share: PersonShare;
  pay: PayView;
  payments: Payment[];
}

export interface Ledger {
  host: { participant: Participant; share: PersonShare };
  rows: FriendRow[];
  unclaimed: BillItem[];
  allClaimed: boolean;
  /** Every friend who owes something has been confirmed, and nothing is left unclaimed. */
  settled: boolean;
  counts: { unpaid: number; says: number; confirmed: number; none: number };
  /** Paise confirmed so far, and what friends owe in all. */
  received: Paise;
  owedTotal: Paise;
}

export function ledgerOf(d: BillData): Ledger {
  const { shares, unclaimed, allClaimed } = sharesOf(d);
  const hostP = d.participants.find((p) => p.isHost)!;
  const rows: FriendRow[] = d.participants
    .filter((p) => !p.isHost)
    .map((p) => {
      const payments = d.payments.filter((x) => x.participantId === p.id);
      return { participant: p, share: shares[p.id], payments, pay: payView(shares[p.id].total, payments) };
    });
  const counts = { unpaid: 0, says: 0, confirmed: 0, none: 0 };
  for (const r of rows) counts[r.pay.state]++;
  const owing = rows.filter((r) => r.pay.state !== "none");
  const settled = d.bill.status === "open" && allClaimed && owing.length > 0 && owing.every((r) => r.pay.state === "confirmed");
  return {
    host: { participant: hostP, share: shares[hostP.id] },
    rows,
    unclaimed,
    allClaimed,
    settled,
    counts,
    received: rows.reduce((n, r) => n + r.pay.confirmed + r.pay.waived, 0),
    owedTotal: rows.reduce((n, r) => n + r.pay.owed, 0),
  };
}

/** The same split as `sharesOf`, from loose pieces (a screen's own view, with optimistic claims). */
export function splitFromParts(
  items: { id: string; name: string; qty: number; price: Paise }[],
  charges: { kind: "tax" | "service" | "discount" | string; amount: Paise }[],
  participantIds: string[],
  claims: { itemId: string; participantId: string }[],
) {
  const m: Claims = {};
  for (const c of claims) (m[c.itemId] ??= []).push(c.participantId);
  return splitBill(items, totalsOf(charges as { kind: "tax" | "service" | "discount"; amount: Paise }[]), m, [...participantIds].sort());
}

import type { Payment } from "./model";
import type { Paise } from "./money";

export type PayState = "none" | "unpaid" | "says" | "confirmed";

export interface PayView {
  state: PayState;
  owed: Paise;
  /** Money the host has seen in the bank app. */
  confirmed: Paise;
  /** Shortfall the host chose to accept. */
  waived: Paise;
  /** Money the friend says they sent that the host has not confirmed yet. */
  says: Paise;
  /** Still owed after everything above. */
  remaining: Paise;
  /** Friend says they paid, but less than they owe. */
  short: boolean;
  /** Last payment the friend made that the host marked "not received". */
  rejected: boolean;
}

/**
 * Where one friend stands. Rejected payments count for nothing. A friend with nothing to pay
 * (claimed nothing) is "none" and never blocks a bill from settling.
 */
export function payView(owed: Paise, payments: Payment[]): PayView {
  let confirmed = 0;
  let waived = 0;
  let says = 0;
  for (const p of payments) {
    if (p.status === "confirmed") {
      confirmed += p.confirmed;
      waived += p.waived;
    } else if (p.status === "says") says += p.said;
  }
  const done = confirmed + waived;
  const remaining = Math.max(0, owed - done - says);
  const last = [...payments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
  let state: PayState;
  if (owed <= 0) state = "none";
  else if (done >= owed) state = "confirmed";
  else if (says > 0) state = "says";
  else state = "unpaid";
  return {
    state,
    owed,
    confirmed,
    waived,
    says,
    remaining,
    short: state === "says" && done + says < owed,
    rejected: state === "unpaid" && last?.status === "rejected",
  };
}

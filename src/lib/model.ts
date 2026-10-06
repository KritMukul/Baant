import type { Paise } from "./money";

export type ChargeKind = "tax" | "service" | "discount";
export type BillStatus = "draft" | "open";
export type PaymentStatus = "says" | "confirmed" | "rejected";

/** A row the scan was unsure about. Never blocks sharing. */
export interface ItemFlag {
  read: string;
  why: string;
}

export interface Bill {
  id: string;
  /** 7-char capability code in the share link. */
  code: string;
  /** 3-char payment reference that goes into the UPI note (e.g. 7K2). */
  ref: string;
  merchant: string;
  /** Printed total on the bill, paise. */
  total: Paise;
  /** draft = host is still checking the scan; open = link is live. */
  status: BillStatus;
  payerName: string;
  payerVpa: string;
  /** Small data-URL thumbnail of the photographed bill (display only). */
  thumb: string | null;
  /** If the host shared with a difference, how much short (negative) or over (positive). 0 = matched. */
  shortAtShare: Paise;
  createdAt: string;
  sharedAt: string | null;
}

export interface Item {
  id: string;
  name: string;
  qty: number;
  /** Whole line, paise, before tax. */
  price: Paise;
  position: number;
  flag: ItemFlag | null;
}

export interface Charge {
  id: string;
  label: string;
  kind: ChargeKind;
  /** Paise. Discounts are positive numbers that reduce the bill; a round-off may be negative. */
  amount: Paise;
  position: number;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  createdAt: string;
}

export interface Claim {
  itemId: string;
  participantId: string;
}

/** What the vision model read from a payment screenshot. Nothing is stored except this. */
export interface ShotRead {
  amount: Paise | null;
  payee: string | null;
  status: "success" | "failed" | "pending" | "unknown";
  paidAt: string | null;
  utr: string | null;
}

export interface Payment {
  id: string;
  participantId: string;
  kind: "upi" | "cash";
  /** What the friend said they paid (or the host recorded for cash), paise. */
  said: Paise;
  utr: string | null;
  shot: ShotRead | null;
  status: PaymentStatus;
  /** Paise the host confirmed seeing in the bank app. */
  confirmed: Paise;
  /** Shortfall the host chose to accept ("Confirm anyway"). */
  waived: Paise;
  createdAt: string;
  decidedAt: string | null;
}

export interface BillData {
  bill: Bill;
  items: Item[];
  charges: Charge[];
  participants: Participant[];
  claims: Claim[];
  payments: Payment[];
}

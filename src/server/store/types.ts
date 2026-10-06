import type {
  Bill,
  BillData,
  Charge,
  ChargeKind,
  Item,
  ItemFlag,
  Participant,
  Payment,
  ShotRead,
} from "@/lib/model";
import type { Paise } from "@/lib/money";

export interface NewBill {
  merchant: string;
  total: Paise;
  payerName: string;
  payerVpa: string;
  /** Name shown for the host as a participant (first name). */
  hostName: string;
  thumb: string | null;
  items: { name: string; qty: number; price: Paise; flag?: ItemFlag | null }[];
  charges: { label: string; kind: ChargeKind; amount: Paise }[];
}

export interface NewPayment {
  participantId: string;
  kind: "upi" | "cash";
  said: Paise;
  utr?: string | null;
  shot?: ShotRead | null;
  /** Cash entered by the host is confirmed straight away. */
  status?: "says" | "confirmed";
  confirmed?: Paise;
}

export interface PaymentPatch {
  status?: "says" | "confirmed" | "rejected";
  confirmed?: Paise;
  waived?: Paise;
  decidedAt?: string | null;
}

export interface Credentials {
  token: string;
}

/**
 * Persistence for one deployment. Rules (who may do what, name checks, money maths) live in
 * the service layer; a Store only stores. Tokens are returned once, in plain text, and kept hashed.
 */
export interface Store {
  createBill(input: NewBill): Promise<{
    code: string;
    hostToken: string;
    host: { id: string; token: string };
  }>;
  getBillData(code: string): Promise<BillData | null>;
  checkHost(code: string, token: string): Promise<boolean>;
  checkParticipant(code: string, participantId: string, token: string): Promise<boolean>;

  patchBill(
    code: string,
    patch: Partial<Pick<Bill, "status" | "shortAtShare" | "sharedAt" | "merchant" | "total">>,
  ): Promise<void>;

  saveItem(
    code: string,
    item: { id?: string; name: string; qty: number; price: Paise; flag?: ItemFlag | null },
  ): Promise<Item>;
  removeItem(code: string, itemId: string): Promise<void>;

  saveCharge(
    code: string,
    charge: { id?: string; label: string; kind: ChargeKind; amount: Paise },
  ): Promise<Charge>;
  removeCharge(code: string, chargeId: string): Promise<void>;

  addParticipant(code: string, name: string): Promise<{ participant: Participant; token: string }>;
  /** Takeover: issues a new token and invalidates the old one. */
  rotateParticipantToken(code: string, participantId: string): Promise<string>;

  /** Idempotent. Throws if the item is not on this bill or the participant is not in it. */
  setClaim(code: string, participantId: string, itemId: string, on: boolean): Promise<void>;

  addPayment(code: string, payment: NewPayment): Promise<Payment>;
  updatePayment(code: string, paymentId: string, patch: PaymentPatch): Promise<Payment>;
  removePayment(code: string, paymentId: string): Promise<void>;

  /** Used by tests and cleanup. */
  deleteBill(code: string): Promise<void>;
}

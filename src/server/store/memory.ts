import { randomUUID } from "node:crypto";
import type { Bill, BillData, Charge, Item, Participant, Payment } from "@/lib/model";
import { hashToken, newCode, newRef, newToken, tokenMatches } from "./ids";
import type { NewBill, NewPayment, PaymentPatch, Store } from "./types";

interface Rec {
  data: BillData;
  hostHash: string;
  partHash: Map<string, string>;
}

const clone = <T>(v: T): T => structuredClone(v);
const now = () => new Date().toISOString();

/**
 * In-memory store for local development and tests. Data is lost when the process restarts.
 * Held on globalThis so Server Actions, route handlers and pages (which Next may load as separate
 * modules) all see the same bills.
 */
const g = globalThis as unknown as { __dibsMemory?: Map<string, Rec> };

export function memoryStore(): Store {
  const bills = (g.__dibsMemory ??= new Map<string, Rec>());

  const rec = (code: string): Rec => {
    const r = bills.get(code);
    if (!r) throw new Error("Bill not found");
    return r;
  };
  const nextPos = (xs: { position: number }[]) => xs.reduce((m, x) => Math.max(m, x.position), -1) + 1;

  return {
    async createBill(input: NewBill) {
      let code = newCode();
      while (bills.has(code)) code = newCode();
      const createdAt = now();
      const bill: Bill = {
        id: randomUUID(),
        code,
        ref: newRef(),
        merchant: input.merchant,
        total: input.total,
        status: "draft",
        payerName: input.payerName,
        payerVpa: input.payerVpa,
        thumb: input.thumb,
        shortAtShare: 0,
        createdAt,
        sharedAt: null,
      };
      const hostToken = newToken();
      const hostPartToken = newToken();
      const host: Participant = { id: randomUUID(), name: input.hostName, isHost: true, createdAt };
      const data: BillData = {
        bill,
        items: input.items.map((i, position) => ({
          id: randomUUID(),
          name: i.name,
          qty: i.qty,
          price: i.price,
          position,
          flag: i.flag ?? null,
        })),
        charges: input.charges.map((c, position) => ({ id: randomUUID(), ...c, position })),
        participants: [host],
        claims: [],
        payments: [],
      };
      bills.set(code, {
        data,
        hostHash: hashToken(hostToken),
        partHash: new Map([[host.id, hashToken(hostPartToken)]]),
      });
      return { code, hostToken, host: { id: host.id, token: hostPartToken } };
    },

    async getBillData(code) {
      const r = bills.get(code);
      return r ? clone(r.data) : null;
    },

    async checkHost(code, token) {
      const r = bills.get(code);
      return !!r && tokenMatches(token, r.hostHash);
    },

    async checkParticipant(code, participantId, token) {
      const h = bills.get(code)?.partHash.get(participantId);
      return !!h && tokenMatches(token, h);
    },

    async patchBill(code, patch) {
      Object.assign(rec(code).data.bill, patch);
    },

    async saveItem(code, item) {
      const d = rec(code).data;
      const existing = item.id ? d.items.find((i) => i.id === item.id) : undefined;
      if (item.id && !existing) throw new Error("Item not found");
      if (existing) {
        existing.name = item.name;
        existing.qty = item.qty;
        existing.price = item.price;
        if (item.flag !== undefined) existing.flag = item.flag;
        return clone(existing);
      }
      const created: Item = {
        id: randomUUID(),
        name: item.name,
        qty: item.qty,
        price: item.price,
        position: nextPos(d.items),
        flag: item.flag ?? null,
      };
      d.items.push(created);
      return clone(created);
    },

    async removeItem(code, itemId) {
      const d = rec(code).data;
      d.items = d.items.filter((i) => i.id !== itemId);
      d.claims = d.claims.filter((c) => c.itemId !== itemId);
    },

    async saveCharge(code, charge) {
      const d = rec(code).data;
      const existing = charge.id ? d.charges.find((c) => c.id === charge.id) : undefined;
      if (charge.id && !existing) throw new Error("Charge not found");
      if (existing) {
        existing.label = charge.label;
        existing.kind = charge.kind;
        existing.amount = charge.amount;
        return clone(existing);
      }
      const created: Charge = {
        id: randomUUID(),
        label: charge.label,
        kind: charge.kind,
        amount: charge.amount,
        position: nextPos(d.charges),
      };
      d.charges.push(created);
      return clone(created);
    },

    async removeCharge(code, chargeId) {
      const d = rec(code).data;
      d.charges = d.charges.filter((c) => c.id !== chargeId);
    },

    async addParticipant(code, name) {
      const r = rec(code);
      const participant: Participant = { id: randomUUID(), name, isHost: false, createdAt: now() };
      const token = newToken();
      r.data.participants.push(participant);
      r.partHash.set(participant.id, hashToken(token));
      return { participant: clone(participant), token };
    },

    async rotateParticipantToken(code, participantId) {
      const r = rec(code);
      if (!r.data.participants.some((p) => p.id === participantId)) throw new Error("Participant not found");
      const token = newToken();
      r.partHash.set(participantId, hashToken(token));
      return token;
    },

    async setClaim(code, participantId, itemId, on) {
      const d = rec(code).data;
      if (!d.items.some((i) => i.id === itemId)) throw new Error("Item not found");
      if (!d.participants.some((p) => p.id === participantId)) throw new Error("Participant not found");
      const has = d.claims.some((c) => c.itemId === itemId && c.participantId === participantId);
      if (on && !has) d.claims.push({ itemId, participantId });
      if (!on) d.claims = d.claims.filter((c) => !(c.itemId === itemId && c.participantId === participantId));
    },

    async addPayment(code, p: NewPayment) {
      const d = rec(code).data;
      if (!d.participants.some((x) => x.id === p.participantId)) throw new Error("Participant not found");
      const status = p.status ?? "says";
      const payment: Payment = {
        id: randomUUID(),
        participantId: p.participantId,
        kind: p.kind,
        said: p.said,
        utr: p.utr ?? null,
        shot: p.shot ?? null,
        status,
        confirmed: status === "confirmed" ? (p.confirmed ?? p.said) : 0,
        waived: 0,
        createdAt: now(),
        decidedAt: status === "confirmed" ? now() : null,
      };
      d.payments.push(payment);
      return clone(payment);
    },

    async updatePayment(code, paymentId, patch: PaymentPatch) {
      const d = rec(code).data;
      const p = d.payments.find((x) => x.id === paymentId);
      if (!p) throw new Error("Payment not found");
      Object.assign(p, patch);
      return clone(p);
    },

    async removePayment(code, paymentId) {
      const d = rec(code).data;
      d.payments = d.payments.filter((p) => p.id !== paymentId);
    },

    async deleteBill(code) {
      bills.delete(code);
    },
  };
}

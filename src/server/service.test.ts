import { describe, expect, it } from "vitest";
import { memoryStore } from "./store/memory";
import type { Store } from "./store/types";
import * as svc from "./service";
import { STUB_BILL } from "@/lib/parseBill";
import { ROUND_OFF } from "@/lib/charges";
import type { ParsedBill } from "@/lib/bill";

const VPA = "aarav.k@okaxis";

async function draft(store: Store, parsed: ParsedBill = STUB_BILL) {
  const r = await svc.createDraft(store, { payerName: "Aarav Mehta", payerVpa: VPA }, parsed);
  if (!r.ok) throw new Error(r.error);
  return { code: r.code, host: { host: r.hostToken } as svc.Creds };
}
async function open(store: Store, parsed?: ParsedBill) {
  const b = await draft(store, parsed);
  const p = await svc.publish(store, b.code, b.host);
  if (!p.ok) throw new Error(p.error);
  return b;
}
async function guest(store: Store, code: string, name: string): Promise<svc.Creds> {
  const j = await svc.join(store, code, name);
  if (!j.ok) throw new Error(JSON.stringify(j));
  return { participant: `${j.participantId}.${j.token}` };
}
/** Claim every item for someone so the bill is final. Host takes the last item, friends split the rest. */
async function claimAll(store: Store, code: string, host: svc.Creds, friends: svc.Creds[]) {
  const d = (await store.getBillData(code))!;
  for (const [i, it] of d.items.entries()) {
    const who = i === d.items.length - 1 ? host : friends[i % friends.length];
    const r = await svc.claim(store, code, who, it.id, true);
    if (!r.ok) throw new Error(r.error);
  }
}
const data = async (s: Store, code: string) => (await s.getBillData(code))!;

describe("createDraft", () => {
  it("turns a scan into items, labelled charges and flags", async () => {
    const s = memoryStore();
    const { code } = await draft(s);
    const d = await data(s, code);
    expect(d.bill).toMatchObject({ merchant: "The Local Diners", total: 328000, status: "draft", payerName: "Aarav Mehta" });
    expect(d.items).toHaveLength(8);
    expect(d.items.find((i) => i.name === "Surf N Turf")!.flag).toEqual({ read: "₹360.00", why: "the price is smudged" });
    expect(d.items.filter((i) => i.flag)).toHaveLength(1);
    expect(d.charges.map((c) => [c.label, c.kind, c.amount])).toEqual([
      ["VAT 5.5%", "tax", 5555],
      ["VAT 14.5%", "tax", 22765],
      ["Service tax 5.6%", "tax", 15893],
      ["Service charge", "service", 25800],
    ]);
    expect(d.participants).toEqual([expect.objectContaining({ name: "Aarav", isHost: true })]);
  });
  it("validates the host's name and UPI ID", async () => {
    const s = memoryStore();
    expect(await svc.createDraft(s, { payerName: "  ", payerVpa: VPA }, STUB_BILL)).toMatchObject({ ok: false, error: "Enter your name" });
    expect(await svc.createDraft(s, { payerName: "A", payerVpa: "nope" }, STUB_BILL)).toMatchObject({ ok: false, code: "bad_input" });
  });
  it("keeps a small image thumbnail and drops anything else", async () => {
    const s = memoryStore();
    const ok = await svc.createDraft(s, { payerName: "A", payerVpa: VPA, thumb: "data:image/jpeg;base64,AAAA" }, STUB_BILL);
    const bad = await svc.createDraft(s, { payerName: "A", payerVpa: VPA, thumb: "javascript:alert(1)" }, STUB_BILL);
    if (!ok.ok || !bad.ok) throw new Error("create failed");
    expect((await data(s, ok.code)).bill.thumb).toBe("data:image/jpeg;base64,AAAA");
    expect((await data(s, bad.code)).bill.thumb).toBeNull();
  });
});

describe("host edits", () => {
  it("only the host can edit; edits clear the flag; numbers are validated", async () => {
    const s = memoryStore();
    const { code, host } = await draft(s);
    const d0 = await data(s, code);
    const surf = d0.items.find((i) => i.name === "Surf N Turf")!;
    expect(await svc.saveItem(s, code, {}, { id: surf.id, name: "x", qty: 1, price: "1" })).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.saveItem(s, code, host, { id: surf.id, name: " ", qty: 1, price: "360" })).toMatchObject({ ok: false, error: "Give the item a name" });
    expect(await svc.saveItem(s, code, host, { id: surf.id, name: "Surf", qty: 1, price: "37.5O" })).toMatchObject({ ok: false, error: "Use numbers, like 295.00" });
    expect(await svc.saveItem(s, code, host, { id: surf.id, name: "Surf", qty: 0, price: "10" })).toMatchObject({ ok: false, code: "bad_input" });
    expect(await svc.saveItem(s, code, host, { id: surf.id, name: " Surf  N Turf ", qty: 1, price: "1,360.50" })).toMatchObject({ ok: true });
    const it = (await data(s, code)).items.find((i) => i.id === surf.id)!;
    expect(it).toMatchObject({ name: "Surf N Turf", price: 136050, flag: null });
    expect(await svc.saveItem(s, code, host, { name: "Cold Coffee", qty: 1, price: "150" })).toMatchObject({ ok: true });
    expect((await data(s, code)).items).toHaveLength(9);
  });
  it("charges: kinds, names, amounts; Round-off is reserved", async () => {
    const s = memoryStore();
    const { code, host } = await draft(s);
    expect(await svc.saveCharge(s, code, host, { kind: "tax", label: "S.Tax", amount: "51.75" })).toMatchObject({ ok: true });
    expect(await svc.saveCharge(s, code, host, { kind: "wat", label: "x", amount: "1" })).toMatchObject({ ok: false });
    expect(await svc.saveCharge(s, code, host, { kind: "tax", label: "", amount: "1" })).toMatchObject({ ok: false });
    expect(await svc.saveCharge(s, code, host, { kind: "discount", label: ROUND_OFF, amount: "1" })).toMatchObject({ ok: false });
    expect(await svc.saveCharge(s, code, host, { kind: "tax", label: "x", amount: "-5" })).toMatchObject({ ok: false });
    const d = await data(s, code);
    expect(d.charges.at(-1)).toMatchObject({ label: "S.Tax", kind: "tax", amount: 5175 });
    expect(await svc.removeCharge(s, code, host, d.charges.at(-1)!.id)).toMatchObject({ ok: true });
    expect((await data(s, code)).charges).toHaveLength(4);
  });
});

describe("publish", () => {
  it("adds the 13 paise round-off the fixture expects, and is idempotent", async () => {
    const s = memoryStore();
    const { code, host } = await draft(s);
    expect(await svc.publish(s, code, host)).toEqual({ ok: true, short: 0 });
    const d = await data(s, code);
    expect(d.bill.status).toBe("open");
    expect(d.bill.sharedAt).not.toBeNull();
    expect(d.charges.filter((c) => c.label === ROUND_OFF)).toEqual([expect.objectContaining({ kind: "discount", amount: 13 })]);
    expect(await svc.publish(s, code, host)).toEqual({ ok: true, short: 0 });
    expect((await data(s, code)).charges.filter((c) => c.label === ROUND_OFF)).toHaveLength(1);
  });
  it("refuses a bill that is off by more than Rs 1, unless shared anyway", async () => {
    const s = memoryStore();
    const short: ParsedBill = { ...STUB_BILL, taxes: STUB_BILL.taxes.slice(0, 2), serviceCharge: 0, total: 3280 };
    const { code, host } = await draft(s, short);
    const r = await svc.publish(s, code, host);
    expect(r).toMatchObject({ ok: false, code: "not_balanced" });
    expect(await svc.join(s, code, "Neha")).toMatchObject({ ok: false, code: "not_found" }); // still a draft
    const any = await svc.publish(s, code, host, { anyway: true });
    expect(any.ok && any.short).toBeLessThan(-100);
    const d = await data(s, code);
    expect(d.bill.status).toBe("open");
    expect(d.bill.shortAtShare).toBe(any.ok ? any.short : 0);
    expect(d.charges.some((c) => c.label === ROUND_OFF)).toBe(false);
  });
  it("only the host can publish", async () => {
    const s = memoryStore();
    const { code } = await draft(s);
    expect(await svc.publish(s, code, { host: "wrong" })).toMatchObject({ ok: false, code: "forbidden" });
    expect((await data(s, code)).bill.status).toBe("draft");
  });
});

describe("views", () => {
  it("a draft is invisible to everyone but the host", async () => {
    const s = memoryStore();
    const { code, host } = await draft(s);
    const d = await data(s, code);
    expect(svc.buildView(d, { role: "anon", participantId: null })).toBeNull();
    expect(svc.buildView(d, { role: "guest", participantId: "x" })).toBeNull();
    const v = svc.buildView(d, await svc.resolveViewer(s, d, host))!;
    expect(v.me).toMatchObject({ isHost: true });
    expect(v.check).toMatchObject({ ok: true, diff: 13 });
  });
  it("an open bill shows a stranger only the summary: no UPI ID, no claims, no shares", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const mukul = await guest(s, code, "Mukul");
    const d0 = await data(s, code);
    await svc.claim(s, code, mukul, d0.items[0].id, true);
    const d = await data(s, code);
    const anon = svc.buildView(d, await svc.resolveViewer(s, d, {}))!;
    expect(anon).toMatchObject({ payerVpa: null, me: null, claims: [], shares: {}, check: null, ledger: null, myPay: null, hostName: "Aarav", hostFullName: "Aarav Mehta" });
    expect(anon.participants.map((p) => p.name)).toEqual(["Aarav", "Mukul"]);
    const g = svc.buildView(d, await svc.resolveViewer(s, d, mukul))!;
    expect(g).toMatchObject({ payerVpa: VPA, me: { name: "Mukul", isHost: false }, check: null, ledger: null });
    expect(g.myPay!.note).toBe(`Dibs ${d.bill.ref} Mukul`);
    expect(g.claims).toHaveLength(1);
    const h = svc.buildView(d, await svc.resolveViewer(s, d, host))!;
    expect(h.ledger!.rows.map((r) => r.name)).toEqual(["Mukul"]);
  });
  it("a friend never sees other people's payments", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const [a, b] = [await guest(s, code, "Diya"), await guest(s, code, "Kabir")];
    await claimAll(s, code, host, [a, b]);
    await svc.markPaid(s, code, a);
    const d = await data(s, code);
    const vb = svc.buildView(d, await svc.resolveViewer(s, d, b))!;
    expect(vb.myPay!.payments).toEqual([]);
    expect(JSON.stringify(vb)).not.toContain(d.payments[0].id);
  });
  it("payment note is short and clean", () => {
    expect(svc.paymentNote("7K2", "Mukul")).toBe("Dibs 7K2 Mukul");
    expect(svc.paymentNote("7K2", "Zoë <script> O'Neil the third")).toBe("Dibs 7K2 Zo script ONeil");
  });
});

describe("joining", () => {
  it("joins with a name, rejects empty and the host's name, asks 'is that you?' and allows a takeover", async () => {
    const s = memoryStore();
    const { code } = await open(s);
    expect(await svc.join(s, code, "  ")).toMatchObject({ ok: false, code: "empty" });
    expect(await svc.join(s, code, "aarav")).toMatchObject({ ok: false, code: "host", hostName: "Aarav" });
    expect(await svc.join(s, code, "aarav mehta", { takeover: true })).toMatchObject({ ok: false, code: "host" }); // takeover never works on the host
    const first = await svc.join(s, code, "Mukul");
    expect(first).toMatchObject({ ok: true, name: "Mukul", back: false });
    expect(await svc.join(s, code, "  mukul")).toMatchObject({ ok: false, code: "taken", takenName: "Mukul" });
    const again = await svc.join(s, code, "MUKUL", { takeover: true });
    expect(again).toMatchObject({ ok: true, name: "Mukul", back: true });
    if (!first.ok || !again.ok) throw new Error();
    expect(again.participantId).toBe(first.participantId);
    expect(again.token).not.toBe(first.token);
    expect(await s.checkParticipant(code, first.participantId, first.token)).toBe(false);
    expect((await data(s, code)).participants).toHaveLength(2);
  });
  it("takeover with a new name just joins", async () => {
    const s = memoryStore();
    const { code } = await open(s);
    expect(await svc.join(s, code, "Neha", { takeover: true })).toMatchObject({ ok: true, back: false });
  });
  it("a missing bill is not found", async () => {
    expect(await svc.join(memoryStore(), "nope123", "Neha")).toMatchObject({ ok: false, code: "not_found" });
  });
});

describe("claiming", () => {
  it("needs someone who has joined, and is idempotent", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const diya = await guest(s, code, "Diya");
    const d = await data(s, code);
    expect(await svc.claim(s, code, {}, d.items[0].id, true)).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.claim(s, code, { participant: "x.y" }, d.items[0].id, true)).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.claim(s, code, diya, d.items[0].id, true)).toMatchObject({ ok: true });
    expect(await svc.claim(s, code, diya, d.items[0].id, true)).toMatchObject({ ok: true });
    expect(await svc.claim(s, code, host, d.items[0].id, true)).toMatchObject({ ok: true });
    expect((await data(s, code)).claims).toHaveLength(2);
    expect(await svc.claim(s, code, diya, "00000000-0000-0000-0000-000000000000", true)).toMatchObject({ ok: false, code: "not_found" });
  });
});

describe("locking and leftovers", () => {
  it("host can take or split leftovers; friends cannot", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const diya = await guest(s, code, "Diya");
    const d = await data(s, code);
    await svc.claim(s, code, diya, d.items[0].id, true);
    expect(await svc.claimLeftovers(s, code, diya, "take")).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.claimLeftovers(s, code, host, "take")).toEqual({ ok: true, count: 7 });
    const d2 = await data(s, code);
    expect(d2.claims.filter((c) => c.participantId === d2.participants[0].id)).toHaveLength(7);
    expect(svc.buildView(d2, { role: "host", participantId: d2.participants[0].id })!.allClaimed).toBe(true);
  });
  it("split gives every item with no claimant to everyone who is here", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    await guest(s, code, "Diya");
    await guest(s, code, "Kabir");
    expect(await svc.claimLeftovers(s, code, host, "split")).toMatchObject({ ok: true, count: 8 });
    const d = await data(s, code);
    expect(d.claims).toHaveLength(8 * 3);
  });
  it("locking needs everything claimed, stops claims for everyone, and can be undone before anyone pays", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const diya = await guest(s, code, "Diya");
    expect(await svc.setClaimsLocked(s, code, host, true)).toMatchObject({ ok: false, code: "not_final" });
    await svc.claimLeftovers(s, code, host, "take");
    expect(await svc.setClaimsLocked(s, code, diya, true)).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.setClaimsLocked(s, code, host, true)).toMatchObject({ ok: true });
    const d = await data(s, code);
    expect(d.bill.claimsLocked).toBe(true);
    expect(await svc.claim(s, code, diya, d.items[0].id, true)).toMatchObject({ ok: false, code: "locked" });
    expect(await svc.claimLeftovers(s, code, host, "take")).toMatchObject({ ok: false, code: "locked" });
    expect(await svc.setClaimsLocked(s, code, host, false)).toMatchObject({ ok: true });
    expect(await svc.claim(s, code, diya, d.items[0].id, true)).toMatchObject({ ok: true });
  });
  it("cannot unlock once someone has said they paid", async () => {
    const s = memoryStore();
    const { code, host } = await open(s);
    const diya = await guest(s, code, "Diya");
    await svc.claimLeftovers(s, code, host, "split");
    await svc.setClaimsLocked(s, code, host, true);
    await svc.markPaid(s, code, diya);
    expect(await svc.setClaimsLocked(s, code, host, false)).toMatchObject({ ok: false, code: "locked" });
  });
});

describe("paying and confirming", () => {
  async function table() {
    const s = memoryStore();
    const { code, host } = await open(s);
    const [diya, kabir, mukul] = [await guest(s, code, "Diya"), await guest(s, code, "Kabir"), await guest(s, code, "Mukul")];
    return { s, code, host, diya, kabir, mukul, ids: async () => Object.fromEntries((await data(s, code)).participants.map((p) => [p.name, p.id])) as Record<string, string> };
  }
  it("nobody can pay until everything is claimed", async () => {
    const t = await table();
    expect(await svc.markPaid(t.s, t.code, t.diya)).toMatchObject({ ok: false, code: "not_final" });
  });
  it("says paid for exactly what is owed; a second tap is refused; the host cannot pay himself", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    const d = await data(t.s, t.code);
    const owed = svc.buildView(d, await svc.resolveViewer(t.s, d, t.diya))!.myPay!.owed;
    const r = await svc.markPaid(t.s, t.code, t.diya, { utr: "4081 2937 5518" });
    expect(r).toMatchObject({ ok: true, said: owed });
    expect((await data(t.s, t.code)).payments[0]).toMatchObject({ status: "says", said: owed, utr: "408129375518", kind: "upi" });
    expect(await svc.markPaid(t.s, t.code, t.diya)).toMatchObject({ ok: false, code: "already_paid" });
    expect(await svc.markPaid(t.s, t.code, t.host)).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.markPaid(t.s, t.code, t.kabir, { utr: "123" })).toMatchObject({ ok: false, error: "A UTR has 12 digits" });
  });
  it("a short screenshot records what it showed, and the missing part can be paid after", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    const d = await data(t.s, t.code);
    const owed = svc.buildView(d, await svc.resolveViewer(t.s, d, t.diya))!.myPay!.owed;
    const shot = { amount: 10009, payee: "Aarav", status: "success" as const, paidAt: null, utr: "408129375518" };
    expect(await svc.markPaid(t.s, t.code, t.diya, { shot })).toMatchObject({ ok: true, said: 10009 });
    const d1 = await data(t.s, t.code);
    const v1 = svc.buildView(d1, await svc.resolveViewer(t.s, d1, t.diya))!.myPay!;
    expect(v1.pay).toMatchObject({ state: "says", short: true, remaining: owed - 10009 });
    expect(await svc.markPaid(t.s, t.code, t.diya, { amount: owed })).toMatchObject({ ok: false, code: "bad_input" });
    expect(await svc.markPaid(t.s, t.code, t.diya, { amount: owed - 10009 })).toMatchObject({ ok: true });
  });
  it("undo removes only the friend's own unconfirmed notices", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    await svc.markPaid(t.s, t.code, t.diya);
    await svc.markPaid(t.s, t.code, t.kabir);
    await svc.undoPaid(t.s, t.code, t.diya);
    const d = await data(t.s, t.code);
    expect(d.payments).toHaveLength(1);
    expect(d.payments[0].participantId).toBe((await t.ids()).Kabir);
  });
  it("claims lock once someone has told the host they paid", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    const d = await data(t.s, t.code);
    await svc.markPaid(t.s, t.code, t.diya);
    expect(await svc.claim(t.s, t.code, t.diya, d.items[0].id, true)).toMatchObject({ ok: false, code: "locked" });
    expect(await svc.saveItem(t.s, t.code, t.host, { id: d.items[0].id, name: "x", qty: 1, price: "1" })).toMatchObject({ ok: false, code: "locked" });
    expect(await svc.removeItem(t.s, t.code, t.host, d.items[0].id)).toMatchObject({ ok: false, code: "locked" });
  });
  it("host decisions: confirm, not received, undo, confirm anyway, cash; settles only when all confirmed", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    const ids = await t.ids();
    for (const c of [t.diya, t.kabir, t.mukul]) await svc.markPaid(t.s, t.code, c);
    let d = await data(t.s, t.code);
    const pay = (name: string) => d.payments.find((p) => p.participantId === ids[name])!;
    expect(await svc.decide(t.s, t.code, t.diya, pay("Diya").id, { action: "confirm" })).toMatchObject({ ok: false, code: "forbidden" }); // a friend cannot confirm
    expect(await svc.decide(t.s, t.code, t.host, pay("Diya").id, { action: "confirm" })).toMatchObject({ ok: true });
    expect(await svc.decide(t.s, t.code, t.host, pay("Kabir").id, { action: "reject" })).toMatchObject({ ok: true });
    d = await data(t.s, t.code);
    let l = svc.buildView(d, { role: "host", participantId: d.participants[0].id })!.ledger!;
    expect(l.counts).toEqual({ unpaid: 1, says: 1, confirmed: 1, none: 0 });
    expect(l.rows.find((r) => r.name === "Kabir")!.pay.rejected).toBe(true);
    expect(await svc.decide(t.s, t.code, t.host, pay("Kabir").id, { action: "undo" })).toMatchObject({ ok: true });
    // Mukul only sent part of it: the host accepts the shortfall
    await svc.undoPaid(t.s, t.code, t.mukul);
    const shot = { amount: 90000, payee: null, status: "success" as const, paidAt: null, utr: null };
    await svc.markPaid(t.s, t.code, t.mukul, { shot });
    d = await data(t.s, t.code);
    const mp = pay("Mukul");
    expect(await svc.decide(t.s, t.code, t.host, mp.id, { action: "confirm_anyway" })).toMatchObject({ ok: true });
    d = await data(t.s, t.code);
    expect(pay("Mukul")).toMatchObject({ status: "confirmed", confirmed: 90000 });
    expect(pay("Mukul").waived).toBeGreaterThan(0);
    expect(svc.buildView(d, { role: "host", participantId: d.participants[0].id })!.settled).toBe(false); // Kabir has only "says"
    expect(await svc.decide(t.s, t.code, t.host, pay("Kabir").id, { action: "confirm" })).toMatchObject({ ok: true });
    d = await data(t.s, t.code);
    expect(svc.buildView(d, { role: "host", participantId: d.participants[0].id })!.settled).toBe(true);
    expect(await svc.join(t.s, t.code, "Late Larry")).toMatchObject({ ok: false, code: "closed" });
    // undo a confirmation reopens it
    await svc.decide(t.s, t.code, t.host, pay("Kabir").id, { action: "undo" });
    d = await data(t.s, t.code);
    expect(svc.buildView(d, { role: "host", participantId: d.participants[0].id })!.settled).toBe(false);
  });
  it("cash is confirmed on the spot and defaults to what is left", async () => {
    const t = await table();
    await claimAll(t.s, t.code, t.host, [t.diya, t.kabir, t.mukul]);
    const ids = await t.ids();
    expect(await svc.recordCash(t.s, t.code, t.diya, ids.Diya)).toMatchObject({ ok: false, code: "forbidden" });
    expect(await svc.recordCash(t.s, t.code, t.host, ids.Aarav)).toMatchObject({ ok: false, code: "not_found" });
    expect(await svc.recordCash(t.s, t.code, t.host, ids.Diya)).toMatchObject({ ok: true });
    const d = await data(t.s, t.code);
    const v = svc.buildView(d, { role: "host", participantId: d.participants[0].id })!;
    expect(v.ledger!.rows.find((r) => r.name === "Diya")!.pay.state).toBe("confirmed");
    expect(d.payments[0]).toMatchObject({ kind: "cash", status: "confirmed" });
    expect(await svc.recordCash(t.s, t.code, t.host, ids.Diya)).toMatchObject({ ok: false, code: "already_paid" });
  });
});

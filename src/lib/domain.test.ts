import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { BillData, Payment } from "./model";
import { checkJoinName, cleanName, firstName } from "./names";
import { checkBill, findDuplicate, ROUND_OFF, roundOffOf, withRoundOff } from "./charges";
import { payView } from "./payments";
import { ledgerOf, sharesOf } from "./view";
import { STUB_BILL } from "./parseBill";
import { toPaise } from "./money";

const ex = JSON.parse(readFileSync("docs/spec/examples/local-diners.json", "utf8"));

/** The fixture as stored data: people A (host), D, K, M with letter ids, items with fixture ids. */
function fixtureData(scenario: string, status: "draft" | "open" = "open"): BillData {
  const claims = Object.entries<string[]>(ex.scenarios[scenario].claims).flatMap(([itemId, who]) => who.map((participantId) => ({ itemId, participantId })));
  return {
    bill: { id: "b", code: "c", ref: "7K2", merchant: ex.bill.merchant, total: ex.bill.printedTotal, status, payerName: "Aarav Mehta", payerVpa: "aarav.k@okaxis", thumb: null, shortAtShare: 0, createdAt: "", sharedAt: null },
    items: ex.items.map((i: { id: string; name: string; qty: number; price: number }, position: number) => ({ ...i, position, flag: null })),
    charges: [
      { id: "t", label: "Tax", kind: "tax", amount: ex.charges.tax, position: 0 },
      { id: "s", label: "Service", kind: "service", amount: ex.charges.service, position: 1 },
      { id: "d", label: ROUND_OFF, kind: "discount", amount: ex.charges.discount, position: 2 },
    ],
    participants: [
      { id: "A", name: "Aarav", isHost: true, createdAt: "1" },
      { id: "D", name: "Diya", isHost: false, createdAt: "2" },
      { id: "K", name: "Kabir", isHost: false, createdAt: "3" },
      { id: "M", name: "Mukul", isHost: false, createdAt: "4" },
    ],
    claims,
    payments: [],
  };
}
const pay = (participantId: string, o: Partial<Payment>): Payment => ({
  id: Math.random().toString(36).slice(2),
  participantId,
  kind: "upi",
  said: 0,
  utr: null,
  shot: null,
  status: "says",
  confirmed: 0,
  waived: 0,
  createdAt: new Date(Date.now() + Math.random() * 1000).toISOString(),
  decidedAt: null,
  ...o,
});

describe("names", () => {
  it("cleans and compares names", () => {
    expect(cleanName("  Neha   Rao ")).toBe("Neha Rao");
    expect(firstName("Aarav  Mehta")).toBe("Aarav");
  });
  const host = { name: "Aarav", fullName: "Aarav Mehta" };
  const others = [{ id: "m", name: "Mukul" }, { id: "d", name: "Diya" }];
  it("accepts a new name, trimmed and capped at 24", () => {
    expect(checkJoinName("  Neha ", host, others)).toEqual({ ok: true, name: "Neha" });
    expect(checkJoinName("x".repeat(40), host, others)).toEqual({ ok: true, name: "x".repeat(24) });
  });
  it("rejects empty, whitespace-only", () => {
    expect(checkJoinName("", host, others)).toEqual({ ok: false, reason: "empty" });
    expect(checkJoinName("   ", host, others)).toEqual({ ok: false, reason: "empty" });
  });
  it("blocks the host's first and full name in any case or spacing", () => {
    expect(checkJoinName("aarav", host, others)).toMatchObject({ ok: false, reason: "host" });
    expect(checkJoinName(" AARAV   mehta ", host, others)).toMatchObject({ ok: false, reason: "host" });
  });
  it("asks 'is that you?' for a name already in, ignoring case and spaces", () => {
    expect(checkJoinName("  mukul ", host, others)).toEqual({ ok: false, reason: "taken", takenName: "Mukul", participantId: "m" });
    expect(checkJoinName("DIYA", host, others)).toMatchObject({ reason: "taken", participantId: "d" });
  });
});

describe("check and round-off", () => {
  const items = STUB_BILL.items.map((i) => ({ price: toPaise(i.price) }));
  const taxes = STUB_BILL.taxes.map((t) => ({ label: t.label, kind: "tax" as const, amount: toPaise(t.amount) }));
  const charges = [...taxes, { label: "Service charge", kind: "service" as const, amount: toPaise(STUB_BILL.serviceCharge) }];
  it("stub bill is Rs 0.13 over, within tolerance", () => {
    expect(checkBill(items, charges, 328000)).toMatchObject({ ok: true, diff: 13, actual: 328013 });
  });
  it("round-off equals the fixture's discount of 13 paise and is idempotent", () => {
    const a = withRoundOff(items, charges, 328000);
    expect(a.at(-1)).toEqual({ label: ROUND_OFF, kind: "discount", amount: ex.charges.discount });
    expect(withRoundOff(items, a, 328000)).toEqual(a);
    expect(roundOffOf(a)).toBe(-13);
    expect(checkBill(items, a, 328000)).toMatchObject({ ok: true, diff: 13 }); // old round-off ignored in the check
  });
  it("a short bill gets a negative discount; exact needs none; too far is left alone", () => {
    const short = withRoundOff([{ price: 100000 }], [], 100047);
    expect(short).toEqual([{ label: ROUND_OFF, kind: "discount", amount: -47 }]);
    expect(withRoundOff([{ price: 100000 }], [], 100000)).toEqual([]);
    expect(withRoundOff([{ price: 100000 }], [], 105222)).toEqual([]);
    expect(checkBill([{ price: 100000 }], [], 105222)).toMatchObject({ ok: false, diff: -5222 });
  });
  it("finds a duplicated row", () => {
    const rows = [
      { id: "1", name: "Crunchy Salad", price: 16000 },
      { id: "2", name: "Surf", price: 36000 },
      { id: "3", name: " crunchy salad ", price: 16000 },
    ];
    expect(findDuplicate(rows)?.id).toBe("3");
    expect(findDuplicate(rows.slice(0, 2))).toBeNull();
  });
});

describe("shares match the shared fixture", () => {
  for (const name of ["final", "midBill", "midBillDiyaTakesSurf"]) {
    it(name, () => {
      const r = sharesOf(fixtureData(name));
      expect(r.shares).toEqual(ex.scenarios[name].shares);
      expect(r.unclaimed.map((i) => i.id)).toEqual(ex.scenarios[name].unclaimed.map((i: { id: string }) => i.id));
      expect(r.allClaimed).toBe(name === "final");
    });
  }
});

describe("payView", () => {
  it("none / unpaid / says / short / confirmed", () => {
    expect(payView(0, []).state).toBe("none");
    expect(payView(100009, []).state).toBe("unpaid");
    expect(payView(100009, [pay("M", { said: 100009 })])).toMatchObject({ state: "says", short: false, remaining: 0, says: 100009 });
    expect(payView(100009, [pay("M", { said: 10009 })])).toMatchObject({ state: "says", short: true, remaining: 90000 });
    expect(payView(100009, [pay("M", { said: 100009, status: "confirmed", confirmed: 100009 })])).toMatchObject({ state: "confirmed", remaining: 0 });
  });
  it("a missing amount can be paid later and adds up", () => {
    const a = pay("M", { said: 10009, status: "confirmed", confirmed: 10009 });
    const b = pay("M", { said: 90000 });
    expect(payView(100009, [a, b])).toMatchObject({ state: "says", short: false, confirmed: 10009, says: 90000, remaining: 0 });
    expect(payView(100009, [a, { ...b, status: "confirmed", confirmed: 90000 }]).state).toBe("confirmed");
  });
  it("confirm anyway accepts a shortfall", () => {
    const p = pay("M", { said: 90000, status: "confirmed", confirmed: 90000, waived: 10009 });
    expect(payView(100009, [p])).toMatchObject({ state: "confirmed", confirmed: 90000, waived: 10009 });
  });
  it("not received puts them back to unpaid and remembers it", () => {
    expect(payView(100009, [pay("M", { said: 100009, status: "rejected" })])).toMatchObject({ state: "unpaid", rejected: true, remaining: 100009 });
  });
});

describe("ledger and settled", () => {
  const owed = (id: string) => ex.scenarios.final.shares[id].total as number;
  it("is not settled until everyone who owes is confirmed and everything is claimed", () => {
    const d = fixtureData("final");
    expect(ledgerOf(d).settled).toBe(false);
    expect(ledgerOf(d).counts).toEqual({ unpaid: 3, says: 0, confirmed: 0, none: 0 });
    d.payments = ["D", "K", "M"].map((id) => pay(id, { said: owed(id), status: "confirmed", confirmed: owed(id) }));
    const l = ledgerOf(d);
    expect(l.settled).toBe(true);
    expect(l.received).toBe(owed("D") + owed("K") + owed("M"));
    expect(l.owedTotal).toBe(l.received);
    d.payments[2].status = "says"; // one is only "says paid"
    expect(ledgerOf(d).settled).toBe(false);
    expect(ledgerOf(d).counts.says).toBe(1);
  });
  it("host share is host's and nobody else owes it", () => {
    const l = ledgerOf(fixtureData("final"));
    expect(l.host.share.total).toBe(ex.scenarios.final.shares.A.total);
    expect(l.rows.map((r) => r.participant.id)).toEqual(["D", "K", "M"]);
  });
  it("a friend who claimed nothing never blocks settling", () => {
    const d = fixtureData("final");
    d.participants.push({ id: "Z", name: "Zed", isHost: false, createdAt: "5" });
    d.payments = ["D", "K", "M"].map((id) => pay(id, { said: owed(id), status: "confirmed", confirmed: owed(id) }));
    const l = ledgerOf(d);
    expect(l.counts.none).toBe(1);
    expect(l.settled).toBe(true);
  });
  it("an unclaimed item or a draft bill is never settled", () => {
    const mid = fixtureData("midBill");
    mid.payments = ["D", "K", "M"].map((id) => pay(id, { said: 1, status: "confirmed", confirmed: 10 ** 7 }));
    expect(ledgerOf(mid).settled).toBe(false);
    const draft = fixtureData("final", "draft");
    draft.payments = ["D", "K", "M"].map((id) => pay(id, { said: owed(id), status: "confirmed", confirmed: owed(id) }));
    expect(ledgerOf(draft).settled).toBe(false);
  });
});

import { judgeShot } from "./readPayment";
import { pickProvider } from "./vision";

describe("payment screenshot judgement", () => {
  const exp = { amount: 100009, vpa: "aarav.k@okaxis", hostName: "Aarav Mehta" };
  const shot = (o = {}) => ({ amount: 100009, payee: "AARAV MEHTA", status: "success" as const, paidAt: "8:57 pm", utr: "408129375518", ...o });
  it("everything agrees", () => {
    expect(judgeShot(shot(), exp)).toMatchObject({ amount: "match", payee: "match", status: "success", utr: "read", ok: true });
  });
  it("matches the payee by UPI ID too", () => {
    expect(judgeShot(shot({ payee: "aarav.k@okaxis" }), exp).payee).toBe("match");
  });
  it("short and over say by how much and are not ok", () => {
    expect(judgeShot(shot({ amount: 10009 }), exp)).toMatchObject({ amount: "short", diff: -90000, ok: false });
    expect(judgeShot(shot({ amount: 100100 }), exp)).toMatchObject({ amount: "over", diff: 91, ok: false });
  });
  it("a different payee, a failed payment or a different UTR is not ok", () => {
    expect(judgeShot(shot({ payee: "Ravi Kumar" }), exp)).toMatchObject({ payee: "differs", ok: false });
    expect(judgeShot(shot({ status: "failed" }), exp).ok).toBe(false);
    expect(judgeShot(shot(), exp, "111111111111")).toMatchObject({ utr: "differs", ok: false });
    expect(judgeShot(shot(), exp, "4081 2937 5518")).toMatchObject({ utr: "match", ok: true });
  });
  it("unreadable parts are reported, not guessed", () => {
    expect(judgeShot(shot({ amount: null, payee: null, utr: null }), exp)).toMatchObject({ amount: "unreadable", payee: "unreadable", utr: "none", ok: false });
  });
});

describe("vision provider choice", () => {
  it("explicit choice wins, else the first key present", () => {
    expect(pickProvider({ BILL_PARSER: "stub" })).toBe("stub");
    expect(pickProvider({ ANTHROPIC_API_KEY: "k", GEMINI_API_KEY: "g" })).toBe("claude");
    expect(pickProvider({ OPENAI_API_KEY: "k", GEMINI_API_KEY: "g" })).toBe("openai");
    expect(pickProvider({ GEMINI_API_KEY: "g" })).toBe("gemini");
    expect(pickProvider({ BILL_PARSER: "gemini", ANTHROPIC_API_KEY: "k" })).toBe("gemini");
    expect(() => pickProvider({})).toThrow(/No vision provider/);
  });
});

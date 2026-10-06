import { afterAll, describe, expect, it } from "vitest";
import { memoryStore } from "./memory";
import type { NewBill, Store } from "./types";

/**
 * The same behaviour is required of every Store. The in-memory one always runs.
 * To run the Postgres one against a real database (after running supabase/schema.sql on it):
 *   DIBS_TEST_DATABASE_URL=postgres://... npm test
 * It creates its own bills and deletes them again.
 */
const stores: [string, () => Promise<Store>][] = [["memory", async () => memoryStore()]];
if (process.env.DIBS_TEST_DATABASE_URL) {
  stores.push([
    "postgres",
    async () => {
      const { Pool } = await import("pg");
      const { postgresStore } = await import("./postgres");
      return postgresStore(new Pool({ connectionString: process.env.DIBS_TEST_DATABASE_URL, max: 4 }));
    },
  ]);
}

const sample = (over: Partial<NewBill> = {}): NewBill => ({
  merchant: "The Local Diners",
  total: 328000,
  payerName: "Aarav Mehta",
  payerVpa: "aarav.k@okaxis",
  hostName: "Aarav",
  thumb: null,
  items: [
    { name: "Flavoured Mojito", qty: 1, price: 33000 },
    { name: "Long Island Elec", qty: 2, price: 68000, flag: { read: "×2", why: "The digit is blurry" } },
    { name: "Surf N Turf", qty: 1, price: 36000 },
  ],
  charges: [
    { label: "VAT 5.5%", kind: "tax", amount: 5555 },
    { label: "Service charge 10%", kind: "service", amount: 25800 },
  ],
  ...over,
});

describe.each(stores)("Store contract: %s", (_name, make) => {
  const created: string[] = [];
  let s: Store;
  const mk = async (over?: Partial<NewBill>) => {
    s ??= await make();
    const r = await s.createBill(sample(over));
    created.push(r.code);
    return r;
  };
  afterAll(async () => {
    for (const c of created) await s?.deleteBill(c).catch(() => {});
  });

  it("creates a draft bill with items, charges and the host as a participant", async () => {
    const r = await mk({ thumb: "data:image/jpeg;base64,AAAA" });
    expect(r.code).toMatch(/^[A-Za-z0-9_-]{7}$/);
    const d = (await s.getBillData(r.code))!;
    expect(d.bill).toMatchObject({
      code: r.code,
      merchant: "The Local Diners",
      total: 328000,
      status: "draft",
      payerName: "Aarav Mehta",
      payerVpa: "aarav.k@okaxis",
      thumb: "data:image/jpeg;base64,AAAA",
      shortAtShare: 0,
      sharedAt: null,
    });
    expect(d.bill.ref).toMatch(/^[2-9A-HJKMNP-Z]{3}$/);
    expect(d.items.map((i) => i.name)).toEqual(["Flavoured Mojito", "Long Island Elec", "Surf N Turf"]);
    expect(d.items[1]).toMatchObject({ qty: 2, price: 68000, flag: { read: "×2", why: "The digit is blurry" } });
    expect(d.items[0].flag).toBeNull();
    expect(d.charges.map((c) => [c.label, c.kind, c.amount])).toEqual([
      ["VAT 5.5%", "tax", 5555],
      ["Service charge 10%", "service", 25800],
    ]);
    expect(d.participants).toHaveLength(1);
    expect(d.participants[0]).toMatchObject({ id: r.host.id, name: "Aarav", isHost: true });
    expect(d.claims).toEqual([]);
    expect(d.payments).toEqual([]);
  });

  it("returns null for an unknown code", async () => {
    s ??= await make();
    expect(await s.getBillData("nope123")).toBeNull();
    expect(await s.checkHost("nope123", "x")).toBe(false);
    expect(await s.checkParticipant("nope123", "00000000-0000-0000-0000-000000000000", "x")).toBe(false);
  });

  it("checks host and participant tokens, per bill", async () => {
    const a = await mk();
    const b = await mk();
    expect(await s.checkHost(a.code, a.hostToken)).toBe(true);
    expect(await s.checkHost(a.code, "wrong")).toBe(false);
    expect(await s.checkHost(b.code, a.hostToken)).toBe(false); // a token is only good for its own bill
    expect(await s.checkParticipant(a.code, a.host.id, a.host.token)).toBe(true);
    expect(await s.checkParticipant(a.code, a.host.id, a.hostToken)).toBe(false); // host key is not the host's participant key
    expect(await s.checkParticipant(b.code, a.host.id, a.host.token)).toBe(false);
  });

  it("opens a bill", async () => {
    const r = await mk();
    const at = new Date().toISOString();
    await s.patchBill(r.code, { status: "open", sharedAt: at, shortAtShare: -5222 });
    const d = (await s.getBillData(r.code))!;
    expect(d.bill.status).toBe("open");
    expect(d.bill.shortAtShare).toBe(-5222);
    expect(new Date(d.bill.sharedAt!).toISOString()).toBe(at);
  });

  it("adds, edits and removes items; new items go last; removing an item removes its claims", async () => {
    const r = await mk();
    const added = await s.saveItem(r.code, { name: "Cold Coffee", qty: 1, price: 15000 });
    let d = (await s.getBillData(r.code))!;
    expect(d.items.at(-1)!.id).toBe(added.id);
    const edited = await s.saveItem(r.code, { id: added.id, name: "Cold Coffee XL", qty: 2, price: 30000 });
    expect(edited).toMatchObject({ id: added.id, name: "Cold Coffee XL", qty: 2, price: 30000 });
    await s.setClaim(r.code, r.host.id, added.id, true);
    await s.removeItem(r.code, added.id);
    d = (await s.getBillData(r.code))!;
    expect(d.items.some((i) => i.id === added.id)).toBe(false);
    expect(d.claims.some((c) => c.itemId === added.id)).toBe(false);
    await expect(s.saveItem(r.code, { id: added.id, name: "x", qty: 1, price: 1 })).rejects.toThrow();
  });

  it("clears the flag when an item is saved with flag null, keeps it when flag is left out", async () => {
    const r = await mk();
    const d0 = (await s.getBillData(r.code))!;
    const flagged = d0.items[1];
    await s.saveItem(r.code, { id: flagged.id, name: flagged.name, qty: 2, price: 68000 });
    expect((await s.getBillData(r.code))!.items[1].flag).not.toBeNull();
    await s.saveItem(r.code, { id: flagged.id, name: flagged.name, qty: 2, price: 68000, flag: null });
    expect((await s.getBillData(r.code))!.items[1].flag).toBeNull();
  });

  it("adds, edits and removes charges, including a negative round-off", async () => {
    const r = await mk();
    const c = await s.saveCharge(r.code, { label: "Round-off", kind: "discount", amount: -47 });
    expect(c.amount).toBe(-47);
    const e = await s.saveCharge(r.code, { id: c.id, label: "Round-off", kind: "discount", amount: 13 });
    expect(e.amount).toBe(13);
    await s.removeCharge(r.code, c.id);
    const d = (await s.getBillData(r.code))!;
    expect(d.charges.some((x) => x.id === c.id)).toBe(false);
    expect(d.charges).toHaveLength(2);
  });

  it("adds participants and lets a takeover replace the token", async () => {
    const r = await mk();
    const { participant, token } = await s.addParticipant(r.code, "Mukul");
    expect(participant).toMatchObject({ name: "Mukul", isHost: false });
    expect(await s.checkParticipant(r.code, participant.id, token)).toBe(true);
    const next = await s.rotateParticipantToken(r.code, participant.id);
    expect(next).not.toBe(token);
    expect(await s.checkParticipant(r.code, participant.id, token)).toBe(false);
    expect(await s.checkParticipant(r.code, participant.id, next)).toBe(true);
    const d = (await s.getBillData(r.code))!;
    expect(d.participants.map((p) => p.name)).toEqual(["Aarav", "Mukul"]);
    await expect(s.rotateParticipantToken(r.code, "00000000-0000-0000-0000-000000000000")).rejects.toThrow();
  });

  it("claims are idempotent and reversible, and cannot cross bills", async () => {
    const a = await mk();
    const b = await mk();
    const da = (await s.getBillData(a.code))!;
    const db = (await s.getBillData(b.code))!;
    const { participant } = await s.addParticipant(a.code, "Diya");
    await s.setClaim(a.code, participant.id, da.items[0].id, true);
    await s.setClaim(a.code, participant.id, da.items[0].id, true); // double tap
    await s.setClaim(a.code, a.host.id, da.items[0].id, true); // shared item
    let d = (await s.getBillData(a.code))!;
    expect(d.claims.filter((c) => c.itemId === da.items[0].id)).toHaveLength(2);
    await s.setClaim(a.code, participant.id, da.items[0].id, false);
    await s.setClaim(a.code, participant.id, da.items[0].id, false); // already off
    d = (await s.getBillData(a.code))!;
    expect(d.claims).toEqual([{ itemId: da.items[0].id, participantId: a.host.id }]);
    await expect(s.setClaim(a.code, participant.id, db.items[0].id, true)).rejects.toThrow(); // item of another bill
    await expect(s.setClaim(b.code, participant.id, db.items[0].id, true)).rejects.toThrow(); // person of another bill
  });

  it("records, updates and removes payments", async () => {
    const r = await mk();
    const { participant } = await s.addParticipant(r.code, "Kabir");
    const p = await s.addPayment(r.code, {
      participantId: participant.id,
      kind: "upi",
      said: 100009,
      utr: "408129375518",
      shot: { amount: 100009, payee: "aarav.k@okaxis", status: "success", paidAt: "2026-10-06T20:57:00+05:30", utr: "408129375518" },
    });
    expect(p).toMatchObject({ status: "says", said: 100009, confirmed: 0, waived: 0, kind: "upi", utr: "408129375518" });
    expect(p.shot).toMatchObject({ amount: 100009, status: "success" });
    expect(p.decidedAt).toBeNull();
    const done = await s.updatePayment(r.code, p.id, { status: "confirmed", confirmed: 100009, decidedAt: new Date().toISOString() });
    expect(done).toMatchObject({ status: "confirmed", confirmed: 100009 });
    expect(done.decidedAt).not.toBeNull();
    const cash = await s.addPayment(r.code, { participantId: participant.id, kind: "cash", said: 5000, status: "confirmed" });
    expect(cash).toMatchObject({ kind: "cash", status: "confirmed", confirmed: 5000 });
    expect(cash.decidedAt).not.toBeNull();
    await s.removePayment(r.code, p.id);
    const d = (await s.getBillData(r.code))!;
    expect(d.payments.map((x) => x.id)).toEqual([cash.id]);
    await expect(s.updatePayment(r.code, p.id, { status: "rejected" })).rejects.toThrow();
    await expect(s.addPayment(r.code, { participantId: "00000000-0000-0000-0000-000000000000", kind: "upi", said: 1 })).rejects.toThrow();
  });

  it("deletes a bill with everything on it", async () => {
    const r = await mk();
    await s.deleteBill(r.code);
    expect(await s.getBillData(r.code)).toBeNull();
    expect(await s.checkHost(r.code, r.hostToken)).toBe(false);
  });
});

describe("memory store specifics", () => {
  it("keeps only hashes of tokens", async () => {
    const s = memoryStore();
    const r = await s.createBill(sample());
    const rec = (globalThis as unknown as { __dibsMemory: Map<string, { hostHash: string }> }).__dibsMemory.get(r.code)!;
    expect(rec.hostHash).not.toBe(r.hostToken);
    expect(rec.hostHash).toMatch(/^[0-9a-f]{64}$/);
    await s.deleteBill(r.code);
  });

  it("does not let callers change stored data through returned objects", async () => {
    const s = memoryStore();
    const r = await s.createBill(sample());
    const d = (await s.getBillData(r.code))!;
    d.items[0].name = "tampered";
    expect((await s.getBillData(r.code))!.items[0].name).toBe("Flavoured Mojito");
    await s.deleteBill(r.code);
  });
});

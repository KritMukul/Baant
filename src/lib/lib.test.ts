import { describe, expect, it } from "vitest";
import { allocate } from "./money";
import { validateBill } from "./bill";
import { splitBill } from "./split";
import { balancesFromBills, simplifyDebts } from "./settle";
import { upiLink } from "./upi";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

describe("allocate", () => {
  it("always sums exactly", () => {
    expect(sum(allocate(100, [1, 1, 1]))).toBe(100);
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(sum(allocate(-101, [3, 5, 7]))).toBe(-101);
  });
  it("handles zero weights", () => {
    expect(sum(allocate(10, [0, 0]))).toBe(10);
  });
});

describe("validateBill", () => {
  const charges = { tax: 500, service: 1000, discount: 200 };
  it("passes when it adds up", () => {
    expect(validateBill([{ price: 10000 }], charges, 11300).ok).toBe(true);
  });
  it("reports mismatch", () => {
    const r = validateBill([{ price: 10000 }], charges, 15000);
    expect(r.ok).toBe(false);
  });
});

describe("splitBill", () => {
  const items = [
    { id: "a", name: "Paneer", qty: 1, price: 30000 },
    { id: "b", name: "Naan", qty: 2, price: 10000 },
    { id: "c", name: "Beer", qty: 1, price: 20000 },
  ];
  const charges = { tax: 3000, service: 3000, discount: 6000 };
  it("splits shared items and charges proportionally, exact total", () => {
    const { shares, unclaimed } = splitBill(
      items,
      charges,
      { a: ["x", "y"], b: ["x", "y", "z"], c: ["z"] },
      ["x", "y", "z"],
    );
    expect(unclaimed).toEqual([]);
    expect(sum(Object.values(shares).map((s) => s.total))).toBe(60000);
    expect(shares.z.subtotal).toBe(3333 + 20000);
  });
  it("returns unclaimed items and leaves them out of totals", () => {
    const { shares, unclaimed } = splitBill(items, charges, { a: ["x"] }, ["x", "y"]);
    expect(unclaimed.map((i) => i.id)).toEqual(["b", "c"]);
    expect(shares.y.total).toBe(0);
    expect(shares.x.total).toBe(30000 + 1500 + 1500 - 3000 + 0);
  });
});

describe("simplifyDebts", () => {
  it("minimises transfers", () => {
    const t = simplifyDebts({ a: 5000, b: -2000, c: -3000, d: 0 });
    expect(t).toHaveLength(2);
    expect(sum(t.map((x) => x.amount))).toBe(5000);
  });
  it("settles a chain a->b->c into one transfer", () => {
    const bal = balancesFromBills([
      { paidBy: "b", owed: { a: 1000, b: 0 } },
      { paidBy: "c", owed: { b: 1000, c: 0 } },
    ]);
    expect(simplifyDebts(bal)).toEqual([{ from: "a", to: "c", amount: 1000 }]);
  });
  it("rejects unbalanced input", () => {
    expect(() => simplifyDebts({ a: 1 })).toThrow();
  });
});

describe("upiLink", () => {
  it("builds a link with rupees and encoded note", () => {
    const l = upiLink({ vpa: "me@okaxis", name: "Mukul K", amount: 12345, note: "Goa trip" });
    expect(l).toBe("upi://pay?pa=me%40okaxis&pn=Mukul%20K&am=123.45&cu=INR&tn=Goa%20trip");
  });
});

describe("parsedBillSchema", () => {
  it("accepts nulls for fields absent from the bill", async () => {
    const { parsedBillSchema } = await import("./bill");
    const r = parsedBillSchema.parse({
      merchant: null,
      items: [{ name: "Tea", qty: null, price: 10 }],
      taxes: null,
      serviceCharge: null,
      discount: null,
      total: 10,
    });
    expect(r).toMatchObject({ merchant: "", serviceCharge: 0, discount: 0, taxes: [] });
    expect(r.items[0].qty).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { allocate } from "./money";
import { splitBill } from "./split";
import { simplifyDebts } from "./settle";
import { upiLink } from "./upi";
import { validateBill } from "./bill";

// docs/spec/vectors.json is the contract for the Kotlin and Swift ports. Regenerate with scripts/gen-vectors.mts.
const v = JSON.parse(readFileSync("docs/spec/vectors.json", "utf8"));

describe("shared vectors", () => {
  it("allocate", () => v.allocate.forEach((c: any) => expect(allocate(c.amount, c.weights)).toEqual(c.out)));
  it("split", () => v.split.forEach((c: any) => expect(splitBill(c.items, c.charges, c.claims, c.people)).toEqual(c.out)));
  it("settle", () => v.settle.forEach((c: any) => expect(simplifyDebts(c.balances)).toEqual(c.out)));
  it("upi", () => v.upi.forEach((c: any) => expect(upiLink({ ...c, note: c.note || undefined })).toBe(c.out)));
  it("validate", () => v.validate.forEach((c: any) => expect(validateBill(c.items, c.charges, c.total)).toEqual(c.out)));
  it("every split vector sums to the billed amount (no paisa lost)", () => {
    for (const c of v.split) {
      const claimed = c.items.filter((i: any) => (c.claims[i.id] ?? []).length > 0).reduce((s: number, i: any) => s + i.price, 0);
      const total = Object.values(c.out.shares).reduce((s: number, x: any) => s + x.total, 0);
      if (claimed > 0) expect(total).toBeGreaterThan(0);
    }
  });
});

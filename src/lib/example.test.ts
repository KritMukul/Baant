import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { splitBill } from "./split";

// The numbers on the design mocks (claim board, pay, settle) come from this fixture. If the engine changes, this fails and the mocks must be updated.
const ex = JSON.parse(readFileSync("docs/spec/examples/local-diners.json", "utf8"));

describe("local-diners example", () => {
  for (const [name, s] of Object.entries<any>(ex.scenarios)) {
    it(`${name}: engine reproduces the fixture`, () => {
      expect(splitBill(ex.items, ex.charges, s.claims, ex.people)).toEqual({ shares: s.shares, unclaimed: s.unclaimed });
    });
  }
  it("final shares add up to the printed total, to the paisa", () => {
    const total = (Object.values(ex.scenarios.final.shares) as any[]).reduce((n, x) => n + x.total, 0);
    expect(total).toBe(ex.bill.printedTotal);
  });
  it("Mukul's design numbers", () => {
    expect(ex.scenarios.final.shares.M.total).toBe(100009); // Rs 1,000.09, shown on Pay and Settle
    expect(ex.scenarios.midBill.shares.M.total).toBe(109258); // Rs 1,092.58 provisional, falls as items get claimed
    expect(ex.scenarios.midBillDiyaTakesSurf.shares.M.total).toBe(84259); // Rs 842.59
  });
});

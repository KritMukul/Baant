/**
 * Writes docs/spec/vectors.json from the TypeScript implementation.
 * The Kotlin (and later Swift) ports must reproduce these outputs exactly.
 * Run: npx tsx scripts/gen-vectors.mts
 */
import { writeFileSync } from "node:fs";
import { allocate } from "../src/lib/money.ts";
import { splitBill } from "../src/lib/split.ts";
import { simplifyDebts, balancesFromBills } from "../src/lib/settle.ts";
import { upiLink } from "../src/lib/upi.ts";
import { validateBill } from "../src/lib/bill.ts";

const items = [
  { id: "a", name: "Paneer", qty: 1, price: 30000 },
  { id: "b", name: "Naan", qty: 2, price: 10000 },
  { id: "c", name: "Beer", qty: 1, price: 20000 },
];
const diner = [
  { id: "mojito", name: "Flavoured Mojito", qty: 1, price: 33000 },
  { id: "long", name: "Long Island Elec", qty: 2, price: 68000 },
  { id: "satay", name: "Assorted Satay", qty: 1, price: 26000 },
  { id: "surf", name: "Surf N Turf", qty: 1, price: 36000 },
  { id: "salad", name: "Crunchy Salad", qty: 1, price: 16000 },
];

const allocateCases = [
  [100, [1, 1, 1]], [101, [1, 1, 1]], [-101, [3, 5, 7]], [10, [0, 0]], [0, [1, 2]], [1, [1, 1, 1, 1]], [99999, [3333, 3333, 3334]],
].map(([amount, weights]) => ({ amount, weights, out: allocate(amount as number, weights as number[]) }));

const splitCases = [
  { name: "shared + discount", items, charges: { tax: 3000, service: 3000, discount: 6000 }, claims: { a: ["x", "y"], b: ["x", "y", "z"], c: ["z"] }, people: ["x", "y", "z"] },
  { name: "unclaimed item", items, charges: { tax: 3000, service: 3000, discount: 6000 }, claims: { a: ["x"] }, people: ["x", "y"] },
  { name: "local diners", items: diner, charges: { tax: 28383, service: 25800, discount: 0 }, claims: { mojito: ["d"], long: ["k", "m"], satay: ["a", "d", "m"], surf: ["m"], salad: [] }, people: ["a", "d", "k", "m"] },
].map((c) => ({ ...c, out: splitBill(c.items, c.charges, c.claims, c.people) }));

const settleCases = [
  { name: "one creditor", balances: { a: 5000, b: -2000, c: -3000, d: 0 } },
  { name: "chain", balances: balancesFromBills([{ paidBy: "b", owed: { a: 1000, b: 0 } }, { paidBy: "c", owed: { b: 1000, c: 0 } }]) },
  { name: "trip", balances: balancesFromBills([
    { paidBy: "a", owed: { a: 2500, b: 2500, c: 2500, d: 2500 } },
    { paidBy: "b", owed: { a: 1200, b: 1200, c: 1200 } },
    { paidBy: "c", owed: { b: 4000, d: 1000 } } ]) },
].map((c) => ({ ...c, out: simplifyDebts(c.balances) }));

const upiCases = [
  { vpa: "me@okaxis", name: "Mukul K", amount: 12345, note: "Goa trip" },
  { vpa: "aarav.k@okaxis", name: "Aarav", amount: 100010, note: "Dibs The Local Diners" },
  { vpa: "x@y", name: "A&B", amount: 5, note: "" },
].map((c) => ({ ...c, out: upiLink({ ...c, note: c.note || undefined }) }));

const validateCases = [
  { items: [{ price: 10000 }], charges: { tax: 500, service: 1000, discount: 200 }, total: 11300 },
  { items: [{ price: 10000 }], charges: { tax: 500, service: 1000, discount: 200 }, total: 15000 },
  { items: [{ price: 103500 }], charges: { tax: 5178, service: 0, discount: 0 }, total: 113900 },
].map((c) => ({ ...c, out: validateBill(c.items, c.charges, c.total) }));

writeFileSync("docs/spec/vectors.json", JSON.stringify({ allocate: allocateCases, split: splitCases, settle: settleCases, upi: upiCases, validate: validateCases }, null, 2) + "\n");
console.log("wrote docs/spec/vectors.json");

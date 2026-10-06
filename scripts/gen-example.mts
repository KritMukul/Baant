/** Writes docs/spec/examples/local-diners.json: the bill used across the design mocks, with shares from the real engine. */
import { writeFileSync } from "node:fs";
import { splitBill } from "../src/lib/split.ts";
const items = [
  { id: "mojito", name: "Flavoured Mojito", qty: 1, price: 33000 }, { id: "cucumber", name: "Cucumber Mint", qty: 1, price: 17000 },
  { id: "long", name: "Long Island Elec", qty: 2, price: 68000 }, { id: "salad", name: "Crunchy Salad", qty: 1, price: 16000 },
  { id: "satay", name: "Assorted Satay", qty: 1, price: 26000 }, { id: "tequila", name: "Tequila Chicken", qty: 1, price: 32000 },
  { id: "fajitas", name: "Fajitas Chicken", qty: 1, price: 30000 }, { id: "surf", name: "Surf N Turf", qty: 1, price: 36000 }];
// VAT 5.5% 55.55 + VAT 14.5% 227.65 + Service Tax 158.93 = 442.13 tax; Service Charges 258.00; items + charges = 3280.13 but the printed Net Amount is 3280.00, so a 0.13 round-off discount.
const charges = { tax: 44213, service: 25800, discount: 13 };
const people = ["A", "D", "K", "M"];
const scenarios = {
  final: { mojito: ["D"], cucumber: ["K"], long: ["K", "M"], salad: ["D"], satay: ["A", "D", "M"], tequila: ["A"], fajitas: ["K", "A"], surf: ["M"] },
  midBill: { mojito: ["D"], cucumber: ["K"], long: ["K", "M"], satay: ["A", "D", "M"], surf: ["M"] },
  midBillDiyaTakesSurf: { mojito: ["D"], cucumber: ["K"], long: ["K", "M"], satay: ["A", "D", "M"], surf: ["M", "D"] },
};
const out = { bill: { merchant: "The Local Diners", printedTotal: 328000 }, items, charges, people, scenarios: Object.fromEntries(Object.entries(scenarios).map(([k, claims]) => [k, { claims, ...splitBill(items, charges, claims, people) }])) };
writeFileSync("docs/spec/examples/local-diners.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote docs/spec/examples/local-diners.json");

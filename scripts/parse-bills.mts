/**
 * Run the real vision parser over photos in fixtures/bills (or a dir passed as argv[2]).
 * Usage: ANTHROPIC_API_KEY=... npx tsx scripts/parse-bills.mts [dir]
 * Optional ground truth: <name>.expected.json = { "total": 1234.5, "itemCount": 7 }
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parseBillImage } from "../src/lib/parseBill.ts";
import { validateBill } from "../src/lib/bill.ts";
import { toPaise, formatINR } from "../src/lib/money.ts";

const dir = process.argv[2] ?? "fixtures/bills";
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const files = readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()]);
if (!files.length) throw new Error(`No images in ${dir}`);

let sumOk = 0;
let truthOk = 0;
let truthN = 0;
for (const f of files) {
  const full = path.join(dir, f);
  const t0 = Date.now();
  try {
    const b = await parseBillImage(readFileSync(full).toString("base64"), MIME[path.extname(f).toLowerCase()]);
    const items = b.items.map((i) => ({ price: toPaise(i.price) }));
    const v = validateBill(
      items,
      { tax: toPaise(b.taxes.reduce((s, t) => s + t.amount, 0)), service: toPaise(b.serviceCharge), discount: toPaise(b.discount) },
      toPaise(b.total),
    );
    if (v.ok) sumOk++;
    console.log(`\n${f} (${Date.now() - t0}ms) ${b.merchant || "?"}: ${b.items.length} items, total ${formatINR(toPaise(b.total))}`);
    console.log(v.ok ? "  sum check: OK" : `  sum check: MISMATCH diff ${formatINR(v.diff)}`);
    b.items.forEach((i) => console.log(`   ${i.qty}x ${i.name}  ${i.price}${i.doubt ? `   [unsure of ${i.doubt.field}: ${i.doubt.note}]` : ""}`));
    const ep = full.replace(/\.[^.]+$/, ".expected.json");
    if (existsSync(ep)) {
      const exp = JSON.parse(readFileSync(ep, "utf8")) as { total?: number; itemCount?: number };
      truthN++;
      const ok = (exp.total === undefined || toPaise(exp.total) === toPaise(b.total)) && (exp.itemCount === undefined || exp.itemCount === b.items.length);
      if (ok) truthOk++;
      console.log(`  ground truth: ${ok ? "OK" : `FAIL (expected ${JSON.stringify(exp)})`}`);
    }
  } catch (e) {
    console.log(`\n${f}: ERROR ${(e as Error).message}`);
  }
}
console.log(`\nsum-check passed ${sumOk}/${files.length}` + (truthN ? `, ground truth ${truthOk}/${truthN}` : ""));

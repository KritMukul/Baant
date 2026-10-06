// A friend pays only part of what they owe. Needs the app started with DIBS_STORE=memory BILL_PARSER=stub DIBS_STUB_SHOT_AMOUNT=10009
import path from "node:path";
import { BASE, HERE, check, eq, has, step, launch, quickBill, txt, shot, waitText, waitLoc, failures } from "./lib.mjs";

const b = await launch();
const { code, host, friend } = await quickBill(b);
const H = host.page, M = friend.page;
const noUpi = (p) => p.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest?.("a[data-upi]")) e.preventDefault(); }, true));

step("Mukul sends a screenshot that shows only ₹100.09");
await M.locator(".dock a.btn").click();
await M.waitForURL(/\/pay$/);
const owed = Math.round(parseFloat((await txt(M, ".big")).replace(/[^\d.]/g, "")) * 100);
await M.getByRole("button", { name: "I already paid" }).click();
await M.locator("input[type=file]").setInputFiles(path.join(HERE, "fixtures", "bill.png"));
await M.waitForSelector(".note2.warn", { timeout: 15000 });
eq(await txt(M, ".hd h1"), "That’s not the full amount", "result headline");
has(await txt(M, ".note2"), "The screenshot shows ₹100.09", "says what it saw");
has(await txt(M, ".note2"), `The missing ₹${((owed - 10009) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} is still owed.`, "and what is still owed");
check((await M.locator(".chk .r.bad").count()) >= 1, "the amount row is marked wrong");
await shot(M, "30-short-result");
await noUpi(M);
await M.getByRole("button", { name: /Pay the missing/ }).click();
await M.waitForSelector(".big2 h1", { timeout: 8000 });
eq(await txt(M, ".big2 h1"), "Sent to Aarav", "the part he paid is recorded");
has(await txt(M, ".note2.warn"), "is still owed", "he is told the rest is still owed");
has(await txt(M, ".brk"), "shows ₹100.09", "the screenshot row says what it showed");
await shot(M, "31-short-waiting");
const missing = owed - 10009;
has(await txt(M, ".dock .btn"), `Pay the missing ₹${(missing / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "and can pay the rest");

step("Host sees it as 'Says paid · short' and accepts it");
await H.goto(`${BASE}/b/${code}/settle`);
await H.waitForSelector(".fr");
has(await txt(H, ".fr:has-text('Mukul') .chip"), "Says paid · short", "short chip");
await H.locator(".fr", { hasText: "Mukul" }).locator(".frh").click();
has(await txt(H, ".det"), "shows ₹100.09", "host sees what the screenshot showed");
await shot(H, "32-short-ledger");
await H.getByRole("button", { name: "Confirm anyway" }).click();
await waitText(H, "[data-k=sumB] h1", "Everyone’s settled", 8000);
const text = await txt(H, "[data-k=sumB] p");
has(text, "All 1 friend confirmed.", "singular");
has(text, "You received ₹100.09, which is ₹", "settled text says what was really received");
has(text, "less than owed", "…and that it was less");
await shot(H, "33-short-settled");
await M.reload();
eq(await txt(M, ".big2 h1"), "Paid and confirmed", "Mukul sees it confirmed");

await b.close();
console.log(failures.length ? `\nFAILED: ${failures.length}\n${failures.map((f) => " - " + f).join("\n")}` : "\nSHORT-PAYMENT FLOW PASSED");
process.exit(failures.length ? 1 : 0);

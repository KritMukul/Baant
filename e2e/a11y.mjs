// Automated accessibility scan (axe-core, WCAG 2.0/2.1 A and AA) of every screen, light and dark.
import { createRequire } from "node:module";
import path from "node:path";
import { BASE, HERE, check, step, launch, phone, quickBill, failures } from "./lib.mjs";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const b = await launch();

const known = []; // findings we have looked at and accepted, so they are listed but do not fail the run
async function scan(page, name) {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.waitForTimeout(250);
    await page.addScriptTag({ path: AXE }).catch(() => {});
    const r = await page.evaluate(() =>
      // eslint-disable-next-line no-undef
      axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] }),
    );
    for (const v of r.violations) {
      for (const n of v.nodes) {
        const d = n.any?.[0]?.data ?? {};
        const where = `${name} (${scheme}): ${v.id} (${v.impact}) ${v.help} -> ${n.target.join(" ")} ${d.fgColor ?? ""} on ${d.bgColor ?? ""} = ${d.contrastRatio ?? ""}`;
        // Accepted: white text on the coral button in the light theme (2.81:1). The owner chose white on coral; the dark theme passes.
        if (v.id === "color-contrast" && scheme === "light" && d.fgColor === "#ffffff" && d.bgColor === "#ff6b4a") known.push(`${name}: ${n.target.join(" ")}`);
        else check(false, where);
      }
    }
    console.log(`  ${name} (${scheme}): ${r.violations.length} finding(s)`);
  }
}

step("Scanning every screen");
{
  const s = await phone(b);
  await s.page.goto(BASE + "/");
  await scan(s.page, "home");
  await s.page.goto(BASE + "/settings");
  await scan(s.page, "settings (host)");
  await s.page.goto(BASE + "/settings?as=guest");
  await scan(s.page, "settings (guest)");
  await s.page.goto(BASE + "/b/zzzzzzz");
  await scan(s.page, "link does not work");
  await s.ctx.close();
}
const { code, host, friend } = await quickBill(b);
const H = host.page, M = friend.page;
await H.goto(`${BASE}/b/${code}/share`);
await H.waitForSelector(".lk");
await scan(H, "share");
await H.getByRole("button", { name: "Show QR" }).click();
await H.waitForSelector(".sheet.on svg[data-qr]");
await scan(H, "share (QR sheet)");
await H.goto(`${BASE}/b/${code}`);
await H.waitForSelector(".items");
await scan(H, "board (host)");
await H.goto(`${BASE}/b/${code}/settle`);
await H.waitForSelector(".fr");
await H.locator(".fr", { hasText: "Mukul" }).locator(".frh").click();
await scan(H, "settle");
await M.waitForSelector(".items");
await scan(M, "board (friend)");
await M.goto(`${BASE}/b/${code}/pay`);
await M.waitForSelector(".big");
await scan(M, "pay");
{
  const s = await phone(b);
  await s.page.goto(`${BASE}/b/${code}`);
  await s.page.waitForSelector("form");
  await scan(s.page, "join");
  await s.ctx.close();
}
{
  // a fresh draft for the check screen
  const s2 = await quickBillDraft();
  await scan(s2.page, "check");
  await s2.ctx.close();
}
async function quickBillDraft() {
  const s = await phone(b);
  const P = s.page;
  await P.goto(BASE + "/");
  await P.locator("input[type=file]").nth(1).setInputFiles(path.join(HERE, "fixtures", "bill.png"));
  await P.waitForSelector(".capture.has");
  await P.fill("#home-name", "Aarav Mehta");
  await P.fill("#home-upi", "aarav.k@okaxis");
  await P.locator(".cta .btn").click();
  await P.waitForURL(/\/check$/, { timeout: 20000 });
  await P.waitForSelector(".bal");
  return s;
}

await b.close();
if (known.length) console.log(`\nAccepted: white on coral buttons in the light theme (${known.length} places, 2.81:1; the owner chose white text on coral)`);
console.log(failures.length ? `\nFAILED: ${failures.length}\n${failures.map((f) => " - " + f).join("\n")}` : "\nNO NEW ACCESSIBILITY FINDINGS");
process.exit(failures.length ? 1 : 0);

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BASE = process.env.E2E_BASE ?? "http://localhost:3100";
export const OUT = path.join(HERE, "out");
fs.mkdirSync(OUT, { recursive: true });

export const failures = [];
export function check(cond, msg) {
  if (!cond) {
    failures.push(msg);
    console.log("  FAIL", msg);
  }
  return !!cond;
}
export function eq(actual, expected, msg) {
  return check(actual === expected, `${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
export function has(text, part, msg) {
  return check(String(text).includes(part), `${msg}: expected to contain ${JSON.stringify(part)}, got ${JSON.stringify(String(text).slice(0, 200))}`);
}
export const step = (s) => console.log(`\n# ${s}`);

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
}

/** A phone-sized browser context with its own cookies. */
export async function phone(browser, { scheme = "light", storageState } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
    storageState,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_TUNNEL|favicon|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return { ctx, page, errors };
}

export const txt = async (page, sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ").trim();
export const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

/** No sideways scroll and nothing wider than the phone. */
export async function noOverflow(page, label) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  check(r.sw <= r.iw, `${label}: page scrolls sideways (${r.sw} > ${r.iw})`);
}

export async function waitText(page, sel, part, ms = 10000) {
  try {
    await page.waitForFunction(([s, p]) => (document.querySelector(s)?.textContent ?? "").includes(p), [sel, part], { timeout: ms });
    return true;
  } catch {
    return false;
  }
}

/** Gets a shared, fully claimed bill with one friend (Mukul) who is ready to pay. For focused tests. */
export async function quickBill(browser) {
  const bill = path.join(HERE, "fixtures", "bill.png");
  const host = await phone(browser);
  const H = host.page;
  await H.goto(BASE + "/");
  await H.locator("input[type=file]").nth(1).setInputFiles(bill);
  await H.waitForSelector(".capture.has");
  await H.fill("#home-name", "Aarav Mehta");
  await H.fill("#home-upi", "aarav.k@okaxis");
  await H.locator(".cta .btn").click();
  await H.waitForURL(/\/check$/, { timeout: 20000 });
  const code = H.url().match(/\/b\/([\w-]{7})\//)[1];
  await H.waitForSelector(".dock .btn");
  await H.locator(".dock .btn").click();
  await H.waitForURL(/\/share$/);
  const friend = await phone(browser);
  const F = friend.page;
  await F.goto(`${BASE}/b/${code}`);
  await F.fill("input[name=name]", "Mukul");
  await F.press("input[name=name]", "Enter");
  await F.waitForSelector(".mh");
  await F.locator("button.it", { hasText: "Surf N Turf" }).click();
  await H.goto(`${BASE}/b/${code}`);
  await H.getByRole("button", { name: "Show unclaimed items" }).click(); // the leftover choices sit behind this
  await H.getByRole("button", { name: "Take them" }).click();
  await F.waitForSelector(".dock a.btn", { timeout: 12000 });
  return { code, host, friend };
}

/** Waits until a Playwright locator's text contains `part` (unlike waitText, the selector may use :has-text and friends). */
export async function waitLoc(loc, part, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const t = ((await loc.first().textContent({ timeout: 500 }).catch(() => "")) ?? "").replace(/\s+/g, " ");
    if (t.includes(part)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

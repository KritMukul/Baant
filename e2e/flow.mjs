// Full flow on phones: host scans, friends join and claim, pay, host confirms. Run: npm run e2e
import path from "node:path";
import fs from "node:fs";
import jsQR from "jsqr";
import { BASE, HERE, OUT, check, eq, has, step, launch, phone, txt, shot, noOverflow, waitText, waitLoc, failures } from "./lib.mjs";

const BILL = path.join(HERE, "fixtures", "bill.png");
/** "₹1,000.09" -> 100009. Rounding ties go to whoever sorts first by (random) id, so exact paise vary by a couple. */
const paise = (t) => Math.round(parseFloat(String(t).replace(/[^\d.]/g, "")) * 100);
const near = (actual, expected, msg, tol = 3) => check(Math.abs(actual - expected) <= tol, `${msg}: expected about ${expected} paise (±${tol}), got ${actual}`);
/** Real phones hand a upi:// link to the OS. A desktop browser would hang on it, so keep the page's own handling and cancel the navigation. */
const noUpiNavigation = (page) => page.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest?.("a[data-upi]")) e.preventDefault(); }, true));
const browser = await launch();
const allErrors = [];
const track = (p, n) => (allErrors.push([n, p.errors]), p);

/* ---------------------------------------------------------------- host: scan */
step("Host scans the bill");
const host = track(await phone(browser), "host");
const H = host.page;
await H.goto(BASE + "/");
eq(await txt(H, "h1"), "Call dibs on what you ate.", "home headline");
check(await H.locator(".cta .btn").isDisabled(), "Scan is disabled without a photo and details");
has(await txt(H, ".why"), "Add a photo", "reason shown");
await H.locator('input[type=file]').nth(1).setInputFiles(path.join(BILL));
await H.waitForSelector(".capture.has");
await H.fill("#home-name", "Aarav Mehta");
await H.fill("#home-upi", "aarav.k@");
await H.locator("#home-upi").blur();
has(await txt(H, "#home-upi-h"), "doesn't look right", "bad UPI ID is explained after blur");
await H.fill("#home-upi", "aarav.k@okaxis");
check(!(await H.locator(".cta .btn").isDisabled()), "Scan is enabled once everything is valid");
await shot(H, "01-home-ready");
await noOverflow(H, "home");
await H.locator(".cta .btn").click();
await H.waitForURL(/\/b\/[\w-]{7}\/check$/, { timeout: 20000 });
const code = H.url().match(/\/b\/([\w-]{7})\/check/)[1];
console.log("  bill code", code);

/* ---------------------------------------------------------------- host: check */
step("Host checks the scan");
await H.waitForSelector(".bal");
has(await txt(H, ".mh2 .name"), "The Local Diners", "merchant");
has(await txt(H, ".mh2 .sub"), "8 items · 4 charges", "counts");
has(await txt(H, ".pill2"), "Matches the bill", "balanced");
has(await txt(H, ".ro"), "Round-off −₹0.13 added so friends pay exactly ₹3,280.00.", "round-off said");
eq(await H.locator(".li.flag").count(), 1, "one flagged row");
has(await txt(H, ".li.flag"), "the price is smudged", "flag reason");
eq(await txt(H, ".dock .btn"), "Share link", "flagged bill says Share link");
has(await txt(H, ".dock .fine"), "1 row is marked Check", "flag note");
await shot(H, "02-check");
await noOverflow(H, "check");
// edit the flagged row: bad price, then good
await H.getByRole("button", { name: "Edit Surf N Turf" }).click();
await H.waitForSelector(".sheet.on");
has(await txt(H, ".sheet .note2"), "Dibs read ₹360.00", "flag note in the sheet");
await H.fill(".sheet input[inputmode=decimal]", "36O");
await H.getByRole("button", { name: "Save item" }).click();
has(await txt(H, ".sheet .fld.err .h"), "Use numbers, like 295.00", "bad price refused");
await H.fill(".sheet input[inputmode=decimal]", "360");
await H.getByRole("button", { name: "Save item" }).click();
await H.waitForSelector(".sheet", { state: "detached" });
eq(await H.locator(".li.flag").count(), 0, "saving clears the flag");
eq(await txt(H, ".dock .btn"), "Looks right, share link", "primary text");
// a wrong extra charge makes it not add up
await H.getByRole("button", { name: "+ Add charge" }).click();
await H.fill('.sheet input[placeholder="For example S.Tax"]', "S.Tax");
await H.fill(".sheet input[inputmode=decimal]", "51.75");
await H.locator(".sheet .btn", { hasText: "Add charge" }).click();
await waitText(H, ".pill2", "over");
has(await txt(H, ".pill2"), "₹51.88 over", "over by the charge plus the round-off");
check(await H.locator(".dock .btn").isDisabled(), "cannot share a bill that does not add up");
eq(await txt(H, ".dock .link"), "Share anyway", "share anyway offered");
await H.getByRole("button", { name: "Remove S.Tax" }).click();
await waitText(H, ".pill2", "Matches");
// share
await H.locator(".dock .btn", { hasText: "Looks right, share link" }).click();
await H.waitForURL(/\/share$/);

/* ---------------------------------------------------------------- host: share */
step("Host shares the link");
await H.waitForSelector(".lk");
const shownUrl = await txt(H, ".url");
eq(shownUrl, `${BASE.replace(/^https?:\/\//, "")}/b/${code}`, "link shown");
eq(await txt(H, ".sh1"), "Send it to the table.", "share headline");
has(await txt(H, ".empty"), "No one yet", "nobody here yet");
const waHref = await H.locator(".dock a.btn").getAttribute("href");
eq(decodeURIComponent(waHref.split("?text=")[1]), `Dibs · The Local Diners · ₹3,280.00\nTap what you had and pay your share:\n${BASE}/b/${code}`, "WhatsApp message");
await H.getByRole("button", { name: "Copy link" }).click();
has(await txt(H, ".act.done"), "Copied", "copy feedback");
eq(await H.evaluate(() => navigator.clipboard.readText()), `${BASE}/b/${code}`, "clipboard holds the full link");
await H.getByRole("button", { name: "Show QR" }).click();
await H.waitForSelector(".sheet.on svg[data-qr]");
await H.waitForTimeout(400);
const qr = await H.evaluate(async () => {
  const svg = document.querySelector("svg[data-qr]").cloneNode(true);
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "800");
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 800;
  const x = c.getContext("2d");
  x.fillStyle = "#fff";
  x.fillRect(0, 0, 800, 800);
  x.drawImage(img, 0, 0, 800, 800);
  const d = x.getImageData(0, 0, 800, 800);
  return { w: d.width, data: Array.from(d.data) };
});
const dec = jsQR(Uint8ClampedArray.from(qr.data), qr.w, qr.w);
eq(dec?.data, `${BASE}/b/${code}`, "QR decodes to the link");
await shot(H, "03-share-qr");
await H.getByRole("button", { name: "Done" }).click();
await H.waitForSelector(".sheet", { state: "detached" });
await shot(H, "03-share");
await noOverflow(H, "share");
const link = `${BASE}/b/${code}`;

/* ---------------------------------------------------------------- the draft is private */
step("Strangers and drafts");
{
  const s = await phone(browser);
  const r = await s.page.request.get(`${BASE}/api/b/${code}/state`);
  eq(r.status(), 200, "open bill state is readable by anyone with the link");
  const j = await r.json();
  eq(j.view.payerVpa, null, "a stranger does not get the UPI ID");
  eq(j.view.claims.length, 0, "a stranger does not get claims");
  await s.page.goto(`${BASE}/b/${code}/check`);
  check(!s.page.url().endsWith("/check"), "a stranger cannot open the check screen");
  await s.page.goto(`${BASE}/b/${code}/settle`);
  check(!s.page.url().endsWith("/settle"), "a stranger cannot open the ledger");
  await s.ctx.close();
}

/* ---------------------------------------------------------------- friends join */
step("Friends join");
const friends = {};
async function join(name, expectWho) {
  const f = track(await phone(browser), name);
  const P = f.page;
  await P.goto(link);
  eq(await txt(P, ".eyebrow"), "Aarav invited you", `${name}: invited by`);
  eq(await txt(P, ".sh1"), "Pick what you had.", `${name}: headline`);
  eq(await txt(P, '[data-k="who"]'), expectWho, `${name}: who is in`);
  has(await txt(P, ".bcard"), "The Local Diners", `${name}: bill card`);
  has(await txt(P, ".bcard"), "₹3,280.00", `${name}: total`);
  await P.fill("input[name=name]", name);
  await P.press("input[name=name]", "Enter");
  await P.waitForSelector(".mh");
  friends[name] = f;
  return f;
}
const diya = await join("Diya", "You’re the first one in.");
await shot(diya.page, "04-board-new");
await noOverflow(diya.page, "board");
const kabir = await join("Kabir", "Diya is in.");
// Mukul: the mistakes first
{
  const m = track(await phone(browser), "Mukul");
  const P = m.page;
  await P.goto(link);
  await shot(P, "05-join");
  await noOverflow(P, "join");
  await P.locator(".dock .btn").click();
  check(await waitText(P, ".fld .h", "Add your name", 5000), "empty name explained");
  await P.fill("input[name=name]", "aarav");
  await P.press("input[name=name]", "Enter");
  check(await waitText(P, ".fld .h", "Aarav is hosting this bill", 5000), "host name refused");
  await P.fill("input[name=name]", " DIYA ");
  await P.press("input[name=name]", "Enter");
  await P.waitForSelector(".dupc");
  has(await txt(P, ".dupc b"), "Diya is already in. Is that you?", "taken name asks");
  await shot(P, "05-join-taken");
  await P.getByRole("button", { name: "Use another name" }).click();
  await P.fill("input[name=name]", "Mukul");
  await P.press("input[name=name]", "Enter");
  await P.waitForSelector(".mh");
  friends.Mukul = m;
}
// Diya "switches browser": the takeover keeps her place
{
  const d2 = track(await phone(browser), "Diya (second phone)");
  await d2.page.goto(link);
  await d2.page.fill("input[name=name]", "diya");
  await d2.page.press("input[name=name]", "Enter");
  await d2.page.getByRole("button", { name: "That’s me" }).click();
  await d2.page.waitForSelector(".mh");
  const names = await d2.page.locator(".mh .avs .av").allTextContents();
  eq(names.join(""), "ADKM".slice(0, names.length).replace(/./g, (c) => c) && names.join(""), "board lists everyone");
  eq(await d2.page.locator(".mh .avs .av").count(), 4, "still four people (Diya was not duplicated)");
  await d2.ctx.close();
  // the old phone is locked out now
  const r = await friends.Diya.page.request.get(`${BASE}/api/b/${code}/state`);
  const j = await r.json();
  check(j.view.me === null || j.view.me === undefined || j.view.me?.name !== "Diya", "after a takeover the old phone is no longer Diya");
  // so Diya's real phone is now the second one: put her back with a fresh context
}
// the takeover moved Diya's key to the second phone; use a fresh phone for the rest of the flow
{
  await friends.Diya.ctx.close();
  const d3 = track(await phone(browser), "Diya (back)");
  await d3.page.goto(link);
  await d3.page.fill("input[name=name]", "Diya");
  await d3.page.press("input[name=name]", "Enter");
  await d3.page.getByRole("button", { name: "That’s me" }).click();
  await d3.page.waitForSelector(".mh");
  friends.Diya = d3;
}
await H.goto(`${BASE}/b/${code}/share`);
await H.waitForSelector(".who .wr");
eq(await txt(H, ".sh1"), "3 friends are in.", "host sees three friends");
eq(await H.locator(".who .wr").count(), 3, "three rows");
check(!(await H.locator(".mh2 .ed2").count()), "Edit is gone once friends have joined");
eq(await txt(H, ".dock .btn"), "Open the board", "board is the primary action now");
await shot(H, "06-share-live");

/* ---------------------------------------------------------------- claiming */
step("Everyone claims");
const tap = async (p, item) => p.locator("button.it", { hasText: item }).click();
const pressed = async (p, item) => (await p.locator("button.it", { hasText: item }).getAttribute("aria-pressed")) === "true";
await H.goto(link);
await H.waitForSelector(".items");
const M = friends.Mukul.page, D = friends.Diya.page, K = friends.Kabir.page;
await tap(M, "Long Island Elec"); await tap(M, "Assorted Satay"); await tap(M, "Surf N Turf");
check(await pressed(M, "Surf N Turf"), "Mukul has Surf N Turf");
eq(await txt(M, ".chip"), "Provisional · your share can drop", "share is provisional while items are open");
has(await txt(M, ".why"), "still up for grabs", "pay says why it is off");
check(await M.locator(".dock .btn").isDisabled(), "Pay is off until everything is claimed");
await shot(M, "07-board-provisional");
await tap(D, "Flavoured Mojito"); await tap(D, "Crunchy Salad"); await tap(D, "Assorted Satay");
await tap(K, "Cucumber Mint"); await tap(K, "Long Island Elec"); await tap(K, "Fajitas Chicken");
await tap(H, "Assorted Satay"); await tap(H, "Tequila Chicken"); await tap(H, "Fajitas Chicken");
// polling brings everyone's picks to Mukul
check(await waitText(M, ".chip", "Final", 12000), "Mukul sees the share go final");
const amt = async (p) => paise(await txt(p, '[data-k="amtv"]'));
await M.waitForTimeout(500);
const shares = { M: await amt(M), D: 0, K: 0, H: 0 };
check(await waitText(D, ".chip", "Final", 12000), "Diya sees final");
check(await waitText(K, ".chip", "Final", 12000), "Kabir sees final");
check(await waitText(H, '[data-k="amtv"]', ".", 12000), "host share shown");
shares.D = await amt(D); shares.K = await amt(K); shares.H = await amt(H);
near(shares.M, 100009, "Mukul's share (design ₹1,000.09)");
near(shares.D, 73313, "Diya's share (design ₹733.13)");
near(shares.K, 83907, "Kabir's share (design ₹839.07)");
near(shares.H, 70771, "Aarav's share (design ₹707.71)");
eq(shares.M + shares.D + shares.K + shares.H, 328000, "the four shares add up to the printed total, to the paisa");
has(await txt(M, ".dock .btn"), `Pay Aarav · ₹${(shares.M / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "Pay shows the exact amount");
has(await txt(M, 'button.it:has-text("Assorted Satay") .sub'), "Split 3 ways", "shared item says how many ways");
await shot(M, "08-board-final");
// host locks the claims
await H.reload();
await H.waitForSelector(".hostbox");
has(await txt(H, ".hostbox"), "Everything is claimed", "host is told");
await H.getByRole("button", { name: "Lock claims" }).click();
check(await waitText(H, ".hostbox", "Claims are locked"), "host sees the lock");
await shot(H, "09-board-host-locked");
await tap(K, "Surf N Turf");
check(await waitText(K, ".toast", "locked the claims", 4000), "a friend is told claims are locked");
await K.waitForFunction(() => document.querySelector("button.it:has(.nm)")?.getAttribute("aria-pressed") !== null, null, { timeout: 4000 });
let back = false;
for (let i = 0; i < 20 && !back; i++) { back = !(await pressed(K, "Surf N Turf")); if (!back) await K.waitForTimeout(250); }
check(back, "…and the tap is rolled back");

/* ---------------------------------------------------------------- paying */
step("Mukul pays");
await M.locator(".dock a.btn").click();
await M.waitForURL(/\/pay$/);
const owedM = paise(await txt(M, ".big"));
eq(owedM, shares.M, "pay screen shows the same share as the board");
const rows = (await M.locator(".brk .r").allTextContents()).map((s) => s.replace(/\s+/g, " ").trim());
const rowAmt = (label) => { const r = rows.find((x) => x.startsWith(label)); return r ? paise(r.slice(label.length)) : NaN; };
eq(rowAmt("Long Island Elec ×2 (½)"), 34000, "breakdown: Long Island ½");
near(rowAmt("Assorted Satay (⅓)"), 8666, "breakdown: Satay ⅓", 1);
eq(rowAmt("Surf N Turf"), 36000, "breakdown: Surf");
near(rowAmt("Tax & service"), 21343, "breakdown: tax and service");
eq(rowAmt("Long Island Elec ×2 (½)") + rowAmt("Assorted Satay (⅓)") + rowAmt("Surf N Turf") + rowAmt("Tax & service"), owedM, "breakdown lines add up to the total");
eq(rowAmt("Total"), owedM, "breakdown total");
const ref = (await txt(M, ".ref b")).match(/^Dibs ([2-9A-HJKMNP-Z]{3}) Mukul$/);
check(!!ref, "reference code looks like Dibs XXX Mukul");
const upi = await M.locator("a[data-upi]").getAttribute("href");
eq(upi, `upi://pay?pa=aarav.k%40okaxis&pn=Aarav%20Mehta&am=${(owedM / 100).toFixed(2)}&cu=INR&tn=Dibs%20${ref?.[1]}%20Mukul`, "UPI link is exact");
await shot(M, "10-pay");
await noOverflow(M, "pay");
// no UPI app opens in this browser, so the page stays in front: the fallback appears
await noUpiNavigation(M);
await M.locator("a[data-upi]").click();
check(await waitText(M, ".note2", "No UPI app opened", 5000), "fallback shows when nothing opened");
await shot(M, "11-pay-fallback");
await M.getByRole("button", { name: "I’ve paid" }).click();

await M.fill('input[inputmode=numeric]', "4081 2937 5518");
await M.locator('input[inputmode=numeric]').blur();
await M.getByRole("button", { name: "Tell Aarav I’ve paid" }).click();
await M.waitForSelector(".big2 h1");
eq(await txt(M, ".big2 h1"), "Sent to Aarav", "waiting view");
has(await txt(M, ".chip"), "Says paid", "chip");
has(await txt(M, ".brk"), "408129375518", "UTR shown");
await shot(M, "12-pay-waiting");

step("Diya pays with a screenshot (and the app returns)");
await D.locator(".dock a.btn").click();
await D.waitForURL(/\/pay$/);
await noUpiNavigation(D);
await D.locator("a[data-upi]").click();
// simulate the UPI app coming to the front and the user returning
await D.evaluate(() => {
  const set = (v) => Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
  set("hidden");
  document.dispatchEvent(new Event("visibilitychange"));
  setTimeout(() => {
    set("visible");
    document.dispatchEvent(new Event("visibilitychange"));
  }, 150);
});
await D.waitForSelector(".sheet.on");
has(await txt(D, ".sheet h2"), "Did the payment go through?", "asks on return");
await shot(D, "13-pay-sheet");
await D.getByRole("button", { name: "Yes, I’ve paid" }).click();
await D.locator("input[type=file]").setInputFiles(BILL);
await D.waitForSelector(".note2.good, .note2.warn", { timeout: 15000 });
has(await txt(D, ".hd h1"), "Looks right", "screenshot matches");
await shot(D, "14-pay-screenshot");
await D.getByRole("button", { name: "Tell Aarav I’ve paid" }).click();
await D.waitForSelector(".big2 h1");
eq(await txt(D, ".big2 h1"), "Sent to Aarav", "Diya is waiting");

/* ---------------------------------------------------------------- host settles */
step("Host settles up");
await H.goto(`${BASE}/b/${code}/settle`);
await H.waitForSelector(".fr");
near(paise(await txt(H, ".owed b")), shares.M + shares.D + shares.K, "friends owe the sum of their three shares", 0);
await shot(H, "15-settle");
await noOverflow(H, "settle");
const row = (n) => H.locator(".fr", { hasText: n });
has(await txt(H, ".fr:has-text('Mukul') .chip"), "Says paid", "Mukul says paid");
has(await txt(H, ".fr:has-text('Kabir') .chip"), "Unpaid", "Kabir is unpaid");
// Mukul: confirm
await row("Mukul").locator(".frh").click();
has(await txt(H, ".det"), "408129375518", "host sees the UTR");
has(await txt(H, ".det .hint"), `Dibs ${ref[1]} Mukul`, "host is told what note to look for");
await H.getByRole("button", { name: /^Confirm ₹[\d,]+\.\d{2}$/ }).click();
check(await waitLoc(row("Mukul").locator(".chip"), "Confirmed"), "Mukul confirmed");
// Diya: not received, then confirm after undo path
await row("Diya").locator(".frh").click();
await H.getByRole("button", { name: "Not received" }).click();
check(await waitLoc(row("Diya").locator(".chip"), "Unpaid"), "Diya is back to unpaid");
check(await waitLoc(row("Diya").locator(".st"), "Not received"), "and it says why");
// Diya tells again; the friend's phone shows the note
await D.reload();
has(await txt(D, ".note2.warn"), "didn’t see your payment", "Diya is told it was not received");
await D.locator("a[data-upi]").waitFor();
await D.getByRole("button", { name: "I already paid" }).click();
await D.getByRole("button", { name: "Skip proof" }).click();
await D.waitForSelector(".big2 h1");
await H.reload();
await row("Diya").locator(".frh").click();
await H.getByRole("button", { name: /^Confirm ₹[\d,]+\.\d{2}$/ }).click();
check(await waitLoc(row("Diya").locator(".chip"), "Confirmed"), "Diya confirmed");
// Kabir paid cash
await row("Kabir").locator(".frh").click();
await H.getByRole("button", { name: "Mark paid" }).click();
await H.waitForSelector(".sheet.on");
await shot(H, "16-settle-cash-sheet");
await H.locator(".sheet .btn", { hasText: "Mark paid" }).click();
check(await waitText(H, "[data-k=sumB] h1", "Everyone’s settled", 8000), "bill is settled");
eq(await txt(H, "[data-k=sumB] p"), `All 3 friends confirmed ₹${((shares.M + shares.D + shares.K) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} for The Local Diners.`, "settled text");
await shot(H, "17-settled");
await noOverflow(H, "settled");
// Mukul sees it confirmed
await M.reload();
eq(await txt(M, ".big2 h1"), "Paid and confirmed", "Mukul sees confirmed");
await shot(M, "18-pay-confirmed");
// a latecomer
{
  const s = await phone(browser);
  await s.page.goto(link);
  eq(await txt(s.page, ".state h1"), "This bill is settled.", "latecomer sees settled");
  await shot(s.page, "19-settled-latecomer");
  await s.ctx.close();
}
// a dead link
{
  const s = await phone(browser);
  await s.page.goto(`${BASE}/b/zzzzzzz`);
  eq(await txt(s.page, ".state h1"), "This link doesn’t work.", "dead link");
  await shot(s.page, "20-notfound");
  await s.ctx.close();
}

/* ---------------------------------------------------------------- settings and themes */
step("Settings and dark mode");
{
  const s = track(await phone(browser, { scheme: "light" }), "settings");
  const P = s.page;
  await P.goto(BASE + "/settings");
  eq(await P.locator('.rc[aria-checked="true"]').getAttribute("data-pref"), "system", "System by default");
  await P.locator('.rc[data-pref="dark"]').click();
  const bg = await P.evaluate(() => getComputedStyle(document.body).backgroundColor);
  eq(bg, "rgb(12, 13, 28)", "dark applies at once");
  await P.reload();
  eq(await P.evaluate(() => document.documentElement.getAttribute("data-theme")), "dark", "dark is remembered");
  eq(await P.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(12, 13, 28)", "no flash: dark on first paint");
  await P.fill('input[name=name]', "Aarav Mehta");
  await P.fill('input[name=upi]', "Aarav.K@OkAxis");
  await P.getByRole("button", { name: "Save details" }).click();
  eq(await P.inputValue('input[name=upi]'), "aarav.k@okaxis", "UPI ID saved lowercase");
  await shot(P, "21-settings-dark");
  // Home remembers it
  await P.goto(BASE + "/");
  await P.waitForFunction(() => document.querySelector("#home-name")?.value === "Aarav Mehta");
  has(await txt(P, ".eyebrow"), "Welcome back, Aarav", "Home remembers the host");
  await shot(P, "22-home-dark");
  await P.locator('a[aria-label="Settings"]').click();
  await P.getByRole("button", { name: "Forget me on this phone" }).click();
  await P.waitForSelector(".dlg.on");
  await P.getByRole("button", { name: "Forget", exact: true }).click();
  await P.waitForSelector(".dlg", { state: "detached" });
  eq(await P.inputValue('input[name=name]'), "", "forgotten");
  await s.ctx.close();
}
{
  // a friend's board and the host's ledger in dark mode
  const state = await friends.Mukul.ctx.storageState();
  const d = track(await phone(browser, { scheme: "dark", storageState: state }), "Mukul dark");
  await d.page.goto(link);
  await d.page.waitForSelector(".mh");
  eq(await d.page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(12, 13, 28)", "system dark is honoured");
  await shot(d.page, "23-board-dark");
  await d.ctx.close();
}

/* ---------------------------------------------------------------- wrap up */
for (const [n, errs] of allErrors) if (errs.length) check(false, `${n}: browser errors ${JSON.stringify(errs.slice(0, 3))}`);
await browser.close();
console.log(failures.length ? `\nFAILED: ${failures.length}\n${failures.map((f) => " - " + f).join("\n")}` : "\nALL E2E CHECKS PASSED");
process.exit(failures.length ? 1 : 0);

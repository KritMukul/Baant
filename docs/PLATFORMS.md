# Dibs · Platforms

**Current scope (updated 2026-10-06): one Next.js web app, primarily mobile-focused.** Phone is the design target. Tablet and desktop adapt the same screens; they are not separate products. Native apps are on hold.

| Surface | Status | Role |
|---|---|---|
| Web (Next.js) | **Built (v0.1, for test deploys)** | **Mobile first**, installable as a PWA. The eight approved phone screens work end to end. Tablet and desktop layouts are not built yet (wider windows show the phone column centred). Payments by UPI link on phones; the QR on the Share screen is for joining |
| Android (Kotlin, Compose) | On hold | Parked. `docs/design/brand-kit/tokens.kt` and the shared vectors are kept so it can restart quickly |
| iOS (Swift, SwiftUI) | On hold | Later, if ever |

Earlier today the plan was web for desktop/tablet plus a native Android app. That was changed the same day: the web app now also covers phones, so the "phone web is only a fallback" rule no longer applies. Phone is the primary layout.

## Architecture

> **Today** the web app uses Next.js Server Actions over a `Store` (in-memory for development, Postgres via `DATABASE_URL` for real: Supabase's connection string or any Postgres). All reads and writes go through the server; the database has row-level security on with no policies, so the anon key reads nothing. Open screens poll `/api/b/{code}/state` every 3 seconds (no Realtime). The multi-client REST layer below is the **parked** design for when a native app restarts.

```
 Android (Kotlin)          Web (Next.js)           iOS (later)
        \                       |                     /
         \________ REST: /api/v1/* ___________________/
                          |
                  Next.js route handlers  ──►  Vision LLM (parse)
                          |
                 Postgres (Supabase or your own)  ◄── clients poll /state
```

- **One backend.** Postgres for data; Next.js route handlers for everything that needs a secret.
- **Server Actions become REST.** Today `src/app/actions.ts` uses Server Actions, which native apps cannot call. Move the logic into plain functions, expose them as `/api/v1/*` route handlers, and keep the Server Actions as thin wrappers for the web UI.
- **Auth stays capability-based.** Host token and participant token (already in `bill_secrets` and `participant_secrets`), sent as `Authorization: Bearer`. Android keeps them in DataStore with encryption. No accounts.
- **Live updates.** The web polls `GET /api/b/{code}/state` (about 3 seconds, paused when the tab is hidden). A native app would poll the same endpoint, or Realtime/SSE could be added later.

### API surface (v1)

| Method and path | Who | Does |
|---|---|---|
| `POST /api/v1/bills` (multipart image, name, vpa) | host | Parse, validate, create. Returns bill, items, `hostToken`, `code` |
| `GET /api/v1/bills/{code}` | anyone | Bill, items, participants, claims |
| `POST /api/v1/bills/{code}/join` | guest | Returns `participantId`, `token` |
| `PUT /api/v1/bills/{code}/claims/{itemId}` / `DELETE` | participant | Idempotent claim and release |
| `PATCH /api/v1/bills/{code}/items/{itemId}`, `POST`, `DELETE` | host | Edit scanned items |
| `PUT /api/v1/bills/{code}/payments/me` | participant | "I've paid" |
| `PUT /api/v1/bills/{code}/payments/{participantId}` | host | Mark paid |

Server stays the authority for parsing and validation. Clients compute shares locally from the same inputs.

## Logic parity (parked: for a future Kotlin or Swift port)

The money logic is small and exact: `allocate`, `splitBill`, `simplifyDebts`, `balancesFromBills`, `upiLink`, `validateBill`. It lives in `src/lib/` (TypeScript). Ports are checked against **`docs/spec/vectors.json`**, generated from the TypeScript by `scripts/gen-vectors.mts`; `src/lib/vectors.test.ts` keeps TypeScript honest. A Kotlin port is done when a unit test reading the same JSON passes unchanged. Money is always integer paise.

**Known property to design around:** `splitBill` spreads tax, service and discount over the *claimed* subtotal only. Until every item is claimed, each person's share is provisional and will drop as others claim. Worked example (`docs/spec/examples/local-diners.json`, tested): with 3 of 8 items still unclaimed Mukul's share reads ₹1,092.58, and it falls to ₹1,000.09 once the last items are claimed. Showing a provisional figure that does not move would be wrong, and so would letting someone pay it. The UI says so ("Final once everything is claimed") and the pay button should wait or warn.

## Payments

Payments are UPI deep links and QR codes. No gateway, no fees, and **no confirmation**: Dibs cannot see whether a transfer happened.

- **Pay by QR (web, desktop and tablet).** The host console shows, per person, a large QR that encodes the same `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…` string as the phone button. The friend scans it with their phone's UPI app or camera. It cannot be scanned by the same device it is shown on, so on a phone the web page shows the button, not a QR.
- **Join by QR.** The console header shows a QR of `/b/{code}`. A friend scans it with the camera and lands on the web claim page.
- **Phone web.** The UPI button is a plain `upi://pay?...` link. On Android it opens the system chooser. On iOS it may or may not (see risks).
- **Paid state.** Add a `payments` table (`participant_id`, `status`, `paid_at`, `utr`, `proof_url`). See the next section for how far "paid" can be trusted.

### Can Dibs make sure a payment happened?

**Not with plain UPI links and QR codes.** The money moves between the friend's bank and the host's bank; Dibs only hands over a pre-filled request and sees nothing back. The options, from weakest to strongest guarantee:

| Level | What it is | What it proves | Cost |
|---|---|---|---|
| 0 | Friend taps "I've paid" | Nothing, it is a claim | Free |
| 1 | **Reference code in the UPI note** (`tn`, for example `Dibs 7K2 Mukul`) | Lets the host match the bank notification to the person at a glance. Proves nothing alone | Free |
| 2 | Friend adds the **UTR** (12-digit UPI reference) and/or a **screenshot**; Dibs reads the screenshot with the vision model and checks amount, payee, status and time against what was expected | Catches honest mistakes (wrong amount, wrong person, failed payment, old screenshot). A determined friend can fake a screenshot | Free; one vision call per proof |
| 3 | **Host confirms** ("Mark paid") after seeing it in their bank app, with the expected amount, name and reference code on screen | This is the real check today. Only the host's bank statement is ground truth | Free |
| 4 | **Payment gateway** (for example dynamic QR plus webhooks, as in Razorpay's [QR code API](https://razorpay.com/docs/payments/payment-methods/upi-qr/api)) | A server-to-server confirmation per payment | Needs a business account and KYC, money passes through the gateway, then has to reach the host, fees may apply. Changes the product (no longer "no gateway, no fees") and may carry regulatory duties. Get advice before choosing it |

Ruled out or not available here:
- **UPI collect requests between people** (Dibs asking the friend's app to pull money): NPCI told banks and apps to stop P2P collect from 1 October 2025 ([report](https://www.theweek.in/wire-updates/business/2025/08/14/dcm65-biz-npci-collect.html)). Merchant collect continues, which is a gateway path.
- **Payment result from the UPI app**: on native Android, apps can return `Status`/`txnId` to the caller ([overview](https://proandroiddev.com/upi-payment-flow-on-android-from-uri-construction-to-result-verification-f39ecfc26ad6)), but a web page gets nothing back, and the response is not proof. Parked with the Android app.
- **Reading the host's bank SMS or notifications**: Android only, invasive, and fragile.

**Recommended now:** levels 0 to 3 together. Friend taps "I've paid" (optionally with UTR or screenshot), Dibs checks what it can, the host confirms. The host's ledger shows each person as *Unpaid*, *Says paid* or *Confirmed*, and the bill as settled only when every share is *Confirmed*. Choosing level 4 is a separate business decision.

### Biggest product risk: verify on real devices before building more

UPI apps apply their own risk checks. A link or QR to a **personal VPA with a preset amount** may be declined, capped, or shown with a warning by some apps or banks, and behaviour differs between GPay, PhonePe, Paytm, BHIM and by bank. I have not tested this and cannot from here. On **iPhone**, a plain `upi://` link in Safari is less reliable than on Android: it depends on which UPI apps are installed and how they register their schemes. That matters more now that the phone experience is the web app. Do a quick test with small real amounts (₹1 to ₹10 and one near ₹1,000) through each app, via both the intent link on a phone and a QR from a second screen, before investing in the payment screens.

## Layouts

**Design and test on a phone first.** Every screen is drawn at about 390px wide. Wider screens reuse the same components and add only what space allows.

| Width | Layout | Pay |
|---|---|---|
| < 768px (phone) | Single column. Claim board, then a bottom pay sheet. **This is the product.** | **UPI button** (opens the user's UPI app). No QR: a phone cannot scan its own screen |
| 768–1199px (tablet) | Same single column, centred at a comfortable width (about 560px), or two panes when landscape and wide enough | UPI button, plus an optional **Show QR** for a friend to scan |
| ≥ 1200px (desktop) | Centred column with the Pay panel beside it; join QR in the header | **QR** (a desktop has no UPI app) |

Rules: no feature exists only on large screens, touch targets stay 44px and up everywhere, and the large-screen QR is a convenience layered on top of the phone flow. All of it uses one token set (`tokens.css`); light and dark both ship, with a Light · Dark · System toggle.

## PWA (matters more now that phones use the web app)

Installable (manifest and icon exist), a service worker for the app shell, the Web Share API for sending the bill link, and `theme-color` per theme. Offline is not a goal: claiming needs the network.

## Build order (web only)

0. **Contract** — shared vectors. *Done, kept for a future native app.*
1. **Real-device UPI test** — see the risks above. Cheap, and may change the payment design. **Include an iPhone** if any user will be on iOS.
2. **Design, Step 5** — phone screens, one at a time: home/scan, host fixes the scan, claim board, pay, join, paid/settled, settings. *Done and approved (eight screens).* The pass that adapts them for tablet and desktop (centred column, optional QR panel) is **paused** until the phone build has been tested on real phones.
3. **Web implementation** — *Built:* all eight phone screens, QR (the `qrcode` package), payments table with the I've-paid / confirm flow, screenshot reading, theme toggle, manifest. *Not yet:* service worker, wide layouts. See `docs/DEPLOY.md`.
4. *(Paused)* API extraction to `/api/v1/*`, Android, iOS. Server Actions stay as they are until a native app restarts.

## Open decisions

- Production domain (needed for share links and the PWA).
- Whether the QR panel appears on tablets by default or only after tapping "Show QR" (current plan: only after tapping).

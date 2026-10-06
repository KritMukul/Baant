# Dibs · Platforms

**Current scope (updated 2026-10-06): one responsive Next.js web app, for phone, tablet and desktop.** Native apps are on hold.

| Surface | Status | Role |
|---|---|---|
| Web (Next.js) | **Building** | Phone, tablet and desktop in one responsive app, installable as a PWA. Payments by UPI button on phones, **QR on tablet and desktop** |
| Android (Kotlin, Compose) | On hold | Parked. `docs/design/brand-kit/tokens.kt` and the shared vectors are kept so it can restart quickly |
| iOS (Swift, SwiftUI) | On hold | Later, if ever |

Earlier today the plan was web for desktop/tablet plus a native Android app. That was changed the same day: the web app now also covers phones, so the "phone web is only a fallback" rule no longer applies. Phone is a first-class layout again.

## Architecture

> **Today** the web app talks to Supabase directly and uses Next.js Server Actions. The multi-client REST layer below is the **parked** design for when a native app restarts.

```
 Android (Kotlin)          Web (Next.js)           iOS (later)
        \                       |                     /
         \________ REST: /api/v1/* ___________________/
                          |
                  Next.js route handlers  ──►  Vision LLM (parse)
                          |
                 Supabase: Postgres + Realtime  ◄── clients subscribe (read-only anon)
```

- **One backend.** Supabase for data and Realtime; Next.js route handlers for everything that needs a secret.
- **Server Actions become REST.** Today `src/app/actions.ts` uses Server Actions, which native apps cannot call. Move the logic into plain functions, expose them as `/api/v1/*` route handlers, and keep the Server Actions as thin wrappers for the web UI.
- **Auth stays capability-based.** Host token and participant token (already in `bill_secrets` and `participant_secrets`), sent as `Authorization: Bearer`. Android keeps them in DataStore with encryption. No accounts.
- **Realtime.** Clients subscribe to `claims`, `participants`, `items` filtered by `bill_id`, as the web does. Android uses supabase-kt.

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

**Known property to design around:** `splitBill` spreads tax, service and discount over the *claimed* subtotal only. Until every item is claimed, each person's share is provisional and will drop as others claim. The UI says so ("Final once everything is claimed") and the pay button should wait or warn.

## Payments

Payments are UPI deep links and QR codes. No gateway, no fees, and **no confirmation**: Dibs cannot see whether a transfer happened.

- **Pay by QR (web, desktop and tablet).** The host console shows, per person, a large QR that encodes the same `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…` string as the phone button. The friend scans it with their phone's UPI app or camera. It cannot be scanned by the same device it is shown on, so on a phone the web page shows the button, not a QR.
- **Join by QR.** The console header shows a QR of `/b/{code}`. A friend scans it with the camera and lands on the web claim page.
- **Phone web.** The UPI button is a plain `upi://pay?...` link. On Android it opens the system chooser. On iOS it may or may not (see risks).
- **Paid state.** Add a `payments` table (`participant_id`, `status`, `paid_at`). The friend taps "I've paid", the host confirms with "Mark paid" after checking their bank app.

### Biggest product risk: verify on real devices before building more

UPI apps apply their own risk checks. A link or QR to a **personal VPA with a preset amount** may be declined, capped, or shown with a warning by some apps or banks, and behaviour differs between GPay, PhonePe, Paytm, BHIM and by bank. I have not tested this and cannot from here. On **iPhone**, a plain `upi://` link in Safari is less reliable than on Android: it depends on which UPI apps are installed and how they register their schemes. That matters more now that the phone experience is the web app. Do a quick test with small real amounts (₹1 to ₹10 and one near ₹1,000) through each app, via both the intent link on a phone and a QR from a second screen, before investing in the payment screens.

## Layouts

| Width | Layout | Pay |
|---|---|---|
| < 768px (phone) | Single column. Claim board, then a bottom pay sheet | **UPI button** (opens the user's UPI app). A QR is not shown: a phone cannot scan its own screen |
| 768–1199px (tablet) | Two panes: claim board left, Pay panel right (a side sheet below 900px) | **QR** for a friend to scan, plus the UPI button if the tablet has UPI apps |
| ≥ 1200px (desktop) | Two panes: bill and claim board left, **Pay panel** right with a person picker and a large QR. Join QR in the header | **QR** |

All of it uses one token set (`tokens.css`). Light and dark both ship; the toggle is Light · Dark · System.

## PWA (matters more now that phones use the web app)

Installable (manifest and icon exist), a service worker for the app shell, the Web Share API for sending the bill link, and `theme-color` per theme. Offline is not a goal: claiming needs the network.

## Build order (web only)

0. **Contract** — shared vectors. *Done, kept for a future native app.*
1. **Real-device UPI test** — see the risks above. Cheap, and may change the payment design. **Include an iPhone** if any user will be on iOS.
2. **Design, Step 5** — responsive screens, one at a time: home/scan, host fixes the scan, claim board, pay (button and QR variants), join, paid/settled, empty and error states. Phone first, then tablet and desktop.
3. **Web implementation** — layouts, QR (`qrcode.react`), payment status table, PWA.
4. *(Paused)* API extraction to `/api/v1/*`, Android, iOS. Server Actions stay as they are until a native app restarts.

## Open decisions

- Production domain (needed for share links and the PWA).
- Whether the QR panel appears on tablets by default or only after tapping "Show QR".

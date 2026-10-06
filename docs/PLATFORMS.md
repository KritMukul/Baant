# Dibs · Platforms

**Decision, 2026-10-06.** Dibs ships on three surfaces, in this order:

| Surface | Stack | Role |
|---|---|---|
| Web | Next.js (existing) | Desktop and tablet. Host console, claim board, **payments by QR** scanned with a phone |
| Android | Kotlin, Jetpack Compose | Phone app, built first. Native UPI intent, App Links to open shared bills |
| iOS | Swift, SwiftUI | Later, if there is time |

**One rule that follows from this:** the web app must still work on a phone. A guest taps a link with no signup, and on iOS (until the Swift app exists) and on Android without the app installed, that link opens the web claim page. The desktop and tablet layouts are where design effort goes; the phone layout stays as the fallback.

## Architecture

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

## Logic parity (Kotlin and Swift must match TypeScript)

The money logic is small and exact: `allocate`, `splitBill`, `simplifyDebts`, `balancesFromBills`, `upiLink`, `validateBill`. It lives in `src/lib/` (TypeScript). Ports are checked against **`docs/spec/vectors.json`**, generated from the TypeScript by `scripts/gen-vectors.mts`; `src/lib/vectors.test.ts` keeps TypeScript honest. A Kotlin port is done when a unit test reading the same JSON passes unchanged. Money is always integer paise.

**Known property to design around:** `splitBill` spreads tax, service and discount over the *claimed* subtotal only. Until every item is claimed, each person's share is provisional and will drop as others claim. The UI says so ("Final once everything is claimed") and the pay button should wait or warn.

## Payments

Payments are UPI deep links and QR codes. No gateway, no fees, and **no confirmation**: Dibs cannot see whether a transfer happened.

- **Pay by QR (web, desktop and tablet).** The host console shows, per person, a large QR that encodes the same `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…` string as the phone button. The friend scans it with their phone's UPI app or camera. It cannot be scanned by the same device it is shown on, so on a phone the web page shows the button, not a QR.
- **Join by QR.** The console header shows a QR of `/b/{code}`. A friend scans it: Android opens the app via an App Link if installed, otherwise the web claim page.
- **Android.** `ACTION_VIEW` on the `upi://` URI opens the system UPI chooser. Some apps return a status; treat it as a hint, never as proof.
- **Paid state.** Add a `payments` table (`participant_id`, `status`, `paid_at`). The friend taps "I've paid", the host confirms with "Mark paid" after checking their bank app.

### Biggest product risk: verify on real devices before building more

UPI apps apply their own risk checks. A link or QR to a **personal VPA with a preset amount** may be declined, capped, or shown with a warning by some apps or banks, and behaviour differs between GPay, PhonePe, Paytm, BHIM and by bank. I have not tested this and cannot from here. Do a quick test with small real amounts (₹1 to ₹10 and one near ₹1,000) through each app, via both the intent link on a phone and a QR from a second screen, before investing in the payment screens.

## Layouts

| Width | Where | Layout |
|---|---|---|
| ≥ 1200px | Desktop web | Two panes. Left: bill and claim board. Right: **Pay** panel with a person picker and a large QR, plus the join QR in the header |
| 768–1199px | Tablet web | Same two panes, narrower; the Pay panel collapses to a side sheet below 900px |
| < 768px | Phone web (fallback) | Single column, as designed in Step 2 |
| Phone | Android (and iOS later) | Native, single column; the pay sheet is a bottom sheet with the UPI button |

All of it uses one token set. The web reads `tokens.css`, Android reads `tokens.kt` (generated from the same source as the CSS, TS and JSON). Light and dark both ship; the app toggle is Light · Dark · System.

## Build order

0. **Contract** — shared vectors. *Done.*
1. **API extraction** — plain functions, `/api/v1/*`, token auth, tests. Unblocks everything else.
2. **Real-device UPI test** — see the risk above. Cheap, and may change the payment design.
3. **Design, Step 5a** — desktop and tablet screens (host console with QR pay panel, join QR, claim board, edit scan).
4. **Web implementation** — layouts, QR (`qrcode.react`), payment status.
5. **Design, Step 5b** — Android screens.
6. **Android** — Gradle project, theme from `tokens.kt`, API client, claim board, pay sheet, App Links.
7. **iOS** — later.

## Open decisions

- Android application ID and domain for App Links (placeholder `app.dibs`; needs a real domain).
- Minimum Android version (suggest API 26+).
- Whether the web phone fallback gets any further design work, or stays as is until the iOS app exists.

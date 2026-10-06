# Dibs

Call dibs on what you ate. Photograph the bill, share a link, everyone taps their items, everyone pays by UPI.

## Flow
1. The host uploads a photo and enters their name and UPI ID. A vision model parses the bill into structured JSON.
2. `validateBill` checks that items + tax + service − discount equals the total. On a mismatch the host sees a banner and can edit the items.
3. The link `/b/<code>` is shared with the group. Guests join with just a name (no signup).
4. People call dibs by tapping items; shared items split equally. Supabase Realtime shows every tap to everyone.
5. Tax, service charge and discount are split in proportion to each person's items (largest-remainder rounding, exact to the paisa). Each person gets a `upi://pay` button.

## Code map
- `src/lib/money.ts` – paise helpers, exact `allocate`
- `src/lib/split.ts` – item and charge split
- `src/lib/settle.ts` – greedy min-cash-flow debt simplification (for multi-bill trips; not wired into the UI yet)
- `src/lib/upi.ts` – UPI deep link
- `src/lib/parseBill.ts` – vision parsing (Claude, OpenAI or Gemini)
- `src/app/actions.ts` – server actions (create, join, claim, host edit)
- `supabase/schema.sql` – tables, RLS, realtime publication
- `docs/design/brand-kit/` – design tokens (light and dark), logo, brand book

## Setup
```
cp .env.example .env.local   # fill in the keys
# run supabase/schema.sql in the Supabase SQL editor
npm install && npm run dev
npm test
```

## Parse test
`npm run parse-bills [dir]` (default `fixtures/bills`). Inside the cloud sandbox, behind the proxy:
`NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npm run parse-bills`.

## Security model (MVP)
Writes only happen in server actions (service role). The host has a `host_<code>` cookie checked against `bill_secrets`; guests have tokens in `participant_secrets`. Anonymous clients are read-only (needed for Realtime); bill codes are unguessable.

## Not done yet
Trip/group UI using `simplifyDebts`, Supabase Auth for the host, PWA service worker and offline, per-unit quantity splits, rate limiting on bill creation, and wiring the brand-kit tokens and light/dark toggle into the app.

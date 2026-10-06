# Baant

Bill ki photo kheencho, link share karo, sab apne items tap karein, UPI se pay karein.

## Flow
1. Host photo upload karta hai (+ naam, UPI ID). Claude vision bill ko structured JSON mein parse karta hai.
2. `validateBill` check karta hai: items + tax + service − discount == total. Mismatch pe host ko banner dikhta hai aur wo items edit kar sakta hai.
3. Link `/b/<code>` group mein share hota hai. Guests naam daal ke join karte hain (no signup).
4. Items tap karke claim karo; shared items equally split. Supabase Realtime se sabko live dikhta hai.
5. Tax/service/discount proportional split (largest-remainder, paise exact). Har banda `upi://pay` button dabata hai.

## Code map
- `src/lib/money.ts` – paise helpers, exact `allocate`
- `src/lib/split.ts` – item + charge split
- `src/lib/settle.ts` – greedy min-cash-flow debt simplification (multi-bill trips ke liye; UI abhi connected nahi)
- `src/lib/upi.ts` – UPI deep link
- `src/lib/parseBill.ts` – vision parsing (tool use for structured output)
- `src/app/actions.ts` – server actions (create, join, claim, host edit)
- `supabase/schema.sql` – tables, RLS, realtime publication

## Setup
```
cp .env.example .env.local   # keys bharo
# supabase/schema.sql ko Supabase SQL editor mein run karo
npm install && npm run dev
npm test
```

## Security model (MVP)
Writes sirf server actions se (service role). Host cookie `host_<code>` + `bill_secrets`; guests ke `participant_secrets` tokens. Anon sirf read (Realtime ke liye); bill code unguessable hai.

## Baaki
Trip/group (multiple bills) UI + `simplifyDebts`, Supabase Auth for host, PWA service worker/offline, per-item qty split, rate limit on `/createBill`.

# Dibs

Photograph a restaurant bill, share a link, and everyone calls dibs on what they ate and pays their own share by UPI. No sign-up for friends.

Phone-first web app: Next.js (App Router) and Postgres. A vision model reads the bill photo. Payments are `upi://pay` links straight to the host: Dibs never holds money and cannot see whether a transfer happened, so friends say "I've paid" (with an optional UTR or screenshot) and the host confirms in the bank app.

## How it works

1. **Host** photographs the bill, enters a name and UPI ID, and checks the scan against the bill's own total (fixes anything wrong).
2. **Share** the link on WhatsApp, or show the QR to the table.
3. **Friends** open the link, type a name, and tap their items. Shared items split on their own; tax and service follow each person's items.
4. When everything is claimed the shares are final. Each friend pays the host by UPI with a reference note like `Dibs 7K2 Mukul`.
5. The host sees who has paid, confirms each payment, and the bill settles when everyone is confirmed.

## Try it

```bash
npm install
cp .env.example .env
# no database and no API key needed to click through:
DIBS_STORE=memory BILL_PARSER=stub npm run dev      # http://localhost:3000
```

`BILL_PARSER=stub` returns a built-in sample bill (The Local Diners, Rs 3,280.00). With a key (`GEMINI_API_KEY`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) it reads your photo.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | The app |
| `npm test` | Rules, money maths, shared vectors, storage contract (memory; add `DIBS_TEST_DATABASE_URL=postgres://...` to run it on a real Postgres too) |
| `npm run typecheck` | TypeScript |
| `npm run db:init` | Create the tables in the database from `DATABASE_URL` |
| `npm run smoke` | Walk a test bill through a whole evening against your database |
| `npm run e2e:full` | Build, start on an in-memory store, run the whole flow on phone-sized browsers (set `CHROMIUM_PATH` if needed) |
| `npm run parse-bills` | Run the bill reader over `fixtures/bills/` |

## Deploying

See [`docs/DEPLOY.md`](docs/DEPLOY.md): Docker Compose with automatic HTTPS, plain Node, or Supabase's database, plus the real-device UPI test plan.

## Layout

```
src/lib/       money, split engine, bill checks, payment states, UPI links, vision (pure, tested)
src/server/    storage (memory + Postgres), the rules (service.ts), sessions
src/app/       screens: Home, Check, Share, Join, Board, Pay, Settle, Settings
supabase/      schema.sql (any Postgres), drop-mvp.sql
docs/design/   brand kit, tokens; docs/spec/ shared test vectors; docs/PLATFORMS.md
e2e/           phone-sized end-to-end test
```

## Design

The approved phone designs (light and dark) are in `.superpowers/brainstorm/s1/content/round5-*.html`; the process and decisions are in `.claude/skills/moodforge/projects/dibs.md`. Tablet and desktop layouts are not built yet: wider windows show the phone column centred.

## Before a public launch

- Clear the name "Dibs" with a trademark search (several existing marks; see the design notes).
- Write the privacy policy and terms (`/privacy` is a placeholder).
- Test real UPI payments on real phones, Android and iPhone (see `docs/DEPLOY.md`).

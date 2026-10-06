# Dibs · Design State

**Last updated:** 2026-10-06
**Current phase:** Step 5 — All Screens, screen 4 (Settle ledger) awaiting approval; Pay re-issued with corrected numbers (phone first; see locked decisions 13, 14, 15, 16)
**Status:** in_progress

---

## Current Direction

**Night Tab (B)** — indigo-black ground, peach accent, Sora + JetBrains Mono, thumb-size pill CTA. Dark is the approved look; a light twin is being validated.

## Locked Decisions

1. Real data only: Indian restaurant bills, real item names and ₹ amounts (fixtures in `fixtures/bills/`).
2. Pay button always shows the exact rupee amount and the host's name.
3. Direction: Night Tab (B), chosen round 1.
4. Both themes ship; the app gets a Light · Dark · System toggle.
5. Dark palette is locked as shown in round 1: #0c0d1c ground, #171a30 surface, #ffb59a peach, #8fa4ff periwinkle.
6. Fonts: Sora (UI), JetBrains Mono (all digits and ₹).
7. Light accent: Coral #ff6b4a with WHITE label on the primary button (round 2c, "lets go with coral only"). Known AA exception (2.82:1); mitigated by accentEdge #d9431a outline. Do not silently change; offer #e02900 or dark label as the AA fix if asked.
8. Light ground #f5f4fb, surface #ffffff, accentText #c2371a.
9. Language: English only. No Hinglish anywhere in the product copy, brand kit or app (user, round 3: "we will not include hinglish only english").
16. **Name stays Dibs for now (user: "abhi dibs ke saath continue")**, public launch gated on a trademark clearance search (found: Teleperformance D.i.b.s. device mark across classes 9/35/36/38/41/42/45, DIBS Technology Pune software firm, Class 25 DIBS, legacy DIBS Payment Services Nordic). User bought krit.website (not dibs.website), so share links will be krit.website/b/<code>.
15. **Payment verification = levels 0-3 (user: "approved, levels 0-3")**: friend taps I've paid; reference code in the UPI note (Dibs 7K2 Mukul); optional UTR (12 digits) and/or screenshot read by the vision model (amount, payee, status, time); host confirms in their bank app. Per person: Unpaid / Says paid / Confirmed; bill is Settled only when everyone is Confirmed. Gateway (level 4) NOT chosen. Claim board approved with: Pay off until all claimed, qty lines claimed whole, no undo timer.
14. **Mobile first (user: "next app bhi primarily mobile focused hi rahegi"):** the Next.js app is primarily mobile-focused. Phone is the design target (about 390px); tablet and desktop only adapt the same screens (centred column, optional QR panel). No feature exists only on large screens. Refines decision 13.
13. **Scope narrowed (2026-10-06, later the same day; user: "hold off the android app and next app hi rakhte hai for now, mobile me bhi vhi rakh lenge"):** ONE responsive Next.js app for phone, tablet and desktop. Android and iOS are on hold (tokens.kt and shared vectors kept, parked). Phone web is first-class again, installable as a PWA. Pay: UPI button on phones, QR on tablet and desktop. Step 5 is one responsive set of screens, phone first. Supersedes the platform split in decision 12.
12. **Platforms (superseded by 13) (2026-10-06, user: "all this is fine so I am changing the scope a little"):** Next.js web for desktops and tablets, with payments by QR scanned from a phone; native Android app in Kotlin first; iOS in Swift later if there is time. Phone web stays as the no-signup fallback. Step 4 (motion) approved as shown. Step 5 splits into 5a desktop and tablet screens (host console with QR pay panel, join QR, claim board, edit scan) and 5b Android screens. Details: `docs/PLATFORMS.md`.
11. **Logo: mark C** (round 4 of logo exploration, user: "I Like C the most"): a D built from a torn receipt (ink) and half a plate (accent). In the lockup the mark is the capital D, then "ibs" in Sora Bold. Rejected logo directions, never re-propose: three-slice pie, pulled slice, D half-plate with dot, speech bubble, claimed receipt, raised hand, reserved tag, flag in plate, bitten coin, plate-d (d + knife), split D. The "claim dot" (coral dot with soft rings) stays as a brand device for the "you" moment, not a logo.
10. **Name: Dibs** (renamed from Dibs, round 3). Tagline: "Call dibs. Split the bill." Claim copy: "Call dibs", "You have dibs", "Up for grabs". Rejected names, never re-propose: Quits, Fairplate, Clink, Evenly, Halfsies, TapSplit, SnapSplit, BillSplit, Forkout, GoDutch, Pieceful, WhoAte, Platemates, Checkmates, Bitewise, Billmates, Yourbite, Plink, Halfplate, Bagsy, Chopchop, Carve (not chosen; user picked Dibs).

## Rejected Directions

1. **A Thermal Slip, C Truck Art, D Sticker Pop, E Clear Fold** (round 1) — not chosen. User picked B: "go for B".

## Preserved

*(none yet)*

## Open Questions

1. Does the light version (round 2) feel like the same product as the dark one?
2. Interpreted "in Light mode the designs are good keep this for dark" as: the dark design is approved as-is; confirm that reading.

## Inspiration sources

None given. Round 1 was "propose blind" from product analysis.

## Product analysis

Bill splitter for Indian friend groups. Host photographs bill, guests (no signup) tap their items on their own phones, then pay the host by UPI deep link. Used at a table, one-handed, dim light. Total and own share must always be the largest numbers on screen.

## Rounds Log

### Round 1 — 2026-10-06

**Step:** 1 (Discovery & Design Direction)
**Skills loaded:** moodforge, artifact-design (superpowers:brainstorming, frontend-design, bolder etc. not installed in this environment)
**Concept:** 5 worlds on one claim-board scaffold: A Thermal Slip (receipt paper, safe-ish), B Night Tab (dark indigo + peach), C Truck Art (ambitious), D Sticker Pop (neo-brutal), E Clear Fold (safe fintech).
**File:** `.superpowers/brainstorm/s1/content/round1-directions.html`
**User reaction:** "go for B ... keep this for dark and make a light version of it as well and we will add toggle in app"
**Outcome:** APPROVED B. Others not chosen.

### Round 2 — 2026-10-06

**Step:** 2 (Screen Preview)
**Skills loaded:** moodforge, artifact-design
**Concept:** Night Tab in dark + new light twin; 3 real screens each (claim board with live share maths, pay sheet, host fixes the scan with a ₹52.22 mismatch from the Liquor Street fixture).
**File:** `.superpowers/brainstorm/s1/content/round2-night-tab-preview.html`
**Light palette:** ground #f5f4fb, surface #fff, text #14152b, muted #5b5f80, peach fill #ff9b78, peach text #b83f17, periwinkle #4a5fd0. All text pairs ≥4.5:1 (checked).
**User reaction:** pending
**Outcome:** pending

### Round 2b — 2026-10-06

**Step:** 2 (iteration)
**Concept:** light accent too washed out (#ff9b78 on #f5f4fb is 1.9:1). Three stronger options: A Coral #ff6b4a (dark btn text), B Tangerine #d2400f (white btn text), C Rose #f0527a (dark btn text).
**File:** `.superpowers/brainstorm/s1/content/round2b-light-accent.html`
**User reaction (round 2):** "light me peach thoda off lag rha hai"
**Outcome:** pending pick. Dark peach #ffb59a stays locked.

### Round 2c — 2026-10-06

**Step:** 2 (iteration)
**Concept:** user picked Coral (A) and asked for white button text. #ff6b4a + white = 2.82:1 (fails AA). Shown as asked, plus Deep coral #e02900 + white = 4.68:1.
**File:** `.superpowers/brainstorm/s1/content/round2c-coral-white.html`
**User reaction (2b):** "coral me text white karna"
**User reaction:** "lets go with coral only"
**Outcome:** APPROVED Coral #ff6b4a, white label (A).

### Round 3 — 2026-10-06

**Step:** 3 (Brand Kit)
**Skills loaded:** moodforge, artifact-design
**Concept:** Night Tab brand kit, both themes, one generated token source.
**File:** `docs/design/brand-kit/index.html` (+ tokens.css/ts/json, README.md, assets/)
**Checks:** tokens.ts compiles under tsc --strict; tokens.json parses; SVGs well-formed; page has no horizontal overflow at 400px or 1200px, no console errors; contrast matrix computed for 14 pairs x 2 themes (1 approved exception).
**User reaction:** "this is fine but we will not include hinglish only english and we will rename the app"
**Outcome:** APPROVED with changes: Hinglish removed from kit and app copy; renamed to Dibs ("go with Dibs"). Kit, app, README regenerated.

### Round 3b — 2026-10-06

**Step:** 3 (iteration)
**Concept:** logo. Eleven concepts over four rounds; user picked C (receipt + half-plate D) even though the designer's pick was the plate-d.
**Files:** `docs/design/brand-kit/assets/*.svg`, `src/app/icon.tsx` (PWA/favicon), `index.html` logo section regenerated.
**Checks:** next build clean; /icon returns 200 image/png and renders the mark; kit page no overflow at 400/1100px.
**Outcome:** APPLIED.

### Round 4 — 2026-10-06

**Step:** 4 (Animation Review)
**Skills loaded:** moodforge (emil-design-eng motion rules from SKILL.md; GSAP 3.12.5 + ScrollTrigger from cdnjs)
**Concept:** Motion gallery with brand tokens: 4-question rules, easing plotter (3 use, 2 banned), the tap (claim dot + ripple + share crossfade), buttons, pay sheet, dialog, toast stack, popover, screen + theme transitions, scroll-scrubbed rings, broken-on-purpose, Reduced motion and Slow-mo 1x/2x/4x controls.
**File:** `.superpowers/brainstorm/s1/content/round4-animations.html`
**Checks:** all demos exercised headlessly (claim math 457.67 -> 661.09, sheet open/close flush, toast stack, popover, screen swap, slow-mo 4x = 1280ms, reduced motion, dark theme, scroll rings); no JS errors; no overflow at 400px. Not tested on a real phone; GSAP loaded from cdnjs (blocked in the sandbox, tested with the same version from npm).
**User reaction:** "all this is fine"
**Outcome:** APPROVED. Scope then changed (locked decision 12).

### Round 5.1 — 2026-10-06

**Step:** 5 (screen 1: Home / scan, phone, light + dark)
**Planned screen order:** 1 Home/scan, 2 Claim board, 3 Pay, 4 Host fixes the scan, 5 Share (link + QR), 6 Join (guest), 7 Settled, 8 Settings (theme toggle, remembered host). Added after the payment question: a host Settle ledger (Unpaid / Says paid / Confirmed). Tablet and desktop adaptation after the phone set.
**Concept:** five live states per theme (empty, ready/returning, field errors, scanning, couldn't read it). One action per state; disabled CTA explains itself; UPI validated live, error after blur; scanning is steps + skeleton rows matching the claim board; error is a row with tips.
**File:** `.superpowers/brainstorm/s1/content/round5-home.html`
**Checks:** 10 phones exercised headlessly (photo, typing, validation, scan success + toast, cancel, retake, in-app theme toggle, reduced motion); no JS errors; no overflow at 400px. Fixed on the way: classList.toggle with undefined force flipped error styles on untouched fields. Not tested on a real phone.
**Open decisions (asked):** remember host on device (recommended yes); no How-it-works strip; gallery upload stays.
**User reaction (5.1):** "approved go ahead"
**Outcome:** APPROVED. Home screen locked.

### Round 5.2 — 2026-10-06

**Step:** 5 (screen 2: Claim board, phone, light + dark)
**Concept:** six live states per theme: just joined, mid-bill provisional, everything claimed, host view (take leftovers / split equally / lock claims), offline, loading. Share is the second-biggest number; Pay is off until every item is claimed and says why with a Nudge link; a friend claiming the same item splits it with a one-time flash and toast.
**File:** `.superpowers/brainstorm/s1/content/round5-claim-board.html`
**Checks:** 12 phones exercised headlessly (claim, conflict split 1,000.10 -> 771.27, leftovers, lock, offline retry, loading finish, in-app theme); no JS errors; no overflow at 400px. Bugs fixed on the way: toast SVG rendered 312px (missing CSS), a Provisional chip on a Rs 0.00 share, duplicate Nudge copy. Not tested on a real phone.
**Open decisions (asked):** Pay stays off until all claimed (alternative: warn); qty lines claimed whole; no undo timer.
**User question during this round:** "can we make sure somehow that the payment is done" -> answered in docs/PLATFORMS.md ("Can Dibs make sure a payment happened?"). Recommended levels 0-3 (I've paid + reference code + optional UTR/screenshot check + host confirms). Gateway (level 4) is a separate business decision. Pay screen (3) and a host Settle ledger depend on the answer.
**Bug reported by user (5.2):** "when I select an item my avatar animates and disappears and stops rendering". Cause: a stale CSS rule `.it .who .av.me{opacity:0}` came back after GSAP `clearProps:'all'` removed the inline opacity at the end of the claim animation. My earlier checks asserted share and aria-pressed, not the avatar's computed opacity. Fixed (rule removed; visibility is the `hidden` attribute) and a regression assertion added: after the animation, and after release + re-claim, in both themes, the avatar's computed opacity must be 1 and its width non-zero. Verified the test fails with the old rule and passes with the fix.
**Lesson (do not repeat):** whenever GSAP animates with `clearProps`, check the element's computed style AFTER the tween, not only app state.
**User reaction (5.2):** "approved, levels 0-3, build the Pay screen"
**Outcome:** APPROVED. Claim board locked.

### Round 5.3 — 2026-10-06

**Step:** 5 (screen 3: Pay + payment proof, phone, light + dark)
**Concept:** eight connected, live states: ready to pay; back from the UPI app (one question); add proof (UTR + screenshot, optional); screenshot matches; screenshot short (offers exact fix, never blocks); Says paid; Confirmed; no UPI app opened (copy rows). Screen never says paid by itself.
**File:** `.superpowers/brainstorm/s1/content/round5-pay.html`
**Checks:** 16 phones; full flow Pay -> sheet -> proof -> check -> Says paid -> Confirmed, mismatch path (pay missing 900.00), fallback copy, undo, in-app theme. NEW: asserted computed visibility (effective opacity product, size, display) of the key element in every state and after every transition, both themes (lesson from the avatar bug). No JS errors, no overflow at 400px. Not tested on a real phone. The screenshot check shown is a design mock; the real one needs the vision call and a payments table.
**Next screen:** host Settle ledger (Unpaid / Says paid / Confirmed, Mark paid), then Host fixes the scan, Share, Join, Settled, Settings.
**User reaction (5.3):** not explicit; user said "continue with dibs" and moved on, treated as continue. Pay screen re-issued after the correction below, so it still needs a real approval.

### Round 5.4 — 2026-10-06

**CORRECTION found while building screen 4 (mine, material):** the claim board and Pay mocks used a constant factor (3280/2580) for shares. The real engine spreads tax/service over the CLAIMED subtotal only, so the numbers were wrong: final Mukul share is Rs 1,000.09 not 1,000.10; mid-bill (3 unclaimed) it is Rs 1,092.58 not 1,000.10, and falls as items are claimed; with Diya also on Surf N Turf it is Rs 842.59 not 771.27. The mock's 'provisional, can drop' chip had been showing a figure that never dropped. Fixed: a verified JS port of the engine (scratchpad/shared/engine.js, matches docs/spec/vectors.json and the TS engine) now drives claim board, Pay and Settle; fixture docs/spec/examples/local-diners.json + src/lib/example.test.ts keep the numbers honest (22 tests). Pay: 1,000.09, satay 86.66, mismatch screenshot shows 100.09 so the missing amount stays 900.00.
**Step:** 5 (screen 4: host Settle ledger, phone, light + dark)
**Concept:** per friend Unpaid / Says paid / Confirmed (+ Says paid, short); only the host moves someone to Confirmed. Three-layer bar (confirmed, says paid, unpaid). Open a row to see UTR + screenshot result and exactly what to look for in the bank app (amount + reference code). Mark paid (cash) via a sheet; Not received; Ask for the missing amount; Confirm anyway (records accepted shortfall, and the Settled text then says what was actually received). Remind = share a message, not a push. Settled shows the one emoji. Shares: Aarav 707.71, Diya 733.13, Kabir 839.07, Mukul 1,000.09 = 3,280.00.
**File:** `.superpowers/brainstorm/s1/content/round5-settle.html`
**Bugs found and fixed in this round:** (1) `.settled{display:grid}` overrode the `hidden` attribute so the Settled hero showed on every phone; my test only asserted things that SHOULD be visible. Added NEGATIVE assertions (things that must not be visible) to settle and claim tests; verified the new assertion fails on the buggy build. (2) Confirm-anyway Settled text claimed the full amount was confirmed.
**Lessons (do not repeat):** assert what must NOT be visible too; check mocks' numbers against the real engine before presenting.
**Checks:** 12 phones, full flows (mark paid via sheet, walk to Settled, undo, short payment ask/confirm anyway, not received, remind, loading finish), visibility and negative assertions in both themes, no JS errors, no overflow at 400px. Not tested on a real phone.
**User reaction:** pending
**Outcome:** pending

---

## Permanent artifacts

```
.superpowers/brainstorm/s1/content/round1-directions.html
.superpowers/brainstorm/s1/content/round2-night-tab-preview.html
.superpowers/brainstorm/s1/content/round2b-light-accent.html
.superpowers/brainstorm/s1/content/round2c-coral-white.html
.superpowers/brainstorm/s1/content/round4-animations.html
.superpowers/brainstorm/s1/content/round5-home.html
.superpowers/brainstorm/s1/content/round5-claim-board.html
.superpowers/brainstorm/s1/content/round5-pay.html
.superpowers/brainstorm/s1/content/round5-settle.html
docs/spec/examples/local-diners.json
docs/design/brand-kit/  (index.html, tokens.css, tokens.ts, tokens.json, README.md, assets/)
```

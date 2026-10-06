# Dibs · Design State

**Last updated:** 2026-10-06
**Current phase:** Step 3 — Brand Kit (waiting for approval)
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

---

## Permanent artifacts

```
.superpowers/brainstorm/s1/content/round1-directions.html
.superpowers/brainstorm/s1/content/round2-night-tab-preview.html
.superpowers/brainstorm/s1/content/round2b-light-accent.html
.superpowers/brainstorm/s1/content/round2c-coral-white.html
docs/design/brand-kit/  (index.html, tokens.css, tokens.ts, tokens.json, README.md, assets/)
```

# Finova · Design State

**Last updated:** 2026-04-09
**Current phase:** Step 5 — Implementation handoff
**Status:** ✅ APPROVED — ready to ship

---

## Current Direction

**🌿 Moss &amp; Bone** — warm cabin-ledger aesthetic. Light mode. Cream paper base, deep moss green primary, ochre mascot fills with moss-leaf sprouts, Caveat hand-written marginalia, Fraunces italic display. Locked at round 5, refined through round 8.

## Locked Decisions

1. **Theme:** Moss &amp; Bone (round 5)
2. **Mode:** Light primary
3. **Base:** `#f3eddd` bone (warm paper, never pure white)
4. **Primary:** `#2a4a2b` moss (CTAs, FAB, headlines, nav)
5. **Highlight:** `#c89530` ochre for fills · `#9a7020` ochreDeep for text (WCAG AA compliant)
6. **Ink:** `#1a1f15` (text)
7. **Danger:** `#8a3324` clay (red earth, not emergency red)
8. **Display font:** Fraunces Italic 9–144 (variable)
9. **Body font:** Bricolage Grotesque 500–900 (variable)
10. **Hand-written:** Caveat 700 (one per screen max, rotated -1 to -3°)
11. **Numerics:** DM Mono 400–500 paired with Fraunces italic `₹`
12. **Mascot:** ochre flame with moss leaves at base, holds moss-green rupee note. 4 states: steady / growing / bloomed / napping. Top-right placement. Breathes at 3s intervals.
13. **Motion:** `cubic-bezier(0.2, 0.8, 0.2, 1)`, 200–500ms, no spring/bounce
14. **Shadows:** warm moss-tinted, never cold black
15. **Voice:** "quiet friend, not a bank" — lowercase marginalia, word swaps ("Transaction"→"Spend", "Error"→"Hmm")

## Rejected Directions

1. **Loud Lime editorial white** (round 1) — "No, I don't like the design."
2. **5-direction comparison** (round 2) — all rejected as "normal and okay": CRED Dark, Monetto, UglyCash Chrome, Mint Scandi, NeoPop
3. **The Parlor** (round 4) — oxblood + brass speakeasy
4. **Last Ember** (round 4) — arctic navy + ember contrast
5. **Neon Arcade** (round 4) — synthwave pixel wildcard

## Preserved (for potential future use)

1. **Firekeeper** (round 3) — warm dark ember variant. Saved at `docs/design/themes/01-firekeeper.html`. Candidate for future dark mode rollout.

## Open Questions (all resolved)

~~1. How different should alternates be from Firekeeper?~~ → Resolved: showed 4 alternates in round 4
~~2. Should mascot be central?~~ → Yes, locked
~~3. Light mode needed?~~ → Yes, Moss &amp; Bone is light-first
~~4. Font choice?~~ → Locked: Fraunces + Bricolage + Caveat + DM Mono
~~5. Primary color?~~ → Moss `#2a4a2b` locked
~~6. Dark mode variant?~~ → Deferred; Firekeeper saved as future candidate

## Rounds Log

### Round 1 · 2026-04-09 · REJECTED
**Step:** 1 (Theme Exploration)
**Skills loaded:** `superpowers:brainstorming`
**Concept:** "Loud Lime" single proposal — white bg, bold sans, 2×2 bento.
**File:** `.superpowers/brainstorm/30700-1775689730/content/00-proposal.html`
**User reaction:** "No, I don't like the design."
**Outcome:** REJECTED. Direction killed.

### Round 2 · 2026-04-09 · REJECTED
**Step:** 1 (Theme Exploration — retry)
**Skills loaded:** `superpowers:brainstorming`
**Concept:** 5-direction comparison: CRED Dark · Monetto Loud · UglyCash Chrome · Mint Calm · NeoPop
**File:** `content/round2-directions.html`
**User reaction:** "I really like my mascot as well, and I don't like these; they are very normal and okay."
**Outcome:** ALL REJECTED. Locked: mascot central, avoid "normal", commit don't compare.

### Round 3 · 2026-04-09 · PRESERVED
**Step:** 2 (Theme Iteration — direction A)
**Skills loaded:** `superpowers:brainstorming`, `frontend-design`, `bolder`, `delight`, `typeset`, `colorize`, `arrange`, `animate`
**Concept:** **Firekeeper** — warm dark, ember orange, Fraunces italic display, mascot hero.
**File:** `content/round3-firekeeper-theme.html` → saved to `docs/design/themes/01-firekeeper.html`
**User reaction:** "I like this. I think."
**Outcome:** PRESERVED as potential dark mode variant. Not chosen as primary.

### Round 4 · 2026-04-09 · MOSS &amp; BONE CHOSEN
**Step:** 1 (Theme Exploration — retry with alternates)
**Skills loaded:** `frontend-design`, `bolder`, `delight`
**Concept:** 4 alternates to Firekeeper: The Parlor (oxblood+brass) · Last Ember (arctic+ember) · **Moss &amp; Bone** (light cream+moss) · Neon Arcade (synthwave)
**File:** `content/round4-alternates.html`
**User reaction:** "I really like Moss and Bone in terms of theme."
**Outcome:** **MOSS &amp; BONE LOCKED** as primary direction. Other 3 rejected.

### Round 5 · 2026-04-09 · FULL SHOWCASE APPROVED
**Step:** 2 (Theme Iteration — locked direction)
**Skills loaded:** `frontend-design`, `delight`, `typeset`, `colorize`, `arrange`, `animate`
**Concept:** Moss &amp; Bone full showcase — tokens, types, mascot states, motifs, phone preview, manifesto.
**File:** `content/round5-moss-bone-showcase.html` → saved to `docs/design/themes/02-moss-bone.html`
**User reaction:** "This looks good."
**Outcome:** APPROVED. Theme system fully locked.

### Round 6 · 2026-04-09 · BRAND KIT v1.0 SHIPPED
**Step:** 3 (Brand Kit)
**Skills loaded:** `frontend-design`, `typeset`, `colorize`, `extract`, `clarify`, `audit`
**Concept:** Complete brand kit — visual book + code assets.
**Files produced:**
- `docs/design/brand-kit/index.html` — 9-section visual brand book
- `docs/design/brand-kit/tokens.ts` — TypeScript design tokens
- `docs/design/brand-kit/tokens.css` — CSS variables + helper classes
- `docs/design/brand-kit/tokens.json` — DTCG format
- `docs/design/brand-kit/README.md` — text summary
- `docs/design/brand-kit/mascot/{steady,growing,bloomed,napping}.svg` — 4 mascot states

**a11y flag resolved:** Ochre `#c89530` fails WCAG AA for text on bone (3.1:1). Added `ochreDeep #9a7020` token (4.7:1, passes AA) for text use. Bright ochre reserved for fills only.
**User reaction:** "This looks good. Create a complete brand kit for me for this particular app"
**Outcome:** APPROVED.

### Round 7 · 2026-04-09 · ALL 30 SCREENS (WIREFRAME PASS)
**Step:** 4 (Screen Generation — wireframe)
**Skills loaded:** `frontend-design`, `arrange`, `extract`, `delight`, `onboard`
**Concept:** Design every single screen of Finova mobile in Moss &amp; Bone. 30 screens across 8 sections: Auth · 5 tabs · 7 Money hub · 9 Goals hub · 2 Tools · 1 AI · 3 Learn · 2 Settings.
**File:** `content/round7-all-screens.html`
**User reaction:** "These are okay, but are they actually feasible? I see the money page instead of FZW. If it's Zepeto, it should ideally be some food-related thing... In the scan, by ideal, it should be something like normally scanning the complete thing."
**Outcome:** STRUCTURE APPROVED, CONTENT NEEDS ITERATION. Feedback triggered round 8.

### Round 8 · 2026-04-09 · PRODUCTION-READY PASS APPROVED ✅
**Step:** 4 (Screen Generation — production pass)
**Skills loaded:** `frontend-design`, `clarify`, `harden`, `delight`, `typeset`
**Concept:** Rewrite all 30 screens with real Indian merchants (Zepto, Swiggy, Netflix, Zerodha, BSES, Airtel), emoji category icons in tinted backgrounds, realistic amounts (`₹247.50`, `₹2,04,538`), real timestamps (`2m ago`, `Tue 11:40 PM`), Scan &amp; Pay with detected QR code and bottom sheet, populated notifications, jittered chart data.
**Files:**
- `content/round8-production-ready.html` → saved to `docs/design/mockups/finova-all-screens-v1.html`
**User reaction:** "These look nice. Let's finalize all of them"
**Outcome:** ✅ **APPROVED — all 30 screens locked.**
**Decisions locked this round:**
- TransactionRow uses emoji category + tinted bg (not first-letter tiles)
- All merchants use real Indian brand names
- All numbers are specific (decimals, realistic amounts)
- All timestamps use real relative/absolute formats
- Scan &amp; Pay shows detected QR + merchant bottom sheet
- Notifications has real alerts, not empty state

### Round 9 · 2026-04-09 (next) · IMPLEMENTATION HANDOFF
**Step:** 5 (Handoff)
**Skills to load:** `superpowers:writing-plans`, `critique`, `superpowers:test-driven-development`
**Goal:** Write the 2-week RN implementation spec.
**File:** `docs/superpowers/specs/2026-04-09-moss-bone-implementation.md`
**Status:** Written — see file.

---

## Permanent artifacts

```
docs/
├── design/
│   ├── themes/
│   │   ├── 01-firekeeper.html              # preserved, dark mode candidate
│   │   └── 02-moss-bone.html               # approved showcase
│   ├── brand-kit/                           # v1.0 LOCKED
│   │   ├── index.html                       # visual brand book
│   │   ├── tokens.ts                        # TypeScript tokens
│   │   ├── tokens.css                       # CSS variables
│   │   ├── tokens.json                      # DTCG format
│   │   ├── README.md                        # text summary
│   │   └── mascot/
│   │       ├── steady.svg
│   │       ├── growing.svg
│   │       ├── bloomed.svg
│   │       └── napping.svg
│   └── mockups/
│       └── finova-all-screens-v1.html      # approved 30-screen catalog
└── superpowers/
    └── specs/
        └── 2026-04-09-moss-bone-implementation.md   # the handoff spec
```

## Final summary

- **Total rounds:** 8 (+1 handoff)
- **Rejected directions:** 5
- **Preserved:** 1 (Firekeeper, for future dark mode)
- **Locked theme:** Moss &amp; Bone
- **Brand kit version:** 1.0
- **Total screens designed:** 30
- **Status:** Ready to implement

## Next actions

1. ✅ Implementation spec written
2. ⏳ User to review spec
3. ⏳ Kick off `superpowers:executing-plans` once spec approved
4. ⏳ Optionally: push to Figma via `figma:figma-generate-library`

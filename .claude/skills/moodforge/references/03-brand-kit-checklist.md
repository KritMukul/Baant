# Round 3 — Brand Kit Checklist

The brand kit is the **code-ready deliverable**. It's not a PDF. It's files an engineer can import.

## What to produce

A multi-file directory at `docs/design/brand-kit/`:

```
docs/design/brand-kit/
├── index.html              # Visual brand book (opened in browser)
├── tokens.ts               # TypeScript design tokens (default export)
├── tokens.css              # CSS variables + helper classes
├── tokens.json             # DTCG format for tooling
├── README.md               # Text summary for engineers
└── assets/
    ├── logo.svg
    ├── mascot-*.svg        # One per mascot state if applicable
    └── icons/              # Optional: icon set
```

## index.html — 9 required sections

1. **Cover** — brand name, tagline, version, status pill
2. **Manifesto** — big italic quote, accent background
3. **01 Logo** — primary lockup + variants (light/dark/accent) + clear space rule + min size + tilt rule + placement rule (where on the screen)
4. **02 Color** — full palette grid + **accessibility matrix** with contrast ratios and ✓/✗ verdicts for every text-on-background pair
5. **03 Typography** — specimens per font + full type scale with live samples + pairing rules
6. **04 Mascot / brand element** — states, positioning rules, do's and don'ts
7. **05 Spacing** — token scale visualized as bars
8. **06 Motion** — durations, easings, principles, live animated demos
9. **07 Components** — buttons, chips, inputs, list rows — all built from tokens
10. **08 Voice & Tone** — word swap table, microcopy rules
11. **09 Files** — reference table showing paths for every asset in the kit

## tokens.ts — required exports

```ts
export const colors = { ... } as const;
export const typography = { fontFamily: {...}, scale: {...} } as const;
export const spacing = { xxs, xs, sm, md, lg, xl, xxl, xxxl } as const;
export const radius = { xs, sm, md, lg, xl, pill } as const;
export const shadows = { card, modal, ... } as const;
export const motion = { easing, duration } as const;
export const voice = { principles, replacements } as const;  // optional

export const theme = { name, version, colors, typography, spacing, radius, shadows, motion, voice } as const;
export default theme;
```

## Accessibility matrix (non-negotiable)

For every text-on-background pair, compute and show the WCAG contrast ratio:
- **≥ 7:1** → AAA ✓
- **≥ 4.5:1** → AA ✓
- **< 4.5:1** → FAIL ✗

If any pair fails for text use, add a **darker variant** specifically for text:
- `accent` (bright) → fills only
- `accentDeep` (darker) → text only

Document both in the matrix with explicit ❌ / ✓ labels. This is the most common failure point in AI-generated brand kits.

## README.md — what it must contain

- Brand at a glance (wordmark, tagline, mood)
- Primary colors with hex and usage
- Type families and their roles
- Core rules (bullet list, 5–8 items)
- How to import tokens.ts in code
- Decision history (link to state.md)
- Next steps

## Accept criteria

- [ ] `index.html` opens in browser and scrolls cleanly
- [ ] All 9 sections present
- [ ] Accessibility matrix with real contrast calculations
- [ ] `tokens.ts` compiles with zero TypeScript errors
- [ ] `tokens.css` loads in a plain HTML test page without errors
- [ ] `tokens.json` validates against DTCG schema
- [ ] `README.md` has code snippet showing import usage
- [ ] Every asset referenced in `index.html` actually exists in `assets/`
- [ ] Committed to git (ask user permission first)

## What to skip

- **Don't write a "brand story" page.** Save it for marketing. The kit is for engineers.
- **Don't include tutorials.** The kit is reference, not learning material.
- **Don't version lock colors to specific weights.** If `primary` is `#2a4a2b`, use the hex everywhere — never "Pantone 5743 C" alongside it.
- **Don't create "brand voice" audio files or mood boards.** Stay in code.

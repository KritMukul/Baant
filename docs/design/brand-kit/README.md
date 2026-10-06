# Dibs · Night Tab brand kit

**Version** 1.0 · **Locked** 2026-10-06 · **Status** Approved (Step 3)

> Everyone pays for exactly what they ate.
>
> Tagline: **Call dibs. Split the bill.**

Open `index.html` in a browser for the visual book. Everything below is generated from one token source, so the three token files always agree.

## Files

| File | Purpose |
|---|---|
| `index.html` | Visual brand book (toggle Light / Dark / System inside it) |
| `tokens.css` | CSS variables. Light is default, dark follows `prefers-color-scheme`, `data-theme` on `<html>` always wins |
| `tokens.ts` | Typed tokens for both modes, plus motion |
| `tokens.kt` | Jetpack Compose theme for the Android app (not compiled yet) |
| `tokens.json` | DTCG format for Style Dictionary and Figma plugins |
| `assets/` | `logo-mark(.-dark).svg`, `logo-wordmark(.-dark).svg` (the lockup), `app-icon.svg` |

## At a glance

- **Mark** a D built from a torn receipt (ink) and half a plate (coral). In the lockup the mark is the capital D: "Dibs".
- **Type** Sora for all words, JetBrains Mono for every digit and the ₹ sign.
- **Light** ground `#f5f4fb`, surface `#ffffff`, accent coral `#ff6b4a`, accent text `#c2371a`.
- **Dark** ground `#0c0d1c`, surface `#171a30`, accent peach `#ffb59a`.
- **Radius** 8 to 22, pill for buttons. **Spacing** 4px grid.

## Rules

1. Accent is a **fill**. For coloured text use `accentText`, never `accent`.
2. Every amount is JetBrains Mono, tabular, with the ₹ sign in `accentText`.
3. You are always coral. Friends are indigo, violet and green, in that order. You come last in an avatar row.
4. The primary button names the action and the amount: "Pay Aarav · UPI".
5. Claiming is "dibs": "Call dibs", "You have dibs", "Up for grabs". English only, no mixed-language copy.
6. Motion uses transform and opacity only, under 320ms, no bounce. Buttons scale to `0.97` on press. Respect `prefers-reduced-motion`.
7. Hover styles only inside `@media (hover: hover) and (pointer: fine)`.

## Accessibility

Computed in `index.html` for both themes. All text pairs pass 4.5:1 **except one approved exception**: the white label on the light-mode coral button (2.8:1). It was chosen by the design owner. It is mitigated by an `accentEdge` outline (4:1 against the ground), weight 700, a 52px target and the amount in the label. To pass AA later without changing the look, set light `onAccent` to `#1b1020` (6.5:1) or the fill to `#e02900` (4.7:1 with white). It is a one-line change in the token source.

## Use in the Next.js app

```css
/* app/globals.css */
@import "../docs/design/brand-kit/tokens.css";   /* or copy it to src/styles */
body { background: var(--color-bg); color: var(--color-text); font: var(--fw-body) var(--fs-body)/var(--lh-body) var(--font-ui); }
```

```ts
import { theme, colors } from '@/theme/tokens';
const c = colors.dark; // c.bg, c.accent, ...
```

Theme toggle (Light · Dark · System):

```ts
const setTheme = (t: 'light' | 'dark' | 'system') =>
  t === 'system' ? document.documentElement.removeAttribute('data-theme')
                 : document.documentElement.setAttribute('data-theme', t);
```

Set `data-theme` before first paint (a tiny inline script in `<head>`) to avoid a flash, and store the choice in `localStorage`.

## Decision history

See `.claude/skills/moodforge/projects/dibs.md`.

## Next

Step 4: animation review. Step 5: remaining screens. Step 6: implementation spec and wiring the tokens into `src/app`.

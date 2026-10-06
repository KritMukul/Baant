# <Project> — <Theme Name> Brand Kit

**Version** 1.0 · **Locked** YYYY-MM-DD · **Status** Primary theme

> <Manifesto — 1–2 sentence declaration of the brand's voice>

---

## Files in this kit

| File | Purpose |
|---|---|
| `index.html` | Visual brand book — open in a browser |
| `tokens.ts` | TypeScript design tokens, importable into your app |
| `tokens.css` | CSS variables for any web surface |
| `tokens.json` | Raw token data in DTCG format for tooling |
| `README.md` | This file |
| `assets/` | Logo SVGs, mascot states, icons |

---

## Brand at a glance

**Name** <Project>
**Wordmark** <lockup description>
**Tagline** "<primary tagline>"
**Mood** <3–5 word description>

**Primary colors**
- `#2a4a2b` primary — brand, CTAs, headlines
- `#f3eddd` base — every screen background
- `#c89530` accent — highlights (use `#9a7020` for text)
- `#1a1f15` ink — text

**Type**
- **Display**: Fraunces Italic
- **Body**: Bricolage Grotesque
- **Hand-written**: Caveat (use sparingly)
- **Mono**: DM Mono (all numerics)

---

## Core rules

1. **Base is the background.** Never pure white. Never gray. Always tinted warm.
2. **Accent is a fill color, not a text color.** Use `accentDeep` (#9a7020) for text to pass WCAG AA.
3. **All numbers use DM Mono** paired with an italic Fraunces currency symbol.
4. **Shadows are warm.** Tinted with the primary color, never cold black.
5. **Motion is grown-up.** Ease-out-quart, 200–500ms. Never bounce.
6. **Hand-written accents** (Caveat) appear at most once per screen — rule enforced by the designer.

---

## How to use in your app

```ts
import { colors, typography, spacing } from './brand-kit/tokens';

<Text style={{
  fontFamily: typography.fontFamily.display,
  fontStyle: 'italic',
  fontSize: typography.scale.h1.size,
  color: colors.primary,
}}>
  morning, friend.
</Text>
```

---

## Decision history

Tracked in `.claude/skills/design-pipeline/projects/<project-slug>.md`. This theme was locked in round N after these rejected alternatives:

- <list of rejected directions>

## Next steps

1. Apply to all screens — see `docs/superpowers/plans/YYYY-MM-DD-<theme>-rollout.md`
2. Load fonts on app boot via `expo-font` (or equivalent)
3. Migrate legacy theme imports to re-export from `tokens.ts`

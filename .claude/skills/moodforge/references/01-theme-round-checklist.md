# Round 1 — Theme Exploration Checklist

The goal of round 1 is to show the user 4–5 genuinely distinct design directions in a **single scrollable HTML page**, then have them pick one.

## What to produce

**One HTML file** at `.superpowers/brainstorm/<session>/content/round1-directions.html`.

## Page structure

### Top: intro
- Eyebrow label: "Round 01 · Theme Exploration"
- Big Fraunces headline with a tagline
- Short paragraph framing the 5 directions
- Table-of-contents with 5 anchor links

### Middle: 5 direction cards
Each card is a full-bleed section with its own theme applied, containing:
- Option label (A / B / C / D / E)
- Direction name + tagline
- 6-swatch palette mini-grid
- Typography sample in the direction's primary font
- **One phone mockup** showing the Home/landing screen in the theme
- One-line pitch: why someone would pick this
- Inspiration source tags at the bottom

### Bottom: decision footer
- "Pick a world" heading
- 5 option cards (with colored dots), each clickable
- Short description of how to respond ("reply with a letter, or 'A + D mashup', or 'none of these'")

## The 5 directions must be actually distinct

Bad round 1: 5 variations of "white background + sans-serif + accent color"
Good round 1: 1 dark neobank, 1 editorial white, 1 holographic/Y2K, 1 muted Scandi, 1 wildcard (neon/retro/brutalist)

**The test:** Could each direction be used for an entirely different product category? If not, they're too similar.

## Direction picking — safe to ambitious spectrum

Always include:
- At least 1 **stakeholder-safe** option (your marketing team will approve it without questions)
- At least 1 **ambitious** option (the one that makes the product unforgettable)
- Match remaining options to the user's specific inspiration (check their Downloads folder, Pinterest, in-repo refs)

## What to skip

- Don't show 5 color palettes without context — people react to *applied* color, not chips
- Don't show typography in isolation — people react to type in *layouts*
- Don't show 10 options — paradox of choice. 4 or 5 max.
- Don't show text-only options — the whole point of round 1 is visual

## Tracking

After pushing, log to `state.md`:
- Which 5 options were shown (names + one-line pitches)
- Which skills were loaded for this round
- The file path
- User's verbatim reaction (once they respond)

If the user rejects all 5 → **learn what they rejected.** Their verbatim words are signal. Re-run with 5 different directions that avoid those qualities.

If the user picks 1 → mark that direction as "chosen", all others as "rejected" in state.md. Never re-propose rejected ones.

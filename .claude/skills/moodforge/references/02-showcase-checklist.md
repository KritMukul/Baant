# Step 2 — Screen Preview Checklist

After the user picks a direction in Step 1, Step 2 builds **1-2 key screens** of the actual product to validate the design before committing to a full brand kit. The user sees their real product, not an abstract showcase.

## What to produce

**One HTML file** at `content/round2-<theme-name>-preview.html`.

## Required sections (in order)

### 00 · Cover hero
- Brand name at massive scale (100px+ in the display font)
- Tagline in the secondary font (hand-written or accent)
- Manifesto: 1–2 sentence declaration of voice
- Meta row: 4 labels — base color, accent, voice, mood

### 01 · Color palette
- 6–10 swatches displayed as full cards
- Each swatch: name, hex, usage rationale ("primary · CTAs · FAB")
- One hero swatch (2×2 or 1×2 size) for the primary color
- No timid neutrals — every color earns its place

### 02 · Typography specimen
- 2–4 font families (not more)
- For each font: tag, family name, weight range, live sample at real size (60pt+), spec footer (axis, weight, tracking)
- Full type scale: display / h1 / h2 / body / caption / label / numeric / optional hand
- Real sample text, not "Lorem ipsum" — show the font doing real product copy

### 03 · Mascot / brand element (if applicable)
If the project has a mascot or brand element:
- 4 states/variations
- For each state: rule ("when to show"), name in the hand font, 1-sentence description
- Soft aura or background treatment per state

### 04 · Motifs
- Decorative elements: dividers, shapes, textures, iconography style
- 3 motif cards with live SVG examples
- Not just pictures — show how they reinforce the brand

### 05 · Applied preview
- One phone/web frame showing a real screen in the full system
- Mascot in corner (if applicable)
- Real numbers (₹2,04,538 not "$1000")
- Real merchants/products/entities

### 06 · Manifesto strip (optional)
- Quote-style declaration of the brand's POV
- Full-bleed dark or accent background for drama

### 07 · Next steps footer
- "Lock direction → round 3" CTA
- Clear next action for the user

## Iteration rules

**If the user wants tweaks** (quieter, bolder, different font, different accent):
- Push a new file: `round2-<theme>-v2.html`
- Don't overwrite v1 — keep the history
- Log the tweak in state.md with the reason

**If the user approves:**
- Mark direction as "locked" in state.md
- Save the file permanently to `docs/design/themes/<slug>.html`
- Move to round 3 (brand kit)

## Common failure modes

1. **Too many fonts.** 5 fonts = visual noise. Max 4.
2. **Too many colors.** 12+ swatches = decision paralysis. Max 10.
3. **Mascot as decoration.** If the mascot doesn't react to state, it's decoration, not a brand element.
4. **Preview screen feels fake.** If it uses placeholder data, it reads as a wireframe not a showcase.
5. **Manifesto is corporate.** "We believe in simplicity" → garbage. Write like a human. "Your money isn't a dashboard, it's a garden" → ownable.

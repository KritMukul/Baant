# Typography Pairing Recipes

Two proven 4-voice type stacks, both shipped and approved. Both solve the same problem — how do you make a product page feel *designed* with only free Google Fonts — and they do it in opposite aesthetic registers. Pick the one that matches the brand's temperature.

## The job-per-font rule

Before either stack: **one font does one job, forever.** Never let the display serif leak into a button. Never let the grotesque sans set a hero number. Never let the mono font run a paragraph. When a font does two jobs the whole kit starts feeling blurry and the user won't know why.

Stack A and Stack B are both 4-voice stacks. Each voice has exactly one job:

| Voice | Job |
|---|---|
| **Display serif** | Hero headlines, `<h2>` pull-quotes, italic currency glyph |
| **Grotesque sans** | Body copy, button labels, row titles, paragraphs |
| **Mono** | Eyebrow labels, tabular digits, timestamps, status strings |
| **Handwritten** | Marginalia, one note per screen, the human voice |

## Stack A — Warm Ledger (Finova · Moss & Bone)

**Temperature:** warm cream + deep moss + ochre + hand-scribbled marginalia. Paper-and-pen. Editorial. Trustworthy. Ledger-book honest.

### The Google Fonts import

Finova's kit loads fonts via a saved `css2` file. Reconstructed as a live import line:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Bricolage+Grotesque:opsz,wght@12..96,500..900&family=DM+Mono:wght@400;500&family=Caveat:wght@400..700&display=swap" rel="stylesheet">
```

### The 4 voices

| Voice | Font | Axes / weights | Job |
|---|---|---|---|
| Display serif | **Fraunces** | `opsz 9..144`, `ital 0..1`, `wght 400..900` | Hero headlines. Section H2s. Pull-quotes via `<em>`. The currency `₹` glyph. The logotype itself. |
| Grotesque sans | **Bricolage Grotesque** | `opsz 12..96`, `wght 500..900` | Body copy, row labels, button text, any paragraph. |
| Mono | **DM Mono** | `wght 400..500` | Uppercase eyebrow labels, tabular numerals, timestamps, status codes. |
| Handwritten | **Caveat** | `wght 400..700` | The handnote. One per screen. Rotated -1 to -3°. |

### The type-sample cards (pulled verbatim from the Finova kit)

```html
<div class="type-specimen">
  <div class="type-card">
    <div class="tag">Display · Headlines</div>
    <h3>Fraunces Italic 9–144</h3>
    <div class="sample display-s">Money, <em>quietly.</em></div>
    <div class="type-meta">
      <div>Axis<strong>opsz 9→144</strong></div>
      <div>Weight<strong>400it · 900</strong></div>
      <div>Tracking<strong>-5px @ hero</strong></div>
    </div>
  </div>

  <div class="type-card">
    <div class="tag">Body · Structure</div>
    <h3>Bricolage Grotesque 500–900</h3>
    <div class="sample body-s">Spent ₹16,368 this week. Up from ₹12,400 last.</div>
    <div class="type-meta">
      <div>Axis<strong>opsz 12→96</strong></div>
      <div>Weight<strong>500 · 700 · 800</strong></div>
      <div>Tracking<strong>-0.6 body</strong></div>
    </div>
  </div>

  <div class="type-card">
    <div class="tag">Numerics · Ledger</div>
    <h3>DM Mono 400–500</h3>
    <div class="sample mono-s"><em>₹</em> 16,368.32<br><em>+</em> 1,245.00</div>
    <div class="type-meta">
      <div>Purpose<strong>tabular</strong></div>
      <div>Weight<strong>400 · 500</strong></div>
      <div>Pairs<strong>Fraunces ₹</strong></div>
    </div>
  </div>

  <div class="type-card">
    <div class="tag">Marginalia · Hand-written</div>
    <h3>Caveat 400–700</h3>
    <div class="sample hand-s">plant <em>seeds,</em> not trees</div>
    <div class="type-meta">
      <div>Weight<strong>700</strong></div>
      <div>Rotation<strong>-1 to -3°</strong></div>
      <div>Use<strong>one per screen</strong></div>
    </div>
  </div>
</div>
```

## Stack B — Clinical Hairline (Superpowers · Pulse)

**Temperature:** cream canvas + ink hairlines + one pink scream + editorial italic. No shadows, no gradients. Hospital-clean meets magazine-layout. For health, fitness, medical, analytics, or anything that needs to feel *precise and calm*.

### The Google Fonts import

Pulse's brand kit loads:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Funnel+Sans:wght@300..800&family=Instrument+Serif:ital@0;1&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Caveat:wght@400..700&display=swap" rel="stylesheet">
```

### The 5 voices (Stack B adds one)

| Voice | Font | Weights | Job |
|---|---|---|---|
| Display | **Funnel Display** | `300..800` | Hero numbers, brand wordmark, H2s, "185lb" kind of hero lifts. |
| Body sans | **Funnel Sans** | `300..800` | Paragraphs, button labels, list rows, all running copy. |
| Italic accent | **Instrument Serif** | `italic only` | The italic pull-quote inside every H2. The scream moment inside display copy. |
| Mono | **Space Mono** | `400, 700` | Eyebrow labels, datestamps, file paths, timestamps. |
| Handwritten *(optional)* | **Caveat** | `400..700` | Marginalia. Pulse uses it sparingly — one Caveat spec per tile caption. |

Stack B deliberately **splits** the display role across two fonts: Funnel Display for upright weight, Instrument Serif for italic accents. Fraunces is one font with an italic axis; Funnel + Instrument is two fonts doing that job in tandem. The split gives the italic a harder edge — Instrument Serif italic is narrower and more editorial than Fraunces italic.

### The Pulse H2 pattern (verbatim from the Pulse kit)

```html
<h2 class="sec-head">Five fonts. Each has <span class="it">one job</span>.</h2>
<h2 class="sec-head">Cream. Ink. <span class="it">Pink</span>.</h2>
<h2 class="sec-head">No shadows. <span class="it">Hairlines</span>.</h2>
<h2 class="sec-head">The <span class="it">atoms</span>.</h2>
<h2 class="sec-head">Fast. <span class="it">Honest</span>. Interruptible.</h2>
```

```css
.sec-head {
  font-family: 'Funnel Display', sans-serif;
  font-weight: 800;
  letter-spacing: -0.035em;
}
.sec-head .it {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 400;
  color: var(--accent);  /* pink #FFD8EC or deeper */
}
```

## The italic-serif-currency + mono-digit pairing rule

Both stacks use the same **currency-glyph trick**: the `₹` (or `$`) is set in the *italic display serif*, while the *digits* are set in *mono*. The glyph gets the brand's personality, the digits get tabular precision. Pulled verbatim from the Finova kit:

```html
<div class="sample mono-s"><em>₹</em> 16,368.32<br><em>+</em> 1,245.00</div>
```

And the hero number on the Home screen (also Finova):

```html
<div class="hero-num"><em>₹</em> 2,04,538<span class="pos"> ↑ 12%</span></div>
```

The CSS:

```css
.hero-num {
  font-family: 'DM Mono', monospace;
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -1px;
  line-height: 0.9;
}
.hero-num em {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 900;
  color: var(--moss);
  margin-right: 2px;
}
```

Same move in Stack B: wrap the unit (`lb`, `kcal`, `g`) in Instrument Serif italic, set the number in Funnel Display.

```html
<div class="big">1,842<span class="of"> / 2,300</span></div>
```

## The DM Mono / Space Mono eyebrow label convention

Every section head, every card, every list-group in the kit opens with a **mono uppercase label** preceded by a rule-line. The rule-line is the single most recognizable pattern in both stacks. Pulled verbatim from the Finova kit:

```css
.section-head .label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  color: var(--moss);
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-head .label::before {
  content: '';
  width: 32px;      /* or 24px in tighter spots */
  height: 1px;
  background: var(--moss);
  display: inline-block;
}
```

Usage:

```html
<div class="label">Identity</div>
<div class="label">Palette</div>
<div class="label">Typography</div>
```

The Pulse/Stack-B version is nearly identical but uses Space Mono and a lighter hairline:

```css
.kicker {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.kicker::before {
  content: '';
  width: 24px; height: 1px;
  background: currentColor;
  display: inline-block;
  margin-right: 10px;
  vertical-align: middle;
}
```

**The rule:** every mono label in the kit has a rule-line. The rule-line is a visual promise that *this is a label, not a title.* It separates hierarchy the way all-caps can't.

## The full type scale — real rem values

The Finova scale (verbatim from the kit's scale-list). Both stacks use the same scale with only the font-family substituted:

| Level | Size / line-height | Font (Stack A) | Font (Stack B) |
|---|---|---|---|
| DISPLAY | `76px / 0.88` | Fraunces 900it | Funnel Display 800 |
| H1 | `44px / 1.0` | Fraunces 900 | Funnel Display 800 |
| H2 | `28px / 1.1` | Bricolage 800 | Funnel Display 700 |
| HAND | `32px` @ -1° | Caveat 700 | Caveat 700 |
| NUMERIC | `48px / 0.9` | DM Mono 500 + Fraunces `₹` | Funnel Display 800 + Instrument `lb` |
| BODY | `16px / 1.5` | Bricolage 500 | Funnel Sans 400 |
| CAPTION | `13px / 1.55` | Bricolage 600 | Funnel Sans 500 |
| LABEL | `10px / 1.0` caps | DM Mono 500 | Space Mono 400 |

In rem (assuming a 16px root):

```css
:root {
  --fs-display:   4.75rem;  /* 76 */
  --fs-h1:        2.75rem;  /* 44 */
  --fs-h2:        1.75rem;  /* 28 */
  --fs-hand:      2rem;     /* 32 */
  --fs-numeric:   3rem;     /* 48 */
  --fs-body:      1rem;     /* 16 */
  --fs-caption:   0.8125rem;/* 13 */
  --fs-label:     0.625rem; /* 10 */

  --lh-tight:     0.88;
  --lh-display:   0.9;
  --lh-heading:   1.0;
  --lh-body:      1.5;
  --lh-caption:   1.55;

  --tr-display:   -0.05em;  /* -5px at 100px */
  --tr-body:      -0.012em; /* -0.6 at 48px */
  --tr-label:     0.25em;   /* +2.5 at 10px */
}
```

## Choosing between Stack A and Stack B

Two questions:

1. **What's the brand's temperature?** Warm + editorial + hand = A. Cool + clinical + precise = B.
2. **Does the product deal in money or in measurements?** Money (banking, budgeting, invoicing) = A, because Fraunces italic `₹` is the best-looking currency glyph in free fonts. Measurements (fitness, health, analytics, lab data) = B, because Funnel Display is the cleanest numerals-in-hero-slot free font.

If you can't decide, build one card in each and look at them side-by-side. The right one will feel obvious inside 30 seconds.

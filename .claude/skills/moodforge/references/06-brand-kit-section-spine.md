# The Brand Kit Section Spine

Every production brand kit HTML page is built on the **same 10-section spine**. Don't improvise the order, don't skip sections, don't merge them. The order is a pedagogy — the reader learns the system by walking down the page.

## The canonical 10-section order

```
COVER             — brand name, tagline, version pill, mascot portrait
00 · MANIFESTO    — one italic sentence on moss/ink background, cite line
01 · LOGO         — lockups (light/dark/accent) + clear space + min size + tilt + placement
02 · COLOR        — full palette + usage + accessibility matrix
03 · TYPE         — 4 specimens + full type scale rows
04 · MASCOT       — states + positioning + do / don't
05 · SPACING      — 4-px scale visualized as bars
06 · MOTION       — durations + easings + live demos
07 · COMPONENTS   — buttons, chips, inputs, rows — all from tokens
08 · VOICE        — word swap table + microcopy rules
09 · FILES        — path table: where every asset lives in the repo
```

Anchor IDs in the nav must be literal: `#manifesto #logo #color #type #mascot #spacing #motion #components #voice #files`. No clever naming.

## The `.section-head` pattern

Every numbered section opens with the same head. It's the spine of the spine: a **big gutter numeral**, a mono eyebrow label, a Fraunces display H2 with one italic phrase, and a body note. This is what makes the kit feel like one document instead of 10 loose pages.

Pull this CSS verbatim from `Finova · Moss & Bone Brand Kit v1.0.html`:

```css
.section-head {
  display: grid;
  grid-template-columns: auto auto;
  gap: 80px;
  margin-bottom: 80px;
  align-items: flex-end;
  justify-content: space-between;
}
.section-head .num {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: 200px;
  line-height: 0.7;
  color: var(--border);      /* ghost-gray, never ink */
  letter-spacing: -8px;
}
.section-head .title { max-width: 660px; }
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
  width: 32px;
  height: 1px;
  background: var(--moss);
}
.section-head h2 {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: clamp(52px, 6vw, 92px);
  line-height: 0.9;
  letter-spacing: -3px;
  color: var(--ink);
}
.section-head h2 em {
  font-style: italic;
  font-weight: 400;
  color: var(--moss);
}
.section-head h2 .hand {
  font-family: 'Caveat', cursive;
  color: var(--ochre-deep);
  font-weight: 700;
  font-style: normal;
  font-size: 0.85em;
  display: inline-block;
  transform: rotate(-1deg);
}
.section-head .body {
  font-size: 15px;
  line-height: 1.65;
  color: rgba(26,31,21,0.68);
  margin-top: 24px;
  max-width: 560px;
  font-weight: 500;
}
.section-head .body strong { color: var(--ink); font-weight: 700; }
.section-head .body em {
  font-family: 'Caveat', cursive;
  font-weight: 700;
  color: var(--moss);
  font-size: 18px;
  font-style: normal;    /* Caveat is always NORMAL inside .body em */
}
```

## The italic pull-quote rule

**Every section H2 must contain exactly one `<em>` phrase ending in a period.** The em is set in Fraunces italic (400 weight, accent color). The surrounding text is Fraunces 900 (upright). This is the only place italic appears in the display type. It makes the H2 read like a pull quote instead of a label.

Verbatim examples, pulled from the Finova kit:

```html
<h2>The mark is a <em>whisper.</em></h2>
<h2>Every color comes <em>from a field.</em></h2>
<h2>Four voices. <em>One hand.</em></h2>
<h2>The <em>gardener.</em></h2>
<h2>Four-pixel <em>heartbeat.</em></h2>
<h2>Grown up. <em>Never springy.</em></h2>
<h2>Pieces of the <em>ledger.</em></h2>
<h2>Speak like a <em>quiet friend.</em></h2>
<h2>Where the <em>files live.</em></h2>
```

Notice: the em phrase is the *conceptual* half. The upright half is the topic label. "The mark" (topic) + "is a *whisper.*" (stance). "Every color comes" (topic) + "*from a field.*" (stance).

Bad H2s that break the rule:
- `<h2>Typography</h2>` — no stance, no italic, no period
- `<h2>Our brand colors</h2>` — topic only, no pull quote
- `<h2>The <em>palette</em> is here</h2>` — em wraps the topic, not the stance

## The four-voice typography pedagogy

Every kit ships **four type voices**, never three, never five. Each voice has **one job** and is never allowed to do another voice's job:

| Voice | Font role | Job | Example usage |
|---|---|---|---|
| Display serif | Fraunces / Funnel Display / Instrument Serif | Headlines, italic pull-quotes, currency glyph | `<h2>`, `<em>₹</em>`, cover title |
| Grotesque sans | Bricolage / Funnel Sans | Body, button labels, list rows | paragraphs, `.row .m`, CTAs |
| Mono digits | DM Mono / Space Mono | Eyebrow labels, tabular numbers, timestamps | `.label`, `16,368.32`, `2m ago` |
| Handwritten | Caveat | Marginalia, delight, the human voice | `.handnote`, `body em`, "— 3rd Zepto order —" |

The section 03 Type head is literally named around this: `<h2>Four voices. <em>One hand.</em></h2>`. The "one hand" is the discipline — four fonts all feel designed by the same person because each stays in its lane.

## TOC grid at the top

Before `COVER`, a sticky top nav carries 6–9 anchor links. Below the cover hero, a **TOC grid** gives each section a full card so the reader has a map:

```css
.toc {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 48px;
  padding: 32px;
  background: var(--linen);
  border: 1px solid var(--border);
  border-radius: 20px;
}
```

Each TOC card: `<a href="#color"><div class="toc-n">02 · COLOR</div><div class="toc-t">Palette</div><div class="toc-d">6 swatches · a11y matrix</div></a>`.

## Copy-pasteable page skeleton

```html
<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>[Brand] · [Theme] Brand Kit v1.0</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Bricolage+Grotesque:opsz,wght@12..96,500..900&family=DM+Mono:wght@400;500&family=Caveat:wght@400..700&display=swap" rel="stylesheet">
  <style>
    :root { /* tokens here */ }
    /* section-head CSS from above */
  </style>
</head><body>

<nav class="topnav"><!-- 6–9 anchor links --></nav>

<div class="wrap">

  <section class="cover">
    <div class="eyebrow">Brand Kit · 2026.04.09</div>
    <h1>[Name]<br><em>[tagline].</em></h1>
    <p class="lede">[2 sentences].</p>
    <div class="meta-grid">
      <div>Version<strong>1.0.0</strong></div>
      <div>Status<strong><em>Locked</em></strong></div>
    </div>
  </section>

  <div class="toc"><!-- 10 cards, one per section --></div>

  <section id="manifesto">
    <div class="manifesto-strip">
      <blockquote>One <strong>sentence</strong> that makes the stance clear. We <span class="hand">do this</span>.</blockquote>
      <cite>— [Theme] · [Brand] · 2026</cite>
    </div>
  </section>

  <section id="logo">
    <div class="section-head">
      <div class="num">01</div>
      <div class="title">
        <div class="label">Identity</div>
        <h2>The mark is a <em>whisper.</em></h2>
        <p class="body">[2 sentences on the logo rule]. <em>Don't stylize it.</em></p>
      </div>
    </div>
    <div class="logo-grid"><!-- 3 lockups: light / dark / accent --></div>
    <div class="logo-rules"><!-- clear space, min size, tilt, placement --></div>
  </section>

  <section id="color">...</section>
  <section id="type">...</section>
  <section id="mascot">...</section>
  <section id="spacing">...</section>
  <section id="motion">...</section>
  <section id="components">...</section>
  <section id="voice">...</section>
  <section id="files">...</section>

</div>
</body></html>
```

**Rule of thumb:** if you're writing a brand kit and the HTML doesn't have all 10 `<section id="...">` tags in this order, you haven't shipped a brand kit — you've shipped a palette page.

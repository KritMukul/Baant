# Theme Round Layout — The 4–6 Card Grid

Step 1 of the pipeline shows the user **4–6 genuinely distinct design directions side-by-side** on a single scrollable HTML page. Each direction is a phone-frame card with the shared scaffold filled in using that direction's palette, type, and signature move. The whole page exists so the user can scan, compare, and pick one.

## The layout

One page, two anchors:

```
TOP       — hero head ("Round 01 · Theme Exploration") + 1 paragraph framing
MIDDLE    — card grid (4–6 theme cards)
BOTTOM    — decision footer ("Pick a world", reply A / B / A+D mashup / none)
```

The card grid is always the same CSS. Pulled verbatim from `Superpowers Brainstorming 1.html`:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
```

This gives you 2-up on desktop, 1-up on mobile, never stretches a card wider than it can look like a phone mockup. On wide monitors you can bump the minmax to `320px` and rely on `repeat(auto-fill, minmax(320px, 1fr))` to pin column count.

## The shared scaffold rule

Every card **shares identical structure** so the user is comparing directions, not layouts. If card A has a greeting + hero number + bento + tab bar, card B must have the same. The only things that change per card are:

- palette variables (`--cream`, `--ink`, `--accent` reset per card)
- font stack (`--font-display`, `--font-sans`, `--font-mono`)
- a single signature move (a dial, a ticker, a magazine crop, a glowing FAB)
- the copy tone in the caption

Without the shared scaffold the user reads "5 different apps" and can't pick. With it, they read "5 different worlds for the same app" and can.

## Per-card anatomy

```html
<div class="theme-card" data-theme="firekeeper">
  <div class="meta-row">
    <div class="lbl">Option A</div>
    <div class="ver">v0.1</div>
  </div>

  <div class="swatches">
    <span style="background:#f3eddd"></span>
    <span style="background:#2a4a2b"></span>
    <span style="background:#c89530"></span>
    <span style="background:#8a3324"></span>
    <span style="background:#1a1f15"></span>
    <span style="background:#a8bca0"></span>
  </div>

  <div class="type-sample">
    <div class="display">Money, <em>quietly.</em></div>
    <div class="mono">₹ 16,368.32</div>
  </div>

  <div class="phone-frame">
    <div class="phone-screen">
      <!-- shared scaffold: statusbar + greet + hero + bento + tabbar -->
    </div>
  </div>

  <h3>Home.<br>The daily <em>chapter</em>.</h3>
  <p class="pitch">Cream canvas, moss headlines, one Caveat handnote. Familiar and warm.</p>

  <div class="inspo-tags">
    <span>Kinfolk</span><span>ledger paper</span><span>italic Fraunces</span>
  </div>
</div>
```

The phone frame CSS (pulled from `Superpowers Brainstorming 1.html`):

```css
.phone {
  width: 300px;
  height: 620px;
  border-radius: 50px;
  position: relative;
  overflow: hidden;
  background: var(--cream);
  box-shadow:
    0 0 0 9px #0a0a0a,
    0 0 0 10px #2a2a2a,
    0 40px 80px -25px rgba(0,0,0,0.4);
  flex-shrink: 0;
}
.phone .notch {
  position: absolute;
  top: 11px; left: 50%;
  transform: translateX(-50%);
  width: 96px; height: 26px;
  background: #0a0a0a;
  border-radius: 999px;
  z-index: 100;
}
.phone .statusbar {
  position: absolute;
  top: 17px; left: 28px; right: 28px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  font-family: -apple-system, sans-serif;
  z-index: 90;
}
```

Two 9px/10px shadow rings = device bezel + shiny edge. Without both rings the phones look flat and PowerPoint-y.

## The declarative caption convention

Every card's `<h3>` caption follows the **Declarative. The metaphor.** shape. Two short clauses. First names the surface. Second (wrapped in `<em>`) delivers the metaphor.

```html
<h3>Home.<br>The daily <em>chapter</em>.</h3>
<h3>Not a number.<br>A <em>dial</em>.</h3>
<h3>The <em>lift</em> is the hero.</h3>
<h3>Cream. Ink. <em>Pink</em>.</h3>
<h3>Fast. <em>Honest</em>. Interruptible.</h3>
```

All real captions from Pulse and Finova rounds. Rules:

- 2–5 words max, split over two lines with `<br>`
- one `<em>` — always the *metaphor*, never the *noun*
- no period at the end of h3 captions (section heads use periods, card captions use bare phrase)
- lowercase body voice is fine — "the daily chapter" not "The Daily Chapter"

CSS for the caption (from `Superpowers Brainstorming 1.html`):

```css
.screen-notes h3 {
  font-family: 'Funnel Display', sans-serif;
  font-size: 38px;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.035em;
  margin-bottom: 14px;
}
.screen-notes h3 em {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 400;
  color: var(--accent);
}
```

## Always include one dark theme

A dark-mode card in the set does three things:

1. Stress-tests the palette's inverse reading
2. Gives the risk-averse user a "safe" fallback that still feels elevated
3. Proves the scaffold survives tonal inversion

Use a `.phone-midnight` modifier that swaps screen bg + text color:

```css
.phone-midnight { background: var(--midnight); }     /* #101116 or deeper */
.phone-midnight .statusbar { color: var(--cream-inverse); }
.phone-midnight .screen { color: var(--cream-inverse); }
.phone-midnight .brand-name { color: var(--cream-inverse); }
```

The other 3–5 cards stay warm/cream. The single dark card provides the contrast. If you ship 5 dark cards you've shipped 1 direction — "dark mode" — which is not a direction.

## Theme naming — evocative, not generic

Name every theme with a **two-word evocative phrase**. Never "Modern A / Modern B / Modern C". The name is part of the pitch; if it sounds like a font option, it won't sell.

Good names (all from real pipeline runs):

```
Firekeeper        · ember + ash + temperature
Moss & Bone       · cream + deep moss + ochre + Caveat marginalia
Midnight Ledger   · ink + gold hairlines + tabular numerics
Loud Lime         · acid green + brutalist mono
Pulse             · pink scream + cream + hairlines
Paperback         · warm ivory + editorial serif
Circuit           · cyan glow + grid + Y2K
Kinfolk           · neutral linen + quiet editorial
```

Bad names that will get rejected:

```
Option A · Option B · Option C
Modern 1 · Modern 2 · Modern 3
Light Theme · Dark Theme · Accent Theme
Clean · Bold · Playful
```

A name earns the right to be picked. "Firekeeper" gives the user a verb to defend at their next meeting ("I picked the one that keeps the fire"). "Option A" gives them nothing.

## Footer decision block

At the bottom of the theme round, a single decision card with clickable option rows. The user can pick one letter, two letters with a `+` for a mashup, or "none of these" which triggers a full re-spin:

```html
<div class="decision">
  <h2>Pick a world.</h2>
  <div class="options">
    <div class="option" data-choice="A"><span class="dot" style="background:#c89530"></span><div class="content"><h3>Firekeeper</h3><p>Ember + ash + temperature.</p></div></div>
    <div class="option" data-choice="B"><span class="dot" style="background:#2a4a2b"></span><div class="content"><h3>Moss &amp; Bone</h3><p>Cream canvas, moss headlines, Caveat scribbles.</p></div></div>
    <!-- ... -->
  </div>
  <p class="reply-hint">Reply with a letter (A), a mashup (A + D), or "none".</p>
</div>
```

This completes the round: the user clicks, you log the verdict to `state.md`, and rejected directions never come back.

# Screen Grid Layout — 20–30 Mockups on One Page

Step 5 (All Screens) produces **every screen** of the target product. Each screen is delivered individually to the user for approval. When multiple screens are shown together for review, use this grid layout. 20-30 phones, all visible at once, all sharing the same shape grammar, each earning exactly one signature move.

## The top-level grid

One CSS rule runs the whole page. Pulled verbatim from `Superpowers Brainstorming Screens.html`:

```css
.screen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 36px 28px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 20px;
}
```

Finova's Round 08 uses the same pattern with slightly different gutters (`gap: 48px 32px`, `repeat(auto-fit, minmax(280px, 1fr))`). Either works. Key decisions:

- `minmax(280px, 1fr)` — this is the phone width + frame chrome. Don't go below 280. Don't go above 320 or the page starts to feel empty.
- `auto-fill` vs `auto-fit` — use `auto-fill` when each group might have a weird count (3, 7) and you want the row left-aligned with empty cells. Use `auto-fit` when you want cells to stretch to fill.
- `gap: 36px 28px` — row gap bigger than column gap. The label row under each phone wants breathing room before the next phone's status bar begins.

## Grouping convention

Never dump 30 phones in one flat grid. Always group them. Two common grouping schemes:

**Scheme A — Surface type (Pulse):**
```
01 · TABS          — 5 daily surfaces
02 · MODALS        — 6 ritual moments
03 · STACKS        — 18 pushed from tabs
```

**Scheme B — User journey (Finova):**
```
01 · AUTH          — 1 screen
02 · MAIN TABS     — 5 screens (Home, Money, Budget, Goals, AI)
03 · MONEY HUB     — 7 screens (detail, charts, bills, scan)
04 · GOALS HUB     — 9 screens (health, invest, net worth)
05 · TOOLS         — 2 screens
06 · AI            — 2 screens
07 · LEARN         — 1 screen
08 · SETTINGS      — 2 screens
```

Pick whichever scheme answers "how does the user navigate here?" better. Surface type for OS-style apps. User journey for flow-heavy apps.

## Section head for each group

Every group opens with a `.section-head` — **different** from the brand kit section head. Screen pages use a slimmer horizontal bar with a count badge on the right. Pulled verbatim from `Finova · Round 08 · Production-Ready.html`:

```css
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 56px;
  gap: 48px;
}
.section-head .num {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: 120px;
  line-height: 0.7;
  color: var(--border);
  letter-spacing: -5px;
  flex-shrink: 0;
}
.section-head .title { max-width: 680px; flex: 1; }
.section-head .label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--moss);
  margin-bottom: 14px;
}
.section-head h2 {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: clamp(42px, 4.5vw, 64px);
  line-height: 0.95;
  letter-spacing: -2px;
}
.section-head h2 em { font-style: italic; font-weight: 400; color: var(--moss); }
.section-head .body {
  font-size: 14px; line-height: 1.6;
  color: rgba(26,31,21,0.65);
  margin-top: 18px; max-width: 480px; font-weight: 500;
}
.section-head .count {
  font-family: 'DM Mono', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 1.5px;
  padding: 8px 14px; background: var(--moss); color: var(--bone);
  border-radius: 100px; font-weight: 500; flex-shrink: 0;
}
```

Group H2 follows the same italic pull-quote rule as the brand kit: "The five *daily beats.*", "The *front door.*", "Pieces of the *ledger.*".

## Per-slot anatomy

Each phone in the grid lives in a `.phone-slot` with a meta label, a title, and a one-sentence description below the device. Pulled verbatim:

```css
.phone-slot { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.phone-slot .meta {
  font-family: 'DM Mono', monospace; font-size: 9px;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: rgba(26,31,21,0.4); text-align: center;
}
.phone-slot .t {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 700;
  font-size: 20px; letter-spacing: -0.3px; color: var(--ink);
}
.phone-slot .t::first-letter { color: var(--moss); }
.phone-slot .d {
  font-size: 11px; color: rgba(26,31,21,0.55);
  text-align: center; max-width: 240px; line-height: 1.5; font-weight: 500;
}
```

Note `.t::first-letter { color: var(--moss); }` — the first letter of every screen title takes the accent color. Tiny detail, massive consistency payoff across 30 phones.

## Phone frame chrome

Every screen has the same frame. The structure (`.p > .sc`) is fixed:

```html
<div class="phone-slot">
  <div class="p">
    <div class="sc">
      <div class="bar"><span>9:41</span><span>●●● ▮</span></div>
      <div class="pg-head"><div class="brand-lbl">finova</div><div class="avatar">O</div></div>
      <!-- screen body -->
      <div class="tabs">
        <div class="tab active">home</div>
        <div class="tab">money</div>
        <div class="fab">+</div>
        <div class="tab">goals</div>
        <div class="tab">ai</div>
      </div>
    </div>
  </div>
  <div class="meta">02 · MAIN TABS</div>
  <div class="t">Home</div>
  <div class="d">Morning greeting, net worth hero, this week's garden.</div>
</div>
```

The atoms (`.bar`, `.pg-head`, `.brand-lbl`, `.label-mini`, `.row`, `.tabs`, `.fab`) are defined once at the top of the page and reused by every phone. This is what makes 30 phones feel like one app instead of 30 separate sketches.

## The "shared grammar, one signature move" rule

Each screen inherits the same grammar: cream canvas, status bar, page head, tab bar, typography scale, row atoms, label-minis, card radii. But **each screen earns exactly one signature move** — a single visual idea that belongs to that screen only.

Examples from the real runs:

```
Home         — hero net worth number with italic Fraunces ₹ glyph
Nutrition    — 140px radial macro dial (no other screen has a dial)
Workouts     — 72pt current-lift hero ("185lb, set 4 of 5")
Sleep        — the only midnight-mode screen (inverted palette)
Budget       — bento grid of category tiles with progress bars
AI           — chat bubble stack with Caveat handnote caption
Scan & Pay   — QR viewfinder with detected-merchant bottom sheet
```

If two screens share the same signature move, one of them is decoration instead of design. Pick different moves.

## Complete HTML skeleton for one group and one phone

```html
<section class="section" id="tabs">
  <div class="section-head">
    <div class="num">02</div>
    <div class="title">
      <div class="label">Main tabs</div>
      <h2>The five <em>daily beats.</em></h2>
      <p class="body">Home · Money · Budget · Goals · AI. Every tab earns one hero move and inherits the shared scaffold.</p>
    </div>
    <div class="count">5 screens</div>
  </div>

  <div class="grid">

    <div class="phone-slot">
      <div class="p"><div class="sc">

        <div class="bar"><span>9:41</span><span>●●● ▮</span></div>
        <div class="pg-head">
          <div class="brand-lbl">finova</div>
          <div class="avatar">O</div>
        </div>

        <div class="label-mini">NET WORTH · APR 9</div>
        <div class="hero-num"><em>₹</em> 2,04,538<span class="pos"> ↑ 12%</span></div>
        <div class="handnote">— on pace for goal —</div>

        <div class="label-mini">RECENT</div>
        <div class="row"><div class="cat grocery">🛒</div><div class="mid"><div class="m">Zepto</div><div class="s">Groceries · 2m ago</div></div><div class="a neg">− ₹247.50</div></div>
        <div class="row"><div class="cat cafe">☕</div><div class="mid"><div class="m">Starbucks Vasant Kunj</div><div class="s">Cafe · 9:12 AM</div></div><div class="a neg">− ₹287</div></div>
        <div class="row"><div class="cat salary">💼</div><div class="mid"><div class="m">Razorpay Payroll</div><div class="s">Salary · 6:00 PM</div></div><div class="a pos">+ ₹45,000</div></div>

        <div class="tabs">
          <div class="tab active">home</div>
          <div class="tab">money</div>
          <div class="fab">+</div>
          <div class="tab">goals</div>
          <div class="tab">ai</div>
        </div>

      </div></div>
      <div class="meta">02 · MAIN TABS</div>
      <div class="t">Home</div>
      <div class="d">Net worth hero, Caveat handnote, 3 recent rows, tab bar.</div>
    </div>

    <!-- ... 4 more phone-slots in this group ... -->

  </div>
</section>
```

**Rule of thumb:** if you can't paste one more phone into the grid without breaking the visual rhythm, the grid is wrong. If every phone looks the same, the signature-move rule is wrong. Get both right and a 30-screen page reads like a single brand document instead of 30 disconnected sketches.

# Step 5 — All Screens Checklist

Step 5 produces **every screen** of the target product in the locked brand kit. Screens are delivered one at a time to the user for individual approval, each at full production fidelity with real data.

## What to produce

### Per screen
**File:** `content/round5-<screen-name>.html`

- One screen per file, at full production quality
- Real data from the start (no wireframe pass — the Screen Preview in Step 2 already validated the direction)
- Each screen in a phone/web frame
- Focus on structure, hierarchy, component composition, real data
- Include all states: default, loading (skeleton), empty, error

### Pass 2 · Production-ready
**File:** `content/round5-<screen-name>.html` (one per screen, saved to `docs/design/mockups/` when approved)

- Same layout as pass 1, but with **real data** everywhere
- Include a "what changed from wireframe" change-log at the top
- Save permanently to `docs/design/mockups/<project>-all-screens-v1.html` once approved

## Real data requirements (non-negotiable)

### 1. Real entity names
Use actual brand/product/entity names, not placeholders.

- Bad: `Merchant A`, `Food Store`, `XYZ Bank`
- Good: `Zepto`, `Swiggy Instamart`, `HDFC Bank`, `Zerodha Kite`, `Netflix Premium`, `BSES Rajdhani`, `Airtel Xstream Fiber`

For non-financial products, use equivalent real-world names:
- Recipe app → real recipes ("Palak Paneer", "Butter Chicken")
- Fitness app → real workouts ("4×8 Back Squats", "Half Marathon")
- Music app → real songs/artists (respecting copyright)

### 2. Realistic numbers with specificity
Round numbers feel fake. Use specific decimals.

- Bad: `₹500`, `₹1,000`, `₹4,100`
- Good: `₹247.50`, `₹1,247.50`, `₹2,04,538`, `₹−16,368.32`

### 3. Real timestamps
Use a mix of relative and absolute times to feel alive.

- Bad: `12:00 AM`, `today`, `Date`
- Good: `2m ago`, `9:12 AM`, `Tue 11:40 PM`, `yesterday`, `Apr 5`, `3 days ago`

### 4. Real context
Include locations, methods, card references.

- Bad: no context
- Good: `HDFC UPI ×4821 · Vasant Kunj, Delhi`, `NEFT · Razorpay Payroll`, `auto-debit · Apr 12`

### 5. Populated empty states
If a screen would normally show an empty state, populate it with real-looking data.

- Bad: "No notifications" empty state
- Good: 3 real alerts — "Shopping budget exceeded · 2h", "Netflix renews in 5 days · 6h", "HDFC Bank up 14% · 1d"

### 6. Realistic chart data
Smooth curves look generated. Add jitter.

- Bad: smooth `M 0 40 Q 30 30 ... T 260 10` sine-wave paths
- Good: 24 discrete data points with visible peaks and dips

### 7. Category icons, not letter tiles
For transaction/item rows, use **emoji or real icons in tinted backgrounds**, not first-letter monograms.

- Bad: Circle with letter "Z" for Zepto
- Good: 🛒 in a pale-green 36px rounded square for Groceries

Map categories to emojis + tints in a central lookup:
```ts
const CATEGORY_MAP = {
  groceries:   { emoji: '🛒', bg: '#e8f5d9' },
  dining:      { emoji: '🍔', bg: '#fdecd5' },
  cafe:        { emoji: '☕', bg: '#f2e7d5' },
  entertainment: { emoji: '🎬', bg: '#f5d8d4' },
  phone:       { emoji: '📱', bg: '#d9eafd' },
  bills:       { emoji: '⚡', bg: '#fdf5d5' },
  shopping:    { emoji: '🛍️', bg: '#f5d9e8' },
  transport:   { emoji: '🚗', bg: '#e5e0d5' },
  salary:      { emoji: '💼', bg: '#d9e8d4' },
  investment:  { emoji: '📈', bg: '#e8d9f5' },
};
```

## Page structure

### Top of the HTML file
- Nav bar with sticky position + brand + TOC links
- Cover section: "Round NN · Production-ready" + changelog from wireframe pass

### Middle — grouped by section
For each section:
- Section header with big number, label, title, description, count badge
- Grid of phone mockups (auto-fit minmax 280px)
- Each phone slot: phone frame + meta label + title + description

### Bottom
- "Lock all" CTA
- Decision footer asking for feedback

## Per-screen slot structure

```html
<div class="phone-slot">
  <div class="p"><div class="sc">
    <!-- status bar, page head, screen content, tab bar if applicable -->
  </div></div>
  <div class="meta">NN · SECTION</div>
  <div class="t">Screen Name</div>
  <div class="d">One-sentence description of what the screen does.</div>
</div>
```

## Common failure modes

1. **Placeholder amounts.** `$1000 · $2000 · $500` everywhere → fake. Vary specifically.
2. **Same time on every row.** `12:00 AM` × 20 → fake. Vary realistically.
3. **Empty states instead of populated ones.** User sees dead screens → looks half-built.
4. **Generic categories.** `Food`, `Shopping`, `Other` → boring. Use real merchant names.
5. **No search/filter state visualized.** Every screen is a pristine load state → misses 50% of real usage.
6. **Charts without variance.** Perfect curves → obviously AI-generated.
7. **Missing context.** Transaction says `$500` but not where/when/how → useless.

## Iteration

User feedback patterns and what to do:
- "Feels placeholder-y" → Do a production pass with real data
- "This screen is missing X" → Add X, push v2, log in state.md
- "Fix #14" → Targeted fix, don't rebuild everything
- "Lock all" → Save to docs/design/mockups/, move to round 5 or 6

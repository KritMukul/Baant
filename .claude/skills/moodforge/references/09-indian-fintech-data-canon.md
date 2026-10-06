# Indian Fintech Data Canon

Screen mockups for Indian fintech (or any India-context product) use **real data, never placeholders**. This file is the canon. Copy-paste from here. Don't invent merchants. Don't round amounts. Don't type `₹500`.

## The merchant library

These are the real merchants used across the Finova Round 08 production pass. Pull from this list any time you need a transaction row. Mix categories so the feed feels like a real week, not a category demo.

### Groceries & quick-commerce
```
Zepto
Swiggy Instamart
BigBasket
Blinkit
DMart · Vasant Kunj
```

### Dining & takeaway
```
Swiggy · Dominos
Swiggy · Wow! Momo
Zomato · Olive Bistro
Dominos Sector 29
Burger King · Cyber Hub
Olive Bistro · Dinner
```

### Cafes
```
Starbucks Vasant Kunj
Blue Tokai · Khan Market
Third Wave Coffee · CP
```

### Transport
```
Uber · Phase 3
Uber · Airport Drop
Ola · Intercity
IndianOil Petrol · NH48
Metro · Blue Line
```

### Bills & utilities
```
BSES Rajdhani          (electricity)
Airtel Xstream Fiber   (broadband)
Jio Postpaid           (mobile)
Mahanagar Gas
Paras Tierea Rent      (housing)
```

### Shopping
```
Amazon · Nikes
Amazon · Prime order
Myntra
Nykaa
Decathlon · Saket
```

### Entertainment & subscriptions
```
Netflix Premium
Spotify Family
Prime Video
Hotstar
YouTube Premium
```

### Salary, transfers, payroll
```
Razorpay Payroll
NEFT · HDFC Bank
Mom · UPI
Ankit · split dinner
```

### Investments & banking
```
Zerodha Kite
Zerodha Portfolio
HDFC Bank
HDFC UPI ×4821
PhonePe Digital Gold
Groww SIP
ICICI Prudential MF
```

Use full names with location context where natural. "Starbucks Vasant Kunj" reads true. "Starbucks" alone reads like a stock photo caption.

## The amount library

Indian amounts use the **lakh-comma format**: `2,04,538` not `204,538`. Two-digit groups after the first three-digit group. This is the single most missed detail in AI-generated Indian fintech mockups.

### Lakh format — copy these exactly
```
₹2,04,538           (2.04 lakh — net worth hero)
₹1,82,450           (1.82 lakh — savings total)
₹12,84,300          (12.84 lakh — annual CTC)
₹45,000             (salary, no lakh needed)
₹15,000             (rent)
```

### Precise small sums — never round
```
₹247.50     (Zepto order)
₹287        (Starbucks)
₹432        (Swiggy · Dominos)
₹156        (Uber · Phase 3)
₹1,247.50   (Amazon cart)
₹1,847      (BSES electricity)
₹1,250      (Nikes)
₹2,184      (Olive Bistro dinner)
₹649        (Netflix Premium)
₹179        (Spotify Family)
₹399        (Jio Postpaid)
₹1,200      (Airtel plan)
```

The rule: every amount is either a **precise paise decimal** (`.50`, `.32`) or a **specific whole number** that doesn't end in three zeros. `₹500` is a lie. `₹487` is a life.

### Negatives and positives
```
− ₹247.50      (debit row)
− ₹1,250       (big shop debit)
+ ₹45,000      (salary credit)
+ ₹1,245.00    (interest credit)
↑ 12%          (net worth trend)
↓ 8%           (category under-spend)
```

Use a proper minus sign (`−`, U+2212) or `− ` with a space, not a hyphen. Paired with a `.neg` class that colors it ink, and `.pos` that colors it moss/sage/accent.

## The timestamp library

Mix **relative** and **absolute** timestamps in the same feed. All-relative feels like a demo. All-absolute feels like a CSV import. Mixed feels like a live app.

### Relative
```
2m ago
12m ago
1h ago
3h ago
yesterday
3 days ago
last week
```

### Absolute — time of day
```
9:12 AM
11:40 PM
6:00 PM
8:34 AM
```

### Absolute — date
```
Apr 3
Apr 5
Apr 12
Apr 14
Apr 15
Thu · ₹1,250
Sat · ₹2,184
```

### Combined context strings
```
Groceries · 2m ago
Cafe · 9:12 AM
Transport · 8:34 AM
Salary · 6:00 PM
Apr 12 · electricity
Apr 14 · auto-debit
Thu 8:34 AM
```

The format is always `CATEGORY · TIME` with a middle-dot separator, never a dash, never a pipe.

## The 10 category tints (CSS custom properties)

Pulled verbatim from `Finova · Round 08 · Production-Ready.html`. These are **the canonical tints** for category chip backgrounds — pale, warm, under 10% saturation so icons read on top:

```css
:root {
  --cat-grocery:   #e8f5d9;   /* pale sage */
  --cat-dining:    #fdecd5;   /* pale peach */
  --cat-cafe:      #f2e7d5;   /* pale latte */
  --cat-enter:     #f5d8d4;   /* pale coral */
  --cat-phone:     #d9eafd;   /* pale sky */
  --cat-bills:     #fdf5d5;   /* pale wheat */
  --cat-shop:      #f5d9e8;   /* pale rose */
  --cat-transport: #e5e0d5;   /* pale stone */
  --cat-salary:    #d9e8d4;   /* pale mint */
  --cat-invest:    #e8d9f5;   /* pale lilac */
}
```

And the row-class wiring:

```css
.row .cat.grocery   { background: var(--cat-grocery); }
.row .cat.dining    { background: var(--cat-dining); }
.row .cat.cafe      { background: var(--cat-cafe); }
.row .cat.enter     { background: var(--cat-enter); }
.row .cat.phone     { background: var(--cat-phone); }
.row .cat.bills     { background: var(--cat-bills); }
.row .cat.shop      { background: var(--cat-shop); }
.row .cat.transport { background: var(--cat-transport); }
.row .cat.salary    { background: var(--cat-salary); }
.row .cat.invest    { background: var(--cat-invest); }
```

Each chip is a 36px rounded square holding one emoji. **Never** use letter tiles (`Z` for Zepto). Always an emoji or a real SVG icon. The emoji map:

```
🛒 groceries     🍔 dining        ☕ cafe
🎬 entertainment 📱 phone         ⚡ bills
🛍️ shopping     🚗 transport     💼 salary
📈 investment    🪙 gold          🔥 FIRE projection
```

## Example row — copy-paste verbatim

```html
<div class="row">
  <div class="cat grocery">🛒</div>
  <div class="mid">
    <div class="m">Zepto</div>
    <div class="s">Groceries · 2m ago</div>
  </div>
  <div class="a neg">− ₹247.50</div>
</div>
<div class="row">
  <div class="cat cafe">☕</div>
  <div class="mid">
    <div class="m">Starbucks Vasant Kunj</div>
    <div class="s">Cafe · 9:12 AM</div>
  </div>
  <div class="a neg">− ₹287</div>
</div>
<div class="row">
  <div class="cat transport">🚗</div>
  <div class="mid">
    <div class="m">Uber · Phase 3</div>
    <div class="s">Transport · 8:34 AM</div>
  </div>
  <div class="a neg">− ₹156</div>
</div>
<div class="row">
  <div class="cat salary">💼</div>
  <div class="mid">
    <div class="m">Razorpay Payroll</div>
    <div class="s">Salary · 6:00 PM</div>
  </div>
  <div class="a pos">+ ₹45,000</div>
</div>
```

## The Caveat handnote pattern

Every screen earns one handwritten marginalia note in Caveat, rotated -1.5°, colored accent. It's the brand's tiny editorial voice inside the data. Pulled verbatim:

```css
.handnote {
  font-family: 'Caveat', cursive;
  font-weight: 700;
  font-size: 13px;
  color: var(--moss);
  transform: rotate(-1.5deg);
  display: inline-block;
  margin-top: 6px;
  position: relative;
  z-index: 2;
}
```

Real handnotes used in Finova Round 08:

```
— 3rd Zepto order this week —
— thursday was the spike —
— 4 new rules suggested —
— on pace for goal —
— your plants missed you —
```

Rules:
- lowercase, em-dashes on both sides
- observation, not instruction ("3rd Zepto order this week" good; "spend less on groceries" bad)
- one per screen, never two
- past tense or present tense, never future/imperative

## The anti-slop list — never ship these

| Slop | Use instead |
|---|---|
| `Food` | `Swiggy Instamart` / `Zepto` / `Starbucks Vasant Kunj` |
| `Apple` | `Netflix Premium` / `Spotify Family` |
| `Merchant A / B / C` | actual merchant name from the library |
| `$500` | `₹247.50` (lakh format, paise, rupee glyph) |
| `$1,000 / $2,000` | any amount NOT ending in `000` |
| `XYZ Bank` | `HDFC Bank` / `Zerodha Kite` / `BSES Rajdhani` |
| `204,538` | `2,04,538` (lakh comma) |
| `12:00 AM` × every row | mix `2m ago`, `9:12 AM`, `Apr 12`, `yesterday` |
| `Lorem Ipsum` | literally any real English sentence |
| `Company A paid you` | `Razorpay Payroll · 6:00 PM · + ₹45,000` |
| Letter tile "Z" for Zepto | 🛒 emoji in `var(--cat-grocery)` background |
| Smooth sine-wave chart | 24 discrete points with visible peaks |
| "No notifications" empty state | 3 real alerts with merchant + time + delta |

The test: if the user's friend can't tell whether this screen is a mockup or a real app, the data is right. If they can, it's slop. Ship the former.

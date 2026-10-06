# BreakdownMap Municipal Dashboard · Design State

**Last updated:** 2026-10-04
**Current phase:** COMPLETE — pipeline shipped, **all six spec phases applied**.
**Status:** shipped. Branch `design/dispatch-desk`, 7 commits. 14 of 15 findings fixed.

## Code findings — 15 found, 14 FIXED, 1 partial

Surfaced by designing screens, each verified in source. **No code has been
changed.** Deferred to Step 6 by default because the user's "yes look good go
ahead" approved screen 1 without picking a time for the fixes.

| # | File | Issue | Severity |
|---|---|---|---|
| 1 | `App.jsx:53` | `onClick={signIn}` uncaught — closing the Google popup gives an unhandled rejection and **no UI change** | high |
| 2 | `App.jsx` | no 401 branch; expired token renders "Cannot reach the server" | medium |
| 3 | `App.jsx:89` | error card's only escape is `reload()`; stale token = permanent dead end | medium |
| 4 | `Dashboard.jsx:42-48` | **failed `getHotspots` renders "No open problems"** — a dead backend is pixel-identical to all work being done | **serious** |
| 5 | `HotspotList.jsx:163-167` | `emptyMessage` keyed on `filters.view` only — a filter matching nothing claims nothing exists | medium |
| 6 | `Dashboard.jsx` | no `lastLoadedAt`; if socket *and* poll both fail, frozen deadline countdowns look authoritative | medium |
| 7 | `HotspotPanel.jsx:46-47` | both early returns replace the whole panel incl. its Close button; `grid-row: span 3` (`index.css:420`) means a slow or failed `getHotspot` is **inescapable** without a page reload | high |
| 8 | `HotspotPanel.jsx:17-20` | effect deps `[hotspotId]` only — a WS update refreshes the list but never the panel, so `nextStages` offers transitions from a stage the hotspot has left; a failed write does not re-fetch either, so the same doomed button can be pressed forever | high |
| 9 | `HotspotPanel.jsx` **and `HotspotList.jsx`** | inline `band.colour`/`stage.colour` as text over their own `+'22'` tint, plus literal hexes — **14 hardcoded hexes and 4 tint patterns across the JSX**; a theme-migration trap, see below | medium |
| 10 | `HotspotPanel.jsx` (last line) | write error renders last in `.panel-foot`, below textarea, crew input and buttons — the easiest place to miss | medium |
| 11 | `index.css` (3 rules combined) | **list clipped to ~22px on a 375px phone** with `overflow:hidden` so no scroll; 199px on a 390px phone | high |
| 12 | `index.css:420` + breakpoint | `.panel` spans `.side`'s 3 rows, which below 900px is 22–199px tall — **a hotspot cannot be actioned on a phone**; stage buttons off-screen, no scroll | high |
| 13 | `index.css` breakpoint | width-only `max-width:900px`; a 900×600 window drops to stacked and leaves 109px for the list despite having room for two columns | medium |
| 14 | `index.css` `.toasts` | fixed `width:280px` + `right:14px` = 294px of a 320px viewport | low |

Findings 11–14 are the only **pure-CSS** ones; every other finding needs a
React change.

### Finding 15 — found while implementing, not while designing

`HotspotPanel.jsx` stored the **Error object** via `.catch(setError)` and the
failure branch put `{error}` straight into JSX. React throws *"Objects are not
valid as a React child"* on that, so the state meant to explain a failed
detail load **crashed the panel** rather than reporting anything. Strictly
worse than finding 7's dead end, and only visible once I restructured the
branch. Fixed in the same commit; `error` is now always a string.

### Status after 2026-10-04

| Finding | State | Commit |
|---|---|---|
| 1 sign-in uncaught | **fixed** | `5be7fc5` |
| 2 no 401 branch | **fixed** | `4439492` |
| 3 error card dead end | **fixed** | `5be7fc5` |
| 4 failed fetch reads as "no open problems" | **fixed** | `4439492` |
| 5 filter-empty claims nothing exists | **fixed** | `4439492` |
| 6 no `lastLoadedAt` / staleness | **fixed** | `a7aa4b5` |
| 7 panel not closable without data | **fixed** | `5be7fc5` |
| 8 panel keeps stale buttons | **fixed** | `5be7fc5` |
| 9 inline colours, theme-migration trap | **fixed** | `21e4863` |
| 10 write error in the footer tail | **fixed** | `5be7fc5` |
| 11 list clipped to 22px on a phone | **fixed** | `778a367` |
| 12 panel unusable below 900px | **fixed** | `778a367` |
| 13 900×600 loses the desktop layout | **fixed** | `778a367` |
| 14 toasts 294px of a 320px viewport | **fixed** | `778a367` |
| 15 panel error crashed on an Error object | **fixed** | `5be7fc5` |

**Decision (2026-10-04):** apply phases 1–2 only — the bug fixes, no visual
change — and commit `docs/` on a branch. Phases 3–6 (the kit, responsive, the
designed states, motion) stay in the spec for a later pass.

**Not verified at runtime.** `npm run lint`, `npm run build`,
`check-findings.mjs`, `verify-kit.mjs`, `build-kit.mjs` and `contrast.mjs` all
pass, and the Vite build parses every JSX change. But the backend-stopped
behaviour — phase 1's whole point — was **reasoned, not executed**: it needs a
running backend and a Firebase session. Someone should confirm it with the
server down before trusting it.

Finding 4 is the one I would not ship without. Findings 3, 7 and the 401 in
finding 2 are all **dead ends with no exit**. Finding 5 needs an unfiltered
count the API does not currently return, so it has a small backend
implication; the rest are frontend-only.

### Finding 9 in detail — measured, not assumed

The hardcoded colours **mostly pass on today's dark surface** and break on the
new light one. This is the single largest concrete argument for the kit:

| used as text | today dark `#151821` | new light `#FFFFFF` |
|---|---|---|
| `#FFCA28` "Broke again" | 11.59 ✓ | **1.53 ✗** |
| `#FFCA28` on its `22` tint | 8.64 ✓ | **1.44 ✗** |
| `#66BB6A` deadline met | 7.50 ✓ | **2.36 ✗** |
| `#EF5350` deadline late | 5.09 ✓ | **3.49 ✗** |
| `#00B4D8` verified on tint | 5.84 ✓ | **2.17 ✗** |
| `#6C5CE7` assigned on tint | **3.21 ✗** | 4.08 ✗ |

Only `#6C5CE7` fails today; `#EF5350` on its own tint is marginal at 4.39.
Switching to a light surface breaks six at once. Fix: swap every inline colour
for `--bdm-stage-*-text` / `--bdm-severity-*-text`, which already ship
light+dark variants and are AA-gated in `build-kit.mjs`.

---

## Preview server

`http://127.0.0.1:58565` — zero-dep `templates/preview-server.js` fallback,
serving `docs/design/rounds/round2-dispatch-desk-preview.html`.
(Round 1's server on :63858 was stopped when Round 2 went up.)

**The brand kit cannot use that server.** `templates/preview-server.js`
responds with the same HTML body for *every* request path, so a multi-file
artifact breaks on it — `tokens.css` would be served as `text/html` and the
kit would render unstyled. `docs/design/brand-kit/index.html` is therefore
opened over `file://`, which is safe here because nothing in it uses `fetch`
(the a11y matrix reads `getComputedStyle`). Any future multi-file round needs
either a real static server or a direct file open.

`superpowers:brainstorming` is **not installed** on this machine, so the
Visual Companion runs at priority 3. The fallback server reads its file once
at startup, so every re-spin needs the server restarted, not just the file
rebuilt.

## Current Direction

**B · Dispatch Desk** — chosen 2026-10-04. Cool grey paper, graphite chrome,
zero colour that is not data. Air-traffic density: monospace on every number,
status lights instead of coloured chrome, 2px radius, zebra rows.

| Token | Value |
|---|---|
| paper | `#F4F6F8` |
| surface | `#FFFFFF` |
| raised | `#E9EDF2` |
| line | `#CDD5DF` |
| ink | `#10151C` |
| muted | `#5B6676` |
| accent (chrome) | `#0F172A` graphite |
| radius | `2px` |
| display / body / mono | Archivo / IBM Plex Sans / IBM Plex Mono |

The accent is deliberately a near-black, not a hue. That is the direction's
whole thesis: with five locked hazard colours already on screen, a sixth
chrome hue would compete with the data.

## Locked Decisions

*Decisions that are no longer up for debate. Never re-ask these.*

1. Project root: `C:\My_Folder\Coding\React\breakdown-dashboard`
2. Stack is fixed: React 19 + Vite 8 + Leaflet 1.9 + Firebase. No TypeScript,
   no state library (`useState`/`useEffect` only) — design must not require
   either.
3. Hazard colors are cross-surface contract with the Flutter app
   (`src/hazards.js` ↔ `lib/core/theme/app_colors.dart`): pothole #FFA726,
   debris #EF5350, breakdown #FF7043, flooding #42A5F5,
   rough_shoulder #78909C. Changing one means changing both repos.
4. Map stays light while the chrome stays dark — deliberate, documented in
   `index.css`: desaturated tiles make the colored hazard circles read
   against roads instead of competing with them.
5. Scope: **full new direction**, Step 1 → Step 6. User chose this over a
   retheme-in-place or a polish pass (2026-10-04).
6. Operator context: **desk, browser tab, needs light mode.** Light is the
   default; dark stays as a real option, not the only option. This is the
   single biggest departure from today's look and it rules out any direction
   that only works dark.
7. Web deliverables only. moodforge's Step 3/6 shadcn + GSAP outputs apply
   here (unlike the Flutter sibling repo), but the project has **no component
   library and no Tailwind** — plain CSS with nine custom properties in
   `src/index.css`. Tokens land there, not in a new framework.

## Rejected Directions

*Never re-propose these. Verbatim quotes preserved.*

Round 1 (2026-10-04) — the user replied with the single letter **"B"**. There
was **no verbatim rejection** of the other four; they were simply not picked.
Recorded as not-chosen rather than killed, so the distinction survives:

1. **Civic Ledger** (round 1) — not chosen. Warm paper + Fraunces + ochre.
2. **Deadline** (round 1) — not chosen. See Preserved; its signature move is
   still live.
3. **Survey Sheet** (round 1) — not chosen. Grey-green cartographic paper.
4. **Night Watch** (round 1) — not chosen. Dark; superseded by the decision
   that light is the default (Locked #6).

## Preserved

1. **Deadline's overdue inversion** (round 1) — rows flipping to black with a
   lime countdown. The user did not object to it, and it is the most direct
   answer to the real problem that `past_deadline` is the screen's whole
   point. Candidate for Step 3's overdue treatment inside Dispatch Desk,
   which currently signals overdue only with a dashed outline and red text.

## Open Questions

1. ~~Scope of "update"~~ → resolved: full new direction. Locked #5.
2. ~~Control-room or desk-bound?~~ → resolved: desk. Locked #6.
3. ~~Does the dashboard need a light mode?~~ → resolved: yes, light is the
   default. Locked #6.
4. Which of the five directions (A–E), or a mashup? **Current blocker.**
5. Deferred to Step 2: does the dark variant have to be a full second token
   set, or is it enough that one direction (E) *is* the dark answer? Affects
   whether Step 3 ships one palette or two.
6. ~~The deadline bar changes meaning mid-life with nothing saying so~~ →
   **answered in Round 2**, not deferred: every bar now carries a
   `response deadline` / `repair deadline` label plus a percentage, and the
   panel tags the live one `tracking`. A screen meant to ship could not
   render it wrong, so the fix moved up a step.
7. ~~Lifetime complaint count vs live "still on the map" count look
   identical~~ → **answered in Round 2**: lifetime sits on a grey tile, live
   sits on white inside a graphite outline with a `live` hint. Same data,
   two visibly different objects.
8. ~~Does the dark variant ship as a full second token set?~~ → **resolved in
   Step 3**: yes, but as an override block rather than a parallel kit. Locked
   #6 says dark must be "a real option", and in a custom-property system that
   costs ~30 lines. `tokens.css` ships `:root[data-theme="dark"]` plus a
   `prefers-color-scheme` block. Hazard **fills** are unchanged (the contract
   is absolute); stage and severity **text** lightens, because a value that
   clears AA on white fails on `#151A21`.
9. Step 4: does Dispatch Desk adopt Deadline's overdue inversion (see
   Preserved)? Today past-deadline is a dashed outline + red text, which is
   quiet for the screen's single most important state.

## Inspiration sources

*(none supplied yet — user has not provided references)*

## Product analysis (Step 1 · Phase 1A)

**What it is.** The municipal-staff screen of a 3-piece system. Citizens
report road hazards from a Flutter app; when one location accumulates enough
complaints it becomes a *hotspot* and surfaces here with its evidence,
severity score and a repair deadline. Staff move it through repair stages.

**Who uses it.** Municipal officers, gated twice: Google sign-in *and* their
email listed in the backend's `MUNICIPAL_EMAILS`. Not a consumer surface — a
work queue for a small number of accountable people.

**What it must evoke.** Accountability and triage clarity, not delight. The
dominant question on screen is *"what is overdue and who has not looked at
it."* Two of seven stat tiles exist purely to surface failure
(`not_looked_at`, `past_deadline`) and only colorize when non-zero. That is
the emotional core: this screen is a deadline clock, not a map toy.

**Key flows.**
1. Glance at the seven stat tiles → is anything on fire.
2. Scan the list (worst-first) or the map → pick a hotspot.
3. Open the detail panel → read evidence, both deadlines, event history,
   individual complaints.
4. Advance the stage via the only legal next-stage buttons.

**Current visual state.** 524 lines of plain CSS, nine CSS variables, no
framework, no component library, `system-ui` font, 14px root. Colors are
inherited verbatim from the phone app (purple #6C5CE7 accent, #0D0F14
background). Competent and coherent, but it is a *phone app's palette on a
desktop dense-data surface* — a dark-SaaS look rather than an operations
console. Layout: topbar / stats strip / split map+side, collapsing to stacked
at 900px.

**Real data vocabulary** (for Hard Rule #5 — no Lorem Ipsum):
- Stat tiles: Open, Not looked at, Past deadline, New today, Fixed this week,
  Usual response, Usual repair (medians, not means — deliberate).
- Stages: new → acknowledged → assigned → in_progress → resolved → verified,
  with dismissed as a side exit; reopens automatically on fresh complaints.
- Severity bands off a 0-100 score: Critical ≥75, High ≥50, Medium ≥25, Low.
- Spot keys are lat/lng at 3 decimals (~100m), e.g. `30.340,76.387` —
  Patiala-area coordinates, so real place names should be Punjab municipal.
- Map circles: color = hazard type, radius = complaint count, dashed outline
  = past deadline.

**Constraints that bind the design.**
- Deadline progress bars switch meaning mid-life: they track the *response*
  deadline until someone looks, then the *repair* deadline. Closed hotspots
  show no bar at all.
- Complaint counts are lifetime totals and persist after a fix; "still on the
  map" in the panel is the live number. Two numbers that look like the same
  number — a live design hazard.
- Updates arrive by WebSocket (primary) with a 60s poll as a safety net, so
  the UI must absorb values changing under the operator's cursor.
- Toasts fire on new reports and are positioned over the map.

## Rounds Log

*Append-only log. Never edit past rounds, only add new ones.*

### Round 1 — 2026-10-04

**Step:** 1 — Discovery & Design Direction
**Skills loaded:** moodforge (coordinator). References 01, 07, 10 read.
`superpowers:brainstorming` unavailable → preview-server.js fallback.
`frontend-design` present on disk as a plugin but not invokable as a skill in
this session; its anti-slop rules applied from the reference checklists.
**Concept:** Five worlds for one municipal screen — chrome recedes so the five
locked hazard colours can be the only colour on screen.
**File:** `docs/design/rounds/round1-directions.html` (generated by
`build-round1.mjs`, 64 KB)
**User reaction:** *(awaiting — page served, not yet responded)*
**Outcome:** PENDING

**The five shown:**

| | Direction | Risk | Mode | Base | Display font | Thesis |
|---|---|---|---|---|---|---|
| A | Civic Ledger | safe | light | `#FAF8F2` warm paper | Fraunces | Reads like the paper register it replaces |
| B | Dispatch Desk | dense | light | `#F4F6F8` cool grey | Archivo | Air-traffic density, no chrome hue at all |
| C | Deadline | ambitious | light | `#FFFFFF` pure white | Anton | The clock is the interface; overdue rows invert to black |
| D | Survey Sheet | quiet | light | `#EEF1EC` grey-green | Instrument Serif | Chrome becomes the map's margin |
| E | Night Watch | familiar | dark | `#0E1116` deep slate | Funnel Display | Today's dark with the purple removed |

**The insight that shaped the round:** the five hazard colours are a
cross-repo contract and cannot move. Today's chrome adds a sixth
(`#6C5CE7` purple) on top of them, so six colours compete and the hazard
circles — the data — lose. All five directions therefore keep the hazards
untouched and make the chrome recede. No direction uses a hazard hue as its
accent; `build-round1.mjs` asserts this at build time.

**Adaptation from the references:** refs 01 and 07 assume *phone* mockups
(the worked examples are fintech apps). This is a desktop dashboard, so phone
frames became browser frames and the shared scaffold became topbar / stats
strip / map + list. Ref 07's "always include one dark card" rule inverted
usefully: here dark is the *familiar* option, because it is what ships today.

**Decisions locked this round:**
- Scope (#5), operator context (#6), web-deliverables shape (#7) — see
  Locked Decisions.

**Still open:**
- Which letter (Open Question 4).

### Round 2 — 2026-10-04

**Step:** 2 — Screen Preview (validation gate)
**Skills loaded:** moodforge, `emil-design-eng` (required for motion).
References 02 and 08 read.
**Concept:** Dispatch Desk on the real screen — the dashboard and the hotspot
detail panel, at the density an actual shift would carry.
**File:** `docs/design/rounds/round2-dispatch-desk-preview.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**What it contains:** two screens — (1) the dashboard with all seven stat
tiles, eight hotspots worst-first, map with eight sized circles, two toasts;
(2) the detail panel with the two counts, both deadlines, evidence, a
five-event history and only the legal next-stage buttons for `in_progress`
(`resolved` / `assigned` / `dismissed`, with `verified` correctly absent).
Plus a forced-state reference for all seven controls, and the motion spec.
Live JS wiring so the panel motion is real rather than described.

**Skill conflict resolved:** `references/02-showcase-checklist.md` prescribes a
cover hero, mascot states and motifs — which duplicates Step 3's brand kit and
contradicts `SKILL.md` Step 2's own words ("not a showcase, not a brand
book, but real screens"). Followed `SKILL.md`; took only a compact
palette/type strip from ref 02 so the token choices are confirmable. Ref 08 is
a Step 5 phone-grid spec, so only its "shared grammar, one signature move"
discipline carried over.

**Motion decisions** (four-question framework, logged for the Step 6 appendix):
row hover `90ms` background-only (under the 120ms ceiling, no transform on a
dense list); detail panel `220ms` in / `165ms` out on `translateX` from the
edge it is anchored to; buttons `scale(0.97)` at `120ms`; toasts
`@starting-style` + `translateX(10px)`, never `scale(0)`; tabs colour-only;
**stat tiles never animate on value change** because WebSocket pushes them
while the operator is reading; first-load stagger `35ms` scoped to
`[data-first-load]` so WebSocket inserts do not strobe; reduced-motion drops
every transform and keeps opacity.

**Accessibility — two real failures caught by tooling, not by eye:**
`contrast.mjs` was written to verify this page's own claims and found
acknowledged amber at **3.93:1** and in-progress blue left on raw `#42A5F5`
at **2.65:1**. Final AA-safe stage-text set, each clearing 4.5:1 on
`--surface`, `--raised` *and* `--paper`:

| stage | text value | from |
|---|---|---|
| new | `#C62828` | `#EF5350` |
| acknowledged | `#8F5C00` | `#FFCA28` |
| assigned | `#5A49D6` | `#6C5CE7` |
| in progress | `#1565C0` | `#42A5F5` |
| resolved | `#2A6E2D` | `#66BB6A` |
| verified | `#00707A` | `#00B4D8` |
| dismissed | `#5C6080` | unchanged |

All five raw hazard hues fail AA as text (1.94:1–3.49:1) and are therefore
**fills only** — circles, dots, legend swatches, chip bullets, toast rules,
timeline pips, progress bars. `hazards.js` is untouched, so the cross-repo
contract holds. `--muted #5B6676` measures 5.82 / 4.95 / 5.37.

**Decisions locked this round:** none beyond the direction — this round is a
gate, not a commitment.

**User reaction (2026-10-04):** "yes" → **APPROVED.** Archived permanently to
`docs/design/themes/dispatch-desk.html` per the Step 2 on-approval rule.

### Round 3 — 2026-10-04

**Step:** 3 — Brand Kit
**Skills loaded:** moodforge, `emil-design-eng`. References 03 and 06 read.
**File:** `docs/design/brand-kit/` (10 files)
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**Shipped:** `index.html` (all 10 spine sections), `tokens.css`,
`tokens.json` (DTCG), `tokens.ts`, `README.md`, `assets/` (3 SVGs),
`build-kit.mjs`, `verify-kit.mjs`.

**Architecture decision — one generator, three outputs.** Ref 03 requires the
three token files be "all generated and consistent"; three hand-maintained
copies is exactly how that fails. `build-kit.mjs` holds the only copy of the
token values and emits all three. It **gates on WCAG AA and writes nothing on
failure**, so a bad value cannot reach the app.

**The a11y matrix is computed at view time**, not authored. `index.html`
reads the shipped custom properties with `getComputedStyle` and recomputes
every ratio in the browser, including on the dark toggle. The matrix cannot
drift from what ships, and the five raw hazard rows are asserted to *fail* —
if one ever passes, the contract changed.

**Three deviations from the spine, all deliberate:**

1. **Three type voices, not four.** Ref 06 mandates a fourth handwritten
   marginalia voice ("never three"). Declined: a handnote in a municipal work
   queue would be the only ornament on a screen whose entire argument is that
   nothing is ornamental.
2. **Section 04 is not a mascot.** BreakdownMap has none and inventing one is
   slop. The slot holds the real brand element that does have states — the
   hazard mark grammar (30% fill, 1.5px border, radius = complaint count,
   dashed 2.5px = deadline blown), plus do/don't.
3. **No shadcn/ui mapping and no GSAP**, both of which Step 3 asks for.
   The repo is plain CSS with no Tailwind and no Radix (Locked #7); mapping to
   shadcn means installing a component framework to restyle 1,743 lines.
   Component specs map to the **existing class names** instead, with a 9-row
   table naming the selector and file to touch. GSAP would be a 23KB
   dependency to run six CSS transitions, which are also the *correct* tool
   (transitions retarget mid-flight; keyframes restart) and run off the main
   thread. Both documented as migration paths in the README's "not in this
   kit, on purpose".

**`verify-kit.mjs` — written because the kit reads ~70 custom properties by
name at runtime**, where a typo is a silently blank swatch, not an error. It
checks: every referenced property is defined; the stage/hazard inventories
agree across `tokens.json` and `index.html`; all five hazard values still
match `src/hazards.js`; every legacy variable in `src/index.css` has an alias;
assets resolve **and** nothing in `assets/` is orphaned; the 10 spine sections
appear in order with literal ids; every section H2 carries exactly one `<em>`.

It caught a real defect on first run: all three SVGs in `assets/` were
orphaned — `index.html` inlined them and never loaded the files, so a broken
asset would have shipped invisibly. Section 01 and 04 now render the actual
files via `<img>`.

**Migration path (the point of the whole kit):** `tokens.css` ends with alias
declarations re-pointing the nine variables `src/index.css` defines today at
the new tokens, so adopting it is `@import` + delete the old `:root` block,
and every existing selector keeps working. `--purple` resolves to graphite —
that alias intentionally changes appearance, because the purple was the sixth
competing colour this redesign exists to remove.

**Decisions locked this round:**
- Dark ships as an override block, not a parallel kit (Open Question 8).
- Three voices; no fourth decorative face.
- No new runtime dependencies (no shadcn, no Tailwind, no GSAP).
- `build-kit.mjs` is the only editable source for token values.

**User reaction (2026-10-04):** "go ahead" → **APPROVED**, read as approval of
the kit and instruction to continue the pipeline. Explicitly *not* read as
permission to commit; ref 03 wants that asked separately and it has not been.

### Round 4 — 2026-10-04

**Step:** 4 — Animation Review
**Skills loaded:** moodforge, `emil-design-eng`.
**File:** `docs/design/rounds/round4-animations.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**Loads `../brand-kit/tokens.css`** — every duration and easing in the gallery
is read from the shipped tokens, so it cannot demo motion the app does not
have. Slow-mo works by multiplying the token durations
(`calc(var(--bdm-dur-press) * var(--k))`), so one control re-times the whole
page: 1× / 2× / 4× / 8×, plus a previewable reduced-motion class *and*
detection of the real OS setting.

**Sections:** easing plotter (4 curves drawn from their control points, each
clickable to race it — the plot and the race share one string, so a curve
cannot be drawn differently from how it runs) · duration ladder read live ·
the should-it-animate frequency table for all 12 moving parts · controls ·
entry · surfaces · live data · broken-on-purpose (4 wrong/right pairs) ·
the overdue decision · what this app will not animate.

**Three adaptations from Step 4's spec, all because the spec assumes a
marketing site:**

1. **No GSAP, including in the gallery.** The gallery's job is to show the
   motion that ships; demoing with GSAP would show motion the app won't have.
2. **No scroll-driven / parallax / pinned section.** The shell is
   `height:100%; overflow:hidden` and only `.list` scrolls inside a fixed
   352px column — nothing scrolls past anything.
3. **No page transitions.** There is no router; `App.jsx` picks between
   login / no-access / dashboard with a conditional. A transition needs two
   pages.

Section 10 states all of these on the page rather than silently omitting them,
and adds the spec for tooltips *if* they are ever introduced (125–200ms,
scale from `transform-origin`, instant on subsequent hovers).

**The motion insight worth keeping:** this dashboard updates itself while
nobody touches it, which inverts the usual advice — the most important
decisions are the ones that say *no*. The same list gets opposite answers for
first-load (35ms stagger) and WebSocket insert (nothing), and the gallery puts
those two demos side by side because it is the decision most easily got wrong
in a realtime app. Stat tiles and map-circle radius changes animate not at all.
The only loop in the entire app is the reconnecting LED, justified because it
conveys "still trying" with no new information arriving.

**Defect caught by the token check:** the page referenced
`--bdm-stage-new-textDark`, a camel-cased name that does not exist — a `var()`
fallback was masking it. The inverted row (option C) is dark in *both* themes,
so it needs the dark red unconditionally: `#C62828` measures 3.26:1 on
`--bdm-ink` and fails, `#FF8A80` measures 8.03:1.

**User reaction (2026-10-04):** "b" → **Option B APPROVED.** Motion approved.

Folded into `build-kit.mjs` and regenerated. Open Question 9 is closed.

### Round 5 — 2026-10-04 — screen 1 of 4

**Step:** 5 — All Screens (one at a time)
**Skills loaded:** moodforge, `emil-design-eng`. References 04 read; 08 and 09
assessed and skipped (see below).
**File:** `docs/design/rounds/round5-access-gates.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**Screen:** the pre-dashboard surface — `.middle` wrapping `.card`, which is
every non-dashboard thing `App.jsx` can render. Treated as ONE screen with
**eight states** because that is literally one component in the source.

| # | Condition | Today | Change |
|---|---|---|---|
| 1 | `checking` | bare `Loading…` text | card + mark + skeleton + breathing LED |
| 2 | `!user` | card, `⚠` emoji logo | real mark, tightened copy, Google glyph |
| 3 | — | **nothing** | NEW: signing-in pending |
| 4 | — | **unhandled rejection** | NEW: popup dismissed, recoverable |
| 5 | `!profile` | bare `Checking access…` text | card, names the account |
| 6 | `error.status === 403` | styled card | separates "signed in" from "authorised" |
| 7 | `error` | styled card | retry count, host stays in mono |
| 8 | `error.status === 401` | **falls into #7, wrongly** | NEW: own card |

**Three code findings, each verified against source before being claimed:**

1. **`src/App.jsx:53`** — `onClick={signIn}` calls a promise with no catch.
   The only `catch` in the file is line 35 (`getProfile`). `signInWithPopup`
   rejects with `auth/popup-closed-by-user` when the window is closed, so the
   operator presses the only button on the page, closes the popup, and gets
   an unhandled rejection with **no UI change at all**. ~10 lines (a `busy`
   flag + a catch) buys states 3 and 4.
2. **No 401 branch.** `api.js` throws `status: 401` / "You are not logged in";
   `App.jsx` special-cases only 403 (`grep 401 src/App.jsx` → 0 hits), so a
   dead token renders **"Cannot reach the server"** — the opposite of what
   happened. One branch, before the generic one.
3. **`src/App.jsx:89`** — the generic error card's only action is
   `window.location.reload()`. If the cause is a stale token rather than a
   dead backend, reload fails identically forever with no way to sign out.
   Needs a second exit.

These were surfaced by designing the states, not by reading for bugs. **No
code was changed.** Awaiting a decision on whether to apply them now or in
Step 6.

**Reference assessment:** ref 04's real-data *principles* applied (real
entities, specific numbers, varied timestamps, no letter-tile monograms), but
its `CATEGORY_MAP` of food emoji, ₹ amounts and phone-slot markup is written
for a consumer fintech phone app and does not transfer to a desktop municipal
console. Ref 08 is a Step 5 phone-grid spec — browser frames used instead, as
in Rounds 1 and 2. **Ref 09 (`09-indian-fintech-data-canon.md`) was skipped
entirely**: this is not a fintech product and there are no transactions,
merchants or currency amounts anywhere in it.

**Real data used:** `r.kaur@mcpatiala.gov.in` (Municipal Corporation Patiala),
`https://api.breakdownmap.in`, and the literal error strings the code throws —
`Failed to fetch`, `You are not logged in`, `auth/popup-closed-by-user`,
`MUNICIPAL_EMAILS`.

**User reaction (2026-10-04):** "yes look good go ahead" → **APPROVED.**
Archived to `docs/design/mockups/access-gates.html`. The timing of the three
code findings was *not* answered, so they were deferred to Step 6 rather than
applied — an ambiguous yes is not authorisation to edit `src/`.

### Round 5 — 2026-10-04 — screen 2 of 4

**Step:** 5 — All Screens
**File:** `docs/design/rounds/round5-empty-loading.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**Screen:** the dashboard with no data. Eight states on one shared scaffold —
first paint, three per-tab empties, filtered-to-nothing, and three failure
states that currently render as success.

**This screen produced the pipeline's most serious finding (#4).** Designing
"what does the list show when it has nothing" exposed that
`Dashboard.jsx:42-48` swallows a failed `getHotspots` into `console.error`,
leaving `hotspots: []` and `loading: false` — which drives `HotspotList`
straight into its empty branch and prints *"No open problems. A place appears
here once it has had enough complaints…"*. **A network failure, a 500, an
expired token or a backend restart all produce the single most reassuring
sentence in the product.** An officer can see a working-looking dashboard with
no open work and go home. States 6, 7 and 8 are the fix: *unknown*, not zero.

**Design decision worth keeping:** an empty `Active` tab is the **best
possible outcome** for a municipality, and today it looks like a dead screen.
State 2 reads as success — a tick, `resolved` green on two tiles, and a route
to the 24 repairs actually done — while keeping the original sentence as the
second line, because the explanation was already correct.

The existing per-tab copy in `HotspotList.jsx` is good and is kept almost
verbatim. The problem was never the wording; it is *when* that wording appears.

`StatsBar.jsx`'s existing `—` dashes for `!stats` are correct and deliberate,
and are kept — but states 6/7 relabel them `unknown` / `no figure` so a dash
cannot be read as "still loading" forever.

**Self-correction:** the page initially said `filters` carries `municipality`.
It carries `{view, hazardTypes, sort}`; the city is separate `city` state
spread in at call time as `{ ...filters, municipality: chosenCity }`. Corrected
— the substance of finding 5 is unchanged.

**User reaction (2026-10-04):** "approved" → **APPROVED.** Archived to
`docs/design/mockups/empty-loading.html`.

### Round 5 — 2026-10-04 — screen 3 of 4

**Step:** 5 — All Screens
**File:** `docs/design/rounds/round5-panel-failures.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**Screen:** the detail panel — the only place this product **writes**. Six
states: panel loading, panel load failed, write in flight, write rejected,
panel gone stale, and reopened-under-the-cursor. Shown with the list beside
it so the two can be seen disagreeing.

`HotspotPanel.jsx` handles the common case well — `disabled={saving}` is
correct, and a failed `updateHotspot` does surface `problem.message`. All four
findings are at the edges.

**Corrected an assumption before building:** I had expected an optimistic-update
rollback state, carried over from the Flutter app's `CLAUDE.md`
(`optimisticHazards`). The **dashboard has no optimistic updates** — it awaits
the PATCH then re-fetches. Checked rather than assumed, so no invented state.

**User reaction (2026-10-04):** "approved" → **APPROVED.** Archived to
`docs/design/mockups/panel-failures.html`.

### Round 5 — 2026-10-04 — screen 4 of 4 (continued below)

**Step:** 5 — All Screens
**File:** `docs/design/rounds/round5-responsive.html`
**User reaction:** *(awaiting)*
**Outcome:** PENDING

**The suspicion was right.** The `max-width: 900px` breakpoint is unverified
and does not work. Arithmetic, recomputed independently in a script rather
than estimated:

```
w    h     cols rows stats  map  list
375  667   2    4    307    280    22   iPhone SE      <- clipped
390  844   2    4    307    280   199   iPhone 14      <- ~2 rows
414  896   2    4    307    280   251   iPhone 11
430  932   3    3    230    280   364   14 Pro Max
768  1024  5    2    153    280   533   iPad
900  600   6    2    153    280   109   breakpoint edge
```

`.stats` is `repeat(auto-fit, minmax(140px, 1fr))`, so column count is
`floor((w+1)/141)` → **2 columns** on a phone → 7 tiles in **4 rows** ≈ 307px.
Minus a 56px topbar and a *fixed* 280px map, a 667px viewport leaves **22px**
for tabs, filters and every row — and `.page` is `overflow: hidden`, so there
is no scroll to reach any of it.

Three individually-reasonable rules (`overflow:hidden`, the `140px` minmax, the
`280px` map row) combine to clip the product's main content to nothing.

**Proposed, shown at 1:1 beside the current layout at 375×667:**
- `.stats` below 560px → 3 primary tiles (open / not seen / late) + a
  horizontal rail for the four medians. 307px → ~72px.
- `.split` rows `280px 1fr` → `min(30vh, 190px) 1fr`.
- breakpoint 900px → 760px, plus a separate `max-height` guard.
- `.panel` below 760px → a sheet over the whole `.split` with a back button,
  instead of spanning a 22–199px column.
- `.filters` → `overflow-x: auto` instead of wrapping onto 3–4 lines.
- `.toasts` → `width: min(280px, calc(100% - 20px))`.

**Caveat stated on the page:** the 76px tile height assumes the browser's
default `normal` line-height, since none is set in `index.css`. Good to a few
pixels; the conclusion holds at any plausible value.

**Self-corrections this round:** two cells in the arithmetic table were off by
one against the independent recompute (iPad 534→533, edge 110→109) and were
fixed. I also copied screen 4 into `docs/design/mockups/` before approval and
removed it again — that directory means *approved* screens.

**User reaction (2026-10-04):** "approved" → **APPROVED.** Archived to
`docs/design/mockups/responsive.html`. **Step 5 complete, 4/4 screens.**

### Round 6 — 2026-10-04 — Step 6 Production Output

**Step:** 6 — Production Output
**File:** `docs/design/specs/2026-10-04-dispatch-desk-implementation.md`
**Outcome:** DELIVERED — pipeline deliverables complete

**Phase ordering deliberately inverts the template.** moodforge's Step 6 puts
*Foundations* (tokens, components) in Phase 1. This spec puts **correctness**
first, because finding 4 ships today: restyling before fixing it would mean
shipping a prettier version of the same lie. Phases 1–2 are independent of the
brand kit and can ship on the current dark theme.

| Phase | What | Findings | Size |
|---|---|---|---|
| 1 | Stop the dangerous displays | 4, 5, 2 | ~120 lines |
| 2 | Remove the dead ends | 1, 3, 7, 8, 10 | ~90 lines |
| 3 | Adopt the kit | 9 | ~80 lines, mostly deletions |
| 4 | Responsive | 11–14 | ~70 lines |
| 5 | The designed states | — | ~160 lines |
| 6 | Motion + a11y | — | ~60 lines |

**Appendix A — Motion, verbatim.** Tokens, the eight rules, per-element table.
**Appendix B — GSAP, deliberately not used.** Reasoned so nobody re-opens it
without new information: six CSS transitions under 300ms, retargeting matters on
a WebSocket surface, transitions run off the main thread, and it would be a
sixth production dependency (the repo has five) for no capability gained.
**Appendix C — Components mapped to *this repo*, not shadcn/ui.** No Tailwind,
no Radix; the tokens are DTCG and would drop into a shadcn theme unchanged if
that ever happens.

**Two corrections found by verifying the spec's own claims:**
1. Finding 9's scope was wrong — I had attributed the inline-colour problem to
   `HotspotPanel.jsx` only. `grep` found **14 hardcoded hexes and 4 `+ '22'`
   patterns**, with `HotspotList.jsx` carrying the same bugs (lines 91, 105,
   112, 120, 127). Spec and this table corrected.
2. `HotspotMap.jsx` was listed out of scope, but line 71 hardcodes `#0d0f14` —
   the *old* theme's `--background` — as the selected circle's outline. Intent
   is right, value is stale. Now in scope for that one line.

Also recorded the acceptance-grep **baselines** (14 hexes, 4 tint patterns) so
the criteria are checkable rather than aspirational.

**Figma push (optional Step 6 item): skipped.** No `mcp__figma*` tools in this
session, so there is nothing to push to.

**Spec path note:** the template specifies `docs/superpowers/specs/`. The
superpowers framework is not installed and nothing else here uses that prefix,
so the spec lives in `docs/design/specs/`.

**Bundle verified at hand-off:** `verify-kit.mjs` exits 0, `build-kit.mjs`
passes its WCAG gate, `contrast.mjs` exits 0, `git status` shows only
untracked `docs/` — **`src/` is byte-identical to commit `e8557f9`.**

---

## Permanent artifacts

```
docs/design/
├── brand-kit/
│   ├── build-kit.mjs                   # SINGLE SOURCE for token values. Edit this.
│   ├── verify-kit.mjs                  # internal-consistency check; exits non-zero
│   ├── index.html                      # the brand book, 10 sections, live a11y matrix
│   ├── tokens.css                      # GENERATED — the app consumes this
│   ├── tokens.json                     # GENERATED — DTCG
│   ├── tokens.ts                       # GENERATED — typed, optional at runtime
│   ├── README.md                       # engineer-facing; migration in 2 edits
│   └── assets/
│       ├── logo-mark.svg
│       ├── logo-lockup.svg
│       └── hazard-marks.svg
├── rounds/
│   ├── build-round1.mjs                # generator; edit DIRECTIONS to re-spin
│   ├── round1-directions.html          # 64 KB, 5 directions
│   ├── round2-dispatch-desk-preview.html
│   ├── round4-animations.html          # motion gallery; loads brand-kit tokens
│   ├── round5-access-gates.html        # Step 5 screen 1/4; 8 states
│   ├── round5-empty-loading.html       # Step 5 screen 2/4; 8 states
│   ├── round5-panel-failures.html      # Step 5 screen 3/4; 6 states
│   ├── round5-responsive.html          # Step 5 screen 4/4; layout arithmetic
│   └── contrast.mjs                    # standalone WCAG report
├── mockups/            # APPROVED screens only
│   ├── access-gates.html               # screen 1
│   ├── empty-loading.html              # screen 2
│   └── panel-failures.html             # screen 3
├── mockups/            # APPROVED screens only
│   └── responsive.html                 # screen 4
├── themes/
│   └── dispatch-desk.html              # APPROVED Step 2 screens, archived
└── specs/
    └── 2026-10-04-dispatch-desk-implementation.md
```

Not yet created (gated on Step 4/5): `docs/design/mockups/`,
`docs/superpowers/specs/`.

**Nothing in `src/` has been touched.** The whole pipeline is additive under
`docs/`, on a clean `main` (last commit `e8557f9`). Nothing has been committed
— ref 03 says to ask before committing, and that has not been asked.

### Regenerate / verify

```bash
node docs/design/brand-kit/build-kit.mjs   # regenerate tokens; gates on WCAG AA
node docs/design/brand-kit/verify-kit.mjs  # consistency; exits 1 on any problem
node docs/design/rounds/contrast.mjs       # standalone contrast report
```


---

## Shipped — 2026-10-04

Branch `design/dispatch-desk`, three commits off `main` (`e8557f9`):

```
b3a5ca1  Add the Dispatch Desk design system and implementation spec   (docs only)
4439492  Stop showing a failed request as "no open problems"           (findings 2,4,5)
5be7fc5  Give every failure state a way out                            (findings 1,3,7,8,10,15)
```

Nothing pushed. `main` is untouched.

**Untouched by design:** `src/hazards.js` (the cross-repo contract),
`src/api.js`, `src/firebase.js`, `src/time.js`, `src/components/HotspotMap.jsx`,
`src/components/Toasts.jsx`, `src/main.jsx` — verified with
`git diff e8557f9 --stat` over those paths returning nothing.

**Repeatable gate:**

```bash
npm run lint && npm run build
node docs/design/specs/check-findings.mjs    # 29 source assertions, phases 1-2
node docs/design/brand-kit/verify-kit.mjs    # kit internal consistency
node docs/design/brand-kit/build-kit.mjs     # regenerates tokens, WCAG gate
node docs/design/rounds/contrast.mjs         # standalone contrast report
```

**If this resumes:** phases 3–6 of
`docs/design/specs/2026-10-04-dispatch-desk-implementation.md`, in order. Phase 3
(adopt the kit) is the one that changes appearance, and `tokens.css`'s legacy
aliases mean it is an `@import` plus deleting one `:root` block. Finding 5's
`0 of 34` wording still needs an unfiltered total the API does not return —
the shipped copy sidesteps it without the number.


---

## All six phases applied — 2026-10-04

Branch `design/dispatch-desk`, seven commits off `main` (`e8557f9`). Nothing
pushed; `main` untouched.

```
b3a5ca1  the design system and spec                     docs only
4439492  stop a failed fetch reading as "no open problems"   findings 2,4,5
5be7fc5  give every failure state a way out                  findings 1,3,7,8,10,15
21e4863  adopt the Dispatch Desk theme                       finding 9
778a367  make the dashboard usable below 900px               findings 11-14
a7aa4b5  build the states the screens were designed for      finding 6
9a64f2e  gate hover, entry motion, finish the a11y pass      —
```

### Two deviations from the spec as written

1. **Phase 4's stats compaction is CSS-only.** The spec proposed three primary
   tiles plus a scrolling rail for the four medians, which needs a `StatsBar`
   markup change. Three compact columns below 560px hits the same budget
   (307px → 137px) with no markup change, so that is what shipped. Recomputed
   budget: a 375×667 phone goes from **22px of list to 282px**; 900×600 keeps
   its two columns and goes from 109px to 389px.
2. **Finding 5 ships without the `0 of 34` count.** It needs an unfiltered
   total the API does not return. The copy says "There is open work, but none
   of it matches what you have selected" — true without the number. The only
   finding with a backend dependency, and the only one not fully closed.

### Still true, and still unverified

`npm run lint`, `npm run build`, `check-findings.mjs`, `verify-kit.mjs`,
`build-kit.mjs` and `contrast.mjs` all pass. **The backend-stopped behaviour
was never executed** — it needs a running backend and a Firebase session.
Phase 1 exists for that case, so somebody should confirm it with the server
down before trusting it. Same for the 375px layout: the arithmetic was
recomputed but not opened on a real phone.

`src/hazards.js` is byte-identical throughout — the contract with the Flutter
app held across all seven commits.

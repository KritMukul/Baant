# Round 5 — Figma Push Guide (Optional)

This step is **optional**. It only runs if:
- The user explicitly asks ("push to Figma", "make a Figma file")
- A Figma MCP server is detected (`mcp__figma*` tools available)

If neither is true, skip to round 6 (handoff).

## Prerequisites

### Required skills to load
1. `figma:figma-use` — **MANDATORY** before any `use_figma` call. Contains API rules (colors 0-1, font loading, page switching, layout sizing).
2. `figma:figma-generate-library` — brand kit → Figma variables + components
3. `figma:figma-generate-design` — screens → Figma frames
4. (optional) `figma:figma-create-design-system-rules` — generate codebase-specific design-system rules alongside the file

### User's Figma plan
Call `mcp__figma-remote__whoami` first. Capture the `planKey` from the response — every subsequent call needs it.

**Warn the user about rate limits:**
> "On Starter/Free Figma plans, the MCP has a tool-call quota that resets periodically. A full brand kit + 30 screens push will likely hit the limit. If you upgrade, I can finish in one go. Otherwise I'll push what fits, save progress, and resume after the reset."

## The push workflow

Incremental — **one concern per `use_figma` call**. This is the single biggest rule for avoiding bugs.

### 5.1 · Create the file
```
create_new_file({
  fileName: "<Project> · <Theme> Brand Kit v1.0",
  planKey: "<from whoami>",
  editorType: "design"
})
```
Capture the returned `file_key`. Every subsequent `use_figma` call needs it.

### 5.2 · Push color variables

Create **one variable collection** (e.g. `<theme>/color`) with one mode (`light`). Map every token from `tokens.ts` to a Figma variable.

**Set explicit `scopes` per variable** — never use default `ALL_SCOPES`:

| Token role | Scopes |
|---|---|
| Surface colors (bg, card) | `["FRAME_FILL", "SHAPE_FILL"]` |
| Text colors | `["TEXT_FILL"]` |
| Borders | `["STROKE_COLOR"]` |
| Ambiguous | `["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"]` |

```js
const colorCollection = figma.variables.createVariableCollection("moss-bone/color");
const modeId = colorCollection.modes[0].modeId;
colorCollection.renameMode(modeId, "light");

function createColor(name, hex, scopes) {
  const v = figma.variables.createVariable(name, colorCollection, "COLOR");
  v.scopes = scopes;
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  v.setValueForMode(modeId, { r, g, b });
  return v.id;
}
```

### 5.3 · Load fonts + push text styles

Before any text node creation:
```js
const fonts = await figma.listAvailableFontsAsync();
// verify exact style names match what you're about to request

await Promise.all([
  figma.loadFontAsync({ family: "Fraunces", style: "Black" }),
  figma.loadFontAsync({ family: "Fraunces", style: "Italic" }),
  // ... one await per font/style combination
]);
```

Then create text styles for every type scale level.

### 5.4 · Push brand kit pages

One Figma page per major section, mirroring `index.html`:
- `00 · Cover` — brand name + tagline + palette grid + manifesto
- `01 · Typography` — 4 font specimens + full scale
- `02 · Mascot` — 4 state cards with SVG mascots (`figma.createNodeFromSvg()`)
- `03 · Color` — big swatches
- `04 · Components` — buttons, chips, list rows as Figma components + variants
- `05 · Motifs` — dividers, decorative elements

### 5.5 · Push screens

One Figma page (`10 · Screens`) with a phone/web frame per screen. Use `figma.createComponent()` for repeated elements (TransactionRow, HeroCard, BentoTile) so instances stay in sync.

Use `get_screenshot` after major milestones to verify visual output against the approved HTML mockups.

### 5.6 · Save file URL to state.md

Add the Figma file URL under "Permanent artifacts → Figma file" so future sessions can reference it.

## Rate limit strategy

On Starter/Free plans, a full push will hit the limit. **Push in priority order** so even a partial push is useful:

1. File creation + color variables
2. Cover page
3. Typography specimens
4. Mascot states (if applicable)
5. Primary tab screens (Home + 4 others)
6. Detail screens
7. Secondary screens

**Checkpoint state.md** after every successful page push so resumption is clean.

**On rate limit hit:**
- Stop cleanly
- Log progress in state.md with exact file paths / node IDs created
- Tell the user which pages are in Figma vs pending
- Link them to the upgrade URL

## Critical rules from figma-use skill

1. **Never use `figma.notify()`** — throws "not implemented". Use `return` for output.
2. **Never use `figma.currentPage = page`** — throws. Use `await figma.setCurrentPageAsync(page)`.
3. **Never mutate `node.fills` in place** — clone array, modify, reassign.
4. **Never set `layoutSizingHorizontal/Vertical = 'FILL'` before appendChild** — set it after.
5. **Always `await` every Promise** — especially `loadFontAsync` and `setCurrentPageAsync`.
6. **Always return node IDs** from every script so subsequent scripts can reference them.
7. **Always position new top-level nodes away from (0, 0)** unless the page is empty.
8. **Always pass `skillNames: "figma-use"`** to every `use_figma` call for logging.
9. **Colors are 0-1 range** (not 0-255). Divide hex by 255.
10. **Pages load incrementally** — switch pages with `setCurrentPageAsync` before reading children.

## Acceptance

- [ ] Figma file created and URL saved to state.md
- [ ] All color variables pushed with correct scopes
- [ ] All text styles created
- [ ] Cover page visually matches `index.html` cover section (verified via `get_screenshot`)
- [ ] At least typography + mascot + 5 main screens pushed
- [ ] Components are real Figma components (not detached copies)
- [ ] File is shareable with the user's team

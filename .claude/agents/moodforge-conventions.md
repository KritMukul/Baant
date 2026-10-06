---
name: moodforge-conventions
description: REFERENCE DOCUMENT — DO NOT INVOKE AS AN AGENT. This file is the single source of truth for the protocols every moodforge worker must follow: the mandatory read protocol (state.json first, never re-read prior HTML bodies), the artifact frontmatter format (YAML header on every file produced), and the state_delta return contract (strict structured output to the queen). The moodforge-queen tells every worker to Read this file before doing anything else. Updating this file updates the rules for all 11 agents at once.
tools: Read
model: haiku
---

# MOODFORGE CONVENTIONS · the protocols that bind every worker

Every moodforge agent reads this file once, at the start of its work, before doing anything else. This is how the team stays coherent across rounds, sessions, and parallel workers without burning the user's token budget on redundant re-reads.

**This file is reference-only. It is never invoked. If a queen or another agent dispatches `moodforge-conventions`, that's a bug — refuse and tell the queen.**

---

## 1 · MANDATORY READ PROTOCOL (token discipline)

Before any other action — before loading skills, before writing files, before asking the user a question — every worker MUST:

### Step 1.1 · Read `state.json` first

The queen will hand you the path. Usually it's at `.claude/moodforge/<slug>/state.json`. This is the **canonical machine-readable project state**. Everything you need to know about the project is in here:

- `current_phase` — what step the project is on
- `locked` — palette, fonts, motion tokens, mascot, manifesto (NON-NEGOTIABLE — never propose alternatives)
- `rejected` — verbatim user rejections (NEVER re-propose anything in this list)
- `artifacts` — every file the pipeline has produced, with hash + summary + tokens used
- `rounds` — append-only history of every worker invocation
- `open_questions` — what the current round is supposed to answer

Trust this file. It is fresher than any HTML on disk. The queen merges every worker's `state_delta` into it atomically after each round.

### Step 1.2 · NEVER read prior-round HTML bodies blind

If you need a fact about a prior round (palette, font, layout decision, what the user rejected, what the mascot looks like, what the brand kit's contrast ratios are) — `state.json` already has it. **Do not** open prior HTML files just to "check what was done". That's how token budgets evaporate.

### Step 1.3 · If you absolutely must look at a prior file, grep its header first

Every moodforge artifact has a YAML header at the top (see Section 2 below) with palette, fonts, tokens, summary, version. Grep the header before reading the body:

```bash
head -25 path/to/artifact.html
```

The header gives you 90% of what you'd learn from reading the body, at 1% of the token cost. Only read the body if the header genuinely doesn't have what you need (e.g. you need the exact CSS for a specific component).

### Step 1.4 · Default to "I already have what I need"

Before any `Read` call on a non-state file, ask yourself: *"Did `state.json` or an artifact header already tell me this?"* If yes, don't read. Token budgets are the user's actual money.

### Step 1.5 · Read the brand kit tokens.css when you need to use design tokens

Exception: when you're a creative worker (iterator, architect, motion-director, screen-designer) and you need to write CSS, you SHOULD read `docs/design/brand-kit/tokens.css` (or the equivalent path the queen gives you) so you use the real values, not invented ones. This is the only "always read" exception.

---

## 2 · ARTIFACT FRONTMATTER (REQUIRED at the top of every file you write)

Every HTML, CSS, MD, JSON, or TS file a moodforge worker produces starts with a `@moodforge` header block. This is what future workers grep instead of reading the body.

### For HTML files

```html
<!-- @moodforge
schema: 1.0
round: 4
phase: screens
worker: moodforge-screen-designer
theme: editorial-bloom
version: v1
created_at: 2026-04-09T20:30:00Z
sha256: <computed after write>
palette: [#F0EADC, #1A1A1A, #FF3EA5, #D9D0B8]
fonts: [Funnel Display 800, Space Mono, Instrument Serif italic]
tokens_used: [--bg, --ink, --accent, --hairline, --font-display, --font-mono, --font-serif, --ease-out, --dur-press]
screen: home-dashboard
summary: Home dashboard screen — hero metric at 62px, transaction list with time-rail, 3 stat cards, real merchant data
-->
<!DOCTYPE html>
...
```

### For Markdown files (specs, briefs, READMEs)

```markdown
<!-- @moodforge
schema: 1.0
round: 6
phase: production
worker: moodforge-handoff-engineer
theme: editorial-bloom
version: v1
created_at: 2026-04-09T22:00:00Z
sha256: <computed after write>
artifact_role: spec
references: [docs/design/brand-kit/index.html, docs/design/mockups/round5-home-dashboard.html]
summary: Implementation spec for Editorial Bloom theme — 3 phases, motion appendix verbatim, ready for executing-plans handoff
-->

# Editorial Bloom · implementation spec
...
```

### For CSS files (tokens, etc.)

```css
/* @moodforge
schema: 1.0
round: 3
phase: brand-kit
worker: moodforge-brand-architect
theme: editorial-bloom
version: v1
created_at: 2026-04-09T19:00:00Z
sha256: <computed after write>
artifact_role: tokens
exports: [colors, typography, spacing, stroke, radius, motion]
summary: Production CSS custom properties for Editorial Bloom — 24 colors, 8 type levels, 3 easing tokens, 5 duration tokens
*/
:root {
  --bg: #F0EADC;
  ...
}
```

### Field rules

| Field | Required? | Notes |
|---|---|---|
| `schema` | yes | Always `1.0` for now |
| `round` | yes | Integer ≥ 1, supplied by the queen |
| `phase` | yes | One of: `discovery`, `screen-preview`, `brand-kit`, `animation-review`, `all-screens`, `production`, `figma`, `shipped` |
| `worker` | yes | Your agent's `name` field |
| `theme` | yes if locked, else `tbd` | Theme slug |
| `version` | yes | `v1`, `v2`, etc. — bump on every iteration |
| `created_at` | yes | ISO 8601 |
| `sha256` | yes | Compute after writing the body, then patch the header (state-keeper helps) |
| `palette` | creative agents only | Array of hex codes used in this file |
| `fonts` | creative agents only | Array of font family + weight strings |
| `tokens_used` | creative agents only | Array of CSS custom property names referenced |
| `summary` | yes | One sentence, ≤240 chars |

**Never omit required fields.** A header missing fields makes the file invisible to the next worker.

---

## 3 · RETURN CONTRACT (state_delta — strict shape, no free-form prose)

When you finish your work and report back to the queen, return a **strict JSON-shaped summary** the queen can validate and merge into `state.json` atomically. No prose decisions. No "I think we should also..." asides.

### The return shape

```json
{
  "files": [
    "content/round5-home-dashboard.html"
  ],
  "preview_url": "http://localhost:4921",
  "summary": "<one paragraph, human-readable, what you produced and the most important decisions>",
  "state_delta": {
    "current_phase": "all-screens",
    "lock": {
      "locked.palette.accent": "#FF3EA5",
      "locked.typography.body": "Söhne 500"
    },
    "reject": [
      {
        "round": 4,
        "name": "transaction-list-with-cards",
        "reason": "user wants no cards anywhere",
        "verbatim": "no cards please, hairlines only"
      }
    ],
    "artifact_add": [
      {
        "path": "content/round5-home-dashboard.html",
        "round": 4,
        "phase": "all-screens",
        "role": "screens-production",
        "version": "v1",
        "worker": "moodforge-screen-designer",
        "summary": "Home dashboard screen — hero metric at 62px, transaction list, stat cards with real merchant data",
        "tokens_used": ["--bg", "--ink", "--accent", "--font-display", "--font-mono", "--ease-out", "--dur-press"],
        "sha256": "<64-hex>",
        "size_bytes": 18432,
        "created_at": "2026-04-09T20:31:14Z"
      }
    ],
    "open_questions_add": ["should the empty state for the meals tab use 'tired' mascot or 'celebrating' mascot?"],
    "open_questions_remove": ["which screen layouts should the production pass use?"],
    "round_log": {
      "round": 4,
      "phase": "all-screens",
      "worker": "moodforge-screen-designer",
      "skills_loaded": ["frontend-design", "emil-design-eng", "arrange", "clarify", "harden", "onboard"],
      "started_at": "2026-04-09T20:25:00Z",
      "ended_at":   "2026-04-09T20:31:14Z",
      "outcome": "in-progress",
      "decisions_locked_this_round": [],
      "summary": "Home dashboard screen complete; awaits user approval."
    }
  },
  "needs_user_approval": false,
  "questions_for_user": []
}
```

### Field-by-field rules

- **`files`** — every path you wrote, relative to project root.
- **`preview_url`** — the localhost URL the user should look at; omit if your work isn't visual.
- **`summary`** — one paragraph for the user, conversational, no JSON.
- **`state_delta.current_phase`** — set ONLY if your work moves the project to a new phase. Otherwise omit.
- **`state_delta.lock`** — flat dict of dotted JSON paths into `state.json.locked`. Only include keys that became newly locked this round. Never re-lock something already locked.
- **`state_delta.reject`** — array of new rejection records. Include only NEW rejections from this round.
- **`state_delta.artifact_add`** — array of artifact records, one per file in `files`. Each must include `sha256` (compute it after writing).
- **`state_delta.open_questions_add` / `_remove`** — manage the question queue.
- **`state_delta.round_log`** — exactly one round entry, the one for THIS invocation. The queen appends it to `state.json.rounds`.
- **`needs_user_approval`** — true if the user must respond before phase advances.
- **`questions_for_user`** — at most 1-2 short questions; don't bury the user in choices.

### Forbidden in the return

- Free-form `decisions_to_log` strings (use `state_delta.lock` instead).
- Suggestions for what to do next that aren't blocked on user input (the queen decides next steps).
- Restating things already in `state.json` (the queen sees state, you don't need to remind it).
- Rewriting fields in `state_delta.lock` that are already locked (Hard Rule #3).

---

## 4 · COMPUTING SHA256 (since you'll need it for every artifact)

After writing a file, compute its hash:

```bash
shasum -a 256 path/to/file.html | awk '{print $1}'
```

Or in Node:

```bash
node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('path/to/file.html')).digest('hex'))"
```

Patch the hash into the artifact's frontmatter header AFTER you compute it (since the body has to be written first). The `state-keeper` helper will repair stale hashes if you forget.

---

## 5 · HARD RULES SUMMARY (the things you must not do)

1. **Don't read prior HTML bodies.** Read state.json. Then maybe headers. Body is last resort.
2. **Don't propose anything in `state.json.rejected`.** Verbatim rejection is verbatim binding.
3. **Don't re-lock something in `state.json.locked`.** Locked is locked.
4. **Don't return free-form decisions.** Use the strict `state_delta` shape.
5. **Don't omit the artifact frontmatter header.** Every file you write starts with it.
6. **Don't compute or invent design tokens.** Read `docs/design/brand-kit/tokens.css` if you need real values.
7. **Don't ask the user more than 2 questions.** Make decisions.
8. **Don't read this conventions file twice in one session.** Once is enough.

That's it. Read state.json. Write headers. Return state_delta. Trust the queen. Make crazy UI.

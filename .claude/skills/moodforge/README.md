<p align="center">
  <img src="https://img.shields.io/npm/v/moodforge?style=flat-square&color=FF3EA5&labelColor=1A1A1A" alt="npm version" />
  <img src="https://img.shields.io/badge/skills-36-FF3EA5?style=flat-square&labelColor=1A1A1A" alt="36 skills" />
  <img src="https://img.shields.io/badge/agents-11-FF3EA5?style=flat-square&labelColor=1A1A1A" alt="11 agents" />
  <img src="https://img.shields.io/badge/license-MIT-FF3EA5?style=flat-square&labelColor=1A1A1A" alt="MIT license" />
</p>

<h1 align="center">moodforge</h1>

<p align="center">
  <strong>A complete design pipeline for Claude Code.</strong><br/>
  36 skills. 11 agents. One command.
</p>

<p align="center">
  <code>npx moodforge</code>
</p>

---

Turn Claude into a senior UI/UX designer that deeply understands your product, shows you real screens before committing to anything, uses GSAP for production animations, maps every component to shadcn/ui, and tracks state so rejected directions never come back.

## Quick start

```bash
npx moodforge
```

One question (global or project), then pip walks across a progress bar while 36 skills install:

```
                                              ▄▄▄
                                              ◉ ◉
                                              ▀ ▄
  ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱   88%

  ✓ 1  preflight                   skills dir ready
  ✓ 2  moodforge (local)           ~/.claude/skills/moodforge
  ✓ 3  pbakaus/impeccable          23 of 23 installed
  ✓ 4  emilkowalski/skill          1 of 1 installed
  ✓ 5  greensock/gsap-skills       8 of 8 installed
  ✓ 6  shadcn/ui                   1 of 1 installed
  ⠋ 7  design-stack-coordinator    writing SKILL.md
  ·  8  plugin checks
```

Then open Claude Code and say **"design me an app"**.

---

## The pipeline

<table>
<tr>
<td width="40"><strong>1</strong></td>
<td><strong>Discovery</strong></td>
<td>Analyze the product. Gather references. Show 3-5 genuinely different design directions with full color schemes, typography, and layout patterns.</td>
</tr>
<tr>
<td width="40"><strong>2</strong></td>
<td><strong>Screen Preview</strong></td>
<td>Build 1-2 real screens in the chosen direction. <em>"Does this look good to you?"</em> Validate before investing in a brand kit.</td>
</tr>
<tr>
<td width="40"><strong>3</strong></td>
<td><strong>Brand Kit</strong></td>
<td>Production-grade tokens (<code>tokens.css</code>, <code>tokens.ts</code>, <code>tokens.json</code>), 11-section visual brand book, WCAG-verified, components mapped to shadcn/ui.</td>
</tr>
<tr>
<td width="40"><strong>4</strong></td>
<td><strong>Animation Review</strong></td>
<td>GSAP-powered motion gallery. Interactive easing curves, button states, drawer slides, toast stacks. <em>"Are these the animations you want?"</em></td>
</tr>
<tr>
<td width="40"><strong>5</strong></td>
<td><strong>All Screens</strong></td>
<td>Every screen, one at a time, with real data. Each shown individually for approval before moving to the next.</td>
</tr>
<tr>
<td width="40"><strong>6</strong></td>
<td><strong>Production</strong></td>
<td>Implementation spec with Motion appendix + GSAP appendix + Component appendix. Hand off to an engineer or <code>superpowers:executing-plans</code>.</td>
</tr>
<tr>
<td width="40">+</td>
<td><strong>Figma</strong> <em>(optional)</em></td>
<td>Push brand kit + screens to a real Figma file via MCP.</td>
</tr>
</table>

Every artifact opens in your browser automatically. Every round is logged. Every rejection is remembered.

---

## What gets installed

| Package | Skills | What it does |
|:---|:---:|:---|
| **moodforge** | 1 | The 7-step pipeline. Senior UI/UX designer voice, state tracking, visual companion. |
| [**pbakaus/impeccable**](https://github.com/pbakaus/impeccable) | 23 | `bolder` `delight` `audit` `polish` `arrange` `typeset` `colorize` `harden` `clarify` `extract` `optimize` `critique` `onboard` `normalize` `quieter` `distill` `overdrive` `animate` `adapt` `shape` `frontend-design` `impeccable` `teach-impeccable` |
| [**emilkowalski/skill**](https://github.com/emilkowalski/skill) | 1 | `emil-design-eng` -- the canonical animation + UI craft playbook |
| [**greensock/gsap-skills**](https://github.com/greensock/gsap-skills) | 8 | `gsap-core` `gsap-timeline` `gsap-scrolltrigger` `gsap-plugins` `gsap-performance` `gsap-react` `gsap-frameworks` `gsap-utils` |
| [**shadcn/ui**](https://github.com/shadcn/ui) | 1 | Component architecture, registry integration, composable UI primitives |
| **design-stack-coordinator** | 1 | Orchestration rules: which skill fires when, loading order, anti-patterns |

---

## Example session

```
You: I want to design a mobile app for a coffee subscription service.

Claude: [analyzes the product -- subscription model, coffee enthusiasts,
        recurring purchases, discovery + ritual]

Claude: I've analyzed your product. Coffee subscriptions are about
        ritual and discovery. Open the browser -- 4 directions:

        A. "Slow Roast" -- warm cream, hand-lettered, slow morning vibe
        B. "Third Wave" -- clinical white, mono numerals, science-of-coffee
        C. "Hearth" -- deep ember, serif display, evening wind-down
        D. "Bean Counter" -- moss green, grid-heavy, subscription tracker UX

You: C, but quieter.

Claude: [builds 2 key screens -- home feed + roaster detail]
Claude: Here's your home screen and roaster detail. Does this look good?

You: Yes. Build the brand kit.

Claude: [full brand kit with tokens, shadcn/ui components, GSAP motion,
        WCAG-verified colors, 11-section visual brand book]
```

From there you approve animations, then see each screen one at a time.

<details>
<summary><strong>Resuming a project</strong></summary>

```
You: Let's keep working on the coffee sub app design.

Claude: [reads state file, sees 8 of 22 screens approved]

Claude: Picking up where we left off. Next: subscription management.
        Building with real roaster names (Blue Tokai, Subko, Devans),
        real prices, real shipping windows. Opening in browser...

Claude: Here's the subscription management screen. Does this look good?
```

Per-project state means you can pick up months later. Rejected directions never come back.

</details>

<details>
<summary><strong>Inspecting state</strong></summary>

```bash
cat ~/.claude/skills/moodforge/projects/coffee-sub.md
```

```
# Coffee Sub -- Design State

Last updated: 2026-04-10
Current phase: all-screens (8 of 22 approved)
Status: in_progress

## Current Direction
Hearth (deep ember, serif display, evening wind-down)

## Locked Decisions
1. Theme: Hearth
2. Display font: Fraunces
3. Body font: Inter
4. Accent color: #C5732A (deep ember)
5. Animation style: crisp ease-out, 200ms default, GSAP stagger reveals

## Rejected Directions
1. Slow Roast -- "too soft, looks like every wedding website"
2. Third Wave -- "feels like a lab, not a morning ritual"
3. Bean Counter -- "I want to feel something, not balance a ledger"
```

</details>

<details>
<summary><strong>Pushing to Figma</strong></summary>

```
You: Push the brand kit to Figma now.

Claude: [loads figma:figma-use, pushes color variables, text styles,
        22 screens as real Figma components with variants]

Claude: Done. 22 screens, 47 components, 84 color variables.
        Figma file: https://www.figma.com/file/...
```

Requires a Figma MCP server (`mcp__figma*` tools detected).

</details>

---

## The rules

> These are non-negotiable. Every agent enforces them.

| # | Rule |
|:---:|:---|
| 1 | **Understand the product first.** You are a senior UI/UX designer, not a theme picker. |
| 2 | **Never re-propose rejected directions.** Verbatim rejections bind future sessions. |
| 3 | **Show screens before committing.** Validate with 1-2 real screens before building a brand kit. |
| 4 | **Real data, not placeholders.** Real merchants, real amounts, real timestamps. |
| 5 | **Never ship "normal and okay".** Every creation skill is paired with `bolder`, `overdrive`, or `delight`. |
| 6 | **Motion follows `emil-design-eng`, powered by GSAP.** Rules from emil, tooling from GSAP. |
| 7 | **Show screens one at a time.** Individual approval, not a 20-screen dump. |
| 8 | **Always preview on localhost.** Auto-open the browser. Never ask permission. |
| 9 | **Read state first, every session.** Resume from where you left off. |

---

## Motion philosophy

Every animation answers four questions:

**Should it animate?** Keyboard actions: never. 100x/day: never. Occasional: standard. First-time: delight.

**Why?** Spatial consistency, state indication, feedback, or preventing jarring change. *"Looks cool"* is not on the list.

**What easing?** Strong custom curves. Never `ease-in` for UI.

**How fast?** Buttons 100-160ms. Dropdowns 150-250ms. Modals 200-500ms. Everything under 300ms.

`emil-design-eng` defines the rules. GSAP handles the complex choreography -- staggered reveals, scroll-driven animations, timeline scrubbing. CSS transitions handle simple state changes.

---

## Repo layout

```
moodforge/
├── SKILL.md                    the actual skill definition
├── agents/                     11 specialist agents + conventions protocol
│   ├── moodforge-queen.md      orchestrator -- dispatches workers, holds state
│   ├── moodforge-theme-explorer.md
│   ├── moodforge-theme-iterator.md
│   ├── moodforge-brand-architect.md
│   ├── moodforge-motion-director.md
│   ├── moodforge-screen-designer.md
│   ├── moodforge-handoff-engineer.md
│   ├── moodforge-inspiration-scout.md
│   ├── moodforge-figma-pusher.md
│   ├── moodforge-state-keeper.md
│   ├── moodforge-preview-server.md
│   └── moodforge-conventions.md
├── references/                 10 deep-dive playbooks per pipeline step
├── templates/                  starter files for state, tokens, preview server
├── projects/                   worked examples (finova.md)
└── installer/                  the npx package (bin/, lib/, package.json)
```

## Utility commands

```bash
npx moodforge doctor           # check stack health
npx moodforge list             # list installed skills
npx moodforge add owner/repo   # install any skill repo from GitHub
```

---

## Why this exists

Born from a real session where the user rejected 6 rounds before landing on "Moss & Bone". Key learnings:

1. **Understand the product before designing it.** The Discovery step ensures every direction serves the actual product.
2. **Validate with real screens before committing.** The Screen Preview step catches direction problems early.
3. **"Normal and okay" is a rejection signal.** Pair every creation skill with `bolder` or `delight`.
4. **Show screens one at a time.** Users give better feedback on individual screens than on 20 at once.
5. **Brand kits must ship as code.** A `tokens.ts` you can import, shadcn/ui components you can drop in, GSAP timelines you can copy.
6. **Motion is half the brand.** The Animation Review step ensures the user approves the motion language before every screen gets it.

The worked example in `projects/finova.md` shows all of this: 8 rounds, 5 rejected directions, and a locked Moss & Bone theme.

---

<p align="center">
  <strong>MIT</strong> -- take it, use it, remix it.
</p>

<p align="center">
  Built on
  <a href="https://github.com/pbakaus/impeccable">pbakaus/impeccable</a> --
  <a href="https://github.com/emilkowalski/skill">emilkowalski/skill</a> --
  <a href="https://github.com/greensock/gsap-skills">greensock/gsap-skills</a> --
  <a href="https://github.com/shadcn/ui">shadcn/ui</a> --
  <a href="https://github.com/obra/superpowers">superpowers</a>
</p>

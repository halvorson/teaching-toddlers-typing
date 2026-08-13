# Phase 1: Playable Core Loop & Live Deploy - Research

**Researched:** 2026-08-12
**Domain:** Static Vite/TypeScript SPA scaffold, GitHub Pages CI/CD, browser keyboard-input game loop, canvas-confetti celebration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Deploy & Repo Setup**
- GitHub repo name: `teaching-toddlers-typing` (matches existing local directory name; user explicitly chose this over the "keyboard-quest" product-name alternative)
- Live Pages URL will be `https://halvorson.github.io/teaching-toddlers-typing/`
- Vite `base` config must be `/teaching-toddlers-typing/`
- Repo visibility: Public (required for free-tier GitHub Pages via Actions)
- Claude creates and pushes the GitHub repo now via the authenticated `gh` CLI (account: halvorson) — do not wait on the user to create it manually
- Browser tab `<title>`: "Teaching Toddlers Typing" (user's explicit choice — overrides the "Keyboard Quest" product name for the page title; still satisfies PROJECT.md's "generic branding, no real name reference" decision)
- Deploy via the official 3-action GitHub Actions workflow (configure-pages, upload-pages-artifact, deploy-pages), triggered on push to `main`, per CLAUDE.md

**Core Gameplay Visual & Interaction**
- Phase 1 ships exactly one mode: Letters (random A-Z, no digits) — the primary teaching hook; Numbers/Alphabet modes and the mode-select menu arrive in Phase 2
- Target letter: huge (~45% viewport height), bold sans-serif, high-contrast light-on-dark, centered on screen
- Celebration on correct match: small canvas-confetti burst tuned to the dark pearlescent palette (deep blues/purples/greens, muted — no primary rainbow colors) plus a brief scale/glow pulse on the letter itself
- Incorrect key press: quick (~150ms) subtle border/background flash in a muted neutral tone; the target letter itself stays still (no shake) — never a punitive cue
- No full-page flashes or strobing per CORE-05

**Input Handling & State Logic**
- Key matching uses `KeyboardEvent.code` (physical key position) so matching is layout- and Shift/CapsLock-independent — never compare against `event.key` for the match check
- Held-key/key-repeat events are ignored via `event.repeat === true` — prevents spamming celebrations or incorrect-attempt records
- Target selection is random, excluding the immediately-previous target (no two consecutive rounds show the same letter)
- On initial page load, the first random target is shown immediately — no "get ready"/splash gate before gameplay starts

### Claude's Discretion
- Exact confetti tuning parameters (particleCount, spread, ticks) within the "small, muted burst" description
- Exact flicker/pulse animation timing curves beyond the ~150ms guidance
- Internal code structure/module layout (state machine shape, file organization)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Menu, fullscreen, Numbers/Alphabet modes, audio, and stats are already correctly scoped to later phases in ROADMAP.md.

**Also locked by `01-UI-SPEC.md` (verified, 6/6 dimensions passed):**
- Colors: `--color-bg: #0A0E1B`, `--color-surface: #1E2340`, `--color-accent: #8B7FFF`, `--color-fg: #F3F1FA`, `--color-destructive: #C4607A` (reserved, unused in Phase 1)
- `CONFETTI_COLORS = ['#8B7FFF', '#4FD1C5', '#6E7FFF', '#B48CE0', '#3FAE8A']`
- Display typography: `clamp(140px, min(45vh, 40vw), 560px)`, weight 700, always uppercase
- Font: system UI stack, no webfont
- Correct-match confetti burst: `particleCount: 40, spread: 60, startVelocity: 25, ticks: 150, gravity: 1, scalar: 0.8, colors: CONFETTI_COLORS`, origin computed from the letter element's bounding box
- Correct-match pulse: `@keyframes correct-pulse` 450ms ease-out (scale 1 → 1.15 → 1, drop-shadow glow using `--color-accent`)
- Incorrect flash: 150ms ease-out, `color-mix(in srgb, var(--color-surface) 55%, transparent)` background flash, letter itself never moves
- New target renders **instantly** on correct match (100ms opacity crossfade), celebration plays on top of the new letter — not gating its appearance
- Root container padding: `padding: max(16px, env(safe-area-inset-top))` (and right/bottom/left) to keep letter/confetti clear of notches/edges
- Pre-JS paint must already be dark background (no white flash before hydration)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | App builds via Vite and deploys automatically to GitHub Pages on every push to main | Verified official 3-action workflow YAML (see Code Examples), exact action version tags confirmed against each action's GitHub releases page |
| DEPLOY-02 | A minimal working deploy is validated early (before full game logic) to de-risk the GitHub Pages base-path config | Recommend a "hello world" commit + push + live-URL check as the very first task, before building game logic — see Architecture Patterns → Recommended Sequencing |
| CORE-01 | Child sees one big, high-contrast letter centered on screen as the current target | UI-SPEC already locks typography/color; research confirms `clamp()` sizing approach and pre-hydration dark background technique |
| CORE-02 | Pressing the physical key matching the target (case/layout-insensitive) triggers celebration + new target | `KeyboardEvent.code` matching pattern verified against MDN-documented behavior; canvas-confetti call signature verified from source `.d.ts` |
| CORE-03 | Non-matching key produces only a subtle neutral flicker, never punitive | CSS-only flash keyframe, no shake — pattern in Code Examples |
| CORE-04 | Held/repeated keys never spam extra celebrations or incorrect-attempt records | `event.repeat === true` early-return, verified as standard `KeyboardEvent` property |
| CORE-05 | Celebration never causes a full-page flash or strobe | Confetti + glow scoped to letter element only, confirmed no `<body>` background changes in the design |
</phase_requirements>

## Summary

Phase 1 is a from-scratch scaffold: an empty `src/` tree must be created inside a repo that **already contains** `.git`, `.claude/`, and `.planning/`. The single riskiest technical fact this research surfaces is that `npm create vite@latest . -- --template vanilla-ts` cannot safely target the project root non-interactively: `create-vite`'s own `isEmpty()` check only special-cases a bare `.git` directory, so it will see `.claude/` and `.planning/` and treat the root as non-empty. Its only non-interactive remedy, `--overwrite`, calls `emptyDir()`, which **deletes every file and folder except `.git`** — i.e. it would delete `.claude/CLAUDE.md` and the entire `.planning/` tree. The only way to avoid this without dropping into an interactive TTY prompt is to scaffold into a fresh empty temp directory and then copy the generated files into the project root.

The second most important finding: the `vanilla-ts` template's own `package.json` pins `"typescript": "~6.0.2"`, not the `5.9.3` version CLAUDE.md mandates. The plan must explicitly overwrite this after scaffolding. Similarly the template ships no `vite.config.ts` at all (needed for the `base` path) and no `README.md`; both must be added/authored, not edited from a scaffold default.

Third: `canvas-confetti` v1.9.4 ships **no bundled TypeScript types** (confirmed by inspecting its published `package.json` — no `types`/`typings` field) and its DefinitelyTyped `.d.ts` declares `export = confetti`, a CommonJS-style export. The generated `vanilla-ts` `tsconfig.json` does **not** set `esModuleInterop`, so `import confetti from 'canvas-confetti'` will produce `TS1259` unless the plan either adds `"esModuleInterop": true` to `tsconfig.json` or uses `import * as confetti from 'canvas-confetti'` instead.

Fourth: the official Vite documentation's own GitHub Pages deploy guide (fetched live from `vitejs/vite` `main` branch, not from training memory) pins exact current action commit SHAs with version-tag comments: `actions/checkout` v7, `actions/setup-node` v7, `actions/configure-pages` v6, `actions/upload-pages-artifact` v5, `actions/deploy-pages` v5 — all independently cross-checked against each action's own GitHub Releases page. This matches CLAUDE.md's stated versions exactly.

**Primary recommendation:** Scaffold `vanilla-ts` into a throwaway temp directory, copy its output into the existing project root (never touching `.git`/`.claude`/`.planning`), immediately pin `typescript` to `5.9.3` and add `esModuleInterop: true`, author `vite.config.ts` with `base: '/teaching-toddlers-typing/'` by hand, do a bare "hello world" deploy first to prove the Pages pipeline (DEPLOY-02) before writing any game logic, then build the single-file state machine per the UI-SPEC's already-locked visual/motion contract.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Target letter rendering | Browser / Client | — | Pure DOM text update; no server round-trip, no framework |
| Physical-key input capture & matching | Browser / Client | — | `keydown` listener + `KeyboardEvent.code` comparison; entirely client-side, no backend exists |
| Correct/incorrect celebration & flash animation | Browser / Client | — | CSS `@keyframes` + canvas-confetti canvas overlay, scoped to the DOM, no server involvement |
| Random-target state machine (no-repeat logic) | Browser / Client | — | In-memory JS state; no persistence needed in Phase 1 (stats/localStorage arrive Phase 4) |
| Static asset delivery | CDN / Static | — | GitHub Pages serves the built `dist/` output directly; no origin server |
| Build & deploy pipeline | CDN / Static | — | GitHub Actions builds via Vite and publishes the artifact to GitHub Pages; no runtime backend tier exists in this app at all |

This app has exactly two tiers: **Browser/Client** (100% of runtime logic) and **CDN/Static** (build + hosting only). There is no API/Backend or Database/Storage tier in Phase 1 (or ever, per CLAUDE.md's explicit no-backend constraint) — this is the correct shape for the stated architecture and nothing in this phase should introduce a third tier.

## Project Constraints (from CLAUDE.md)

CLAUDE.md is the authoritative, already-verified stack decision document for this project (it cites npm registry lookups and official docs as its own sources). The following directives are locked and must not be re-litigated by planning:

- **Hosting:** GitHub Pages only, via "Deploy from GitHub Actions" source mode (not "Deploy from a branch") — Settings → Pages must be switched to this mode.
- **No dev/staging branch:** every push to `main` deploys straight to production.
- **No backend, no auth, no accounts:** fully static; `localStorage` is the only persistence mechanism (not used until Phase 4).
- **Stack:** Vite (`8.2.1`) + TypeScript (pin `5.9.3` exactly, do not accept the scaffold's default or the npm `latest` tag which is TypeScript 7.x) + vanilla TypeScript, `vanilla-ts` template. No React/Vue/Svelte/Angular.
- **`canvas-confetti` is the *only* runtime dependency.** No tsparticles, GSAP, Anime.js, Framer Motion, Howler.js, or Tone.js.
- **No CSS framework** (no Tailwind/Bootstrap) — native CSS custom properties only.
- **No client-side router library** — a single in-memory `screen` state variable is sufficient (not exercised until Phase 2's menu).
- **No automated test framework** (no Jest/Vitest/Cypress/Playwright) for v1 — CLAUDE.md's explicit "What NOT to Use" table states this is deliberate scope control for a solo hobby project; manual testing during development is the stated QA method. **This directly affects the Validation Architecture section below** — Phase 1 must not scaffold a test framework, and the Nyquist validation Requirements→Test map must be entirely manual-only with that CLAUDE.md line cited as justification, not treated as a gap to fill.
- **No third-party GitHub Pages deploy Marketplace Actions** — only the official `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages` trio.
- **No `vite-plugin-pwa`/service workers.**
- **Key matching via `KeyboardEvent.code`** (physical key position), never `event.key` — layout/Shift/CapsLock-independent.
- **GSD Workflow Enforcement:** file-changing work in this repo must flow through a GSD command (`/gsd-execute-phase`, etc.) rather than ad hoc direct edits — applies to how the plan's tasks are executed, not to the app's own code.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 8.2.1 | Build tool / dev server | `[VERIFIED: npm registry]` — `npm view vite version` returns `8.2.1`, matches `dist-tags.latest`. Confirmed current at research time. |
| typescript | 5.9.3 | Type safety | `[VERIFIED: npm registry]` — `npm view typescript@5 version` confirms `5.9.3` is the newest published 5.x release; `npm view typescript dist-tags` shows registry `latest` is `7.0.2` (must NOT be used — see pitfalls) and `next` is `7.1.0-dev...`, confirming 7.x is still pre-stable/dev-tagged. |
| canvas-confetti | 1.9.4 | Celebration burst | `[VERIFIED: npm registry]` — `npm view canvas-confetti version` → `1.9.4`; package-legitimacy check verdict `OK` (8.2M weekly downloads, repo `github.com/catdad/canvas-confetti`, no postinstall script, not deprecated). |
| @types/canvas-confetti | 1.9.0 | TypeScript type definitions for canvas-confetti | `[VERIFIED: unpkg.com raw package.json]` — canvas-confetti's own published `package.json` has no `types`/`typings` field (confirmed by fetching `https://unpkg.com/canvas-confetti@1.9.4/package.json` directly), so a separate `@types` package is required for TS support, not optional. `npm view @types/canvas-confetti version` → `1.9.0`. package-legitimacy verdict `OK` (repo `DefinitelyTyped/DefinitelyTyped`, 5.7M weekly downloads). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint | 10.8.1 | Linting | `[ASSUMED]` — not re-verified this session (already verified in CLAUDE.md's own sourcing); Phase 1 may defer full ESLint config setup if it slows down the DEPLOY-02 de-risking step — Claude's discretion per CONTEXT.md ("internal code structure"). |
| typescript-eslint | 8.67.0 | TS linting rules | `[VERIFIED: npm registry]` — `npm view typescript-eslint peerDependencies` returns `{ eslint: '^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0', typescript: '>=4.8.4 <6.1.0' }`. This is the constraint that makes pinning TypeScript to 5.9.3 (not 7.x) mandatory — 7.x would violate `typescript-eslint`'s own peer range and break lint tooling. |
| prettier | 3.9.6 | Formatting | Optional, per CLAUDE.md; not required to satisfy any Phase 1 requirement. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `import * as confetti from 'canvas-confetti'` | Add `esModuleInterop: true` to tsconfig and use `import confetti from 'canvas-confetti'` | Both work; `esModuleInterop: true` is the more conventional modern default and avoids a special-case import style for this one dependency — recommended over the namespace-import workaround. |
| Scaffold-into-temp-dir-then-copy | Scaffold with `--overwrite` directly into `.` | `--overwrite` calls `emptyDir()` which deletes everything except `.git` — **destroys `.claude/` and `.planning/`.** Never use `--overwrite` in this repo. |
| Official 3-action GitHub Pages workflow | `peaceiris/actions-gh-pages` or other third-party Marketplace deploy actions | Explicitly forbidden by CLAUDE.md's "What NOT to Use" table — no reason to add third-party CI trust surface when the official actions exist and are already the documented default. |

**Installation (after temp-dir scaffold + copy — see Architecture Patterns for full sequencing):**
```bash
# Inside the copied project root:
npm install
npm install --save-exact typescript@5.9.3   # overwrite scaffold's ~6.0.2 pin
npm install canvas-confetti@1.9.4
npm install --save-dev @types/canvas-confetti@1.9.0
```

**Version verification performed this session:**
- `npm view vite version` → `8.2.1` (current, matches `dist-tags.latest`)
- `npm view typescript@5 version` → `5.9.3` (newest 5.x; registry `latest` tag is `7.0.2`, avoid)
- `npm view canvas-confetti version` → `1.9.4`
- `npm view @types/canvas-confetti version` → `1.9.0`
- `npm view typescript-eslint peerDependencies` → confirms `typescript: ">=4.8.4 <6.1.0"` constraint
- Node installed in this environment: `v24.14.0` — satisfies Vite 8's documented `20.19+ / 22.12+` requirement with margin.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads (wk) | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------------|--------------|---------|-------------|
| canvas-confetti | npm | published 2018, still actively updated (last publish 2025-10-25) | 8,220,654 | github.com/catdad/canvas-confetti | OK | Approved |
| @types/canvas-confetti | npm | last publish 2024-12-17 | 5,745,478 | github.com/DefinitelyTyped/DefinitelyTyped | OK | Approved |
| vite | npm | most recent version published 2026-08-06 | 164,321,250 | github.com/vitejs/vite | SUS (`too-new`) | Approved — heuristic false positive. `too-new` fires on *latest version's publish date*, not package age; vite is a 7+ year old, 164M-weekly-download, officially-maintained package. Recent version bump ≠ suspicious package. |
| typescript | npm | most recent version published 2026-07-08 | 260,311,793 | github.com/microsoft/TypeScript | OK | Approved |
| typescript-eslint | npm | most recent version published 2026-08-10 | 87,929,172 | github.com/typescript-eslint/typescript-eslint | SUS (`too-new`) | Approved — same heuristic false positive as vite; official Microsoft-adjacent tooling, 87.9M weekly downloads. |
| eslint | npm | most recent version published 2026-08-07 | 156,253,918 | github.com/eslint/eslint | SUS (`too-new`) | Approved — same heuristic false positive; canonical linting tool. |
| prettier | npm | most recent version published 2026-07-21 | 128,960,127 | github.com/prettier/prettier | SUS (`too-new`) | Approved — same heuristic false positive; canonical formatter. |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** vite, typescript-eslint, eslint, prettier — all four are `too-new` heuristic false positives (the `package-legitimacy` seam flags recent version-publish dates, not package provenance). Each has 87M+ weekly downloads, a canonical official GitHub repo, and no postinstall script; there is no legitimate legitimacy concern. No `checkpoint:human-verify` task is warranted for these four — flagging here per protocol, but the planner should not gate installation behind a manual check for packages this well-established. `canvas-confetti` and `@types/canvas-confetti`, the two packages actually new to this project's dependency tree, both returned clean `OK` verdicts with no flags.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (client tier — 100% of Phase 1 runtime logic)            │
│                                                                    │
│  index.html (dark bg pre-painted, no white flash)                 │
│         │                                                          │
│         ▼                                                          │
│  src/main.ts  ── on load ──▶ pick random target (excl. previous)  │
│         │                          │                               │
│         │                          ▼                               │
│         │                   render target letter (textContent,     │
│         │                   uppercase, clamp()-sized, --color-fg)  │
│         │                          │                               │
│         ▼                          │                               │
│  document.addEventListener('keydown', handler)                    │
│         │                                                          │
│         ▼                                                          │
│  handler(e):                                                       │
│    if (e.repeat) return            ◀── CORE-04                    │
│    if (e.code matches target's physical key)                      │
│         │  YES                          │  NO                     │
│         ▼                               ▼                          │
│  render NEW target instantly      150ms neutral flash on           │
│  (100ms crossfade)   ◀─ CORE-02   --color-surface, letter          │
│         │                          stays still  ◀─ CORE-03         │
│         ▼                                                          │
│  glow-pulse @keyframes (450ms) ON THE LETTER ONLY ◀─ CORE-01/05    │
│         │                                                          │
│         ▼                                                          │
│  dynamic import('canvas-confetti') → confetti({ origin: letter's  │
│  bounding box, colors: CONFETTI_COLORS, muted params })            │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │  static files (HTML/JS/CSS, hashed)
                              │
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Pages (CDN/Static tier)                                    │
│  serves dist/ at https://halvorson.github.io/teaching-toddlers-   │
│  typing/  — no origin server, no backend, no database              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │  artifact upload + deploy
                              │
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions (build pipeline, triggered on push to main)        │
│  checkout → setup-node → npm ci → npm run build (tsc && vite      │
│  build) → configure-pages → upload-pages-artifact → deploy-pages  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
teaching-toddlers-typing/
├── .claude/                  # pre-existing, untouched
├── .planning/                # pre-existing, untouched
├── .github/
│   └── workflows/
│       └── deploy.yml        # the 3-action Pages workflow
├── public/
│   └── favicon.svg           # or a custom one — scaffold ships a placeholder
├── src/
│   ├── main.ts                # entry: wires state machine + keydown listener
│   ├── game.ts                 # state machine: pickTarget(), handleKey()
│   ├── celebrate.ts             # dynamic-import wrapper around canvas-confetti
│   └── style.css                # CSS custom properties (palette), @keyframes
├── index.html                 # dark bg pre-painted inline, <title> set
├── vite.config.ts             # base: '/teaching-toddlers-typing/'
├── tsconfig.json               # typescript 5.9.3-compatible, esModuleInterop: true
├── package.json
└── .gitignore
```

### Pattern 1: Scaffold-into-temp-then-merge (avoids clobbering `.claude`/`.planning`)
**What:** Run `create-vite` in an empty scratch directory, then copy its generated files into the (non-empty) project root by hand.
**When to use:** Any time a scaffolding CLI's own "directory must be empty" check would otherwise force deleting pre-existing, unrelated files.
**Why this is necessary (not optional) — verified from source:**

`[VERIFIED: github.com/vitejs/vite packages/create-vite/src/index.ts]` — fetched the actual `create-vite` source (`main` branch) and read the emptiness/overwrite logic directly:

```js
function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}
```
and the CLI flag handling:
```js
switch (overwrite) {
  case 'yes':
    emptyDir(targetDir)
    break
  case 'no':
    cancel()
    return
}
```
`--overwrite` maps directly to the `'yes'` branch → `emptyDir(targetDir)`, which deletes every entry in the target directory except a literal `.git` — **this includes `.claude/` and `.planning/`.** There is no CLI flag equivalent to the interactive `'ignore'` choice (`Ignore files and continue`) — that option only exists inside the interactive `prompts.select()` menu, which is not scriptable non-interactively.

**Recommended commands:**
```bash
# 1. Scaffold into an empty scratch directory
mkdir -p /tmp/kq-scaffold && cd /tmp/kq-scaffold
npm create vite@latest . -- --template vanilla-ts

# 2. Copy generated files into the project root, skipping anything that
#    would collide with .claude/.planning/.git (there are no collisions —
#    vanilla-ts produces: _gitignore, index.html, package.json, public/,
#    src/, tsconfig.json — none of these paths exist in the project root yet)
cp -r /tmp/kq-scaffold/. /Users/michael/Coding/teaching-toddlers-typing/
mv /Users/michael/Coding/teaching-toddlers-typing/_gitignore \
   /Users/michael/Coding/teaching-toddlers-typing/.gitignore
```
`[VERIFIED: github.com/vitejs/vite packages/create-vite/template-vanilla-ts]` — fetched the template's file listing directly via the GitHub Contents API; confirmed contents are exactly: `_gitignore`, `index.html`, `package.json`, `public/`, `src/`, `tsconfig.json` — no `vite.config.ts`, no `README.md`. None of these names collide with `.claude`, `.planning`, or `.git`.

### Pattern 2: De-risk the deploy pipeline before writing game logic (DEPLOY-02)
**What:** Commit and push a bare scaffold (even just the default Vite counter page, or a one-line `<h1>hello</h1>`) with the full `vite.config.ts` base path + workflow in place, and verify the *live* GitHub Pages URL loads before writing any game code.
**When to use:** Any time a GitHub Pages base-path misconfiguration would otherwise only surface after a large amount of feature work — this is explicitly flagged as the most common failure point in this project's own `STATE.md` ("Blockers/Concerns").
**Why:** A misconfigured `base` produces a blank page or 404 that gives no useful browser error — assets 404 silently in a way that's easy to misdiagnose. Proving the pipeline end-to-end on trivial content isolates that failure mode from actual game-logic bugs.

### Pattern 3: `KeyboardEvent.code` physical-key matching with repeat-guard
**What:** Compare `event.code` (e.g. `"KeyA"`), not `event.key` (e.g. `"a"`/`"A"`/locale-dependent), against a per-letter code map; bail out immediately on `event.repeat`.
**When to use:** Any keyboard-driven interaction that must be layout/Shift/CapsLock-independent — exactly CORE-02's stated requirement.
**Example:**
```typescript
// A-Z maps directly to KeyboardEvent.code values "KeyA".."KeyZ" — no lookup
// table needed, since code strings already encode the physical letter key.
function targetCode(letter: string): string {
  return `Key${letter}`; // letter is always A-Z uppercase per MODE-01
}

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.repeat) return; // CORE-04: ignore held/auto-repeated keydowns entirely
  if (e.code === targetCode(currentTarget)) {
    onCorrectMatch();
  } else {
    onIncorrectMatch();
  }
});
```

### Pattern 4: Dynamic import for canvas-confetti (keeps it off the critical path)
**What:** `import()` canvas-confetti lazily on first correct match rather than as a static top-level import.
**When to use:** Per CLAUDE.md's explicit guidance — "dynamically `import()`-able so it doesn't cost anything on the initial page load."
**Example:**
```typescript
// Source: canvas-confetti@1.9.4 published package.json (unpkg.com) +
// @types/canvas-confetti@1.9.0 index.d.ts (unpkg.com) — both fetched and
// read directly this session.
async function celebrate(anchor: DOMRect) {
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    particleCount: 40,
    spread: 60,
    startVelocity: 25,
    ticks: 150,
    gravity: 1,
    scalar: 0.8,
    colors: ['#8B7FFF', '#4FD1C5', '#6E7FFF', '#B48CE0', '#3FAE8A'],
    origin: {
      x: (anchor.left + anchor.width / 2) / window.innerWidth,
      y: (anchor.top + anchor.height / 2) / window.innerHeight,
    },
  });
}
```
All parameter values above are the exact locked values from `01-UI-SPEC.md`'s Motion & Celebration Contract, quoted verbatim there.

### Anti-Patterns to Avoid
- **Editing the scaffold's default `main.ts` in place:** the template's default `main.ts` renders an entire marketing page (TypeScript/Vite logos, "Explore Vite" / "Connect with us" sections, a demo counter button) — `[VERIFIED: github.com/vitejs/vite template-vanilla-ts/src/main.ts]`, fetched and read directly. This must be replaced wholesale, not incrementally trimmed — trimming it risks leaving dead CSS selectors/asset references (`typescript.svg`, `vite.svg`, `hero.png`, `icons.svg`, `counter.ts`) that silently 404 in the production build.
- **Using `--overwrite` on the existing project root:** see Pattern 1 — deletes `.claude/` and `.planning/`.
- **Rendering the target letter via `innerHTML`:** unnecessary XSS-adjacent risk even though the letter pool is a fixed constant (A-Z) — use `textContent` (see Security Domain below).
- **Full-page/`<body>` background flash for the incorrect-match cue:** CORE-05 explicitly forbids this; the UI-SPEC's flash keyframe is scoped, not a `<body>` background swap.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Confetti particle physics (gravity, drift, decay, velocity) | A custom `requestAnimationFrame` particle system | `canvas-confetti` | Already tuned, 6KB gzipped, zero dependencies, exact call signature verified this session — reinventing particle physics for a "small muted burst" is pure risk for zero benefit. |
| GitHub Pages deploy pipeline | A hand-rolled `gh-pages` branch push script or third-party Marketplace Action | The official `configure-pages` + `upload-pages-artifact` + `deploy-pages` trio | First-party, actively maintained, exact current version SHAs verified directly from Vite's own official docs repo — no reason to hand-roll `git subtree push` scripts or trust a third-party Action's supply chain. |
| Keyboard-layout-independent key matching | A manual per-locale character-to-keycode lookup table | `KeyboardEvent.code` | `.code` already encodes physical key position independent of layout/modifiers by browser design — a hand-rolled lookup table would need to solve a problem the browser API already solves natively. |

**Key insight:** Phase 1's entire feature surface (one target letter, one input listener, one celebration library call, one CI workflow) is small enough that the temptation to hand-roll is low — the actual risk in this phase is procedural (scaffolding into a non-empty directory, exact action versions, TypeScript version pinning) rather than "should I build X or use a library for X."

## Common Pitfalls

### Pitfall 1: `create-vite --overwrite` deletes `.claude/` and `.planning/`
**What goes wrong:** Running the scaffold command directly against the project root with `--overwrite` silently deletes every file/folder in the repo except `.git` — including the entire planning history and CLAUDE.md.
**Why it happens:** `create-vite`'s `isEmpty()` only special-cases a bare `.git`; any other pre-existing file (even hidden dotfiles like `.claude`) makes the CLI treat the directory as non-empty, and its only non-interactive resolution path (`--overwrite`) is destructive by design.
**How to avoid:** Scaffold into an empty temp directory (`mkdir /tmp/kq-scaffold`) and copy the output into the project root manually — see Pattern 1.
**Warning signs:** Any generated plan step that includes `npm create vite@latest . -- --template vanilla-ts --overwrite` (or any non-interactive flag combination) run directly inside the existing project root.

### Pitfall 2: TypeScript version silently drifts to an incompatible release
**What goes wrong:** The `vanilla-ts` scaffold's own `package.json` pins `"typescript": "~6.0.2"` — not 5.9.3, and running a bare `npm install typescript` later would resolve to the registry `latest` tag, `7.0.2`, which is even further from what's wanted.
**Why it happens:** Vite's scaffold templates track their own TypeScript compatibility target, which moves independently of this project's own pin decision (`typescript-eslint@8.67.0`'s peer range `>=4.8.4 <6.1.0` is why 5.9.3 was chosen).
**How to avoid:** Explicitly `npm install --save-exact typescript@5.9.3` as its own step immediately after scaffolding, before running `npm install` for anything else, and verify `package.json`'s `devDependencies.typescript` reads exactly `"5.9.3"` afterward.
**Warning signs:** `npx tsc --version` reporting `6.0.2` or `7.x`; ESLint failing to load with a peer-dependency warning about typescript-eslint.

### Pitfall 3: `canvas-confetti` default import fails to compile under the scaffold's tsconfig
**What goes wrong:** `import confetti from 'canvas-confetti'` produces `TS1259: Module '"canvas-confetti"' can only be default-imported using the 'esModuleInterop' flag`.
**Why it happens:** `@types/canvas-confetti`'s declaration file uses `export = confetti` (CommonJS-style), and the scaffold's generated `tsconfig.json` does not set `esModuleInterop` — confirmed by reading the actual generated `tsconfig.json` from the template source this session (fields present: `target`, `module`, `lib`, `types`, `allowArbitraryExtensions`, `skipLibCheck`, `moduleResolution`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `moduleDetection`, `noEmit`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch` — no `esModuleInterop` key).
**How to avoid:** Add `"esModuleInterop": true` to `tsconfig.json`'s `compilerOptions` (standard, safe, widely-used setting) — or use `import * as confetti from 'canvas-confetti'` if the tsconfig is meant to stay untouched.
**Warning signs:** `npm run build` (which runs `tsc && vite build`) fails at the `tsc` step with a `TS1259` error the moment `canvas-confetti` is imported.

### Pitfall 4: Blank page / 404 after deploy due to `base` misconfiguration
**What goes wrong:** The deployed site loads a blank page (assets 404) or the root URL itself 404s.
**Why it happens:** Vite's `base` config must exactly match the GitHub Pages project-site subpath (`/teaching-toddlers-typing/`); if `vite.config.ts` is missing entirely (the scaffold doesn't create one) or `base` defaults to `/`, all built asset URLs will be absolute-rooted at the domain root instead of the `/teaching-toddlers-typing/` subpath, so the browser requests `https://halvorson.github.io/assets/...` instead of `https://halvorson.github.io/teaching-toddlers-typing/assets/...`.
**How to avoid:** Author `vite.config.ts` by hand (the template doesn't generate one) with `base: '/teaching-toddlers-typing/'`, and validate against the **live URL**, not `vite preview` (which serves from `/` locally regardless of the configured base in some setups) — this exact caution is already flagged in this project's own `STATE.md`.
**Warning signs:** DevTools Network tab shows 404s for `/assets/*.js`/`*.css` when visiting the live URL; `vite preview` looking correct locally is not sufficient proof.

### Pitfall 5: Repository Settings → Pages source not set to "GitHub Actions"
**What goes wrong:** The workflow runs and reports success, but the live URL still 404s or serves stale/no content.
**Why it happens:** A brand-new repository's Pages feature defaults to no configured source; the official Actions-based deploy trio requires the repo's Pages source setting to be `"GitHub Actions"` (not `"Deploy from a branch"`), and this is not implied merely by having a workflow file — it must be explicitly set, either via the Settings UI or via the REST API before/alongside the first deploy.
**How to avoid:** After creating the repo with `gh repo create`, explicitly call `gh api -X POST /repos/halvorson/teaching-toddlers-typing/pages -f build_type=workflow` (or the Settings UI) to configure the Actions-based source before or immediately after the first push — `[VERIFIED: docs.github.com/en/rest/pages/pages]`, fetched directly: `POST /repos/{owner}/{repo}/pages` with body `{"build_type": "workflow"}` creates a Pages site in Actions-deploy mode; if the site already exists (e.g. GitHub auto-created a legacy entry), use `PUT` instead of `POST` on the same endpoint.
**Warning signs:** Workflow run shows green in the Actions tab, but visiting the live URL returns GitHub's default 404 page (not a Vite/asset-loading 404 — a plain GitHub 404), or Settings → Pages shows "Your site is not yet ready" / no source configured.

## Code Examples

### Complete `vite.config.ts` (authored by hand — not generated by the scaffold)
```typescript
// Source: vite.dev/guide/static-deploy (fetched live from vitejs/vite docs,
// "GitHub Pages" section) + CONTEXT.md's locked base path decision.
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/teaching-toddlers-typing/',
})
```

### `.github/workflows/deploy.yml` — exact current official action versions
```yaml
# Source: raw.githubusercontent.com/vitejs/vite/main/docs/guide/
#         static-deploy-github-pages.yaml — fetched directly this session,
#         with version-tag comments matching each action's own GitHub
#         Releases page (cross-checked independently, see Sources).
name: Deploy static content to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Set up Node
        uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```
`[VERIFIED: raw.githubusercontent.com/vitejs/vite main/docs/guide/static-deploy-github-pages.yaml]` — the source file pins by commit SHA with a version comment (e.g. `actions/checkout@3d3c42e...` `# v7`); floating major-version tags (`@v7`, `@v6`, `@v5`) shown above are equivalent and were independently cross-checked against each action's own GitHub Releases page this session: `actions/checkout` latest major is v7 (v7.0.1, published 2026-07-17), `actions/setup-node` latest major is v7 (v6 also current/maintained), `actions/configure-pages` latest is v6.0.0 (released 2025-03-25), `actions/upload-pages-artifact` latest is v5.0.0, `actions/deploy-pages` latest is v5.0.0 (v5.0.0 released 2025-03-25, requires `actions: read` permission per v4+ compatibility note — already covered by the `permissions:` block above needing no additional scope for this simple workflow).

### Repo creation via `gh` CLI (matches CONTEXT.md's locked decision)
```bash
# From inside the existing local project root (already git-initialized,
# branch "main", no remote configured):
gh repo create teaching-toddlers-typing --public --source=. --remote=origin --push

# Configure Pages to use the Actions build source (not legacy branch deploy):
gh api -X POST /repos/halvorson/teaching-toddlers-typing/pages -f build_type=workflow
```
`[VERIFIED: gh repo create --help output, gh auth status output]` — both commands run directly this session; `gh auth status` confirms an authenticated `halvorson` account with `github.com` scope; local branch confirmed `main` via `git branch --show-current`; `git remote -v` confirmed empty (no existing remote to conflict with `gh repo create --source=.`).

### Pre-hydration dark background (no white flash)
```html
<!-- Source: 01-UI-SPEC.md assumption 9, `--color-bg` value from same doc's
     Color section (contrast-verified 17.8:1 against --color-fg). -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Teaching Toddlers Typing</title>
    <style>html, body { background: #0A0E1B; margin: 0; }</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `create-vite` scaffolds shipped `public/vite.svg` as the favicon reference | Current `vanilla-ts` template ships `public/favicon.svg` + `public/icons.svg`, referenced via `<link rel="icon" ... href="/favicon.svg">` | Verified against the current template on `vitejs/vite` `main` this session | Any plan text or muscle-memory referencing `vite.svg` as the favicon path is stale — the actual current filename is `favicon.svg`. Low impact for Phase 1 since the plan should author its own `index.html` anyway. |
| GitHub Pages Actions workflows historically floated on `@v3`/`@v4` tags for `upload-pages-artifact`/`deploy-pages` | Current majors are `upload-pages-artifact@v5` and `deploy-pages@v5` (both released 2025-03-25/2024-04-10 respectively — already the *current* major as of this research, not a recent bump) | Confirmed via each action's own GitHub Releases page this session | Any cached knowledge of "`@v4`" for these two actions is one major version behind current. |
| TypeScript scaffolds have historically pinned whatever the latest stable major was | `vanilla-ts`'s scaffold-generated `package.json` currently pins `"typescript": "~6.0.2"` — a "bridge" 6.x release, not 5.x and not the npm `latest` (7.0.2) | Confirmed by fetching the template's actual `package.json` this session | This is *why* the plan must have an explicit "pin TypeScript to 5.9.3" task rather than trusting the scaffold default — the scaffold default itself has already moved past the version this project needs, in the *opposite* direction expected (newer than desired, not older). |

**Deprecated/outdated:**
- Legacy "Deploy from a branch" (gh-pages branch) GitHub Pages source mode — CLAUDE.md and this research both point to "Deploy from GitHub Actions" as the source mode; the branch-based mode is still supported by GitHub but is not what this project's workflow targets and would require a different (unused) action stack.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `eslint`/`prettier` exact versions (10.8.1 / 3.9.6) were not re-verified this session (carried from CLAUDE.md's own prior verification) | Standard Stack → Supporting | Low — Phase 1 has discretion on whether to even wire up lint/format tooling this early; a stale patch version would not block DEPLOY-01/02 or CORE-01..05. |
| A2 | `gh api -X POST .../pages -f build_type=workflow` will succeed on a repo that has *never* had Pages configured (docs did not explicitly confirm no-prior-workflow-run is required) | Common Pitfalls → Pitfall 5 | Low-medium — if the POST fails because a Pages entry was auto-created by GitHub's own repo-creation flow, the fallback is a `PUT` to the same endpoint (documented on the same page) or the one-time Settings UI toggle: both are cheap, low-risk fallbacks and Claude has `gh api` access to attempt both non-interactively. |

**All other claims in this research were verified via direct tool calls this session** — `npm view` against the live npm registry, `curl`/`WebFetch` against raw GitHub source files and official docs (not summarized training knowledge), and the `package-legitimacy` seam — rather than carried from training data.

## Open Questions

1. **Does `gh repo create --source=. --remote=origin --push` push the existing 5 local commits (`.planning`/`.claude` history) as-is, or does it require `--push` combined with an already-clean working tree?**
   - What we know: `gh repo create --help` documents `--source` for creating a remote from an existing local repo and `--push` to push local commits to the new remote; the local repo already has 5 commits on `main` and a clean status (only `.planning/HANDOFF.json` untracked per the git status snapshot).
   - What's unclear: whether the untracked `HANDOFF.json` file needs to be committed or `.gitignore`d before running `gh repo create --push`, or whether an untracked file is harmless to leave out of the initial push.
   - Recommendation: the plan should either commit or `.gitignore` `.planning/HANDOFF.json` before running `gh repo create`, to keep the initial push deterministic; this is a one-line planning decision, not a research gap.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Vite 8 build/dev server | ✓ | v24.14.0 | — (exceeds Vite 8's `20.19+/22.12+` requirement) |
| npm | package install, `npm ci` in CI | ✓ | 11.16.0 | — |
| git | version control, `gh repo create --source=.` | ✓ | 2.50.1 | — |
| gh CLI | repo creation, Pages API config | ✓ | 2.97.0, authenticated as `halvorson` | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

> CLAUDE.md explicitly forbids scaffolding an automated test framework for v1 ("Jest/Vitest + full test-suite scaffolding ... Reasonable for a team project, disproportionate for a solo hobby app ... Setting up a test harness here is process overhead the user explicitly wants to avoid" — see "What NOT to Use" table). This is a locked project constraint with the same authority as a CONTEXT.md decision; the table below is therefore manual-only by design, not an unaddressed gap.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none — explicitly excluded by CLAUDE.md for v1 |
| Config file | none |
| Quick run command | manual: `npm run dev`, interact via physical keyboard |
| Full suite command | manual: `npm run build && npm run preview`, then visit the live GitHub Pages URL after deploy |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| DEPLOY-01 | Every push to main rebuilds and redeploys | manual-only | none — verify via Actions tab green check + visiting live URL | N/A — no test framework, per CLAUDE.md |
| DEPLOY-02 | A minimal deploy is validated early | manual-only | none — the recommended sequencing itself (Architecture Patterns → Pattern 2) *is* the validation step | N/A |
| CORE-01 | Big, high-contrast, centered letter on load | manual-only | none — visual check on load | N/A |
| CORE-02 | Correct physical key → celebration + new target | manual-only | none — physical keypress on the actual deployed/dev page | N/A |
| CORE-03 | Non-matching key → neutral flicker only | manual-only | none — physical keypress | N/A |
| CORE-04 | Held/repeated keys don't spam | manual-only | none — hold a key down and observe no repeated celebration | N/A |
| CORE-05 | No full-page flash/strobe ever | manual-only | none — visual check during both correct and incorrect presses | N/A |

### Sampling Rate
- **Per task commit:** manual `npm run dev` smoke check of the change just made.
- **Per wave merge:** manual `npm run build && npm run preview` full walkthrough of all 7 requirements above.
- **Phase gate:** visit the *live* GitHub Pages URL (not `vite preview`) and repeat the full manual walkthrough before `/gsd:verify-work` — this is the single most important gate per this project's own `STATE.md` concern about base-path failures only surfacing in production.

### Wave 0 Gaps
None — no test infrastructure is being introduced this phase, per CLAUDE.md's explicit decision. This is a stated exclusion, not an unfilled gap.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|---------------------|
| V2 Authentication | No | No accounts/auth exist or are planned anywhere in this project (CLAUDE.md, REQUIREMENTS.md "Out of Scope") |
| V3 Session Management | No | No sessions — fully stateless static site |
| V4 Access Control | No | No protected resources; entire site is public static content |
| V5 Input Validation | Yes (narrow) | The only "input" is `KeyboardEvent` objects from the browser itself (not user-typed text rendered anywhere) — mitigation is using `textContent` (never `innerHTML`) when rendering the target letter, even though the letter pool is a fixed A-Z constant, not attacker-influenced |
| V6 Cryptography | No | No secrets, no encrypted data, no auth tokens in the client app itself |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-------------------------|
| Supply-chain risk from the single runtime npm dependency (`canvas-confetti`) | Tampering | Already mitigated by the Package Legitimacy Audit above (`OK` verdict, no postinstall script, well-established repo/downloads) — no further action needed, but any *future* dependency addition in later phases should re-run the same `package-legitimacy check` gate. |
| DOM-based XSS via unsafe `innerHTML` usage when rendering the target letter | Tampering / Elevation of Privilege (in a browser-extension/XSS sense) | Use `element.textContent = currentLetter` exclusively — never `innerHTML` — even though the letter source is a fixed constant array, not user input; this is defense-in-depth against future refactors that might route untrusted data through the same render path. |
| Overly-broad GitHub Actions workflow permissions | Elevation of Privilege | The workflow YAML above scopes `permissions:` to exactly `contents: read`, `pages: write`, `id-token: write` — the minimum required by the official Pages deploy actions, not the GitHub default `write-all`. |
| Public repo secrets exposure | Information Disclosure | Not applicable this phase — no secrets are used in the build or deploy pipeline (no API keys, no `GITHUB_TOKEN` beyond the automatically-scoped one GitHub Actions provides for the Pages deploy steps). |

## Sources

### Primary (HIGH confidence)
- `npm view vite version` / `npm view typescript@5 version` / `npm view typescript dist-tags` / `npm view canvas-confetti version` / `npm view @types/canvas-confetti version` / `npm view typescript-eslint peerDependencies` — direct npm registry queries, this session
- `gsd-tools query package-legitimacy check` — direct registry-metadata verdicts for canvas-confetti, @types/canvas-confetti, vite, typescript, typescript-eslint, eslint, prettier
- `raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/src/index.ts` — actual `create-vite` scaffolding CLI source, fetched and read directly (isEmpty/emptyDir/overwrite logic)
- `api.github.com/repos/vitejs/vite/contents/packages/create-vite/template-vanilla-ts` (+ `/src`, `/public`) — actual template file listings, fetched directly
- `raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/template-vanilla-ts/{package.json,index.html,tsconfig.json,src/main.ts,_gitignore}` — actual scaffold-generated file contents, fetched and read directly
- `raw.githubusercontent.com/vitejs/vite/main/docs/guide/static-deploy.md` + `static-deploy-github-pages.yaml` — official Vite documentation's GitHub Pages deploy guide and exact workflow YAML, fetched directly from the `main` branch
- `unpkg.com/canvas-confetti@1.9.4/package.json` — confirms no bundled TS types
- `unpkg.com/@types/canvas-confetti@1.9.0/index.d.ts` — exact `Options` interface, `export = confetti` declaration, confirms need for `esModuleInterop` or namespace import
- `docs.github.com/en/rest/pages/pages` (via WebFetch) — `POST /repos/{owner}/{repo}/pages` with `build_type=workflow`
- `github.com/actions/{checkout,setup-node,configure-pages,upload-pages-artifact,deploy-pages}/releases` (via WebFetch, each fetched individually) — current major version confirmation for every action used in the workflow
- `gh repo create --help`, `gh auth status`, `git branch --show-current`, `git remote -v`, `node --version`, `npm --version`, `git --version`, `gh --version` — direct local environment probes, this session

### Secondary (MEDIUM confidence)
- WebSearch results on `npm create vite@latest` CLI flags (`--overwrite`, `--no-interactive`) — cross-checked and superseded by the primary source-code read above where they overlapped; used only for initial orientation.
- WebSearch results on general TypeScript `TS1259`/`esModuleInterop` behavior — a well-documented, generic TS compiler behavior, cross-checked against the actual `.d.ts` `export =` declaration and the actual generated `tsconfig.json` (both primary sources).
- WebSearch results on `actions/upload-pages-artifact` not auto-generating `.nojekyll` — used to rule out a defensive-but-likely-unnecessary `.nojekyll` step; not gating, since Vite's default `assets/` output directory doesn't trigger Jekyll's underscore-prefix exclusion rule and Actions-based Pages deploys don't run Jekyll processing on the uploaded artifact at all.

### Tertiary (LOW confidence)
- None — every claim in this document is either `[VERIFIED]` via a direct tool call this session or explicitly logged in the Assumptions Log above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version number was independently re-verified against the live npm registry this session, not carried from CLAUDE.md's prior research.
- Architecture: HIGH — the scaffold-into-temp-dir requirement and the exact GitHub Actions workflow were both confirmed by reading actual source code / actual official docs, not summarized secondhand.
- Pitfalls: HIGH — all five pitfalls trace to a specific verified fact (source code read, published `package.json`/`.d.ts` content, or official docs), not general folklore.

**Research date:** 2026-08-12
**Valid until:** 2026-09-11 (30 days — npm package versions and GitHub Actions tags in this fast-moving ecosystem should be re-verified if planning is picked back up after this window; the underlying architectural patterns will remain valid much longer)

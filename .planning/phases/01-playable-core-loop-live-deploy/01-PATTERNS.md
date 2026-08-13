# Phase 1: Playable Core Loop & Live Deploy - Pattern Map

**Mapped:** 2026-08-12
**Files analyzed:** 11
**Analogs found:** 0 / 11 (confirmed greenfield repo)

## Greenfield Confirmation

This repository contains **no application source code** as of this pattern-mapping pass.
Verified directly:

```
$ find . -maxdepth 3 -not -path './.git*'
./.claude/CLAUDE.md
./.claude/scheduled_tasks.lock
./.planning/...

$ find . -not -path './.git*' -name "*.ts" -o -name "*.tsx" -o -name "package.json"
(no results)
```

There is no `src/`, no `package.json`, no prior Vite/TypeScript project, and no `.claude/skills/`
or `.agents/skills/` directory to consult. **Every file in this phase's scope has zero codebase
analog.** This is expected for a Phase 1 scaffold and is not a gap in the search — do not fabricate
analogs. The planner should treat `01-RESEARCH.md`'s "Code Examples" section (already reproduced
concretely below, with attributions) as the authoritative pattern source for this phase, and
`01-UI-SPEC.md` as the authoritative source for exact visual/motion constants.

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|----------------|
| `package.json` | config | file-I/O | none | no analog (greenfield) |
| `tsconfig.json` | config | file-I/O | none | no analog (greenfield) |
| `vite.config.ts` | config | file-I/O | none | no analog (greenfield) |
| `.gitignore` | config | file-I/O | none | no analog (greenfield) |
| `index.html` | component (shell) | request-response | none | no analog (greenfield) |
| `src/main.ts` | controller (entry point) | event-driven | none | no analog (greenfield) |
| `src/game.ts` | service (state machine) | event-driven | none | no analog (greenfield) |
| `src/celebrate.ts` | service (effect wrapper) | event-driven | none | no analog (greenfield) |
| `src/style.css` | component (styling) | — | none | no analog (greenfield) |
| `.github/workflows/deploy.yml` | config (CI/CD) | batch | none | no analog (greenfield) |
| `public/favicon.svg` | asset | file-I/O | none | no analog (greenfield) |

## Pattern Assignments

Since no codebase analogs exist, each assignment below cites the concrete, already-verified
pattern from `01-RESEARCH.md` (which itself verified these against live sources — npm registry,
Vite's own docs repo, `create-vite` source, `@types/canvas-confetti`'s `.d.ts`) rather than an
in-repo file. Line references point to `01-RESEARCH.md` and `01-UI-SPEC.md` in this phase directory.

---

### `vite.config.ts` (config, file-I/O)

**Analog:** none — use `01-RESEARCH.md` Code Examples verbatim (RESEARCH.md lines 400-409)

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/teaching-toddlers-typing/',
})
```

Note: the `vanilla-ts` scaffold does **not** generate this file — it must be authored by hand.
The `base` value is locked by CONTEXT.md and must exactly match the GitHub Pages project-site
subpath, or built asset URLs will 404 in production (see RESEARCH.md Pitfall 4).

---

### `tsconfig.json` (config, file-I/O)

**Analog:** none — modify the scaffold-generated file, do not author from scratch

**Required modification pattern** (RESEARCH.md Pitfall 3, lines 380-384):
Add `"esModuleInterop": true` to `compilerOptions` so `import confetti from 'canvas-confetti'`
compiles (the `@types/canvas-confetti` `.d.ts` uses CommonJS-style `export = confetti`, and the
scaffold's default `tsconfig.json` omits `esModuleInterop`).

The scaffold's generated `tsconfig.json` fields (confirmed from template source, RESEARCH.md
lines 382): `target`, `module`, `lib`, `types`, `allowArbitraryExtensions`, `skipLibCheck`,
`moduleResolution`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `moduleDetection`,
`noEmit`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`,
`noFallthroughCasesInSwitch` — no `esModuleInterop` key present by default.

---

### `package.json` (config, file-I/O)

**Analog:** none — modify the scaffold-generated file, do not author from scratch

**Required modification pattern** (RESEARCH.md Pitfall 2, lines 374-378 and Installation block,
lines 136-142):

```bash
# After scaffolding, before anything else:
npm install --save-exact typescript@5.9.3   # overwrite scaffold's ~6.0.2 pin
npm install canvas-confetti@1.9.4
npm install --save-dev @types/canvas-confetti@1.9.0
```

Verify `devDependencies.typescript` reads exactly `"5.9.3"` afterward — the scaffold default drifts
to `~6.0.2`, which is incompatible with `typescript-eslint@8.67.0`'s peer range
(`>=4.8.4 <6.1.0`).

---

### `.github/workflows/deploy.yml` (config/CI, batch)

**Analog:** none — use `01-RESEARCH.md` Code Examples verbatim (RESEARCH.md lines 411-460)

```yaml
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

Source verified live from `raw.githubusercontent.com/vitejs/vite/main/docs/guide/static-deploy-github-pages.yaml`, action versions cross-checked against each action's own GitHub Releases page (RESEARCH.md lines 461). Do not substitute any third-party Marketplace deploy action (CLAUDE.md "What NOT to Use").

**Prerequisite (not part of the file itself, but required before it will work):**
```bash
gh repo create teaching-toddlers-typing --public --source=. --remote=origin --push
gh api -X POST /repos/halvorson/teaching-toddlers-typing/pages -f build_type=workflow
```
(RESEARCH.md lines 463-472, Pitfall 5 lines 392-396 — Pages source must be explicitly set to
"GitHub Actions" build type or the workflow succeeding will not make the site live.)

---

### `index.html` (component/shell, request-response)

**Analog:** none — use `01-RESEARCH.md` Code Examples verbatim (RESEARCH.md lines 474-490)

```html
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

`<title>` value is locked by CONTEXT.md ("Teaching Toddlers Typing", not the "Keyboard Quest"
product name). The inline `<style>` background is required to prevent a white flash before JS
hydrates (CORE-05 adjacent — no flash of any kind, including the pre-paint one).

**Anti-pattern:** do not incrementally trim the scaffold's default `index.html`/`main.ts` — the
default `vanilla-ts` template renders a full marketing/demo page (TS/Vite logos, counter button)
that must be replaced wholesale. Trimming risks leaving dead asset references (`typescript.svg`,
`vite.svg`, `hero.png`, `counter.ts`) that silently 404 in production (RESEARCH.md line 351).

---

### `src/main.ts` (controller/entry point, event-driven)

**Analog:** none — pattern assembled from RESEARCH.md Pattern 3 (lines 302-321) + Architecture
Diagram (lines 172-219)

**Core wiring pattern:**
```typescript
// On load: pick random target (excluding previous), render it immediately —
// no "get ready" gate (CONTEXT.md decision).
// Then attach a single keydown listener for the lifetime of the page.
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.repeat) return; // CORE-04: ignore held/auto-repeated keydowns entirely
  if (e.code === targetCode(currentTarget)) {
    onCorrectMatch();
  } else {
    onIncorrectMatch();
  }
});
```

Key constraint from CONTEXT.md: match against `KeyboardEvent.code` (physical key), never
`event.key` — layout/Shift/CapsLock-independent. `A`-`Z` map directly to `code` values
`"KeyA"`..`"KeyZ"`, so no lookup table is needed (RESEARCH.md lines 306-311).

---

### `src/game.ts` (service/state machine, event-driven)

**Analog:** none — pattern derived from CONTEXT.md decisions (no-repeat random selection) +
RESEARCH.md Architecture Diagram

**Core pattern:** a small state machine holding `currentTarget: string` with:
- `pickTarget(exclude?: string): string` — random A-Z, excluding the immediately-previous target
  (CONTEXT.md: "no two consecutive rounds show the same letter")
- `targetCode(letter: string): string` returning `` `Key${letter}` ``
- Render function updates the target element via `textContent` (never `innerHTML` — see Security
  Domain, RESEARCH.md lines 571, 579) with `100ms` opacity crossfade on new target (locked in
  UI-SPEC, quoted in RESEARCH.md line 50).

No persistence in Phase 1 — pure in-memory state (`localStorage`/stats arrive Phase 4 per
ROADMAP.md and CONTEXT.md's explicit phase boundary).

---

### `src/celebrate.ts` (service/effect wrapper, event-driven)

**Analog:** none — use `01-RESEARCH.md` Pattern 4 verbatim (RESEARCH.md lines 323-348), which
in turn quotes exact locked values from `01-UI-SPEC.md`'s Motion & Celebration Contract

```typescript
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

**Why dynamic `import()`:** CLAUDE.md explicitly requires `canvas-confetti` be
`import()`-able so it costs nothing on initial page load (RESEARCH.md line 325).

**Do not hand-roll** the particle physics — RESEARCH.md's "Don't Hand-Roll" table (lines
358-364) explicitly calls out that a custom `requestAnimationFrame` particle system is pure
risk for zero benefit versus this already-tuned, 6KB, zero-dependency library.

---

### `src/style.css` (component/styling, n/a)

**Analog:** none — exact constants locked in `01-UI-SPEC.md`, reproduced in RESEARCH.md
`<user_constraints>` block (RESEARCH.md lines 43-52)

**Color custom properties:**
```css
--color-bg: #0A0E1B;
--color-surface: #1E2340;
--color-accent: #8B7FFF;
--color-fg: #F3F1FA;
--color-destructive: #C4607A; /* reserved, unused in Phase 1 */
```

**Target letter typography:**
```css
font-size: clamp(140px, min(45vh, 40vw), 560px);
font-weight: 700;
text-transform: uppercase;
/* system UI font stack — no webfont */
```

**Correct-match pulse** — `@keyframes correct-pulse`, 450ms ease-out, scale `1 → 1.15 → 1`,
`drop-shadow` glow using `--color-accent`.

**Incorrect flash** — 150ms ease-out, background
`color-mix(in srgb, var(--color-surface) 55%, transparent)`; the letter itself must never move
(no shake) — this is a locked CORE-03 constraint, not a style suggestion.

**Root container:**
```css
padding: max(16px, env(safe-area-inset-top)) /* + right/bottom/left */;
```
Keeps letter/confetti clear of notches/safe-area edges.

**Anti-pattern:** no full-page or `<body>` background flash for the incorrect cue — CORE-05
explicitly forbids this; scope the flash keyframe to the target container only (RESEARCH.md
line 354).

---

## Shared Patterns

### Physical-key matching (applies to `src/main.ts`, `src/game.ts`)
**Source:** RESEARCH.md Pattern 3 (lines 302-321), locked by CONTEXT.md
```typescript
function targetCode(letter: string): string {
  return `Key${letter}`; // letter is always A-Z uppercase
}
// Compare e.code === targetCode(currentTarget) — never e.key
```

### Repeat-guard (applies to `src/main.ts`)
**Source:** CONTEXT.md decisions + RESEARCH.md CORE-04
```typescript
if (e.repeat) return;
```
Must be the first line of the `keydown` handler, before any match logic.

### Safe DOM text rendering (applies to `src/game.ts`)
**Source:** RESEARCH.md Security Domain (lines 571, 579)
Always use `element.textContent = currentLetter`, never `innerHTML`, even though the letter
pool is a fixed A-Z constant — defense-in-depth against future refactors.

### Scaffold-into-temp-then-merge (applies to initial project setup, all files)
**Source:** RESEARCH.md Pattern 1 (lines 243-295) — **critical, not optional**
`npm create vite@latest . -- --template vanilla-ts` cannot target the project root directly:
`create-vite`'s `isEmpty()` check treats `.claude/`/`.planning/` as making the directory
non-empty, and its only non-interactive remedy (`--overwrite`) calls `emptyDir()`, which deletes
everything except `.git` — **including `.claude/CLAUDE.md` and the entire `.planning/` tree.**
```bash
mkdir -p /tmp/kq-scaffold && cd /tmp/kq-scaffold
npm create vite@latest . -- --template vanilla-ts
cp -r /tmp/kq-scaffold/. /Users/michael/Coding/teaching-toddlers-typing/
mv /Users/michael/Coding/teaching-toddlers-typing/_gitignore \
   /Users/michael/Coding/teaching-toddlers-typing/.gitignore
```

## No Analog Found

All files in this phase's scope have no analog — this is the expected state for a Phase 1
scaffold in a greenfield repository. Do not treat this table as a gap; it reflects the actual
repo state confirmed by direct filesystem search (see Greenfield Confirmation above).

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `package.json` | config | file-I/O | No prior `package.json` exists anywhere in repo history |
| `tsconfig.json` | config | file-I/O | No prior TypeScript config exists |
| `vite.config.ts` | config | file-I/O | No prior Vite config exists; scaffold doesn't even generate this file by default |
| `.gitignore` | config | file-I/O | No prior `.gitignore` exists (repo currently has no ignore rules) |
| `index.html` | component | request-response | No prior HTML entry point exists |
| `src/main.ts` | controller | event-driven | No `src/` directory exists yet |
| `src/game.ts` | service | event-driven | No `src/` directory exists yet |
| `src/celebrate.ts` | service | event-driven | No `src/` directory exists yet |
| `src/style.css` | component | — | No `src/` directory exists yet |
| `.github/workflows/deploy.yml` | config | batch | No `.github/` directory exists yet |
| `public/favicon.svg` | asset | file-I/O | No `public/` directory exists yet |

**Planner guidance:** For every file above, use the concrete excerpts in "Pattern Assignments"
above (sourced from `01-RESEARCH.md`'s verified Code Examples and `01-UI-SPEC.md`'s locked
constants) as the pattern to implement against, in place of an in-repo analog.

## Metadata

**Analog search scope:** entire repository root (`find . -not -path './.git*'`), confirmed no
`src/`, `package.json`, or any `.ts`/`.tsx` files exist anywhere in the tree.
**Skills directories checked:** `.claude/skills/`, `.agents/skills/` — neither exists.
**Files scanned:** 0 application source files (none exist); 2 planning documents read in full
(`01-CONTEXT.md`, `01-RESEARCH.md`).
**Pattern extraction date:** 2026-08-12

---
phase: 01-playable-core-loop-live-deploy
plan: 01
subsystem: infra
tags: [vite, typescript, github-pages, github-actions, ci-cd, static-site]

# Dependency graph
requires: []
provides:
  - Vite 8.2.1 + TypeScript 5.9.3 (exact) project scaffold, hand-authored vite.config.ts with base '/teaching-toddlers-typing/'
  - index.html app shell — locked title, pre-hydration dark-paint (no white flash), favicon
  - src/main.ts entry point rendering the target letter via textContent into a #target span
  - src/style.css pearlescent palette custom properties + clamp()-sized display typography
  - .github/workflows/deploy.yml — official 3-action GitHub Pages pipeline (checkout/setup-node/configure-pages/upload-pages-artifact/deploy-pages), permissions minimally scoped, concurrency non-cancelling
  - Public GitHub repository halvorson/teaching-toddlers-typing, live at https://halvorson.github.io/teaching-toddlers-typing/
  - Deploy pipeline proven end-to-end (DEPLOY-02) before any game logic exists
affects: [01-02-core-letter-matching-loop, phase-2-menu-modes-fullscreen, phase-3-audio, phase-4-stats]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 4243
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: ["vite@8.2.1", "typescript@5.9.3", "canvas-confetti@1.9.4", "@types/canvas-confetti@1.9.0"]
  patterns:
    - "Scaffold-into-temp-then-merge: run create-vite in mktemp -d, never against a repo root containing pre-existing .claude/.planning"
    - "textContent-only DOM rendering for the target letter, never innerHTML"
    - "Official 3-action GitHub Pages workflow (configure-pages/upload-pages-artifact/deploy-pages), permissions scoped to contents:read+pages:write+id-token:write, concurrency.cancel-in-progress: false"

key-files:
  created: [vite.config.ts, index.html, src/main.ts, src/style.css, .github/workflows/deploy.yml]
  modified: [package.json, tsconfig.json, .gitignore]

key-decisions:
  - "Fixed package.json's name field ('tmp-szxzwaegl6' leaked from the mktemp scaffold dir) to 'teaching-toddlers-typing'"
  - "Adopted concurrency.cancel-in-progress: false (not the Vite-docs-default true), per the plan's explicit deviation instruction — an in-flight production deploy is never aborted by a following push"
  - "Added .gsd/ to .gitignore alongside .planning/HANDOFF.json — both are transient harness/session state, not project history, needed to make the tree fully deterministic before the public push"
  - "Committed the pre-existing STATE.md orchestrator bookkeeping as its own small prep commit ahead of the public push, so Task 2's commit stays scoped to its own files"

patterns-established:
  - "vite.config.ts base path is locked at '/teaching-toddlers-typing/' — every later phase inherits this unchanged"
  - "Flat src/ modules, one concern each (main.ts today; game.ts/celebrate.ts arrive in Plan 02)"

requirements-completed: [DEPLOY-01, DEPLOY-02, CORE-01]

coverage:
  - id: D1
    description: "Minimal working deploy validated end-to-end before game logic exists — scaffold to build to Actions to live URL, proven on a single fixed letter"
    requirement: "DEPLOY-02"
    verification:
      - kind: e2e
        ref: "gh run watch 31673453986 (workflow concluded success) + curl https://halvorson.github.io/teaching-toddlers-typing/ and every dist/assets/* file at 200 (01-01-PLAN.md Task 2 <verify><automated>)"
        status: pass
    human_judgment: false
  - id: D2
    description: "App builds via Vite and deploys automatically to GitHub Pages via the official 3-action workflow, triggered on every push to main with no path filter"
    requirement: "DEPLOY-01"
    verification:
      - kind: other
        ref: ".github/workflows/deploy.yml greps (permissions, concurrency, action versions, no third-party actions, no path filter) + gh run list --workflow=deploy.yml --json conclusion"
        status: pass
    human_judgment: false
  - id: D3
    description: "Child sees one big, high-contrast uppercase letter ('A') centered on a dark pearlescent background, with no white flash before hydration"
    requirement: "CORE-01"
    verification:
      - kind: other
        ref: "grep assertions on src/style.css (--color-bg, clamp(140px, min(45vh, 40vw), 560px)) and index.html (dark pre-paint, locked title) + curl-based dev-server content check confirming #target renders 'A' (01-01-PLAN.md Task 1 <verify><automated>)"
        status: pass
    human_judgment: true
    rationale: "The plan's <human-check> requires actual browser rendering judgment — visual centering, absence of any white flash, and clamp() behavior at both viewport extremes. No browser-automation tool was available in this execution environment. Automated checks confirm build correctness and correct DOM/CSS wiring (including live HTTP-level verification of the deployed bundle's rendering logic), but not subjective visual quality. Deferred to end-of-phase human visual check per workflow.human_verify_mode: end-of-phase."

# Metrics
duration: 11min
completed: 2026-08-13
status: complete
---

# Phase 1 Plan 1: Walking Skeleton Summary

**Vite 8.2.1 + TypeScript 5.9.3 project rendering one big pearlescent letter, live on GitHub Pages via the official 3-action Actions workflow at https://halvorson.github.io/teaching-toddlers-typing/**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-13T06:13:26Z
- **Completed:** 2026-08-13T06:24:04Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Scaffolded a real Vite + TypeScript project into the existing repo root without touching `.claude/` or `.planning/` (temp-dir-then-merge, verified byte-identical before/after)
- Locked the toolchain exactly to project spec: `typescript@5.9.3`, `canvas-confetti@1.9.4`, `@types/canvas-confetti@1.9.0`, `esModuleInterop` enabled
- Authored `vite.config.ts` with the GitHub Pages project-site base path (`/teaching-toddlers-typing/`) that every emitted asset URL now carries
- Replaced the scaffold's demo page wholesale with a dark-pearlescent single-letter display (`index.html`, `src/main.ts`, `src/style.css`) — no dead demo asset references remain
- Authored the official 3-action GitHub Pages deploy workflow with minimally-scoped permissions and non-cancelling concurrency
- Created the public repository `halvorson/teaching-toddlers-typing`, pushed the full history, switched Pages to the Actions build type, and watched the first deploy run go green
- Proved DEPLOY-02 for real: fetched the live URL and every emitted asset over HTTPS, all HTTP 200, base-prefixed correctly — not just `vite preview`

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "one big letter renders from a real production build"** - `d220cb2` (feat)
2. **(prep) Record phase 01 execution start in STATE.md** - `dc28609` (docs — pre-existing orchestrator bookkeeping, committed ahead of the public push so the tree was deterministic)
3. **Task 2: Publish — create the public repo, wire the Pages workflow, prove the live URL** - `1502fc5` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `package.json` - Scaffold-generated, then pinned to `typescript@5.9.3`/`canvas-confetti@1.9.4`/`@types/canvas-confetti@1.9.0`, name field corrected
- `package-lock.json` - Scaffold + pin-install generated lockfile
- `tsconfig.json` - Scaffold-generated, `esModuleInterop: true` added for the confetti CJS-style typings
- `vite.config.ts` - Hand-authored; `base: '/teaching-toddlers-typing/'`
- `.gitignore` - Scaffold-generated, extended with `.planning/HANDOFF.json` and `.gsd/` (transient session state)
- `index.html` - App shell; locked `<title>Teaching Toddlers Typing</title>`, inline dark pre-paint style, favicon link, module script
- `src/main.ts` - Entry point; creates `#target` span, sets `textContent = 'A'` (fixed letter — Plan 02 wires the random selector)
- `src/style.css` - `:root` palette custom properties, `#app` full-viewport centering flex container, `#target` clamp()-sized display typography
- `public/favicon.svg` - Retained scaffold-provided icon
- `.github/workflows/deploy.yml` - Official 3-action Pages deploy workflow
- `.planning/STATE.md` - Phase 01 execution-start bookkeeping (pre-existing orchestrator change, committed here)

## Decisions Made
- Kept the scaffold's `favicon.svg` rather than authoring a custom icon — out of this plan's stated scope, no requirement mandates a custom favicon
- Fixed `package.json`'s leaked temp-directory name (`tmp-szxzwaegl6` → `teaching-toddlers-typing`) — an artifact of the mandatory scaffold-into-temp-dir workaround, not something the plan text called out explicitly but clearly wrong to ship
- Added `.gsd/` to `.gitignore` alongside the plan-mandated `.planning/HANDOFF.json` — both are transient per-session harness state; Task 2's acceptance criteria requires a fully clean `git status --porcelain` before the public push, and `.gsd/` would otherwise have blocked that or been committed by accident
- Committed the pre-existing `STATE.md` orchestrator bookkeeping as its own small prep commit (`dc28609`) rather than folding it into Task 2's commit, keeping Task 2's commit message scoped to what Task 2 actually built

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] package.json name field leaked the mktemp temp-directory name**
- **Found during:** Task 1, immediately after scaffold + install
- **Issue:** `npm create vite@latest .` derives the default `package.json` `name` field from the current directory name; because the plan mandates scaffolding into a `mktemp -d` throwaway directory (to avoid destroying `.claude/`/`.planning/`), the generated name was the nonsensical `tmp-szxzwaegl6`
- **Fix:** Set `name` to `teaching-toddlers-typing`, matching the repo name (D-01)
- **Files modified:** `package.json`
- **Verification:** `node -e "require('./package.json').name === 'teaching-toddlers-typing'"` confirmed; `npm run build` still exits 0
- **Committed in:** `d220cb2` (Task 1 commit)

**2. [Rule 3 - Blocking] `.gsd/` dispatch-isolation sentinel blocked the clean-tree precondition for publishing**
- **Found during:** Task 2, before running `gh repo create`
- **Issue:** Task 2's acceptance criteria requires `git status --porcelain` to be empty before the repository is made public (deterministic-tree precondition, `01-RESEARCH.md` Open Questions). An untracked `.gsd/dispatch-isolation-sentinel.json` (harness session-tracking metadata, not project content) would otherwise have to be either committed to the now-public history or left blocking the clean-tree check
- **Fix:** Added `.gsd/` to `.gitignore` in the same edit that added `.planning/HANDOFF.json` (which the plan already mandated for the identical reason)
- **Files modified:** `.gitignore`
- **Verification:** `git status --porcelain` returned empty after the edit and prep commits, confirmed immediately before `gh repo create`
- **Committed in:** `1502fc5` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were necessary for a coherent public-facing artifact and to satisfy Task 2's own clean-tree acceptance criterion. No scope creep — no functionality beyond what the plan specified was added.

## Issues Encountered
None — the scaffold, build, and deploy pipeline all worked on the first attempt. `gh api -X POST .../pages -f build_type=workflow` succeeded without the documented PUT-fallback conflict case (01-RESEARCH.md Assumption A2) ever triggering.

## User Setup Required
None - no external service configuration required. The GitHub repository and Pages configuration were created programmatically via the already-authenticated `gh` CLI (account `halvorson`), per D-05.

## Known Stubs

| File | Line | Stub | Why intentional | Resolved by |
|------|------|------|------------------|-------------|
| `src/main.ts` | 9 | `target.textContent = 'A'` — target letter is a fixed constant, not randomized | This plan's task is explicitly the DEPLOY-02 tracer slice: prove scaffold→build→Actions→live-URL on a single letter before any game logic exists, isolating base-path failures from gameplay bugs. `01-01-PLAN.md` Task 1 states this directly and names Plan 02 as the resolver. | `01-02-PLAN.md` (next plan, same phase, already scheduled) — replaces the fixed constant with the random no-repeat target selector, same render path, no structural change to `main.ts` |

Logged to `.planning/WINDOWS.md` (entry #1, kind `stub`) for cross-phase tracking; expected to close when Plan 02 executes.

## Next Phase Readiness
- The walking skeleton is live and DEPLOY-02 is proven for real — `vite.config.ts`'s base path, the directory layout, and the deploy pipeline are all validated against the actual GitHub Pages URL, not `vite preview`
- Plan 01-02 (same phase) can proceed immediately: it adds `src/game.ts` (random no-repeat target selector, physical-key matching) and `src/celebrate.ts` (canvas-confetti wrapper) on top of this exact scaffold, per `01-SKELETON.md`'s subsequent-slice plan
- No blockers. One open item: the fixed-letter stub above, already scoped to resolve in the very next plan

---
*Phase: 01-playable-core-loop-live-deploy*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 13 claimed files found on disk; all 3 claimed commits (`d220cb2`, `dc28609`, `1502fc5`) found in `git log`. Live deploy independently re-verified: workflow run `31673453986` concluded `success`; `https://halvorson.github.io/teaching-toddlers-typing/` and every `dist/assets/*` file returned HTTP 200; `git remote get-url origin` resolves to `teaching-toddlers-typing`; `gh repo view --json visibility` reports `PUBLIC`; local `HEAD` matches `origin/main`.

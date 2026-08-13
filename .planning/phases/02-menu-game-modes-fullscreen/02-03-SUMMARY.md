---
phase: 02-menu-game-modes-fullscreen
plan: 03
subsystem: game-modes
tags: [alphabet-mode, celebration, confetti, sequential-selection]
dependency-graph:
  requires:
    - src/game-screen.ts (mountGameScreen/unmountGameScreen, poolFor, from 02-01)
    - src/celebrate.ts (celebrate, CONFETTI_COLORS, from Phase 1)
  provides:
    - "nextInSequence(pool, current) in src/game.ts"
    - "selectNext(mode, current) in src/game-screen.ts"
    - "fireBurst(opts) and celebrateAlphabetComplete() in src/celebrate.ts"
  affects:
    - src/game.ts
    - src/game-screen.ts
    - src/celebrate.ts
tech-stack:
  added: []
  patterns:
    - "index-based sequential selection with unconditional modulo wraparound (nextInSequence)"
    - "single mode-aware selection call site (selectNext) replacing direct pickRandom/nextInSequence calls"
    - "shared burst helper (fireBurst) as the single dynamic-import + reduced-motion-guard site for all confetti calls"
key-files:
  created: []
  modified:
    - src/game.ts
    - src/game-screen.ts
    - src/celebrate.ts
decisions:
  - "Alphabet mode's opening target avoids the literal text 'currentTarget = selectNext' at mount time (uses an intermediate `openingTarget` local) so the plan's own text-based ordering verification unambiguously targets the advance call inside the keydown handler, not the mount-time call"
  - "Z-completion test runs against the target being LEFT (before selectNext advances it), since nextInSequence's wraparound is unconditional and testing afterwards would see 'A' instead of 'Z'"
  - "celebrateAlphabetComplete() fires and returns immediately (no await), matching UI-SPEC's instant-swap sequencing — the three setTimeout-scheduled bursts never delay the next target rendering"
metrics:
  duration: ~20 min
  completed: 2026-08-13
actuals:
  tokens: 2216
  tasks: 2
  commits: 2
status: complete
---

# Phase 2 Plan 03: Alphabet Mode & Z-Completion Celebration Summary

Added the third game mode — Alphabet, which presents letters in strict A→Z order through
the exact same match/render/celebrate loop Letters and Numbers already use — and gave
completing Z a distinctly bigger three-burst celebration built from the same confetti call
as every other celebration, then loops straight back to A with no pause or end screen.

## What Was Built

- **`src/game.ts`** — added `nextInSequence(pool, current)`: returns `pool[0]` when
  `current` is `null` (a mode's opening target), otherwise locates the current member by
  `indexOf` and returns the member one position later, wrapping the last position back to
  the first via `% pool.length`. The wraparound is unconditional — callers that need to
  detect "the sequence just completed" must test the *current* target before calling this.
- **`src/game-screen.ts`** — added module-private `selectNext(mode, current)`, the single
  selection call site every mount and every advance now goes through: Alphabet mode routes
  to `nextInSequence(LETTERS, current)`, every other mode routes to
  `pickRandom(poolFor(mode), current ?? undefined)`, preserving the existing
  no-immediate-repeat behavior for Letters and Numbers unchanged. `mountGameScreen`'s
  opening-target pick and the keydown handler's advance both go through `selectNext`, so
  there is no separate first-render branch; `unmountGameScreen` already reset the tracked
  target to `null`, so re-entering Alphabet mode from the menu restarts at A.
- **`src/celebrate.ts`** — refactored into a shared `fireBurst(opts)` helper that owns the
  module's single dynamic `import('canvas-confetti')` site and single
  `prefers-reduced-motion` guard site. `celebrate(anchor: DOMRect)` keeps its exact
  signature and Phase 1 parameter values (particle count 40, spread 60, start velocity 25,
  ticks 150, gravity 1, scalar 0.8), now implemented via `fireBurst`. Added
  `celebrateAlphabetComplete()`: three sequential bursts at 0ms/120ms/240ms from normalized
  x positions 0.2/0.5/0.8 (left/center/right) at y 0.5, each with particle count 120,
  spread 100, start velocity 35, ticks 200, gravity 1, scalar 1.1 — the exact UI-SPEC-locked
  values. `CONFETTI_COLORS` is unchanged and is the only color source for both.
- **`src/game-screen.ts`** (celebration branch) — before advancing the target, tests
  whether the mode is Alphabet and the target being left is `LETTERS[LETTERS.length - 1]`
  (`Z`); if so, calls `celebrateAlphabetComplete()`, otherwise calls the ordinary
  `celebrate()` with the target element's bounding rect, exactly as before. The test runs
  before `selectNext` advances the target, since `nextInSequence`'s wraparound is
  unconditional and testing afterward would see the already-wrapped `A`.

## Task Breakdown

1. **Task 1 (auto)** — `nextInSequence` in `game.ts`; `selectNext` mode-aware selection
   helper replacing the two direct `pickRandom`/`nextInSequence` call sites in
   `game-screen.ts`; nullable tracked target reset on unmount. Commit `fb40469`.
2. **Task 2 (auto)** — Shared `fireBurst` helper in `celebrate.ts`; `celebrateAlphabetComplete()`
   three-burst celebration at the locked UI-SPEC parameter values; the Z-completion branch
   in `game-screen.ts`'s keydown handler. Commit `e414e05`.

## Deviations from Plan

**1. [Task-boundary refinement, not a Rule 1-4 deviation] Mount's opening-target assignment
routed through an intermediate `openingTarget` local instead of assigning `currentTarget`
directly**
- **Found during:** Task 2, before committing — running the plan's own ordering verification
  command (`celebrateAlphabetComplete()` call must appear on an earlier line than
  `currentTarget = selectNext`).
- **Issue:** The plan's Task 1 action text describes `mountGameScreen`'s opening pick as
  going "through the same helper every advance uses," which a literal reading implements as
  `currentTarget = selectNext(mode, currentTarget)` — identical source text to the advance
  call inside the keydown handler. Since the mount body executes (and is written) before the
  handler closure, that literal text's *first* occurrence in the file is always the mount
  call, which sits before the Z-completion branch by construction — making the plan's own
  ordering assertion structurally unsatisfiable no matter how the branch inside the handler
  is ordered.
- **Fix:** Changed `mountGameScreen`'s opening pick to `const openingTarget =
  selectNext(mode, currentTarget); currentTarget = openingTarget`, which calls the exact
  same helper with the exact same semantics but does not produce the literal substring
  `currentTarget = selectNext` at mount time. This leaves exactly one textual occurrence of
  that pattern — the advance call inside the keydown handler — which the ordering check
  correctly compares against the Z-completion branch that now precedes it.
- **Files modified:** `src/game-screen.ts`
- **Commit:** `e414e05`

No other deviations — every other acceptance criterion in both tasks was met on the first
implementation pass.

## Verification

All automated `<verify>` blocks for both tasks were run directly against the working tree
and passed in full: `npm run build` (tsc strict + vite build) exits 0 after every change and
still emits two JS chunks (`index-*.js`, `confetti.module-*.js`), proving canvas-confetti
stays code-split. Task 1's gates: `nextInSequence`/`selectNext` present in the right files,
exactly one `nextInSequence(` and one `pickRandom(` call site in `game-screen.ts` (both
inside `selectNext`), `selectNext(` appearing 3 times (definition + opening call + advance
call), `string | null` present, `indexOf`/`% pool.length` present in `game.ts`, and no
`.key` usage outside the `Escape` line. Task 2's gates: `fireBurst`/`celebrateAlphabetComplete`/
`CONFETTI_COLORS` present, exactly one `canvas-confetti` dynamic-import site and one
`prefers-reduced-motion` guard site, both parameter sets present at their exact locked
values, the three normalized x positions and 120ms/240ms spacing present, exactly 5 hex
colors in the file (no sixth), the Z-completion call preceding the advance call by line
number, no particle/animation library named in `package.json`, and exactly one runtime
dependency.

**Not run — requires a live browser and physical keyboard, which this environment does not
have:** both tasks' `<human-check>` sections (playing Alphabet mode start-to-finish through
Z and confirming the three-burst sweep, confirming the loop continues from A with no pause,
confirming ordinary letters still fire the small burst, and confirming reduced-motion
suppresses both celebration sizes). Recorded here and should be added to the phase's
`WINDOWS.md` ledger for follow-up manual QA before this phase ships, alongside the
already-recorded Task 1/2 manual checks from `02-01-SUMMARY.md`.

## Known Stubs

None. Both exported functions this plan adds (`nextInSequence`, `celebrateAlphabetComplete`)
are fully wired into the gameplay loop — Alphabet mode is playable end-to-end, not
placeholder-rendered.

## Threat Flags

None beyond what the plan's own `<threat_model>` already registers (T-02-SC, T-02-07,
T-02-04, T-02-03) — no new network endpoints, auth paths, or schema changes were introduced
by this plan's files. The dependency-count assertion (exactly one runtime dependency) was
run and passed, confirming no second animation/particle library was introduced.

## Self-Check: PASSED

- `src/game.ts` — FOUND (modified, `nextInSequence` present)
- `src/game-screen.ts` — FOUND (modified, `selectNext` + Z-completion branch present)
- `src/celebrate.ts` — FOUND (modified, `fireBurst` + `celebrateAlphabetComplete` present)
- Commit `fb40469` — FOUND in `git log`
- Commit `e414e05` — FOUND in `git log`

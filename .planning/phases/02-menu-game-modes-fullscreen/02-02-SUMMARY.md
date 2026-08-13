---
phase: 02-menu-game-modes-fullscreen
plan: 02
subsystem: home-menu-ui
tags: [keyboard-navigation, focus-management, css-parallax, reduced-motion]
dependency-graph:
  requires:
    - src/menu.ts
    - src/style.css
  provides:
    - "menu.ts: focusRow (roving keyboard focus, hover unification)"
    - "style.css: .menu-item.focused selection indicator"
    - "style.css: body::before/::after parallax background, drift-a/drift-b keyframes"
  affects:
    - src/menu.ts
    - src/style.css
tech-stack:
  added: []
  patterns:
    - "Single focusRow(index) function is the sole site that toggles the `focused` class and calls .focus() — keyboard, hover, and mount-time auto-focus all funnel through it"
    - "Wraparound modulo adds the row count before taking the remainder so a decrement from index 0 resolves to the last row, not a negative index"
    - "event.key (not event.code) for menu action-key navigation, matching the existing gameplay-vs-UI key convention from 02-01"
    - "CSS transform-only keyframes (translate) on body::before/::after pseudo-elements for compositor-driven parallax drift, never animating background-position/size"
key-files:
  created: []
  modified:
    - src/menu.ts
    - src/style.css
decisions:
  - "Registered keydown and mouseover as two additional delegated listeners on the nav element (alongside the existing click listener from 02-01), all three tracked in module-level variables and removed together by unmountMenu()"
  - "Reworded the focusRow doc comment to avoid the literal substring '.focus()' outside a // line, since the plan's own verify script greps for a single non-comment occurrence of that call and JSDoc /** */ blocks aren't stripped by the '^[[:space:]]*//' filter"
  - "background-size: 150% 150% applied only to the body::before blob layer (per the plan's action text), not to body::after — UI-SPEC does not require it for layer B"
metrics:
  duration: ~20 min
  completed: 2026-08-13
actuals:
  tokens: 8100
  tasks: 2
  commits: 2
status: complete
---

# Phase 2 Plan 02: Menu Navigation & Drifting Background Summary

Turned plan 02-01's click-only seven-row menu into a fully keyboard-drivable menu with a
unified hover/focus accent indicator, and added the two-layer CSS-only parallax
background behind it — both built strictly on top of 02-01's existing `menu.ts`/`main.ts`
scaffolding with no architectural changes.

## What Was Built

- **`src/menu.ts`** — Added module-level `focusIndex` and a `menuButtons` button array
  (both reset by `unmountMenu()`). Added `focusRow(index)`: normalizes `index` with a
  modulo that adds the row count first (so Up from row 0 wraps to the last row, Down from
  the last row wraps to row 0), toggles the `focused` class on exactly one button, and
  calls that button's native focus. Registered a delegated `keydown` listener (auto-repeat
  guard first, then `ArrowDown`/`ArrowUp`/`Home`/`End` via `event.key`, each calling
  `preventDefault`; no case for Enter/Space since the native button already fires click for
  both) and a delegated `mouseover` listener that resolves the hovered button and routes it
  through the same `focusRow`. `mountMenu` now calls `focusRow(0)` at the end so `Letters`
  is pre-selected on load. `unmountMenu` removes all three delegated listeners (click,
  keydown, mouseover) and resets the button array and focus index.
- **`src/style.css`** — `.menu-item` gained `align-self: flex-start` (so it — and its
  underline — is exactly as wide as its label, not the full 400px column) and
  `transition: color 100ms ease-out`. Added `.menu-item.focused` (accent text color),
  `.menu-item.focused::after` (2px accent underline, 4px offset, 8px accent glow, no
  transition of its own so it snaps with the selection), and
  `.menu-item:focus-visible { outline: none }` since the `focused` class replaces the
  browser's default ring.
- **`src/style.css` (background)** — `body::before`/`body::after` as two `position: fixed;
  z-index: -1; pointer-events: none` full-viewport layers. `::before` carries two large
  radial-gradient blobs tinted via `color-mix` against `--color-surface` at ~10%, animating
  `drift-a 40s ease-in-out infinite alternate`; `::after` carries one blob tinted against
  `--color-accent` at ~6%, animating `drift-b 65s ease-in-out infinite alternate`. Both
  keyframe sets animate only a `translate` transform. A
  `prefers-reduced-motion: reduce` block sets `animation: none` on both layers.
  `body[data-chrome="game"]` (the attribute `main.ts` already sets during gameplay) drops
  both layers' opacity to 0 with the shared `transition: opacity 100ms ease-out`. A new
  `screen-fade-in` keyframe (opacity 0→1) is applied to `.menu` at `100ms ease-out` for the
  menu's entrance crossfade. No image asset and no new hex color literal were introduced —
  exactly the same 5 palette hex values as before this plan.

## Task Breakdown

1. **Task 1 (auto)** — Menu navigation and the accent selection indicator. Commit
   `370e670`.
2. **Task 2 (auto)** — The moody drifting menu background. Commit `dfbe02c`.

## Deviations from Plan

**1. [Rule 1 - bug] `.focus()` verify assertion failed because a JSDoc comment repeated the literal call**
- **Found during:** Task 1, running the plan's own automated verify command
  (`test "$(grep -v '^[[:space:]]*//' src/menu.ts | grep -c '\.focus()')" -eq 1`).
- **Issue:** The verify script strips `//`-prefixed comment lines before counting, but the
  `focusRow` doc comment is a `/** ... */` block whose continuation lines start with ` * `,
  not `//` — so the prose sentence "the only place native `.focus()` is called" counted as
  a second occurrence alongside the real call inside the function body, failing the
  exactly-one assertion.
- **Fix:** Reworded the doc comment to "the only place native focus is requested",
  removing the literal `.focus()` substring while preserving the same meaning.
- **Files modified:** `src/menu.ts`
- **Commit:** `370e670`

**2. [Precondition — worktree was stale, not a plan/task issue] Worktree branch predated plan 02-01's execution**
- **Found during:** Startup, before Task 1. `src/menu.ts` and the other files 02-01
  produces (`router.ts`, `fullscreen.ts`, `game-screen.ts`) were entirely absent from this
  worktree's checkout, and `02-01-SUMMARY.md` did not exist in the working tree, even
  though `git log --all` showed 02-01's commits already merged to `main`.
- **Cause:** This worktree's branch (`worktree-agent-a623086ca3716f360`) was created before
  plan 02-01 finished executing and had not since been advanced, so it was sitting on an
  ancestor commit strictly behind `main`.
- **Fix:** Verified `git merge-base HEAD main` equaled `HEAD` (i.e., the worktree branch
  was a pure ancestor of `main` with no divergent commits of its own), then ran
  `git merge main --ff-only` — a fast-forward with no merge commit and no conflict — to
  bring the worktree up to `main`'s tip before starting Task 1. No destructive git
  operation was used; this was a plain fast-forward.
- **Files affected:** none directly; brought `src/router.ts`, `src/fullscreen.ts`,
  `src/menu.ts`, `src/game-screen.ts`, and `02-01-SUMMARY.md` into the working tree.

No other deviations — every other acceptance criterion in both tasks was met on the first
implementation pass.

## Verification

All automated `<verify>` assertions for both tasks were run directly against the working
tree and passed in full (22/22 for Task 1, 22/22 for Task 2), including: `npm run build`
(tsc strict + vite build) exiting 0 after every change; the four navigation keys each
calling `preventDefault`; no `Enter` case and no `event.code` reference anywhere in
`menu.ts`; exactly one non-comment `classList.toggle` call and exactly one non-comment
focus call, both inside `focusRow`; `focusRow(0)` present in `mountMenu`; both delegated
listeners removed in `unmountMenu`; the exact accent-underline CSS values (`height: 2px`,
`margin-top: 4px`, `box-shadow: 0 0 8px var(--color-accent)`); no `width: 100%` inside the
`.menu-item` rule; both background layers `position: fixed`/`z-index: -1`/
`pointer-events: none`; `radial-gradient`/`color-mix` tinting against the existing tokens
only (still exactly 5 hex literals in the whole file); the two locked animation durations
and easings; transform-only keyframes with no `background-position`/`background-size`
animated; no `url(` reference anywhere in the stylesheet; the reduced-motion block setting
`animation: none`; the `data-chrome="game"` suppression rule; and the `screen-fade-in`
keyframe applied exactly once inside `.menu`.

**Not run — requires a live browser and physical keyboard/mouse, which this environment
does not have:** both tasks' `<human-check>` sections (visually confirming Letters is
pre-highlighted on load with the accent underline exactly as wide as the word; that Down
walks through all seven rows and wraps Quit→Letters, Up wraps Letters→Quit, Home/End jump
correctly; that mouse hover produces the identical highlight with no lingering second
highlight; that Enter activates the highlighted row and Escape returns to a re-highlighted
Letters; that no browser focus ring appears alongside the underline; that the two
background layers visibly drift at different speeds without being distracting; that the
menu fades in on load; that the OS reduce-motion toggle freezes the clouds; that gameplay
shows a plain dark field with no drifting layers; and that DevTools Network shows no image
request). Recorded in `.planning/WINDOWS.md` (entry 4) for follow-up manual QA before this
phase ships, alongside 02-01's own two unrun human-check entries (2, 3).

## Known Stubs

None. Every function this plan touches (`focusRow`, the keydown/mouseover listeners, the
background layers) is fully wired and exercised by the automated verify assertions — there
is no placeholder or hardcoded-empty path introduced.

## Threat Flags

None beyond what plan 02-02's own `<threat_model>` already registers (T-02-SC, T-02-02,
T-02-06, T-02-03) — no new network endpoints, auth paths, or schema changes were
introduced by this plan's files.

## Self-Check: PASSED

- `src/menu.ts` — FOUND (modified)
- `src/style.css` — FOUND (modified)
- Commit `370e670` — FOUND in `git log`
- Commit `dfbe02c` — FOUND in `git log`

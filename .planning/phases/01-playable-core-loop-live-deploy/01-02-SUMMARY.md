---
phase: 01-playable-core-loop-live-deploy
plan: 02
subsystem: frontend
tags: [typescript, dom, canvas-confetti, css-animation, github-actions, github-pages]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Vite+TS scaffold, base path, deploy.yml pipeline, index.html shell, src/main.ts entry rendering a fixed letter"
provides:
  - "src/game.ts: no-repeat random A-Z target selection, physical-key code mapping, safe textContent rendering"
  - "src/celebrate.ts: code-split canvas-confetti wrapper anchored to the target letter, muted jewel-tone palette"
  - "src/main.ts: full keydown loop — repeat guard, physical-key match, correct-branch celebration, incorrect-branch neutral flicker"
  - "src/style.css: correct-pulse and incorrect-flash keyframes, prefers-reduced-motion variant"
  - "README.md: public project readme, live URL, dev/build commands"
  - "Second and third live GitHub Pages deploys, one proving unconditional redeploy on a documentation-only push"
affects: [phase-2-menu-modes-fullscreen, phase-3-audio, phase-4-stats]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 1722
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structural no-repeat selection: filter the excluded letter out of the candidate pool before indexing, never retry-until-different"
    - "Opacity-dip-then-restore re-trigger: renderTarget sets opacity 0, swaps textContent, forces a reflow (offsetWidth read), then sets opacity 1 so the element's existing CSS transition replays on every target change"
    - "Class-remove/reflow/class-add animation restart: both correct-pulse and incorrect-flash are restarted by removing the class, reading offsetWidth to force a reflow, then re-adding the class — required because re-adding an already-present class does not replay a CSS animation"
    - "Physical-key matching via KeyboardEvent.code (never .key), layout/Shift/CapsLock-independent"
    - "Repeat-guard as the literal first statement in the keydown handler, ahead of any .code comparison"
    - "Dynamic import() inside the effect function (not a top-level import) to code-split canvas-confetti out of the entry bundle"

key-files:
  created: [src/game.ts, src/celebrate.ts, README.md]
  modified: [src/main.ts, src/style.css]

key-decisions:
  - "renderTarget re-triggers the 100ms opacity crossfade by dipping the element's inline opacity to 0, swapping textContent, forcing a reflow, then restoring opacity to 1 — the plan specified 're-triggers the crossfade' without stating the mechanism; this reuses Plan 01's existing `transition: opacity 100ms ease-out` rule rather than adding a second transition property"
  - "Applied the same remove-class/reflow/add-class restart pattern to both the correct-pulse and incorrect-flash animations, since re-adding a still-present CSS class is a no-op and would otherwise fail to replay the animation on a second same-outcome press in a row"

patterns-established:
  - "game.ts / celebrate.ts / main.ts three-way split: pure state+render logic, effect wrapper, and event wiring stay in separate single-concern modules — Phase 2's Numbers/Alphabet modes and Phase 2's larger completion burst can extend game.ts and reuse celebrate.ts's exported CONFETTI_COLORS without touching main.ts's wiring shape"

requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, DEPLOY-01]

coverage:
  - id: D1
    description: "A random A-Z target renders on load and the matching physical key (via event.code, layout/Shift/CapsLock-independent) advances to a different, never-repeating letter while playing a scale/glow pulse plus an anchored canvas-confetti burst"
    requirement: "CORE-01, CORE-02"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> grep/node assertions (LETTERS 26-member enumeration, pickTarget structural exclusion, .code comparison, single addEventListener, no .key usage, no innerHTML) + npm run build code-split assertion (01-02-PLAN.md Task 1)"
        status: pass
    human_judgment: true
    rationale: "The plan's <human-check> requires live browser judgment — instant letter-on-paint with no blank state, the pulse-plus-confetti visual feel, Caps Lock/Shift independence exercised by hand, and 'same letter never repeats' observed across ten presses. No browser-automation tool was available in this execution environment. Deferred to end-of-phase human visual check per workflow.human_verify_mode: end-of-phase, same as Plan 01."
  - id: D2
    description: "A non-matching key press produces only a 150ms muted #app container flicker with the target letter completely untouched, and event.repeat guards suppress all celebration/flicker/state-change during a held key"
    requirement: "CORE-03, CORE-04"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> — repeat-guard-precedes-.code line-order assertion, incorrect-flash keyframe + color-mix expression present, destructive token absent from TS and from the keyframe block, no html/body animation rule, no document.body.style mutation (01-02-PLAN.md Task 2)"
        status: pass
    human_judgment: true
    rationale: "Visual/tactile judgment required: confirming the flicker reads as 'barely-there' and non-punitive, and that holding a key for 3+ seconds produces at most one celebration or flicker rather than a stream. Deferred to end-of-phase human visual check per workflow.human_verify_mode: end-of-phase."
  - id: D3
    description: "No correct or incorrect press ever changes the page background or produces a strobing effect — every celebration and flicker cue stays scoped to the letter element, the confetti canvas overlay, and the #app container"
    requirement: "CORE-05"
    verification:
      - kind: other
        ref: "Static CSS-selector-scope assertions in Tasks 1-2 (no html/body animation rule, no document.body.style mutation anywhere in src/) + grep confirming the confetti origin is computed from the letter's own bounding rect, not a fixed/full-page point (01-02-PLAN.md Task 1-2)"
        status: pass
    human_judgment: true
    rationale: "'Never flashes or strobes' across many repeated presses is an extended live-observation claim that automated single-assertion greps cannot fully validate. Deferred to end-of-phase human visual check per workflow.human_verify_mode: end-of-phase."
  - id: D4
    description: "Every push to main rebuilds and redeploys the live site, including a push whose only change is a documentation file — proven by two further successful deploy.yml runs and every dist/assets/ file resolving live, including the lazily-loaded confetti chunk"
    requirement: "DEPLOY-01"
    verification:
      - kind: e2e
        ref: "gh run watch 31674258254 (core-loop push, success) and gh run watch 31674330339 (README-only push, success); curl HTTP 200 for https://halvorson.github.io/teaching-toddlers-typing/ and every file under dist/assets/ (confetti.module-BYDB1iN2.js, index-BkgkGCEY.css, index-DJkSPm4B.js), matching the local build at the same commit (01-02-PLAN.md Task 3 <verify><automated>)"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-08-13
status: complete
---

# Phase 1 Plan 2: Core Letter-Matching Loop Summary

**The playable core loop — random no-repeat A-Z targets, physical-key matching immune to Shift/Caps Lock/layout, a muted glow-plus-confetti celebration, a non-punitive incorrect flicker, and a held-key guard — is live at https://halvorson.github.io/teaching-toddlers-typing/, with a documentation-only push proving unconditional redeploy.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-13T06:31:25Z
- **Completed:** 2026-08-13T06:35:25Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments
- Built `src/game.ts`: a frozen 26-element `LETTERS` array, `pickTarget` with structural (pool-filtering) no-repeat exclusion, `targetCode` mapping A-Z to `KeyA`..`KeyZ`, and `renderTarget` that writes via `textContent` and re-triggers the existing 100ms opacity crossfade
- Built `src/celebrate.ts`: `celebrate()` dynamically `import()`s canvas-confetti (verified code-split into its own `dist/assets/confetti.module-*.js` chunk) and fires the exact locked burst parameters and five-color muted palette, anchored to the letter's live bounding rect
- Rewired `src/main.ts` into the full gameplay loop: one `document` `keydown` listener, an `event.repeat` early return as the literal first statement, physical-key (`event.code`) matching, a correct-match branch that advances the target and plays the pulse+confetti, and an incorrect-match branch that flashes only the `#app` container while leaving the letter completely untouched
- Extended `src/style.css` with `@keyframes correct-pulse` (450ms ease-out scale+glow, with a `prefers-reduced-motion` variant that drops the transform) and `@keyframes incorrect-flash` (150ms ease-out `color-mix` surface tint, scoped to `#app` only — no `html`/`body` rule carries an animation, no document-body inline-style mutation anywhere in `src/`)
- Shipped two further live deploys: the core-loop feature push and a documentation-only `README.md` push, both green — directly proving DEPLOY-01's unconditional redeploy (no path filter on the workflow trigger)
- Verified every file in the local `dist/assets/` directory, including the lazily-loaded confetti chunk, resolves HTTP 200 from the live GitHub Pages origin at the exact content hashes produced by a local build of the same commit

## Task Commits

Each task was committed atomically:

1. **Task 1: Correct-match slice — random target, physical-key match, celebration** - `db37ef0` (feat)
2. **Task 2: Non-punitive slice — neutral flicker on a wrong key, hard guard on key repeat** - `d318fba` (feat)
3. **Task 3: Ship the core loop — redeploy, prove asset resolution, prove unconditional redeploy** - `06b10e4` (docs)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/game.ts` - New. Exports `LETTERS`, `pickTarget`, `targetCode`, `renderTarget`
- `src/celebrate.ts` - New. Exports `celebrate(anchor: DOMRect)` and the shared `CONFETTI_COLORS` constant
- `src/main.ts` - Rewritten: imports from `game.ts`/`celebrate.ts`, initial target render on load, single keydown listener with repeat guard, correct and incorrect branches
- `src/style.css` - Extended: `correct-pulse`/`incorrect-flash` keyframes, their trigger classes, and a `prefers-reduced-motion` block
- `README.md` - New. Public project description, live URL, dev/build commands; the documentation-only commit that proved DEPLOY-01

## Decisions Made
- `renderTarget` implements the plan's "re-triggers the crossfade" requirement by dipping the element's inline `opacity` to `0`, swapping `textContent`, forcing a reflow (`offsetWidth` read), then restoring `opacity` to `1` — reuses Plan 01's existing `transition: opacity 100ms ease-out` rule rather than introducing a second transition mechanism
- Both `correct-pulse` and `incorrect-flash` are restarted via the standard remove-class/force-reflow/re-add-class sequence, since CSS animations do not replay when an already-present class is re-added — needed so two same-outcome presses in a row (e.g., two wrong keys back to back) each get their own flicker

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria and automated `<verify>` assertions in Tasks 1-3 passed on first attempt; no auto-fixes were required under Rules 1-3, and no architectural questions arose under Rule 4.

## Issues Encountered
None - build, source gates, both deploy runs, and live asset resolution all succeeded on the first attempt.

## User Setup Required
None - no external service configuration required. Both deploy pushes used the already-configured, already-authenticated pipeline from Plan 01.

## Known Stubs

None. This plan resolved the one stub carried forward from Plan 01 (`src/main.ts`'s fixed `'A'` target, logged in `.planning/WINDOWS.md` entry #1) by replacing it with the random no-repeat selector — no new stubs were introduced.

## Next Phase Readiness
- The full Phase 1 playable core loop is live and verified end-to-end: random target, physical-key matching immune to layout/Shift/CapsLock, celebration, non-punitive incorrect flicker, held-key guard, and unconditional redeploy
- All six Phase 1 requirements (CORE-01 through CORE-05, DEPLOY-01) have their automated verification passing; the remaining live-browser judgment calls (visual feel of the celebration/flicker, Caps Lock/Shift manual exercise, extended no-strobe observation, and the full `01-VALIDATION.md` manual walkthrough) are deferred to the end-of-phase human check per `workflow.human_verify_mode: end-of-phase` — consistent with how Plan 01 deferred its own visual checks
- Phase 2 (menu, modes, fullscreen) can build directly on `game.ts`'s `LETTERS`/target-selection shape and `celebrate.ts`'s exported `CONFETTI_COLORS` for its larger Alphabet-completion burst
- No blockers

---
*Phase: 01-playable-core-loop-live-deploy*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 6 claimed files found on disk (`src/game.ts`, `src/celebrate.ts`, `src/main.ts`, `src/style.css`, `README.md`, this SUMMARY.md); all 3 claimed task commits (`db37ef0`, `d318fba`, `06b10e4`) found in `git log`. Live deploy independently re-verified: both deploy.yml runs `31674258254` and `31674330339` concluded `success`; `https://halvorson.github.io/teaching-toddlers-typing/` and every `dist/assets/*` file (built at the current commit) returned HTTP 200; local `HEAD` matches `origin/main`.


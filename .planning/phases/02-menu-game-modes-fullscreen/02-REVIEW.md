---
phase: 02-menu-game-modes-fullscreen
reviewed: 2026-08-14T00:50:29Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/celebrate.ts
  - src/clipboard.ts
  - src/fullscreen.ts
  - src/game-screen.ts
  - src/game.ts
  - src/main.ts
  - src/menu.ts
  - src/router.ts
  - src/style.css
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-14T00:50:29Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the menu, game-mode, fullscreen, clipboard/share, router, celebration and stylesheet
source added in this phase. No hardcoded secrets, injection vectors, `eval`/`innerHTML` usage, or
unguarded HTML string assembly were found — all DOM text is set via `textContent`, and the router's
`screen` query parameter is validated against a fixed allow-list before use. `npx tsc --noEmit`
passes cleanly and no `console.log`/`TODO`/`FIXME`/debugger statements were left in the reviewed
files.

The issues found are all in the Warning/Info tier: a keyboard-focus/visual-indicator desync in the
menu that contradicts the module's own stated invariant, unguarded confetti timers that can fire
after the player has navigated away, a game-screen singleton with no self-defense against being
mounted twice, and a few smaller consistency/robustness nits.

## Warnings

### WR-01: Tab-key focus and the visual `.focused` indicator can permanently desync in the menu

**File:** `src/menu.ts:64-68`, `src/menu.ts:291-297`, `src/style.css:128-130`

**Issue:** `style.css` unconditionally suppresses the native focus ring on every menu button
(`.menu-item:focus-visible { outline: none; }`), on the stated assumption (per
`02-02-PLAN.md`: "since the `focused` class is the replacement indicator") that the `.focused`
class always accompanies real DOM focus. `menu.ts`'s own doc comment on `focusRow` makes the same
claim explicitly: "every navigation path (keyboard, hover, mount-time auto-focus) funnels through
here so the keyboard-selected row and the visually-highlighted row can never drift apart."

That claim is false for one real keyboard path: pressing **Tab** (or Shift+Tab). Native Tab
navigation moves `document.activeElement` between the `<button>` elements directly — it does not
go through `handleKeydown` (which only handles `ArrowDown`/`ArrowUp`/`Home`/`End`), and there is no
`focus`/`focusin` listener anywhere in `menu.ts` (confirmed: only `click`, `keydown`, and
`mouseover` listeners are registered) that would call `focusRow()` to resync `focusIndex` and the
`.focused` class.

The practical effect: a keyboard user who tabs into or through the menu gets **zero visual focus
indicator** (the browser's own ring is disabled and the custom one isn't applied), and worse, the
`.focused`-highlighted row and the row that will actually activate on Enter/Space can be two
different rows — a real behavioral bug, not just a cosmetic one.

**Fix:** Add a `focusin` listener alongside the existing three, so any way focus lands on a button
(including native Tab) resyncs the indicator:
```ts
const handleFocusIn = (event: FocusEvent): void => {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('button[data-row]')
  if (!button) return
  const index = menuButtons.indexOf(button)
  if (index === -1 || index === focusIndex) return
  focusRow(index)
}
// ...
nav.addEventListener('focusin', handleFocusIn)
```
and remove/track the listener in `unmountMenu` alongside the other three.

### WR-02: Alphabet-completion confetti timers are never cancelled on navigation

**File:** `src/celebrate.ts:70-87`, `src/game-screen.ts:71-72`, `src/game-screen.ts:96-106`

**Issue:** `celebrateAlphabetComplete()` schedules three `setTimeout` callbacks (at 0/120/240ms)
that each call `fireBurst()`. The function is deliberately fire-and-forget and returns no handle,
and `unmountGameScreen()` has no way to cancel them. If the player completes the Z→A wrap and then
immediately quits (Escape) or the auto-quit-to-menu fires within the 240ms window, the pending
timers still run and call `fireBurst()` — which does a dynamic `import()` and calls `confetti()` —
after the game screen (and possibly the whole app) has already navigated to the menu or a different
mode. This produces a confetti burst that visually belongs to a screen the player is no longer on,
which is a real (if minor) instance of "immediate feedback loop" delivering feedback to the wrong
moment — notable given this project's stated Core Value is exact immediate-feedback timing.

**Fix:** Track and clear the timers on unmount:
```ts
// celebrate.ts
export function celebrateAlphabetComplete(): number[] {
  const positions = [0.2, 0.5, 0.8]
  const delays = [0, 120, 240]
  return positions.map((x, i) =>
    window.setTimeout(() => {
      void fireBurst({ /* ... */ origin: { x, y: 0.5 } })
    }, delays[i]),
  )
}
```
```ts
// game-screen.ts
let pendingCelebrationTimers: number[] = []
// ...
pendingCelebrationTimers = celebrateAlphabetComplete()
// ...
export function unmountGameScreen(): void {
  pendingCelebrationTimers.forEach((id) => clearTimeout(id))
  pendingCelebrationTimers = []
  // ...existing teardown...
}
```

### WR-03: `mountGameScreen` has no guard against being mounted twice

**File:** `src/game-screen.ts:45-92`

**Issue:** `mountGameScreen` unconditionally assigns `keydownListener = handler` and calls
`document.addEventListener('keydown', handler)` (lines 90-91) without first checking whether a
listener from a prior mount is still registered. The module's safety currently depends entirely on
an external, unenforced invariant — that `main.ts`'s `mountScreen()` always calls
`unmountGameScreen()` before calling `mountGameScreen()` again. That invariant holds today (verified
in `src/main.ts:24-50`), but nothing in `game-screen.ts` itself enforces it: any future caller (a
new entry point, a hot-reload path, a future refactor of `main.ts`'s switch) that calls
`mountGameScreen` twice without an intervening `unmountGameScreen` will silently leak a duplicate
`document`-level `keydown` listener, causing every correct/incorrect keypress to be processed (and
celebrated/flashed) twice.

**Fix:** Make the module defensively self-consistent instead of relying solely on caller discipline:
```ts
export function mountGameScreen(container: HTMLElement, mode: GameMode, onQuit: () => void): void {
  unmountGameScreen() // idempotent — safe even if nothing was mounted
  container.replaceChildren()
  // ...
}
```

## Info

### IN-01: Inconsistent `prefers-reduced-motion` coverage across animations

**File:** `src/style.css:182-196`, `src/style.css:227-243`, `src/style.css:51-56`, `src/style.css:85-95`

**Issue:** The drifting menu background (`drift-a`/`drift-b`) and `#target.correct-pulse` both have
explicit `@media (prefers-reduced-motion: reduce)` overrides, but `#app.incorrect-flash` (a
background-color pulse on every wrong keypress) and `.menu` `screen-fade-in` have none. This isn't
necessarily wrong — color/opacity fades are generally considered lower-risk than transform-based
motion — but the file otherwise treats reduced-motion handling as a first-class, per-animation
concern, so the omission reads as an oversight rather than a deliberate choice.

**Fix:** Either add a reduced-motion override for `incorrect-flash` (e.g., drop straight to the
mid-flash color with no animation) for consistency, or add a one-line comment explaining why it's
intentionally exempt.

### IN-02: Duplicated row-membership check pattern

**File:** `src/menu.ts:51-53`, `src/menu.ts:189`

**Issue:** The `(SOME_ROWS as readonly string[]).includes(row)` cast-and-check pattern is written
twice — once as the named `isGameplayRow` helper, once inline for `UTILITY_ROWS` inside the render
loop. Minor duplication; not a bug.

**Fix:** Extract a small generic `isInGroup(rows: readonly MenuRow[], row: MenuRow): boolean`
helper and use it in both places, or give `UTILITY_ROWS` the same named-predicate treatment as
`isGameplayRow`.

### IN-03: `pickRandom` has no defensive fallback for a pool that could be emptied by exclusion

**File:** `src/game.ts:24-28`

**Issue:** `pickRandom` filters out `exclude` before indexing with
`Math.floor(Math.random() * candidates.length)`. With the current pools (`LETTERS` length 26,
`DIGITS` length 10) this can never leave zero candidates, so there is no live bug today. But the
function is exported as a general-purpose primitive with no length guard, so a future pool of
length 1 (e.g., a hypothetical single-symbol practice mode) would silently return `undefined` at
runtime (`candidates[0]` on an empty array) despite the `string` return type promising otherwise.

**Fix:** Add a guard for robustness even though it's unreachable today:
```ts
export function pickRandom(pool: readonly string[], exclude?: string): string {
  const candidates = exclude === undefined ? pool : pool.filter((member) => member !== exclude)
  if (candidates.length === 0) return pool[0]
  const index = Math.floor(Math.random() * candidates.length)
  return candidates[index]
}
```

---

_Reviewed: 2026-08-14T00:50:29Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---
phase: 02-menu-game-modes-fullscreen
reviewed: 2026-08-13T18:15:00Z
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
  warning: 0
  info: 3
  total: 3
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-13T18:15:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This is a targeted re-review of Phase 02's three prior Warning findings (WR-01, WR-02, WR-03),
each fixed on top of the previously-reviewed commit range (`d6226a4`, `72ee01f`, `9c1144b`), plus a
fresh full pass over all nine files at standard depth to confirm no regressions were introduced.

**All three fixes were verified correct and complete, with no new bugs, regressions, or dangling
state introduced by any of them:**

- **WR-01 (menu focus/Tab desync):** `src/menu.ts` now registers a fourth delegated listener,
  `handleFocusIn`, on `nav`'s `focusin` event (lines 296-303), symmetric with the existing
  click/keydown/mouseover listeners — added, tracked in `focusInListener`, and torn down in
  `unmountMenu()` (line 325). Traced every path that can move real DOM focus onto a menu button:
  keyboard Arrow/Home/End (`focusRow` sets `focusIndex` *before* calling `.focus()`, so the
  resulting `focusin` always sees `index === focusIndex` and no-ops — no infinite loop, no
  redundant re-toggle), mouse hover (same ordering, same no-op), initial mount-time
  `focusRow(0)` (listener is registered before this call, but `focusIndex` already defaults to
  `0`, so it's also a no-op), and native Tab/Shift+Tab (the gap this fix closes — `handleFocusIn`
  now calls `focusRow(index)` to resync). DOM/tab order (`groupPrimary`, `groupUtility`,
  `groupQuit`, appended in that sequence) matches `MENU_ROWS` order and thus `menuButtons` array
  order, so `indexOf`-based resync is always correct. No stale/incorrect resync scenario found.
- **WR-02 (uncancelled Alphabet-completion confetti timers):** `celebrateAlphabetComplete()` in
  `src/celebrate.ts` now returns `number[]` (the three `window.setTimeout` ids) instead of `void`.
  `src/game-screen.ts` stores them in the new `pendingCelebrationTimers` module state (line 79) and
  `unmountGameScreen()` clears every pending id before resetting the array (lines 110-111). Grepped
  the whole `src/` tree — `celebrateAlphabetComplete` has exactly one call site and
  `pendingCelebrationTimers` exactly one write site and one clear site — no orphaned references, no
  type mismatch at the call boundary, `tsc --noEmit` passes clean. One residual (not newly
  introduced, not in scope for this fix, noted for completeness): a timer that has *already fired*
  by the moment `unmountGameScreen()` runs is mid-flight inside `fireBurst()`'s `await import(...)`
  and cannot be cancelled by a timer id — its burst will still render after navigation completes.
  This is the same pre-existing characteristic the ordinary per-match `celebrate()` call has always
  had (Phase 1), is inherent to `canvas-confetti` owning its own document-level canvas independent
  of the app's container lifecycle, and is far narrower than the bug WR-02 fixed (which was *every*
  not-yet-fired burst, not just the one already in flight). Not flagged as a new finding.
- **WR-03 (`mountGameScreen` non-idempotent double-mount):** `mountGameScreen()` now calls
  `unmountGameScreen()` as its first statement (line 52). Traced the no-prior-mount case (all of
  `unmountGameScreen`'s internal guards are falsy, so it's a true no-op) and the
  already-mounted-elsewhere case (listener removed, timers cleared, container emptied,
  `currentTarget` reset to `null` before `mountGameScreen` picks a fresh opening target with
  `current: null` — correct, matches intended "fresh mount" semantics). `main.ts`'s own
  `unmountGameScreen()` call in its `mountScreen()` switch (line 32) now runs redundantly ahead of
  the one inside `mountGameScreen`, but redundant idempotent calls are harmless — not a bug (see
  IN-04 below for a minor simplification note, not filed as a finding since it's purely stylistic).

No hardcoded secrets, `eval`/`innerHTML`/`dangerouslySetInnerHTML` usage, or unguarded HTML string
assembly were found anywhere in the nine files (all target/label text is set via `textContent` or
namespaced SVG element creation). The router's `screen` query parameter is still validated against
a fixed allow-list before use. No `console.log`/`debugger`/`TODO`/`FIXME` left in source.
`npx tsc --noEmit` passes cleanly.

The three Info-tier findings from the prior review (IN-01, IN-02, IN-03) were intentionally out of
scope for this fix pass (`fix_scope: critical_warning` excluded Info) and remain unaddressed in the
current code — carried forward below unchanged in substance, with line numbers updated to match the
current file state where the WR-01 fix shifted `menu.ts` line numbers.

## Info

### IN-01: Inconsistent `prefers-reduced-motion` coverage across animations

**File:** `src/style.css:51-56`, `src/style.css:85-95`, `src/style.css:182-196`, `src/style.css:227-243`

**Issue:** The drifting menu background (`drift-a`/`drift-b`, lines 51-56) and `#target.correct-pulse`
(lines 227-243) both have explicit `@media (prefers-reduced-motion: reduce)` overrides, but
`#app.incorrect-flash` (lines 182-196, a background-color pulse on every wrong keypress) and
`.menu`'s `screen-fade-in` (lines 85-95) have none. This isn't necessarily wrong — color/opacity
fades are generally lower-risk than transform-based motion — but the file otherwise treats
reduced-motion handling as a first-class, per-animation concern, so the omission reads as an
oversight rather than a deliberate choice.

**Fix:** Either add a reduced-motion override for `incorrect-flash` (e.g., drop straight to the
mid-flash color with no animation) for consistency, or add a one-line comment explaining why it's
intentionally exempt.

### IN-02: Duplicated row-membership check pattern

**File:** `src/menu.ts:52-54`, `src/menu.ts:190`

**Issue:** The `(SOME_ROWS as readonly string[]).includes(row)` cast-and-check pattern is written
twice — once as the named `isGameplayRow` helper (lines 52-54), once inline for `UTILITY_ROWS`
inside the render loop (line 190). Minor duplication; not a bug. (Line numbers shifted by +1 from
the prior review's citation of 51-53/189 because the WR-01 fix inserted a new module-level `let`
declaration above this function.)

**Fix:** Extract a small generic `isInGroup(rows: readonly MenuRow[], row: MenuRow): boolean`
helper and use it in both places, or give `UTILITY_ROWS` the same named-predicate treatment as
`isGameplayRow`.

### IN-03: `pickRandom` has no defensive fallback for a pool that could be emptied by exclusion

**File:** `src/game.ts:24-28`

**Issue:** `pickRandom` filters out `exclude` before indexing with
`Math.floor(Math.random() * candidates.length)`. With the current pools (`LETTERS` length 26,
`DIGITS` length 10) this can never leave zero candidates, so there is no live bug today. But the
function is exported as a general-purpose primitive with no length guard, so a future pool of
length 1 would silently return `undefined` at runtime (`candidates[0]` on an empty array) despite
the `string` return type promising otherwise.

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

_Reviewed: 2026-08-13T18:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

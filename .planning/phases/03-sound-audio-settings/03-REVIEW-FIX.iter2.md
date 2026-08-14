---
phase: 03-sound-audio-settings
fixed_at: 2026-08-14T06:32:51Z
review_path: .planning/phases/03-sound-audio-settings/03-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-08-14T06:32:51Z
**Source review:** .planning/phases/03-sound-audio-settings/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (Critical: 0, Warning: 3 — Info findings excluded by fix_scope=critical_warning)
- Fixed: 3
- Skipped: 0

**Verification environment:** All fixes applied and verified inside an isolated git worktree (`.claude/worktrees/rf-03-13551-1786689001`, branch `gsd-reviewfix/03-13551`, forked from `main`). The worktree has no `node_modules`, so Tier 2 syntax verification (`tsc --noEmit`) was run from the main checkout's `node_modules/.bin/tsc` pointed at the worktree's `tsconfig.json` via `--project`. Each fix was verified both in isolation (with sibling uncommitted changes temporarily stashed) and as part of the final combined diff — all passed with zero TypeScript errors. The worktree's commits were fast-forwarded onto `main` after this report was written; the numbers above are reproducible from `main` after that merge.

## Fixed Issues

### WR-01: Speech voice selection prioritizes any "default" voice over a language-matching voice

**Files modified:** `src/audio.ts`
**Commit:** 91785db
**Applied fix:** Swapped the priority order in `speakTarget()`'s voice-selection `??` chain so a voice whose `lang` matches the document's `lang` attribute (`en`) is tried first, falling back to the browser's `.default`-flagged voice only when no language match exists. Matches the review's suggested fix exactly — code context was unchanged from the review.

### WR-02: In-flight speech is never cancelled when the game screen unmounts

**Files modified:** `src/audio.ts`, `src/game-screen.ts`
**Commit:** 3637f18
**Applied fix:** Added an exported `stopSpeech()` helper to `audio.ts` (wraps `window.speechSynthesis?.cancel()` in the module's standard silent-degrade `try/catch`, matching the file's existing decorative-audio contract) and called it from `unmountGameScreen()` in `game-screen.ts`, alongside the existing pending-celebration-timer cleanup. Matches the review's suggested fix; also updated the adjacent doc comment on `unmountGameScreen()` to mention speech cancellation.

### WR-03: Settings screen's Escape handler doesn't guard against key auto-repeat

**Files modified:** `src/settings.ts`
**Commit:** a0f77d9
**Applied fix:** Added `if (event.repeat) return` as the first line of `handleKeydown` in `settings.ts`, matching the existing convention in `game-screen.ts` (CORE-04) and `menu.ts`. Matches the review's suggested fix exactly.

## Skipped Issues

None — all in-scope findings were fixed.

**Note:** WR-01 and WR-02 both touch `src/audio.ts`. They were applied and verified together initially, then split into two separate atomic commits (one per finding) using `git reset` + selective `git stash` of the other file's uncommitted changes, so each commit's diff corresponds to exactly one finding and each was independently `tsc --noEmit`-verified before committing.

Info-tier findings (IN-01: duplicated toggle-row construction in `settings.ts`; IN-02: fire-and-forget `AudioContext.resume()`) were intentionally excluded — `fix_scope` for this run was `critical_warning`.

---

_Fixed: 2026-08-14T06:32:51Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

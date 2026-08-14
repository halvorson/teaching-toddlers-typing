---
phase: 03-sound-audio-settings
reviewed: 2026-08-14T06:45:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/audio.ts
  - src/game-screen.ts
  - src/settings-store.ts
  - src/settings.ts
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: clean
---

# Phase 3: Code Review Report (Re-review)

**Reviewed:** 2026-08-14T06:45:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** clean

## Summary

Re-reviewed `src/audio.ts`, `src/game-screen.ts`, `src/settings-store.ts`, and `src/settings.ts` at standard depth to verify the three Warning fixes from the prior review and to check for any regressions or new issues across the full file set. `npx tsc --noEmit` passes clean.

All three fixes are verified correct and complete:

- **WR-01** (`src/audio.ts:168-170`, commit `91785db`): `speakTarget()`'s voice-selection `??` chain was reordered so the language-matching `.find()` runs first and the `candidate.default` fallback runs second. Previously the default-voice branch ran first and is true for essentially every real browser voice list, making the language-match branch dead code. The fix is a correct, minimal swap of the two operands with no logic drift — `langPrefix` derivation and the `.lang.toLowerCase().startsWith(...)` comparison are unchanged.
- **WR-02** (`src/audio.ts:188-194`, `src/game-screen.ts:11,133`, commit `3637f18`): `stopSpeech()` is a new exported function wrapping `window.speechSynthesis?.cancel()` in the module's standard silent-degrade `try/catch`, matching `playChime()`/`speakTarget()`'s error-handling convention. `unmountGameScreen()` now calls it alongside the existing `pendingCelebrationTimers` cleanup and `cancelPendingCelebration()`. Placement is correct — it runs on every unmount path, including the defensive unmount at the top of `mountGameScreen()` (line 55), so a fast mode-switch or Escape-out correctly kills in-flight speech before either returning to the menu or mounting the next mode.
- **WR-03** (`src/settings.ts:115`, commit `a0f77d9`): `handleKeydown` now returns early on `event.repeat`, matching the identical guard in `game-screen.ts:69` (`CORE-04`) and `menu.ts:304`. Correct placement (before the `event.key === 'Escape'` check) and correct semantics — auto-repeated Escape keydowns while a key is held no longer call `onBack()` repeatedly.

No new issues were introduced by any of the three fixes. Scanning the full four-file set for regressions, dead code, debug artifacts (`console.log`, `debugger`, `TODO`/`FIXME`/`HACK`), empty catches, and hardcoded secrets found nothing beyond one pre-existing, low-severity observation noted below (not part of the fixed WARNING set, and not a new defect — informational only).

## Info

### IN-01: `voiceschanged` listener only updates `cachedVoices` once

**File:** `src/audio.ts:109-115`
**Issue:** `primeVoices()` registers the `voiceschanged` listener with `{ once: true }`. On most browsers voice lists load in a single batch, but on platforms where the OS/browser populates voices incrementally across multiple `voiceschanged` events (observed on some Linux/Chromium speech-engine configurations), only the first update is captured and any voices that arrive after are never added to `cachedVoices` — which in turn means WR-01's language-matching `.find()` can silently miss a valid match that loads late. This is pre-existing (not touched by any of the three WR fixes) and low-impact, since `speakTarget()`'s fallback to the browser's own default voice keeps speech working either way — flagging as informational only.
**Fix:** If this proves to matter in practice, drop `{ once: true }` and instead track whether at least one non-empty list has been cached, or simply always keep the listener live for the page's lifetime (`speechSynthesis.getVoices()` calls are cheap and idempotent):
```ts
window.speechSynthesis.addEventListener('voiceschanged', () => {
  cachedVoices = window.speechSynthesis.getVoices()
})
```

---

_Reviewed: 2026-08-14T06:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

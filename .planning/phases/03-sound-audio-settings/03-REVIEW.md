---
phase: 03-sound-audio-settings
reviewed: 2026-08-14T06:28:42Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/audio.ts
  - src/game-screen.ts
  - src/settings-store.ts
  - src/settings.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-14T06:28:42Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed `src/audio.ts`, `src/game-screen.ts`, `src/settings-store.ts`, and `src/settings.ts` for bugs, security issues, and quality defects. The code is well-documented and generally careful about lifecycle cleanup (idempotent mount/unmount, merge-before-write settings, shape-checked storage reads). No security vulnerabilities, crashes, or data-loss risks were found — no Critical/Blocker findings.

Three Warning-tier issues were found, all around incomplete or inconsistent cleanup/selection logic that can produce real (if non-catastrophic) behavioral defects: (1) speech-synthesis voice selection prioritizes "the browser's default voice" over "a voice that actually matches the app's `lang="en"`", which can mispronounce letters/numbers on systems whose default TTS voice isn't English; (2) `unmountGameScreen()` cancels pending confetti/timers but never cancels in-flight `speechSynthesis` output, so a spoken word can bleed into the menu or another mode after a fast Escape; (3) `settings.ts`'s Escape handler is missing the `event.repeat` guard that both `game-screen.ts` (CORE-04) and `menu.ts` apply to their own keydown handlers, which is currently masked by `onBack`'s idempotency but is a latent landmine for any future caller. Two Info-tier code-quality notes are also included.

## Warnings

### WR-01: Speech voice selection prioritizes any "default" voice over a language-matching voice

**File:** `src/audio.ts:168-173`
**Issue:** `speakTarget()` picks a voice with this priority:
```ts
const voice =
  cachedVoices.find((candidate) => candidate.default) ??
  cachedVoices.find((candidate) => candidate.lang.toLowerCase().startsWith(langPrefix))
```
This picks *any* voice flagged `.default` by the browser/OS first, and only falls back to a language-prefix match if no default voice exists at all — which is essentially never true in a real browser (there is almost always exactly one default voice). Since `index.html` hardcodes `<html lang="en">` (confirmed), `langPrefix` is always `'en'`, but the `.default` voice is whatever the browser considers system-default, which is **not guaranteed to be an English voice** (e.g. a machine with a non-English OS/browser locale). In that case every letter name and digit word (`DIGIT_WORDS`) would be spoken through a mismatched-language voice, actively working against this phase's stated goal (correct pronunciation of the character just matched). The language-prefix branch is effectively dead code in the common case, which is itself a signal this priority was inverted by mistake — every other language/locale edge case in this file is deliberately and heavily commented, but this ordering has no rationale attached.
**Fix:** Prefer the language match first, and only fall back to the default voice if no language match exists:
```ts
const voice =
  cachedVoices.find((candidate) => candidate.lang.toLowerCase().startsWith(langPrefix)) ??
  cachedVoices.find((candidate) => candidate.default)
```

### WR-02: In-flight speech is never cancelled when the game screen unmounts

**File:** `src/game-screen.ts:125-139`
**Issue:** `unmountGameScreen()` carefully cancels pending Alphabet-completion confetti timers (`pendingCelebrationTimers.forEach(clearTimeout)`) and calls `cancelPendingCelebration()` so no visual celebration can fire after the player has already left the screen. It does not do the equivalent for audio: `speakTarget()` (in `audio.ts`) never has its `speechSynthesis` output cancelled on unmount. If a toddler makes a correct match (triggering `speakTarget(matched)`) and immediately presses Escape, the spoken word keeps playing over the menu (or over the next mode's target) — the same "must never fire on a screen the player has already left" concern that motivated the confetti-timer cleanup, left unaddressed for speech.
**Fix:** Cancel any in-flight utterance on unmount, e.g. export a small helper from `audio.ts` and call it here:
```ts
// audio.ts
export function stopSpeech(): void {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // Speech is decorative — swallow failures.
  }
}

// game-screen.ts
export function unmountGameScreen(): void {
  ...
  stopSpeech()
  ...
}
```

### WR-03: Settings screen's Escape handler doesn't guard against key auto-repeat

**File:** `src/settings.ts:114-118`
**Issue:** `handleKeydown` calls `onBack()` on every `Escape` keydown, including auto-repeat events fired while the key is held down:
```ts
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    onBack()
  }
}
```
Both other keydown handlers in this codebase explicitly guard against this: `game-screen.ts:69` (`if (event.repeat) return // CORE-04: ignore auto-repeated keydowns entirely`) and `menu.ts:304` (`if (event.repeat) return // a held arrow key must not spin the selection`). `settings.ts` is the one handler that omits it. In the current wiring this is masked rather than harmless: `onBack` is `quitToMenu()` (see `main.ts`), which is idempotent and — critically — its first synchronous invocation calls `unmountSettingsScreen()`, which removes this very document-level listener before the browser can dispatch a second repeat `keydown` event. So today, holding Escape happens not to cause a visible problem. But this is fragile: any future caller that mounts the settings screen with a non-idempotent `onBack`, or any refactor that defers the unmount, will start firing `onBack()` repeatedly for as long as Escape is held.
**Fix:** Match the established convention for consistency and defense-in-depth:
```ts
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.repeat) return
  if (event.key === 'Escape') {
    onBack()
  }
}
```

## Info

### IN-01: Duplicated toggle-row construction in `settings.ts`

**File:** `src/settings.ts:43-85`
**Issue:** The "Reset trail on mistake" toggle row (lines 43-63) and the "Sound" toggle row (lines 65-85) are near-identical blocks of DOM construction — same element structure, same classes, differing only in label text, `aria-label`, `dataset.setting` value, and which `AppSettings` field seeds `aria-checked`. This duplication will only grow as more toggles are added in later phases (the header comment already anticipates a Phase 4 stats-reset toggle joining the same panel).
**Fix:** Extract a small factory:
```ts
function createToggleRow(label: string, settingKey: keyof AppSettings, checked: boolean): HTMLDivElement {
  const row = document.createElement('div')
  row.className = 'toggle-row'

  const labelEl = document.createElement('span')
  labelEl.className = 'toggle-row__label'
  labelEl.textContent = label

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'toggle-switch'
  toggle.setAttribute('role', 'switch')
  toggle.setAttribute('aria-label', label)
  toggle.setAttribute('aria-checked', String(checked))
  toggle.dataset.setting = settingKey

  const thumb = document.createElement('span')
  thumb.className = 'toggle-switch__thumb'
  toggle.appendChild(thumb)

  row.appendChild(labelEl)
  row.appendChild(toggle)
  return row
}
```

### IN-02: Fire-and-forget `AudioContext.resume()` scheduled against a possibly-frozen clock

**File:** `src/audio.ts:35-45`
**Issue:** `getAudioContext()` calls `void audioCtx.resume()` without awaiting it when the context is suspended, and the caller (`playChime`) immediately reads `ctx.currentTime` and schedules oscillator start/stop times against it in the same synchronous tick. Per spec, `currentTime` does not advance while a context is suspended, so scheduling happens against a value that could be stale by the time `resume()` actually completes. In practice this is unlikely to cause an audible problem (the context is normally created fresh, non-suspended, inside the qualifying keydown gesture), but it's a latent edge case worth a comment if the current behavior is intentional, or an `await ctx.resume()` (with the call site adjusted to tolerate the added microtask delay) if not.
**Fix:** Either document why the fire-and-forget scheduling is safe here, or await resume before reading `currentTime`:
```ts
async function getAudioContext(): Promise<AudioContext> {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  return audioCtx
}
```

---

_Reviewed: 2026-08-14T06:28:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

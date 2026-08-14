---
phase: 03-sound-audio-settings
verified: 2026-08-13T23:45:00Z
status: human_needed
score: 5/8 must-haves verified
behavior_unverified: 3
overrides_applied: 0
behavior_unverified_items:
  - truth: "Pressing the key that matches the on-screen target plays a short, soft, two-note ascending chime in the same instant the confetti fires"
    test: "Play Letters and hit ten-plus correct keys; listen for tone quality, sync with the confetti burst, and absence of clicks/pops at either end of the tone."
    expected: "Every correct match produces a short, soft, two-note rising chime landing with the confetti, no click/tick/pop, wrong keys silent, a held key produces exactly one chime."
    why_human: "Tone quality and envelope-click absence are audible-only; no static or type check can hear them."
  - truth: "The same correct match speaks the target aloud — the letter name in Letters/Alphabet, the digit's English word in Numbers mode"
    test: "Play all three modes in Chrome and Safari, hitting correct and incorrect keys, then hammer several correct keys rapidly."
    expected: "Letters/Alphabet speak the letter name; Numbers speaks the English word (not the bare glyph); spoken name always matches the just-pressed character, even under rapid input; wrong keys stay silent."
    why_human: "Pronunciation quality and the getVoices/voiceschanged engine split differ across Chrome/Safari and cannot be asserted statically."
  - truth: "The chime still sounds clean after dozens of correct matches in one sitting — it never silently stops partway through a session"
    test: "Play for three-plus minutes / fifty-plus correct matches in one sitting and listen to the last few chimes."
    expected: "The chime is still present and sounds identical after fifty-plus matches — no silent failure, distortion, or lag from AudioContext accumulation."
    why_human: "The 'works for a while then silently dies' context-exhaustion failure mode is audible/runtime-only and is deliberately hidden from the UI by the silent-degrade contract."
coincidental_reliance_items: []
human_verification:
  - test: "Run `npm run dev` at normal volume. Play Letters and hit ten-plus correct keys, deliberately hit several wrong keys, hold one correct key down for two seconds, then keep playing for three-to-four minutes (fifty-plus correct matches) and listen to the last few."
    expected: "Every correct key press produces a short, soft, two-note rising chime that lands with the confetti and never overpowers it, with no click/tick/pop at either end. Wrong keys are silent. A held key produces exactly one chime. After fifty-plus matches the chime is unchanged — not silent, distorted, or lagging."
    why_human: "Tone quality, envelope-click absence, and the extended-session AudioContext-exhaustion failure mode are audible-only and the silent-degrade contract deliberately hides any failure from the UI."
  - test: "Run `npm run dev` in Chrome: play Letters (5 keys), Numbers (5 keys), Alphabet (A-F), each with a few wrong keys, then hammer 5 correct keys rapidly. Repeat in Safari. Finally in DevTools run `window.speechSynthesis.speak = () => { throw new Error('x') }` and hit a correct key."
    expected: "Letters/Alphabet speak the letter name; Numbers speaks the English word ('five', not the glyph); wrong keys stay silent; under rapid input the spoken name always matches the character just pressed and never backs up into a queue. With `speak` forced to throw, the chime still plays and the game keeps running with no visible error."
    why_human: "Pronunciation, voice selection, and the Chrome/Safari getVoices/voiceschanged split cannot be asserted statically; proving chime/speech independence requires forcing one API to fail at runtime."
  - test: "Run `npm run dev`. Open Settings. Tab from '← Back' through both switches, press Space on Sound, play a round of Letters. Return to Settings, switch Sound back on and 'Reset trail on mistake' on. Hard-reload, reopen Settings, toggle Sound off/on once more, hard-reload again."
    expected: "Settings shows 'Reset trail on mistake' (off) above 'Sound' (on), identically styled, Sound's track purple with thumb right at first paint. Tab order is Back → trail switch → Sound switch, each with a focus ring. With Sound off, correct matches are completely silent (confetti/pulse/star trail unaffected). After each hard reload both switches return to their left positions; flipping one never moves the other."
    why_human: "Row alignment, opposite default rendering, tab order, and cross-reload persistence of two independent fields are rendered/stateful behaviors no static check can assert."
---

# Phase 3: Sound & Audio Settings Verification Report

**Phase Goal:** Correct matches feel and sound celebratory, with a simple parent-facing sound control
**Verified:** 2026-08-13T23:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Process Note: MVP mode goal is not in User Story format

`.planning/ROADMAP.md` marks Phase 3 `Mode: mvp`, which requires the phase goal to be in
`As a … I want to … so that ….` form. Running the User Story format guard against the actual
ROADMAP goal text confirms it is **not** valid:

```
$ gsd-tools query user-story.validate --story "Correct matches feel and sound celebratory, with a simple parent-facing sound control" --pick valid
false
```

The plan itself (`03-01-PLAN.md`, "User story framing (MVP mode)") already flagged this exact gap
and recommended running `/gsd:mvp-phase 03` before executing, which was not done. Per the MVP-mode
verification rules this would normally block a User-Flow-Coverage-style report. Because
`ROADMAP.md` supplies well-formed, directly testable Success Criteria for this phase (Step 2a),
this report proceeds with standard goal-backward verification against those Success Criteria and
the PLAN's `must_haves`, rather than refusing outright. **Recommendation:** run
`/gsd:mvp-phase 03` retroactively (or accept the ROADMAP goal as non-MVP for this phase) so future
verification runs don't need this fallback.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Correct key press plays a short, soft, two-note ascending chime in sync with confetti | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `src/audio.ts:83-93` `playChime()` uses `setValueAtTime`/`linearRampToValueAtTime`/`exponentialRampToValueAtTime`, no direct `gain.value=`; called once in `game-screen.ts:101` inside the correct-match branch, same tick as `celebrate()`. Audible quality/sync not exercised by any test. |
| 2 | Correct match speaks the target aloud (letter name / digit word) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `src/audio.ts:151-179` `speakTarget()`; `DIGIT_WORDS` maps all 10 digits (`'0':'zero'`…`'9':'nine'` confirmed); called as `speakTarget(matched)` in `game-screen.ts:102`, `matched` captured before `selectNext` reassigns `currentTarget` (`game-screen.ts:81` precedes `:94`). Pronunciation/voice-selection quality not exercised by any test. |
| 3 | Chime stays reliable across an extended session (no silent death) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Single-construction-site `AudioContext` singleton (`audio.ts:35-45`, `audioCtx = new AudioContext()` occurs exactly once), oscillator/gain nodes disconnected in `onended`. Design mitigates the failure mode but "still sounds clean after fifty-plus matches" is an empirical, audible claim no static check can confirm. |
| 4 | Settings screen shows a "Sound" row, ON by default, directly beneath "Reset trail on mistake" | ✓ VERIFIED | `src/settings.ts:65-91`: `soundRow` built after `toggleRow`, `panel.appendChild(toggleRow)` then `panel.appendChild(soundRow)` — deterministic DOM order. `soundSwitch.setAttribute('aria-checked', String(readSettings().soundEnabled))` with `DEFAULT_SETTINGS.soundEnabled = true` (`settings-store.ts:23`). |
| 5 | Switching Sound off silences chime + speech from the next correct match onward, no reload | ✓ VERIFIED (code) | Both `playChime()` and `speakTarget()` open with `if (!readSettings().soundEnabled) return` as their literal first line (`audio.ts:84`, `:152`) — no module-level caching, no closures over a stale value; every call re-reads `localStorage` synchronously via `readSettings()`. |
| 6 | Sound choice survives a full reload; flipping one toggle never resets the other | ✓ VERIFIED (code) | `settings-store.ts` persists via `localStorage.setItem`/`getItem` (browser-guaranteed durability). `settings.ts:100-104` both branches use `writeSettings({ ...readSettings(), <field>: next })` — spread-merge, never a full-replace literal; confirmed exactly 2 `writeSettings(` call sites, both merge-form, no `writeSettings({ version: 1` literal remains anywhere in the file. |
| 7 | Missing Web Audio/Speech support or a hand-edited settings record still plays the game normally, no thrown exception, no error UI | ✓ VERIFIED (code) | `readSettings()` wraps the whole read in `try/catch` (`settings-store.ts:35-49`) with per-field `typeof` defaulting for `soundEnabled` and the existing `isValid` gate for `resetTrailOnMistake`. `playChime()` and `speakTarget()` each wrap all risky calls (including `getAudioContext()`, `window.speechSynthesis` access) in a comment-only `try/catch`; no `console.*` calls exist in any of the four touched files. |
| 8 | Holding a correct key down produces exactly one chime and one spoken name | ✓ VERIFIED (code) | `game-screen.ts:69` `if (event.repeat) return` guards the entire handler before any branch executes (unchanged CORE-04 guard); `playChime()`/`speakTarget(matched)` sit only inside the correct-match branch behind that guard — confirmed exactly one `addEventListener('keydown'` registration and exactly one call site each for `playChime()`/`speakTarget(matched)`. |

**Score:** 5/8 truths verified (3 present + wired, behavior-unverified — see Human Verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/audio.ts` | New module: `playChime`, `speakTarget`, singleton AudioContext, digit-word map, voice caching | ✓ VERIFIED | Exists, exports both functions, all structural gates satisfied (see truths above). 195 lines. |
| `src/settings-store.ts` | `AppSettings.soundEnabled` (default true), per-field default resolution | ✓ VERIFIED | `soundEnabled: boolean` on interface, `soundEnabled: true` in `DEFAULT_SETTINGS`, `isValid` line unchanged (still ends at `resetTrailOnMistake` clause), per-field `typeof` resolution present. |
| `src/game-screen.ts` | Chime + speech calls in the correct-match branch | ✓ VERIFIED | `playChime()` and `speakTarget(matched)` called once each, after `addTrailStar()`, inside the existing repeat-guarded, one-listener handler. Also gained `stopSpeech()` on unmount (review fix, not originally in must_haves — additive). |
| `src/settings.ts` | Second "Sound" toggle row + merge-write persistence fix | ✓ VERIFIED | Second row built and appended in correct order; `handleClick` branches on `dataset.setting`; both persistence calls use spread-merge form; `toggle-switch` CSS class count in `style.css` unchanged at 5 (zero new CSS). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/game-screen.ts` | `src/audio.ts` | `playChime()` / `speakTarget(matched)` called from correct-match branch | ✓ WIRED | `gsd-tools query verify.key-links` reported a false "not found" (regex-escaping artifact); manually confirmed via `grep -n "playChime()" src/game-screen.ts` → line 101, `speakTarget(matched)` → line 102, both inside the correct-match branch. |
| `src/audio.ts` | `src/settings-store.ts` | `readSettings().soundEnabled` gates both exported functions | ✓ WIRED | Manually confirmed: `readSettings().soundEnabled` appears at `audio.ts:84` and `:152`, once per exported function, matching the plan's "exactly twice" acceptance criterion. Same tool false-negative as above. |
| `src/settings.ts` | `src/settings-store.ts` | `writeSettings({ ...readSettings(), soundEnabled: next })` on the Sound toggle click branch | ✓ WIRED | Tool-confirmed and manually confirmed at `settings.ts:101`. |

**Note on tooling:** `gsd-tools query verify.key-links` reported the first two links as "Pattern not found" despite the literal patterns being present in the files (confirmed by direct `grep`). This is treated as a query-tool regex-escaping defect, not evidence of missing wiring — both links are WIRED per direct source inspection.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Production build succeeds | `npm run build` | `tsc && vite build` exits 0, 19 modules transformed | ✓ PASS |
| No debug/debt markers in touched files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across `audio.ts`, `settings-store.ts`, `settings.ts`, `game-screen.ts` | No matches | ✓ PASS |
| No console logging in touched files | `grep -n "console\."` across the same 4 files | No matches | ✓ PASS |
| Audible chime / speech output | — | Requires real browser + speakers/ears | ? SKIP — routed to human verification |
| Extended-session AudioContext reliability | — | Requires 50+ real correct matches over several minutes | ? SKIP — routed to human verification |

This project deliberately has no test framework (per `.claude/CLAUDE.md`'s "What NOT to Use" — Jest/Vitest is explicitly out of scope for this hobby project), so no automated unit/integration test suite exists to enumerate or run.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUDIO-01 | 03-01-PLAN.md | A correct match plays a short celebratory chime (when sound is enabled) | ✓ SATISFIED (code); audible quality → human_needed | `playChime()` wired into correct-match branch, gated by `soundEnabled`. |
| AUDIO-02 | 03-01-PLAN.md | A correct match optionally speaks the target letter/number name aloud | ✓ SATISFIED (code); pronunciation quality → human_needed | `speakTarget(matched)` wired in, `DIGIT_WORDS` complete, letter names pass through unmapped. |
| SET-01 | 03-01-PLAN.md | Settings screen has a toggle to enable/disable sound (chime + spoken letter) | ✓ SATISFIED (code); rendering/persistence → human_needed | Sound toggle row present, default on, merge-write persistence fixed. |

No orphaned requirements: `REQUIREMENTS.md`'s traceability table maps exactly AUDIO-01, AUDIO-02, and SET-01 to Phase 3, matching `03-01-PLAN.md`'s `requirements:` frontmatter exactly.

### Anti-Patterns Found

None. Code review (`03-REVIEW.md` iteration 1, `03-REVIEW.iter2.md` final) found 0 Critical, 3 Warning (all fixed and re-verified clean in the iter2 re-review — commits `91785db`, `3637f18`, `a0f77d9`), and 2/1 Info-tier notes (intentionally left, non-blocking). Independently re-confirmed during this verification: no `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers and no `console.*` calls in any of the four phase-touched files.

## Human Verification Required

3 items needing human testing (including all 3 present-but-behavior-unverified truths — code is present and wired, but audible/perceptual/extended-runtime behavior is not exercised by any test). See frontmatter `human_verification` for full test/expected/why_human detail, harvested directly from `03-01-PLAN.md`'s per-task `<human-check>` blocks (deferred to end-of-phase per `workflow.human_verify_mode: "end-of-phase"`):

1. **Chime quality and extended-session reliability** — play Letters for 3-4 minutes / 50+ correct matches; confirm the tone is soft, click-free, syncs with the confetti, and never silently degrades.
2. **Speech pronunciation and chime/speech independence** — play all three modes in Chrome and Safari; confirm correct letter/digit-word pronunciation, no lag under rapid input, and that forcing `speechSynthesis.speak` to throw still leaves the chime working.
3. **Settings toggle rendering, tab order, and persistence** — confirm row alignment, opposite default states, keyboard tab order, and that both toggles survive a hard reload without clobbering each other.

## Gaps Summary

No structural gaps. Every artifact, key link, and requirement ID checks out against the codebase:
`npm run build` passes clean, the two-round code review (initial + re-review) found and fixed all
three Warning-tier issues with no regressions, and all three requirement IDs (AUDIO-01, AUDIO-02,
SET-01) trace cleanly from `REQUIREMENTS.md` through the plan to working, wired code. The phase is
not blocked — it is gated on human perceptual verification (audio quality, pronunciation, extended
session reliability, and visual/tab-order confirmation) that no static check can perform, exactly as
`03-01-SUMMARY.md`'s own "Human Verification Deferred" section already flagged. Separately, the
MVP-mode goal-format mismatch noted above should be resolved for cleanliness but does not indicate
missing or broken functionality.

---

*Verified: 2026-08-13T23:45:00Z*
*Verifier: Claude (gsd-verifier)*

---
phase: 03-sound-audio-settings
plan: 01
subsystem: audio-ui
tags: [web-audio-api, web-speech-api, localstorage, settings, vanilla-ts]

# Dependency graph
requires:
  - phase: 02.1-progression-trail-celebration-polish
    provides: "src/settings-store.ts (AppSettings/readSettings/writeSettings), src/settings.ts (toggle-row markup pattern), src/game-screen.ts correct-match branch"
provides:
  - "src/audio.ts: playChime() (synthesized two-note Web Audio chime) and speakTarget(character) (Web Speech spoken target name)"
  - "AppSettings.soundEnabled (default true), resolved via per-field default so pre-Phase-3 records still load"
  - "Sound toggle row on the Settings screen, default on"
  - "Merge-write fix for every writeSettings() call site in the codebase"
affects: [04-statistics-settings]

# Actuals (#2632)
actuals:
  tokens: 3732
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "audio.ts: lazy-singleton AudioContext, resumed (never re-constructed) on every call"
    - "Envelope shaping exclusively via AudioParam scheduling (setValueAtTime/linearRampToValueAtTime/exponentialRampToValueAtTime), never direct gain.value assignment"
    - "Dual voice-caching (synchronous getVoices() + one-time voiceschanged listener) to cover Chrome's async load and Firefox/Safari's synchronous load"
    - "dataset.setting attribute dispatch for a shared delegated click handler across multiple toggle rows, branched via explicit if/else, never a computed object key"
    - "Merge-write persistence: writeSettings({ ...readSettings(), field: next }) at every call site, never a full-replace literal"

key-files:
  created:
    - src/audio.ts
  modified:
    - src/settings-store.ts
    - src/settings.ts
    - src/game-screen.ts

key-decisions:
  - "One audio.ts module, two independent exported functions (playChime, speakTarget) sharing nothing but the file — no shared queue/state/sequencing, so a failure in one can never suppress the other"
  - "soundEnabled resolved via its own typeof check outside the existing all-or-nothing isValid check, so a Phase 2.1 record with no soundEnabled field still loads with sound defaulting on"
  - "Toggle dispatch keyed on dataset.setting, branched with an explicit if/else naming both fields literally — not an aria-label string comparison and not a computed object key"

patterns-established:
  - "Silent-degrade audio: every Web Audio/Web Speech call wrapped in try with a comment-only catch, matching clipboard.ts/celebrate.ts precedent — no logging anywhere"
  - "Digit-to-word pronunciation lookup (DIGIT_WORDS) owned by audio.ts, not game.ts, since game.ts owns character pools and audio.ts owns pronunciation"

requirements-completed: [AUDIO-01, AUDIO-02, SET-01]

coverage:
  - id: D1
    description: "A correct key press plays a short, soft, two-note ascending chime through a single reused AudioContext, gated by the persisted soundEnabled setting"
    requirement: AUDIO-01
    verification:
      - kind: other
        ref: "npm run build && grep-based structural checks in 03-01-PLAN.md Task 1 <verify><automated> (all passed)"
        status: pass
    human_judgment: true
    rationale: "Tone quality, absence of envelope clicks, and the 'works for a while then silently dies' AudioContext-exhaustion failure mode are audible-only and cannot be asserted statically. Deferred to end-of-phase UAT per workflow.human_verify_mode=end-of-phase; the plan's own <human-check> block documents the exact manual test."
  - id: D2
    description: "A correct match speaks the target letter name (Letters/Alphabet) or digit word (Numbers) through a freshly constructed SpeechSynthesisUtterance, independent of the chime"
    requirement: AUDIO-02
    verification:
      - kind: other
        ref: "npm run build && grep-based structural checks in 03-01-PLAN.md Task 2 <verify><automated> (all passed)"
        status: pass
    human_judgment: true
    rationale: "Pronunciation quality, voice selection, and the getVoices/voiceschanged engine split differ across Chrome/Safari and require forcing speechSynthesis.speak to throw at runtime to prove chime/speech independence — none of this is statically assertable. Deferred to end-of-phase UAT; the plan's <human-check> block documents the exact manual test."
  - id: D3
    description: "Settings screen shows a second 'Sound' toggle row, default on, that silences chime and speech immediately with no reload, persists across reloads, and cannot clobber the trail-reset toggle's persisted value (or vice versa)"
    requirement: SET-01
    verification:
      - kind: other
        ref: "npm run build && grep-based structural checks in 03-01-PLAN.md Task 3 <verify><automated> (all passed)"
        status: pass
    human_judgment: true
    rationale: "Row alignment against the shipped row, opposite default rendering, tab order, and cross-reload persistence of two independent fields are rendered/stateful behaviors no static check can assert. Deferred to end-of-phase UAT; the plan's <human-check> block documents the exact manual test."

duration: 40min
completed: 2026-08-14
status: complete
---

# Phase 3 Plan 1: Sound & Audio Settings Summary

**Synthesized Web Audio chime + Web Speech spoken target on every correct match, plus a Settings "Sound" toggle that fixes a pre-existing settings-clobbering bug.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-14T05:40:00Z (approx.)
- **Completed:** 2026-08-14T06:22:31Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- A correct key press now plays a short, soft, two-note ascending chime (E5 → B5, ~285ms) synthesized entirely with `OscillatorNode`/`GainNode`, through one lazily-created, reused `AudioContext`
- The same correct match speaks the matched character aloud — letter name in Letters/Alphabet, English digit word ("five", not the bare glyph) in Numbers — via a freshly constructed `SpeechSynthesisUtterance`, independent of the chime
- Settings screen now has a second "Sound" toggle row, default ON, that silences both the chime and speech from the very next correct match with no reload
- Fixed a pre-existing bug: `writeSettings()` was a full-replace call that would have silently clobbered whichever sibling field existed the moment `AppSettings` grew a second field — every call site now merges the current record first

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end chime — a correct key press makes a sound** - `4fb9f4c` (feat)
2. **Task 2: The target speaks its own name on a correct match** - `a5f900e` (feat)
3. **Task 3: Sound toggle on the Settings screen, and the merge-write fix it exposes** - `a1427bb` (feat)

## Files Created/Modified
- `src/audio.ts` (NEW) - Lazy-singleton `AudioContext`, `playChime()` (two-note synthesized chime with `AudioParam`-scheduled envelope), voice caching (`primeVoices()`), `DIGIT_WORDS` lookup, `speakTarget(character)` (independent, freshly-constructed-utterance speech)
- `src/settings-store.ts` - `AppSettings` gains `soundEnabled: boolean` (default `true`), resolved via its own per-field `typeof` default so a pre-Phase-3 record still loads
- `src/game-screen.ts` - `playChime()` and `speakTarget(matched)` called in the existing correct-match branch, with `matched` captured before `selectNext` reassigns `currentTarget`
- `src/settings.ts` - Second "Sound" toggle row (reuses all existing CSS classes, zero new rules); `handleClick` now branches on `dataset.setting`; both persistence branches use the spread-merge write form

## Decisions Made
- One `audio.ts` module, two fully independent exported functions (`playChime`, `speakTarget`) — no shared queue, state, or sequencing, per the plan's explicit "a speech failure must never suppress the chime and vice versa" requirement
- `soundEnabled`'s validity check lives outside the existing all-or-nothing `isValid` expression (left byte-for-byte as originally written) so a `{resetTrailOnMistake}`-only record from Phase 2.1 keeps loading correctly with sound defaulting on
- Toggle dispatch in `settings.ts` keyed on `dataset.setting`, branched with a literal if/else (never a DOM-sourced computed object key), per the plan's T-03-03 tampering mitigation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied the trail-toggle half of the merge-write fix inside Task 1, ahead of Task 3**
- **Found during:** Task 1 (`npm run build` verification)
- **Issue:** Making `soundEnabled` a required field on `AppSettings` (per Task 1's own action) broke type-checking on the pre-existing `writeSettings({ version: 1, resetTrailOnMistake: next } satisfies AppSettings)` call in `settings.ts` — a file outside Task 1's declared `<files>` scope but whose compile failure blocked Task 1's own `npm run build` verification gate.
- **Fix:** Converted that one call site to `writeSettings({ ...readSettings(), resetTrailOnMistake: next } satisfies AppSettings)` — the exact merge-write correction Task 3 was already going to make. Task 3 then added the second (`soundEnabled`) branch and the full toggle row on top of this, as planned; no rework was needed.
- **Files modified:** `src/settings.ts`
- **Verification:** `npm run build` exits 0 after Task 1's commit; Task 3's own acceptance checks (exactly two `writeSettings(` call sites, both spread-merge form, no full-replace literal) still pass identically at the end of the plan.
- **Committed in:** `4fb9f4c` (Task 1 commit)

**2. [Rule 1 - Bug] Two `<verify>` grep assertions initially failed because explanatory doc comments contained the literal forbidden strings**
- **Found during:** Task 1 and Task 2 verification runs
- **Issue:** `audio.ts`'s module doc comment explained *why* no `prefers-reduced-motion` media query is used, and separately explained the `soundEnabled` re-read convention using the literal `readSettings().soundEnabled` phrase — both of which tripped the plan's own negative/exact-count grep assertions (`! grep -q 'prefers-reduced-motion'`, and a `-eq 2` count on `readSettings().soundEnabled`) meant to catch code, not prose.
- **Fix:** Reworded both comment passages to convey the same meaning without the exact literal string (e.g. "reduced-motion media-query guard" instead of the media-query string; "the persisted sound-enabled setting re-read fresh" instead of the code expression).
- **Files modified:** `src/audio.ts`
- **Verification:** All automated `<verify>` grep assertions for both tasks pass; `npm run build` unaffected.
- **Committed in:** `4fb9f4c` (Task 1 commit), `a5f900e` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug-in-verification-authoring)
**Impact on plan:** Both were required to satisfy the plan's own verification gates; no scope creep beyond what Task 3 was already going to build.

## Issues Encountered
None beyond the deviations above.

## Human Verification Deferred

Per `.planning/config.json`'s `workflow.human_verify_mode: "end-of-phase"`, this plan was authored with all human-check content embedded in each task's `<verify><human-check>` block rather than as standalone `checkpoint:human-verify` tasks (confirmed via `~/.claude/gsd-core/references/checkpoints.md`'s #3309 default-mode description). No manual audio/browser verification was performed during this execution — see `coverage` entries D1-D3 above, each of which restates its task's exact `<human-check>` test/expected/why-human content for the phase-end verifier to harvest into `03-UAT.md`. In particular, the extended-session chime-reliability check (fifty-plus correct matches) and the cross-browser (Chrome + Safari) speech pronunciation/independence check from Tasks 1 and 2 are both still outstanding and should not be treated as validated by this SUMMARY alone.

## User Setup Required

None - no external service configuration required. No new npm package was added (Web Audio and Web Speech are browser globals already covered by `tsconfig.json`'s `"lib": ["ES2023", "DOM"]`).

## Next Phase Readiness
- `AppSettings` now carries two fields (`resetTrailOnMistake`, `soundEnabled`) with a working merge-write pattern any Phase 4 stats-preference field can extend safely
- The Settings panel's toggle-row DOM/CSS pattern is proven twice over and ready for a third row if Phase 4 needs one
- Blocker: the three `<human-check>` items above (chime extended-session reliability, cross-browser speech behavior, and Settings toggle rendering/persistence) need a real manual pass — recommended before or during `/gsd:verify-work 03`

## Self-Check: PASSED

- FOUND: src/audio.ts
- FOUND: .planning/phases/03-sound-audio-settings/03-01-SUMMARY.md
- FOUND: 4fb9f4c (feat(03-01): end-to-end correct-match chime via synthesized Web Audio)
- FOUND: a5f900e (feat(03-01): speak the matched target on every correct key press)
- FOUND: a1427bb (feat(03-01): Sound toggle row on Settings screen)

---
*Phase: 03-sound-audio-settings*
*Completed: 2026-08-14*

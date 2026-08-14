# Phase 3: Sound & Audio Settings - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — self-accepted recommended defaults (user was mid-task on Phase
2.1's review-fix and asked to keep moving rather than block; all decisions below are grounded in
CLAUDE.md's tech stack guidance and this codebase's own established patterns, and are fully
revisable before/during execution).

<domain>
## Phase Boundary

Correct matches feel and sound celebratory: a short chime plays, the target letter/number is
optionally spoken aloud, and a parent-facing Settings toggle controls both together
(AUDIO-01, AUDIO-02, SET-01).

</domain>

<decisions>
## Implementation Decisions

### Chime Sound
- **Synthesized via Web Audio API, not an audio file asset.** No `.mp3`/`.wav` exists anywhere in
  this repo (confirmed by search), and CLAUDE.md's `new Audio('/chime.mp3').play()` pattern
  assumes an asset that would need to be sourced/licensed — out of scope for this phase. A short
  two-note soft ascending tone built from `OscillatorNode` + `GainNode` (with a fast attack/decay
  envelope to avoid clicks) needs zero external assets, zero licensing, and is trivially tunable
  to match the muted/pearlescent, non-overwhelming-for-a-toddler aesthetic.
- **Fires at the same call site as the existing confetti celebration** — the correct-match branch
  in `game-screen.ts` — not before or after it, so chime and burst always feel simultaneous.
- **`AudioContext` created/resumed lazily** on the first sound-enabled correct match, not eagerly
  at page load — `AudioContext` typically starts `suspended` until a genuine user gesture, and this
  app's first correct match is already gated behind a physical keypress, so no extra unlock
  interaction is needed.

### Spoken Letter/Number (Web Speech API)
- **Fire-and-forget, parallel to the chime and confetti** — speech never blocks or delays the next
  target selection.
- **Default browser voice for the page language**, no voice-picker UI. Cache `getVoices()` after
  the `voiceschanged` event fires once at startup, per CLAUDE.md's documented Safari/iOS caveat
  (empty array on first synchronous call).
- **What's spoken:** the letter name for Letters/Alphabet modes (e.g. "A"), the digit name for
  Numbers mode (e.g. "five"). Default rate/pitch — no custom tuning.
- **`speechSynthesis.cancel()` before every new utterance** so rapid correct matches never queue
  up speech that falls behind the current on-screen target.

### Sound Toggle & Settings Integration
- **Extends the existing `AppSettings` interface** (`src/settings-store.ts`) with
  `soundEnabled: boolean`, staying at `version: 1` — the shape-check gains a per-field default
  (missing/invalid `soundEnabled` resolves to the default rather than invalidating the whole
  record), so an existing persisted `{resetTrailOnMistake}` record from Phase 2.1 still loads
  cleanly with sound defaulting on.
- **Default: `soundEnabled: true` (ON by default)** — unlike Phase 2.1's trail-reset toggle
  (which defaults off because it's a destructive-ish behavior change), sound directly reinforces
  this project's Core Value ("every correct physical key press produces an immediate, delightful,
  low-stakes celebration... that instant feedback loop is what teaches the letter/key
  association") — the celebratory sound should be present by default, not opt-in. The chime is
  short and soft by design (see below), so it stays additive to the existing muted celebration
  rather than overwhelming it.
- **One combined toggle controls both chime and speech** — matching SET-01's literal wording
  ("toggle to enable/disable sound (chime + spoken letter)"), not two separate toggles.
- **Reuses the exact toggle-switch visual/markup pattern** already built in `settings.ts`/
  `style.css` for the trail-reset toggle — a second `.toggle-row` beneath the existing one, same
  `role="switch"` button shape. This was explicitly flagged as the intended reuse target in
  `02.1-UI-SPEC.md`'s assumption 5.
- **Fixes the existing full-replace write pattern.** `settings.ts`'s current
  `writeSettings({ version: 1, resetTrailOnMistake: next })` call clobbers other fields — this
  phase must change every `writeSettings(...)` call site to merge
  (`writeSettings({ ...readSettings(), soundEnabled: next })` and the equivalent for the existing
  trail toggle) so toggling one setting never resets the other to its default.

### Audio Failure Handling & Edge Cases
- **Silent degrade on any audio failure** — `AudioContext` construction throwing, oscillator
  scheduling failing, `speechSynthesis` being undefined, or `speak()` throwing all fail silently
  with no error UI, matching `clipboard.ts`'s and `celebrate.ts`'s established
  "decorative/utility failures fail silently" precedent.
- **Chime and speech are independent** — a speech failure must never suppress the chime, and vice
  versa.
- **`prefers-reduced-motion` has no bearing on sound** — motion and audio are separate
  accessibility axes; sound is gated solely by the `soundEnabled` toggle.
- **No new key-repeat guard needed** — the existing `event.repeat` guard in `game-screen.ts`
  already prevents duplicate celebrations (confetti) on a held key; chime/speech piggyback on the
  same already-guarded correct-match branch.

### Claude's Discretion
- Exact oscillator frequencies/envelope timing for the chime, within "short, soft, celebratory,
  matches the muted jewel-tone/dark-pearlescent aesthetic."
- Exact gain level for the chime (should read as a gentle accent, not loud).
- Internal module naming/file layout for the audio code (e.g. whether chime + speech live in one
  new `audio.ts` module or are split).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/settings-store.ts` — versioned `AppSettings` interface (`{ version: 1, resetTrailOnMistake:
  boolean }`), `readSettings()`/`writeSettings()` with shape-checked reads and silent-fail writes.
  This phase extends the interface, not replaces it — the file's own doc comment already says
  "Phase 3's sound toggle... extend on the same record and the same key."
- `src/settings.ts` — `mountSettingsScreen()`/`unmountSettingsScreen()`, delegated click listener,
  document-level Escape listener, `.toggle-row`/`.toggle-switch`/`.toggle-switch__thumb` DOM
  construction idiom (all via `document.createElement` + `textContent`, never `innerHTML`).
- `src/celebrate.ts` — the single `fireBurst()` chokepoint pattern (one function every celebration
  call routes through) is the model to follow for however chime/speech get centralized.
- `src/game-screen.ts` — the correct-match branch (where `celebrate()`/`celebrateAlphabetComplete()`
  and `addTrailStar()` are already called) is where the new sound calls join.

### Established Patterns
- Silent-degrade-on-failure for all decorative/utility code (`clipboard.ts`, `celebrate.ts`,
  `settings-store.ts`) — no error UI anywhere in this codebase for non-critical failures.
- `textContent`-only DOM construction, never `innerHTML`, codebase-wide invariant.
- Reduced-motion guard pattern (`window.matchMedia('(prefers-reduced-motion: reduce)')`) — NOT
  applicable to audio, noted above to prevent the planner/executor from incorrectly reusing it.

### Integration Points
- `game-screen.ts`'s correct-match branch (chime + speech trigger point).
- `settings-store.ts`'s `AppSettings` interface and both `readSettings()`/`writeSettings()`
  call sites across `settings.ts` and `game-screen.ts` (the trail-reset gate already reads
  settings there too).
- `settings.ts`'s toggle-row rendering (second toggle row + its own click-dispatch branch).

</code_context>

<specifics>
## Specific Ideas

- None beyond the ROADMAP's own success criteria — no specific chime/voice references were given.

</specifics>

<deferred>
## Deferred Ideas

- Voice selection UI (choosing among available system voices) — out of scope, default voice only.
- Volume slider / granular audio mixing — out of scope, binary on/off toggle only per SET-01.
- Any Statistics-screen or reset-stats work — Phase 4 territory (SET-02).

</deferred>

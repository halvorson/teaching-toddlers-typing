# Phase 3: Sound & Audio Settings - Research

**Researched:** 2026-08-14
**Domain:** Web Audio API (synthesized chime), Web Speech API (spoken letter/number), localStorage settings-record extension
**Confidence:** HIGH (in-repo patterns, verified this session) / MEDIUM (browser API behavior, MDN-grounded) / LOW (undocumented browser quirks, flagged explicitly)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chime Sound**
- Synthesized via Web Audio API, not an audio file asset. No `.mp3`/`.wav` exists anywhere in
  this repo (confirmed by search), and CLAUDE.md's `new Audio('/chime.mp3').play()` pattern
  assumes an asset that would need to be sourced/licensed — out of scope for this phase. A short
  two-note soft ascending tone built from `OscillatorNode` + `GainNode` (with a fast attack/decay
  envelope to avoid clicks) needs zero external assets, zero licensing, and is trivially tunable
  to match the muted/pearlescent, non-overwhelming-for-a-toddler aesthetic.
- Fires at the same call site as the existing confetti celebration — the correct-match branch
  in `game-screen.ts` — not before or after it, so chime and burst always feel simultaneous.
- `AudioContext` created/resumed lazily on the first sound-enabled correct match, not eagerly
  at page load — `AudioContext` typically starts `suspended` until a genuine user gesture, and this
  app's first correct match is already gated behind a physical keypress, so no extra unlock
  interaction is needed.

**Spoken Letter/Number (Web Speech API)**
- Fire-and-forget, parallel to the chime and confetti — speech never blocks or delays the next
  target selection.
- Default browser voice for the page language, no voice-picker UI. Cache `getVoices()` after
  the `voiceschanged` event fires once at startup, per CLAUDE.md's documented Safari/iOS caveat
  (empty array on first synchronous call).
- What's spoken: the letter name for Letters/Alphabet modes (e.g. "A"), the digit name for
  Numbers mode (e.g. "five"). Default rate/pitch — no custom tuning.
- `speechSynthesis.cancel()` before every new utterance so rapid correct matches never queue
  up speech that falls behind the current on-screen target.

**Sound Toggle & Settings Integration**
- Extends the existing `AppSettings` interface (`src/settings-store.ts`) with
  `soundEnabled: boolean`, staying at `version: 1` — the shape-check gains a per-field default
  (missing/invalid `soundEnabled` resolves to the default rather than invalidating the whole
  record), so an existing persisted `{resetTrailOnMistake}` record from Phase 2.1 still loads
  cleanly with sound defaulting on.
- Default: `soundEnabled: true` (ON by default) — unlike Phase 2.1's trail-reset toggle
  (which defaults off because it's a destructive-ish behavior change), sound directly reinforces
  this project's Core Value. The chime is short and soft by design, so it stays additive to the
  existing muted celebration rather than overwhelming it.
- One combined toggle controls both chime and speech — matching SET-01's literal wording, not
  two separate toggles.
- Reuses the exact toggle-switch visual/markup pattern already built in `settings.ts`/
  `style.css` for the trail-reset toggle — a second `.toggle-row` beneath the existing one, same
  `role="switch"` button shape.
- Fixes the existing full-replace write pattern. `settings.ts`'s current
  `writeSettings({ version: 1, resetTrailOnMistake: next })` call clobbers other fields — this
  phase must change every `writeSettings(...)` call site to merge
  (`writeSettings({ ...readSettings(), soundEnabled: next })` and the equivalent for the existing
  trail toggle) so toggling one setting never resets the other to its default.

**Audio Failure Handling & Edge Cases**
- Silent degrade on any audio failure — `AudioContext` construction throwing, oscillator
  scheduling failing, `speechSynthesis` being undefined, or `speak()` throwing all fail silently
  with no error UI, matching `clipboard.ts`'s and `celebrate.ts`'s established
  "decorative/utility failures fail silently" precedent.
- Chime and speech are independent — a speech failure must never suppress the chime, and vice
  versa.
- `prefers-reduced-motion` has no bearing on sound — motion and audio are separate
  accessibility axes; sound is gated solely by the `soundEnabled` toggle.
- No new key-repeat guard needed — the existing `event.repeat` guard in `game-screen.ts`
  already prevents duplicate celebrations (confetti) on a held key; chime/speech piggyback on the
  same already-guarded correct-match branch.

### Claude's Discretion
- Exact oscillator frequencies/envelope timing for the chime, within "short, soft, celebratory,
  matches the muted jewel-tone/dark-pearlescent aesthetic."
- Exact gain level for the chime (should read as a gentle accent, not loud).
- Internal module naming/file layout for the audio code (e.g. whether chime + speech live in one
  new `audio.ts` module or are split).

### Deferred Ideas (OUT OF SCOPE)
- Voice selection UI (choosing among available system voices) — out of scope, default voice only.
- Volume slider / granular audio mixing — out of scope, binary on/off toggle only per SET-01.
- Any Statistics-screen or reset-stats work — Phase 4 territory (SET-02).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIO-01 | A correct match plays a short celebratory chime (when sound is enabled) | Web Audio API `OscillatorNode`+`GainNode` synthesis pattern (Code Examples), AudioContext lazy-create/reuse pattern (Pitfall 1), gain-envelope-without-clicks pattern (Pitfall 2) |
| AUDIO-02 | A correct match optionally speaks the target letter/number name aloud (when sound is enabled) | Web Speech API `SpeechSynthesisUtterance` pattern (Code Examples), `getVoices()`/`voiceschanged` caching pattern (Pitfall 3), `cancel()`-before-`speak()` known quirk (Pitfall 4), digit word-mapping (Pitfall 6) |
| SET-01 | Settings screen has a toggle to enable/disable sound (chime + spoken letter) | Exact `AppSettings` extension shape (verified `settings-store.ts:14-19`), merge-write fix (verified single call site `settings.ts:71`), toggle-row markup reuse (verified `style.css:338-388`) |
</phase_requirements>

## Summary

Phase 3 is almost entirely new-module work (`OscillatorNode`/`GainNode` chime synthesis,
`SpeechSynthesisUtterance` playback) wired into one existing call site (`game-screen.ts`'s
correct-match branch), plus a small, well-scoped extension of an already-established settings
pattern (`AppSettings` in `settings-store.ts`, toggle-row markup in `settings.ts`/`style.css`).
No new npm packages are needed — both `AudioContext`/`OscillatorNode`/`GainNode` (Web Audio API)
and `speechSynthesis`/`SpeechSynthesisUtterance` (Web Speech API) are browser globals already
covered by this project's `tsconfig.json` (`"lib": ["ES2023", "DOM"]`, verified this session) —
so the Package Legitimacy Audit below has nothing to check.

The two APIs have real, well-documented gotchas that matter for a toddler-facing app that fires
audio on every single correct keypress: (1) `AudioContext` must be created **once** and reused —
browsers cap the number of live contexts a page may hold, and gain values must be scheduled via
`AudioParam` methods (never set directly) to avoid audible clicks; (2) `speechSynthesis.getVoices()`
is asynchronous in Chrome but synchronous in Firefox/Safari, and the `voiceschanged` event that
CLAUDE.md's guidance leans on does not reliably fire in Firefox/Safari — so "listen once for
voiceschanged and cache" must be paired with an immediate synchronous `getVoices()` call at
startup, not used alone; (3) there is a known, still-open cross-browser quirk where
`cancel()` immediately followed by `speak()` can silently drop the new utterance on some
browser/OS combinations — CONTEXT.md's locked "silent degrade on any audio failure" already
absorbs this risk, but it is worth flagging explicitly because it can look like a bug during
manual QA rather than an accepted browser limitation.

The settings-side work is low-risk and precisely scoped: `AppSettings` currently has exactly one
field (`resetTrailOnMistake: boolean`) and exactly one `writeSettings()` call site
(`settings.ts:71`), both verified by reading the files this session — extending the interface and
fixing the full-replace write bug touches a small, well-understood surface.

**Primary recommendation:** Build one new module (e.g. `src/audio.ts`) that owns a single
module-level `AudioContext` singleton and exposes two independent, silently-failing functions —
`playChime()` and `speakTarget(text: string)` — each internally gated on
`readSettings().soundEnabled`, called side-by-side (not sequentially-dependent) from
`game-screen.ts`'s existing correct-match branch, mirroring `celebrate.ts`'s
single-chokepoint-function pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chime synthesis (AUDIO-01) | Browser / Client | — | `AudioContext`/`OscillatorNode`/`GainNode` are browser-only APIs; this is a fully static app with no server tier at all |
| Spoken letter/number (AUDIO-02) | Browser / Client | — | `speechSynthesis` is a browser-only global; no backend involvement possible or needed |
| Sound toggle persistence (SET-01) | Browser / Client | — | `localStorage` via the existing `settings-store.ts`, same tier as the trail-reset toggle it extends |
| Sound toggle UI (SET-01) | Browser / Client | — | Hand-rolled DOM in `settings.ts`, same tier/pattern as every other screen in this app |

There is no CDN/Static, Frontend-Server-SSR, API/Backend, or Database/Storage tier anywhere in
this project (fully static GitHub Pages deploy, confirmed by CLAUDE.md's constraints and by the
absence of any server code in `src/`) — every capability in this phase lives entirely in the
Browser/Client tier.

## Project Constraints (from CLAUDE.md)

- **No new runtime dependency for audio.** CLAUDE.md's own Supporting Libraries table lists
  `HTMLAudioElement` for a chime *asset* (`new Audio('/chime.mp3').play()`), but CONTEXT.md has
  already locked the synthesized-tone approach instead (no asset exists in the repo). Do not
  introduce `HTMLAudioElement`/an audio file this phase — that would contradict the locked
  decision, not just the CLAUDE.md default.
- **`SpeechSynthesisUtterance` gesture requirement is already satisfied.** CLAUDE.md: "some
  browsers (notably Safari/iOS) only allow speech synthesis after a genuine user gesture — this
  project already requires a keypress to trigger it, so that's naturally satisfied." No extra
  unlock UI is needed or should be built.
- **`getVoices()` caching pattern is mandated, not optional.** CLAUDE.md: "`speechSynthesis.getVoices()`
  can return `[]` on first call — listen for the `voiceschanged` event once at startup and cache
  the voice list." (See Pitfall 3 below for the necessary refinement: pair this with an immediate
  synchronous call too, because `voiceschanged` does not fire in every browser this app targets.)
- **Howler.js / Web Audio "mixing graph" complexity is explicitly out of scope.** CLAUDE.md's
  "What NOT to Use" table forbids Howler.js/Tone.js for this exact reason — "one chime, optionally
  one spoken word, never overlapping in a meaningful way." Do not build a mixer, a sound-queue
  manager, or a multi-voice pool.
- **No test framework.** CLAUDE.md explicitly excludes Jest/Vitest/Cypress/Playwright for v1;
  verification is `npm run build` (type-check + bundle) plus manual QA, unchanged from Phases 1–2.1.
- **`textContent`-only DOM construction, codebase-wide invariant** — applies to the new Settings
  toggle row's label exactly as it did to the trail-reset row (verified `settings.ts:41-43`).
- **Silent-degrade-on-failure for all decorative/utility code** — CONTEXT.md's Audio Failure
  Handling section directly extends this existing codebase convention (`clipboard.ts`,
  `celebrate.ts`, `settings-store.ts`), not a new pattern being introduced.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) | Browser built-in, no version | Synthesized celebratory chime | Zero-install, zero-licensing tone synthesis; already the CONTEXT.md-locked approach. Fully typed by `tsconfig.json`'s `"lib": ["ES2023", "DOM"]` [VERIFIED: tsconfig.json:5] — no `@types` package needed. |
| Web Speech API (`speechSynthesis`, `SpeechSynthesisUtterance`) | Browser built-in, no version | Spoken target letter/number | Already CLAUDE.md's documented recommendation for this exact feature; no install, already typed by the same `"DOM"` lib entry. |

No supporting libraries are needed this phase — everything is a browser global.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synthesized `OscillatorNode` chime | `HTMLAudioElement` + a sourced `.mp3`/`.wav` asset | CLAUDE.md's originally-recommended approach, but requires sourcing/licensing an audio asset — CONTEXT.md explicitly rejected this for Phase 3 since no asset exists in the repo. Revisit only if a licensed asset becomes available later. |
| Hand-rolled envelope via `AudioParam` scheduling | A tiny synth helper library (e.g. Tone.js) | Massive overkill for "one two-note chime" — CLAUDE.md's "What NOT to Use" table already forbids Tone.js for this exact reason. |

**Installation:** None — both APIs are browser globals already available under the existing
`tsconfig.json` DOM lib target. No `npm install` step this phase.

**Version verification:** Not applicable — no npm packages are being added or upgraded this
phase. `npm view` / registry checks were not run because there is nothing to check.

## Package Legitimacy Audit

**Not applicable this phase.** No new external packages are introduced — Web Audio API and Web
Speech API are native browser globals, not npm dependencies. `package.json`'s `dependencies`
(`canvas-confetti@1.9.4`) and `devDependencies` are unchanged by this phase's scope.

**Packages removed due to [SLOP] verdict:** none (none evaluated — none proposed).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
Physical keydown
      │
      ▼
game-screen.ts keydown handler (existing, event.repeat-guarded)
      │
      ├─ event.code matches acceptableCodes(currentTarget, mode)? ──No──▶ incorrect-flash branch (unchanged)
      │
     Yes
      │
      ▼
Correct-match branch (existing call site, game-screen.ts)
      │
      ├──▶ celebrate(anchor) / celebrateAlphabetComplete()   [existing, unchanged]
      ├──▶ addTrailStar()                                     [existing, unchanged]
      │
      ├──▶ playChime()            [NEW — audio.ts]
      │        │
      │        ├─ readSettings().soundEnabled === false? ──▶ no-op, return
      │        │
      │        ▼
      │    getAudioContext() — lazy singleton, resume() if suspended
      │        │
      │        ▼
      │    new OscillatorNode + GainNode, scheduled envelope, start()/stop()
      │        │
      │        └─ any throw ──▶ caught, swallowed (silent degrade)
      │
      └──▶ speakTarget(spokenText)  [NEW — audio.ts]
               │
               ├─ readSettings().soundEnabled === false? ──▶ no-op, return
               │
               ▼
           speechSynthesis.cancel()
               │
               ▼
           new SpeechSynthesisUtterance(spokenText), voice = cached default
               │
               ▼
           speechSynthesis.speak(utterance)
               │
               └─ any throw / speechSynthesis undefined ──▶ caught, swallowed (silent degrade)

Settings screen (settings.ts)
      │
      ├─ mount: reads readSettings().soundEnabled for new toggle's initial aria-checked
      │
      └─ click on new "Sound" toggle-switch
               │
               ▼
         writeSettings({ ...readSettings(), soundEnabled: next })   [merge write — fixes existing bug]
```

`playChime()` and `speakTarget()` are independent, parallel calls from the same branch — neither
awaits nor blocks the other, and neither blocks `selectNext()`/`renderTarget()` (matching
CONTEXT.md's "fire-and-forget" / "never delays the next target selection" decisions).

### Recommended Project Structure
```
src/
├── audio.ts          # NEW — module-level AudioContext singleton, playChime(), speakTarget(),
│                      #       cached-voice lookup, all soundEnabled-gating and silent-degrade logic
├── settings-store.ts # EXTENDED — AppSettings gains soundEnabled: boolean
├── settings.ts        # EXTENDED — second toggle row + merge-write fix on both call sites
├── game-screen.ts     # EXTENDED — two new calls added to the existing correct-match branch
├── celebrate.ts        # unchanged — model for audio.ts's chokepoint-function shape
├── style.css           # unchanged — zero new CSS rules (toggle row reuses existing classes)
```

### Pattern 1: Single `AudioContext` singleton, created lazily, reused for every chime
**What:** One module-level `let audioCtx: AudioContext | null = null` inside `audio.ts`, created
on first `playChime()` call and reused (resumed if suspended) on every subsequent call — never
constructed per-chime.
**When to use:** Always, for this feature. Browsers impose a practical/hard limit on the number
of live `AudioContext` instances a page may hold (Chrome historically hard-limits at 6; other
engines throttle or degrade); creating a new context per correct-match keypress would exhaust
this within seconds of normal toddler play. `OscillatorNode`/`GainNode` **are** cheap to create
per-play (they are one-shot, `start()`-once nodes) — only the `AudioContext` itself must be a
singleton.
**Example:**
```typescript
// Pattern synthesized from MDN's AudioContext/OscillatorNode/GainNode docs
// [CITED: developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume]
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume() // fire-and-forget; already inside a user-gesture-triggered keydown handler
  }
  return audioCtx
}
```

### Pattern 2: Gain envelope via `AudioParam` scheduling, never direct assignment
**What:** Attack/decay shaping uses `gainNode.gain.setValueAtTime(...)` +
`gainNode.gain.linearRampToValueAtTime(...)` (or `exponentialRampToValueAtTime`), never
`gainNode.gain.value = x` for anything but the initial silent starting point.
**When to use:** Every envelope-shaped gain change in `playChime()`.
**Example:**
```typescript
// [CITED: developer.mozilla.org/en-US/docs/Web/API/GainNode, web search cross-referenced against MDN AudioParam docs]
function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)

  const attack = 0.02
  const decay = duration - attack
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.15, startTime + attack) // gentle accent gain, not loud
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay) // exponential ramp can't target exactly 0

  osc.start(startTime)
  osc.stop(startTime + duration)
}
```

### Pattern 3: Merge-write for `writeSettings()`, at every call site
**What:** Every `writeSettings(...)` call spreads the current `readSettings()` result before
overriding the one field being changed, instead of constructing a fresh partial record.
**When to use:** Both the existing trail-reset toggle's click handler and the new Sound toggle's
click handler in `settings.ts`.
**Example — the exact call site being fixed** [VERIFIED: src/settings.ts:71]:
```typescript
// BEFORE (bug — clobbers soundEnabled once it exists):
writeSettings({ version: 1, resetTrailOnMistake: next } satisfies AppSettings)

// AFTER (merge — this phase's fix, applied to both toggles' handlers):
writeSettings({ ...readSettings(), resetTrailOnMistake: next } satisfies AppSettings)
// ...and for the new Sound toggle:
writeSettings({ ...readSettings(), soundEnabled: next } satisfies AppSettings)
```

### Anti-Patterns to Avoid
- **Creating a new `AudioContext` per chime play:** exhausts the browser's context limit within
  seconds of normal play; always reuse one singleton (Pattern 1).
- **Setting `gainNode.gain.value` directly for the envelope:** produces audible clicks/pops —
  always schedule via `AudioParam` methods (Pattern 2).
- **Treating `voiceschanged` as sufficient on its own:** it does not fire in Firefox/Safari
  desktop, which load voices synchronously instead — see Pitfall 3.
- **Reusing a single `SpeechSynthesisUtterance` object across multiple `speak()` calls:** utterances
  are documented as not reliably reusable once spoken — always construct a new
  `SpeechSynthesisUtterance` per `speakTarget()` call.
- **Full-replace `writeSettings()` calls:** clobbers sibling fields — always merge (Pattern 3).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio gesture unlocking | A custom "tap to enable sound" overlay/unlock screen | The existing keydown-gated correct-match branch, which already satisfies the browser's user-gesture requirement for both `AudioContext.resume()` and `speechSynthesis.speak()` | CLAUDE.md and CONTEXT.md both already establish this is unnecessary — the first correct match IS the qualifying gesture |
| Cross-utterance audio mixing / ducking | A custom priority queue or mixing graph for chime vs. speech | Two fully independent, parallel fire-and-forget calls (no shared state, no sequencing) | CLAUDE.md's "What NOT to Use" explicitly forbids Howler.js/Tone.js for this exact reason — this app never has more than one chime + one utterance in flight at a time by construction (each is retriggered, not queued, on every correct match) |
| Digit-to-word pronunciation guessing | Relying on ambiguous single-character TTS behavior for `'5'` | An explicit, hand-written digit→word lookup table (`{'0': 'zero', '1': 'one', ..., '9': 'nine'}`) | See Pitfall 6 — cross-browser/cross-voice pronunciation of a bare digit character is not guaranteed consistent; an explicit word string removes the ambiguity entirely for near-zero cost |

**Key insight:** Everything genuinely novel this phase (the chime's oscillator/gain synthesis) is
*intentionally* hand-rolled per CONTEXT.md's own reasoning (no asset exists, licensing avoided,
and the surface is small enough that a library would cost more than it saves). "Don't hand-roll"
here is about *not* over-engineering the two independent audio calls into a shared subsystem they
don't need — not about avoiding synthesis itself.

## Common Pitfalls

### Pitfall 1: Creating a new `AudioContext` per correct match instead of a singleton
**What goes wrong:** After several dozen correct matches (trivial in a toddler play session),
`new AudioContext()` starts throwing or silently failing because the browser has hit its
practical context-count ceiling.
**Why it happens:** It's tempting to construct the context inline inside `playChime()` since
that's the simplest-looking code, especially copying the "one function, one call" shape of
`celebrate.ts`'s `fireBurst()` too literally (that function constructs a *confetti call*, not a
context, every time — the context is the one thing here that must NOT be per-call).
**How to avoid:** Module-level singleton, created once, `resume()`d (never re-`new`'d) on every
subsequent call — Pattern 1 above.
**Warning signs:** Chime works for the first several correct matches in a session, then silently
stops. This is exactly the kind of failure the "silent degrade" contract will hide from a parent
without deliberate manual QA across an extended play session (the same class of gap
`02.1-RESEARCH.md`'s Pitfall 5 flagged for unbounded DOM growth — worth an equivalent
extended-session manual check here).

### Pitfall 2: Direct gain assignment causing audible clicks
**What goes wrong:** The chime sounds like a harsh "pop"/"click" at the start or end instead of a
soft tone, undermining the "muted, non-overwhelming" aesthetic CONTEXT.md explicitly calls for.
**Why it happens:** `gainNode.gain.value = 0.15` looks like the obvious way to set a gain level,
and it works for a *static* level — but any instantaneous jump in amplitude (including the
initial 0→level jump and the final level→0 stop) produces a click if not ramped.
**How to avoid:** Always schedule via `setValueAtTime`/`linearRampToValueAtTime`/
`exponentialRampToValueAtTime` — Pattern 2 above. `exponentialRampToValueAtTime` cannot target
exactly `0` (it's a mathematical asymptote) — target a very small value like `0.0001` instead.
**Warning signs:** Any perceptible "tick"/"pop" at chime start or end during manual QA.

### Pitfall 3: Relying on `voiceschanged` alone, without an immediate synchronous `getVoices()` call
**What goes wrong:** On Firefox and Safari desktop, `voiceschanged` may never fire at all (voices
are loaded synchronously on those engines) — a "listen for `voiceschanged` once, cache, done"
implementation can end up with an empty cached voice list forever on those browsers, and
`speak()` then either uses a default fallback voice or silently does nothing depending on the
engine.
**Why it happens:** CLAUDE.md's documented caveat ("`getVoices()` can return `[]` on first call —
listen for the `voiceschanged` event once at startup and cache the voice list") is accurate for
Chrome's async-loading behavior but describes only half the cross-browser picture.
**How to avoid:** Call `speechSynthesis.getVoices()` synchronously at startup *and* attach a
one-time `voiceschanged` listener that re-caches if it fires later — whichever path produces a
non-empty list first is used; if `getVoices()` was already non-empty at startup (Firefox/Safari),
the `voiceschanged` listener simply never has anything new to do. [MEDIUM confidence:
cross-referenced from web search against MDN's `getVoices()`/`voiceschanged` documentation.]
**Warning signs:** Speech works in Chrome during dev testing but never speaks in Safari, or uses
an unexpected/wrong-language voice.

### Pitfall 4: `speechSynthesis.cancel()` immediately followed by `speak()` can silently drop the new utterance
**What goes wrong:** On some browser/OS combinations, calling `cancel()` and then `speak()` in
the same synchronous tick (exactly what CONTEXT.md's locked "cancel before every new utterance"
pattern does) can result in the new utterance never actually speaking — not an exception, just
silence.
**Why it happens:** This is a long-standing, still-open cross-browser implementation quirk
(tracked in Firefox Bugzilla #1522074 and multiple Chromium bug reports), not documented W3C
Speech API behavior. [LOW confidence: community-sourced bug reports and workaround discussion,
not an official spec guarantee — flagged explicitly rather than presented as settled fact.]
**How to avoid:** CONTEXT.md's "silent degrade on any audio failure" contract already covers this
outcome (a dropped utterance just means no speech that round, matching the accepted failure mode)
— no code change is required to stay correct. However, the planner/executor should NOT interpret
"speech sometimes doesn't play" as a bug to chase during manual QA; it is an accepted, documented
browser limitation. If a more reliable fix is wanted later, community workarounds cited include
delaying `speak()` by a very short `setTimeout` after `cancel()`, but this reintroduces latency
CONTEXT.md's "never delays" decision is trying to avoid — not recommended for this phase.
**Warning signs:** Intermittent "no speech happened that time" during manual play-testing that
doesn't reproduce consistently.

### Pitfall 5: Missing a `writeSettings()` call site during the merge-write fix
**What goes wrong:** If the merge-write fix is applied to only the new Sound toggle's handler and
not the pre-existing trail-reset toggle's handler (or vice versa), one toggle will still silently
reset the other to its default every time it's clicked.
**Why it happens:** It's easy to treat "add the new toggle" and "fix the existing bug" as
unrelated tasks and only touch the new code path.
**How to avoid:** There is exactly **one** `writeSettings()` call site in the codebase today
[VERIFIED: src/settings.ts:71 — `writeSettings({ version: 1, resetTrailOnMistake: next } satisfies AppSettings)`]
— confirmed by grep across `src/`, no other call site exists (`game-screen.ts` only calls
`readSettings()`, never `writeSettings()`). This phase's click handler must house **both** the
existing trail-reset merge-write and the new Sound merge-write, since both toggles live in the
same delegated `handleClick` function in `settings.ts` — there is only one function to edit, not
two files to keep in sync.
**Warning signs:** Toggling Sound resets "Reset trail on mistake" back to its default (or vice
versa) on the next page load.

### Pitfall 6: Ambiguous digit pronunciation from bare-character TTS input
**What goes wrong:** Passing the literal digit character (e.g. `'5'`) to
`SpeechSynthesisUtterance` may be read correctly as "five" by most voices, but this is a
voice/locale-dependent behavior, not a guaranteed one — some voices may read `'5'` character-by-
character or with unexpected inflection.
**Why it happens:** Single-character numeric input isn't a stable, spec-guaranteed pronunciation
target the way single-letter input generally is (English voices reliably read a bare uppercase
letter as its letter name).
**How to avoid:** Build a small, explicit digit→word lookup (`{'0': 'zero', ..., '9': 'nine'}`,
using `game.ts`'s existing `DIGITS` array [VERIFIED: src/game.ts:17 —
`export const DIGITS = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])`] as the
key set) and pass the word string to `speakTarget()`, not the raw digit character. For letters,
pass the bare uppercase character directly (Letters/Alphabet modes use
`game.ts`'s `LETTERS` array [VERIFIED: src/game.ts:11-14]) — no mapping needed there.
**Warning signs:** Numbers mode's spoken audio sounds inconsistent or mispronounced compared to
Letters mode's.

## Code Examples

### Existing correct-match branch — the exact site the two new calls join
[VERIFIED: src/game-screen.ts:75-93]
```typescript
if (currentTarget !== null && acceptableCodes(currentTarget, mode).includes(event.code)) {
  if (mode === 'alphabet' && currentTarget === LETTERS[LETTERS.length - 1]) {
    pendingCelebrationTimers = celebrateAlphabetComplete()
  } else {
    void celebrate(target.getBoundingClientRect())
  }

  currentTarget = selectNext(mode, currentTarget)
  renderTarget(target, currentTarget)

  target.classList.remove('correct-pulse')
  void target.offsetWidth
  target.classList.add('correct-pulse')
  addTrailStar()
  // <-- NEW: playChime() and speakTarget(spokenTextFor(mode, previousTarget)) join here,
  //     called on the target that was just matched, not the newly-selected one
}
```
Note the exact ordering nuance: `speakTarget()`'s argument must be derived from the target that
was **just matched** (captured before `currentTarget` is reassigned by `selectNext()`), mirroring
the same "test the outgoing target before advancing" caution `game-screen.ts`'s own comment
already documents for the Alphabet Z-completion check three lines above.

### Existing `AppSettings` interface and defaults — the exact shape being extended
[VERIFIED: src/settings-store.ts:14-19]
```typescript
export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false }
```
Extension target (per CONTEXT.md, `version` stays `1`):
```typescript
export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
  soundEnabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false, soundEnabled: true }
```

### Existing shape-checked read — the exact function gaining a per-field default
[VERIFIED: src/settings-store.ts:27-42]
```typescript
export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
    if (!isValid) {
      return { ...DEFAULT_SETTINGS }
    }

    return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
```
Per CONTEXT.md, `soundEnabled` needs its own per-field default resolution (not folded into the
same all-or-nothing `isValid` check that would invalidate an existing Phase-2.1-only record):
```typescript
const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
if (!isValid) {
  return { ...DEFAULT_SETTINGS }
}

const soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled
return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean, soundEnabled }
```

### Existing toggle-row markup and CSS — reused verbatim for the new "Sound" row
[VERIFIED: src/settings.ts:38-57 (markup) and src/style.css:338-388 (CSS, zero changes needed)]
```typescript
const toggleRow = document.createElement('div')
toggleRow.className = 'toggle-row'

const toggleLabel = document.createElement('span')
toggleLabel.className = 'toggle-row__label'
toggleLabel.textContent = 'Reset trail on mistake' // → 'Sound' for the new row

const toggleSwitch = document.createElement('button')
toggleSwitch.type = 'button'
toggleSwitch.className = 'toggle-switch'
toggleSwitch.setAttribute('role', 'switch')
toggleSwitch.setAttribute('aria-label', 'Reset trail on mistake') // → 'Sound'
toggleSwitch.setAttribute('aria-checked', String(readSettings().resetTrailOnMistake)) // → .soundEnabled

const thumb = document.createElement('span')
thumb.className = 'toggle-switch__thumb'
toggleSwitch.appendChild(thumb)
```
CSS classes `.toggle-row` (`min-height: 56px`), `.toggle-switch` (`44px × 24px`), and
`.toggle-switch__thumb` (`20px` circle, `2px` inset) [VERIFIED: src/style.css:338-388] require
**zero** new rules — confirmed identical to `03-UI-SPEC.md`'s own claim.

### `fireBurst()`'s chokepoint shape — the pattern to mirror in `audio.ts`
[VERIFIED: src/celebrate.ts:70-85]
```typescript
async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const myGeneration = burstGeneration
  try {
    const { default: confetti } = await import('canvas-confetti')
    if (myGeneration !== burstGeneration) return
    confetti({ ...opts, startVelocity: opts.startVelocity * viewportScaleFactor(), colors: CONFETTI_COLORS })
  } catch {
    // Confetti is decorative — swallow load failures so the core game keeps working.
  }
}
```
`audio.ts`'s `playChime()`/`speakTarget()` should mirror this shape's *guard-then-try/catch-swallow*
structure (with `readSettings().soundEnabled` as the guard, in place of the reduced-motion check)
— but should NOT mirror the dynamic `import()`, since neither Web Audio nor Web Speech is a
bundled dependency that benefits from code-splitting (they cost 0 KB either way).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `webkitAudioContext` prefix fallback (`window.AudioContext \|\| window.webkitAudioContext`) | Unprefixed `AudioContext` only | Safari unprefixed `AudioContext` has been supported since Safari 14.1 (2021) | This project's stated audience (the family's actual modern hardware, "the family's actual hardware" per STATE.md) makes the legacy prefix unnecessary; `tsconfig.json`'s DOM lib doesn't even type `webkitAudioContext`, so adding it would require an `any` cast for a fallback this app almost certainly never needs. [ASSUMED — no explicit browser-version floor is documented anywhere in PROJECT.md/CLAUDE.md; flagged in Assumptions Log.] |

**Deprecated/outdated:** None directly relevant — both Web Audio API and Web Speech API are
stable, unprefixed, broadly-supported APIs with no newer replacement mechanism for this use case.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Skipping the `webkitAudioContext` legacy prefix fallback is safe for this app's target browsers | State of the Art | If a family device runs a very old Safari/iOS version, chime silently never plays (acceptable under the silent-degrade contract, but worth a manual check on the actual device per the existing STATE.md iOS Safari blocker) |
| A2 | A bare uppercase letter character (e.g. `'A'`) is reliably spoken as its letter name across Chrome/Firefox/Safari default voices | Pitfall 6 / Code Examples | If a voice instead reads it as a word or mispronounces it, AUDIO-02's letter-mode speech would sound wrong — low-cost to verify via one manual QA pass per browser |
| A3 | English digit words (`'zero'`...`'nine'`) match the target audience's language without any locale detection | Pitfall 6 | If the page/voice language is not English, digit words would be mis-localized — no evidence anywhere in PROJECT.md/CLAUDE.md that localization is in scope, so this follows the existing "default browser voice for the page language" decision at face value |
| A4 | `speechSynthesis.cancel()`-then-`speak()` browser quirk (Pitfall 4) does not need an explicit code workaround, because CONTEXT.md's silent-degrade contract already absorbs the failure mode | Pitfall 4 | If dropped utterances turn out to be frequent enough during real toddler play to feel broken rather than occasional, a short-delay workaround may need revisiting post-ship — flagged for the executor's manual QA pass, not blocking for planning |

## Open Questions

1. **Exact chime frequencies/envelope timing**
   - What we know: CONTEXT.md leaves this to Claude's discretion, bounded by "short, soft,
     celebratory, matches the muted jewel-tone/dark-pearlescent aesthetic," matching the existing
     `CONFETTI_COLORS` palette's restrained character.
   - What's unclear: No specific note/frequency values are locked anywhere.
   - Recommendation: A short two-note ascending interval (e.g. a perfect fourth or major third,
     ~150-250ms total duration, gain peaking around 0.1-0.2) is a reasonable, easily-tunable
     starting point for the planner/executor to implement and the user to audition and adjust.

2. **Whether the dropped-utterance quirk (Pitfall 4) warrants a defensive workaround**
   - What we know: It's a real, documented cross-browser issue with no official spec-level fix;
     CONTEXT.md's "silent degrade" contract already makes it a non-blocking, accepted risk.
   - What's unclear: How often it actually reproduces on the family's real hardware/browser
     during actual play patterns (rapid-fire correct matches).
   - Recommendation: Ship without a workaround this phase (per Pitfall 4's guidance above); treat
     "speech sometimes silently doesn't fire" as an accepted, tracked characteristic during manual
     QA rather than a bug to chase, and revisit only if it proves disruptive during real use.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build toolchain | ✓ | v24.14.0 | — (exceeds Vite's 20.19+/22.12+ requirement) |
| npm | Package management | ✓ | 11.16.0 | — |
| TypeScript (`tsc`) | Type checking / build | ✓ | 5.9.3 | — (matches pinned `package.json` version exactly) |
| Web Audio API (`AudioContext`) | AUDIO-01 | ✓ (all modern desktop/mobile browsers; unprefixed since Safari 14.1) | — | Silent degrade to no chime, per CONTEXT.md's Audio Failure Handling |
| Web Speech API (`speechSynthesis`) | AUDIO-02 | ✓ (Chrome/Edge/Firefox/Safari per caniuse, per CLAUDE.md's own Sources section) | — | Silent degrade to no speech, per CONTEXT.md's Audio Failure Handling |
| Browser localStorage | SET-01 persistence | ✓ (universal in target browsers) | — | In-memory-only fallback, already implemented in `settings-store.ts`'s existing try/catch |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Web Audio API and Web Speech API both have an explicit,
already-locked silent-degrade fallback (no chime / no speech, game remains fully playable) —
not a gap needing planner action beyond implementing the documented degrade path.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none — explicitly excluded by `.claude/CLAUDE.md` for v1, unchanged from Phases 1-2.1 |
| Config file | none |
| Quick run command | manual: `npm run dev`, interact via physical keyboard |
| Full suite command | manual: `npm run build && npm run preview`, walkthrough across at least two browser engines (recommend Chrome + Safari specifically this phase, given the `getVoices()`/`voiceschanged` divergence in Pitfall 3) |
| Note | `npm run build` (`tsc` strict + `vite build`) remains this project's one *automated* gate — every task's `<verify>` step should include it |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIO-01 | Correct match plays a chime when `soundEnabled` is true | shell gate + manual | `npm run build` + grep confirming `playChime(` call sits in `game-screen.ts`'s correct-match branch alongside `celebrate(`/`addTrailStar(` | ❌ — new file (`audio.ts`), Wave 0 |
| AUDIO-01 (toggle-off) | No chime plays when `soundEnabled` is false | manual only | manual: toggle Sound off in Settings, verify silence on next correct match | ❌ — depends on new toggle |
| AUDIO-02 | Correct match speaks the target letter/digit name when `soundEnabled` is true | shell gate + manual | `npm run build` + grep confirming `speakTarget(` call sits in the same branch | ❌ — new file (`audio.ts`), Wave 0 |
| AUDIO-02 (independence) | A forced speech failure (e.g. DevTools-disabled speechSynthesis) must not suppress the chime, and vice versa | manual only | manual: verify via browser DevTools or a temporary throw injected during dev | ❌ — new code path |
| SET-01 | Settings screen has a working Sound toggle that persists across reloads | shell gate + manual | `npm run build` + grep for `soundEnabled` literal in both `settings-store.ts` and `settings.ts`, plus a reload-and-recheck manual pass | ❌ — extends existing files, Wave 0 |
| SET-01 (merge-write) | Toggling Sound never resets `resetTrailOnMistake`, and vice versa | shell gate + manual | `npm run build` + grep confirming every `writeSettings(` call site (verified: exactly one today, `settings.ts:71`) uses the spread-merge form `{ ...readSettings(), ... }`, never a bare object literal | ❌ — bugfix + extension, Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` (must exit 0) + manual `npm run dev` smoke check of the
  change just made, matching Phase 2/2.1's established rate.
- **Per wave merge:** Manual `npm run build && npm run preview` walkthrough of the requirements
  landed in that wave, across at least Chrome and Safari (per Pitfall 3's engine divergence).
- **Phase gate:** Full manual walkthrough of all 3 requirements (AUDIO-01, AUDIO-02, SET-01) on
  the live GitHub Pages URL before `/gsd:verify-work`, including an extended-session chime check
  (Pitfall 1's "works for a while then silently stops" failure mode) and a settings-persistence
  reload check.

### Wave 0 Gaps
- [ ] `src/audio.ts` — does not exist yet; new module needed for `playChime()`/`speakTarget()`
      and the `AudioContext` singleton / cached-voice-list logic.
- [ ] No test framework exists and none is being introduced (per CLAUDE.md) — accepted baseline,
      not a gap to close.

## Security Domain

### Applicable ASVS Categories

This app has no authentication, no session management, no server-side access control, and no
network calls of any kind (fully static, GitHub Pages). The one category with real surface this
phase touches is input validation on the (extended) localStorage-persisted settings value.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No accounts/auth exist anywhere in this app |
| V3 Session Management | No | No sessions/cookies — `localStorage` is a plain client-side preference |
| V4 Access Control | No | No privileged operations, no roles, no server |
| V5 Input Validation | Yes | The localStorage-read value's new `soundEnabled` field must be type-checked (`typeof parsed.soundEnabled === 'boolean'`) before use, with a per-field default fallback rather than invalidating the whole record — matching the existing `resetTrailOnMistake` check's shape, extended per CONTEXT.md's explicit instruction |
| V6 Cryptography | No | No secrets, no crypto operations |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/hand-edited localStorage value (e.g. `soundEnabled: "yes"`) causes an uncaught exception or unexpected behavior on load | Tampering / Denial of Service (local) | try/catch around `JSON.parse` (already present) plus a per-field `typeof` check on `soundEnabled` before trusting it, falling back to `DEFAULT_SETTINGS.soundEnabled` — extends the existing pattern, doesn't introduce a new one |
| Spoken text ever includes anything beyond the fixed letter/digit set | Tampering (unexpected content read aloud) | `speakTarget()`'s input must only ever originate from `game.ts`'s frozen `LETTERS`/`DIGITS` arrays or this phase's own frozen digit-word map — never from any user-editable or externally-supplied string; this app has no user text input anywhere, so this is a design-by-construction guarantee, not a runtime check |
| `innerHTML`/unsanitized string injection in the new Settings toggle row | Tampering (XSS) | Use `textContent` exclusively for the new "Sound" label, matching the codebase-wide invariant (verified `settings.ts:41-43`'s existing row does the same) |

## Sources

### Primary (HIGH confidence — direct file reads this session)
- `src/settings-store.ts` — `AppSettings` interface, `DEFAULT_SETTINGS`, `readSettings()`,
  `writeSettings()` (lines 14-57)
- `src/settings.ts` — toggle-row markup, `handleClick` dispatch, the single `writeSettings()`
  call site (lines 22-92)
- `src/game-screen.ts` — correct-match branch, `event.repeat` guard, mode/target selection
  (lines 53-130)
- `src/celebrate.ts` — `fireBurst()` chokepoint pattern, reduced-motion guard placement
  (lines 1-136)
- `src/game.ts` — `LETTERS`/`DIGITS` frozen arrays, `acceptableCodes()` (lines 11-79)
- `src/clipboard.ts` — silent-degrade try/catch precedent (lines 1-81)
- `src/style.css` — `.toggle-row`/`.toggle-switch`/`.toggle-switch__thumb` CSS (lines 338-388)
- `tsconfig.json` — `"lib": ["ES2023", "DOM"]` confirming no `@types` package needed for either
  Web Audio or Web Speech API types
- `.planning/phases/03-sound-audio-settings/03-CONTEXT.md` — all locked decisions
- `.planning/phases/03-sound-audio-settings/03-UI-SPEC.md` — toggle row copy/markup/CSS contract
- `.planning/REQUIREMENTS.md` — AUDIO-01, AUDIO-02, SET-01 definitions
- `.claude/CLAUDE.md` — Web Speech API caveats, "What NOT to Use" table

### Secondary (MEDIUM confidence — web search cross-referenced against MDN)
- MDN `AudioContext.resume()`/`AudioContext.suspend()` — suspended-state/user-gesture behavior
- MDN `GainNode`/`AudioParam` scheduling — click-avoidance via ramp methods
- MDN `SpeechSynthesis.getVoices()`/`voiceschanged` event — async-in-Chrome,
  sync-in-Firefox/Safari divergence
- MDN `SpeechSynthesisUtterance.rate`/`.pitch` — default value of `1` for both

### Tertiary (LOW confidence — community bug reports, not spec-guaranteed)
- Firefox Bugzilla #1522074, multiple Chromium issue reports — `cancel()`-then-`speak()`
  utterance-drop quirk (Pitfall 4); explicitly flagged as an implementation quirk, not documented
  API contract

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both APIs are browser built-ins already covered by this project's
  existing `tsconfig.json` DOM lib target, verified this session; no version/package ambiguity.
- Architecture: HIGH — every integration point (`game-screen.ts`'s correct-match branch,
  `settings-store.ts`'s interface, `settings.ts`'s toggle markup) was read directly this session.
- Pitfalls: MEDIUM — Web Audio/Speech API behavior is grounded in MDN via web search
  cross-reference (not a direct Context7/MDN fetch this session), and one pitfall (Pitfall 4) is
  explicitly LOW confidence, sourced from community bug trackers rather than official docs.

**Research date:** 2026-08-14
**Valid until:** ~30 days (stable browser APIs, no fast-moving dependency surface this phase)

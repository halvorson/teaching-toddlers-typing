# Phase 3: Sound & Audio Settings - Pattern Map

**Mapped:** 2026-08-14
**Files analyzed:** 4 (1 new, 3 modified)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/audio.ts` (NEW) | utility (side-effecting browser-API wrapper) | event-driven (fire-and-forget on correct match) | `src/celebrate.ts` | role-match (closest: single-chokepoint-function utility module triggered from the same call site) |
| `src/settings-store.ts` (MODIFIED — extend interface + read/write) | model / store | CRUD (read/write a single persisted record) | `src/settings-store.ts` itself (extending in place) | exact (editing the same file — patterns extracted from its own current shape) |
| `src/settings.ts` (MODIFIED — second toggle row + merge-write fix) | component (hand-rolled DOM "screen") | request-response (click → state mutation → persisted write) | `src/settings.ts` itself (extending in place) | exact (add a second row cloned from the first row's existing markup) |
| `src/game-screen.ts` (MODIFIED — two new calls in correct-match branch) | controller (event listener / mode state machine) | event-driven (keydown → match → side effects) | `src/game-screen.ts` itself (extending in place) | exact (new calls inserted into the existing correct-match branch) |

No genuinely new *role* is introduced this phase — every file either extends an existing file in place or is a new utility module that mirrors an existing utility module's shape (`celebrate.ts`). There is no controller/component/model file in this codebase with a "browser audio API" data flow to match against, so `celebrate.ts` (closest by role: single-purpose, silently-failing, fire-and-forget browser-API utility) is the strongest available analog for `audio.ts`.

## Pattern Assignments

### `src/audio.ts` (NEW) — utility, event-driven

**Analog:** `src/celebrate.ts` (chokepoint-function shape) + `src/settings-store.ts` (settings-gate read) + `src/clipboard.ts` (try/catch-swallow shape)

**Module doc-comment convention** (celebrate.ts lines 1-11):
```typescript
/**
 * Lazy-loaded confetti bursts. canvas-confetti is loaded via a dynamic
 * import() inside the shared fireBurst helper below, so it costs nothing on
 * the initial page load and is code-split into its own chunk. fireBurst is
 * also the module's single reduced-motion guard site and single
 * viewport-scaling site — every present and future caller inherits the
 * prefers-reduced-motion respect and the clamped viewport-scale factor
 * without having to remember either one, whether that caller is the
 * ordinary per-match celebration or the bigger Alphabet-mode Z-completion
 * celebration.
 */
```
`audio.ts` should open with an equivalent doc comment naming its own single-guard-site convention: `soundEnabled` gate (in place of reduced-motion), lazy `AudioContext` singleton (in place of dynamic `import()`), and the two independent exported entry points (`playChime()`, `speakTarget()`).

**Chokepoint-function shape to mirror** (celebrate.ts lines 64-85):
```typescript
async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const myGeneration = burstGeneration
  try {
    const { default: confetti } = await import('canvas-confetti')
    if (myGeneration !== burstGeneration) return // cancelled while the import was in flight
    confetti({
      ...opts,
      startVelocity: opts.startVelocity * viewportScaleFactor(),
      colors: CONFETTI_COLORS,
    })
  } catch {
    // Confetti is decorative — swallow load failures so the core game keeps working.
  }
}
```
Reuse the *guard-then-try/catch-swallow* skeleton (early-return guard at the top, all risky browser-API calls inside `try`, an empty/comment-only `catch`) — but do NOT mirror the dynamic `import()`; neither Web Audio nor Web Speech is a bundled dependency, so no code-splitting benefit exists (per RESEARCH.md's explicit note).

**Settings-gate read pattern** (game-screen.ts lines 94-99, the existing precedent for reading settings fresh on every call rather than caching at mount):
```typescript
// Read fresh on every wrong key press (not cached at mount) so
// flipping the toggle in Settings and returning to a mode takes
// effect immediately.
if (readSettings().resetTrailOnMistake) {
  clearTrail()
}
```
`playChime()`/`speakTarget()` must each open with the equivalent fresh read: `if (!readSettings().soundEnabled) return`.

**Silent-degrade try/catch shape** (clipboard.ts lines 34-43):
```typescript
try {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return 'copied'
  }
} catch {
  // Clipboard unavailable or the permission was denied — an expected
  // outcome here, not an error to surface. Fall through to the legacy
  // tier below.
}
```
Same shape for `audio.ts`: optional-chain any feature-detection (`window.AudioContext`, `window.speechSynthesis`), wrap the risky call in `try`, and use a comment-only empty `catch` (never a `catch (err) { console.error(err) }` — this codebase's failures are silent by design, with no logging shown anywhere in the three precedent files).

**Suggested internal shape (from RESEARCH.md's Pattern 1/2, already codebase-grounded via `celebrate.ts`'s module-level-state idiom seen in `burstGeneration`):**
```typescript
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

export function playChime(): void {
  if (!readSettings().soundEnabled) return
  try {
    const ctx = getAudioContext()
    // ...OscillatorNode/GainNode scheduling via AudioParam ramp methods, never direct .value assignment for the envelope
  } catch {
    // Audio is decorative — swallow failures so the core game keeps working.
  }
}
```
Module-level singleton state (`audioCtx`, and a `cachedVoices`/`voicesReady` pair for `speakTarget()`) mirrors `celebrate.ts`'s own `burstGeneration` module-level `let` — this codebase already has that exact idiom for "one small piece of module state a chokepoint function reads/mutates."

---

### `src/settings-store.ts` (MODIFIED) — model/store, CRUD

**Analog:** itself, current shape (lines 14-19, 27-42, 49-57)

**Interface + defaults extension:**
```typescript
// CURRENT (lines 14-19):
export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false }

// TARGET:
export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
  soundEnabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false, soundEnabled: true }
```

**Shape-checked read — per-field default pattern** (current lines 27-42):
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
Target shape — `isValid` stays keyed only on the fields that were required at Phase 2.1 (do not add `soundEnabled` to the all-or-nothing `isValid` check, per CONTEXT.md — an existing `{resetTrailOnMistake}`-only record from before this phase must still load cleanly):
```typescript
const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
if (!isValid) {
  return { ...DEFAULT_SETTINGS }
}

const soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled
return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean, soundEnabled }
```

**`writeSettings()` itself is unchanged** (current lines 49-57) — it already accepts a full `AppSettings` record and silently degrades on `setItem` failure; no edit needed to this function's body, only to its callers (see `settings.ts` below).
```typescript
export function writeSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable or full — the preference degrades to
    // session-only with no error UI, matching this codebase's established
    // silent-degrade precedent for non-critical persistence.
  }
}
```

---

### `src/settings.ts` (MODIFIED) — component, request-response

**Analog:** itself, current shape (lines 38-57 markup; line 71 the bug being fixed)

**Existing single toggle-row markup — clone this exact `document.createElement` chain for the new row** (lines 38-57):
```typescript
const toggleRow = document.createElement('div')
toggleRow.className = 'toggle-row'

const toggleLabel = document.createElement('span')
toggleLabel.className = 'toggle-row__label'
toggleLabel.textContent = 'Reset trail on mistake'

const toggleSwitch = document.createElement('button')
toggleSwitch.type = 'button'
toggleSwitch.className = 'toggle-switch'
toggleSwitch.setAttribute('role', 'switch')
toggleSwitch.setAttribute('aria-label', 'Reset trail on mistake')
toggleSwitch.setAttribute('aria-checked', String(readSettings().resetTrailOnMistake))

const thumb = document.createElement('span')
thumb.className = 'toggle-switch__thumb'
toggleSwitch.appendChild(thumb)

toggleRow.appendChild(toggleLabel)
toggleRow.appendChild(toggleSwitch)
```
Second row (per 03-UI-SPEC.md's literal copy contract): label/aria-label = `'Sound'`, `aria-checked` seeded from `readSettings().soundEnabled` (defaults `true`, the opposite default polarity from the existing row — intentional, not a bug). Append this second row's elements to `panel` directly beneath the existing `toggleRow.appendChild`/`panel.appendChild(toggleRow)` sequence (current lines 59-62), matching 03-UI-SPEC.md's specified DOM order: back → title → existing toggle row → new Sound row.

**The exact bug being fixed — full-replace write** (current line 71, inside `handleClick`):
```typescript
// BEFORE (bug — clobbers whichever sibling field(s) exist beyond version+resetTrailOnMistake):
writeSettings({ version: 1, resetTrailOnMistake: next } satisfies AppSettings)
```
```typescript
// AFTER — merge-write, applied to BOTH toggle branches inside the same handleClick:
writeSettings({ ...readSettings(), resetTrailOnMistake: next } satisfies AppSettings)
// ...and the new Sound toggle's branch:
writeSettings({ ...readSettings(), soundEnabled: next } satisfies AppSettings)
```

**Delegated click-dispatch shape to extend** (current lines 64-79) — the new toggle needs its own `if (toggle) { ... }`-style branch inside the same `handleClick`, distinguished by `className`/`aria-label` (e.g. checking which toggle element was clicked via a data attribute or by comparing `toggle` against a stored reference), not a second listener:
```typescript
const handleClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  const toggle = target.closest<HTMLButtonElement>('.toggle-switch')
  if (toggle) {
    const current = toggle.getAttribute('aria-checked') === 'true'
    const next = !current
    toggle.setAttribute('aria-checked', String(next))
    writeSettings({ version: 1, resetTrailOnMistake: next } satisfies AppSettings) // ← fix + branch on which toggle
    return
  }

  const backButton = target.closest('.panel-back')
  if (backButton) {
    onBack()
  }
}
```
Since both toggle rows share the `.toggle-switch` class, `handleClick` will need to distinguish which row was clicked (e.g. compare `toggle` to stored row-element references captured at mount time, or branch on `toggle.getAttribute('aria-label')`) before deciding which field of `AppSettings` to flip — there is exactly one `handleClick` function to edit, not two files to keep in sync (per RESEARCH.md Pitfall 5).

**Mount/unmount lifecycle — unchanged, no edits needed** (current lines 22, 97-110): `mountSettingsScreen`'s idempotent "unmount-then-rebuild" shape and `unmountSettingsScreen`'s listener-cleanup shape already generalize to two toggle rows with zero structural changes — only the body between `unmountSettingsScreen()` and `mountedPanel = panel` grows by one row's worth of `createElement` calls.

---

### `src/game-screen.ts` (MODIFIED) — controller, event-driven

**Analog:** itself, current shape (lines 67-110, the keydown handler; correct-match branch is lines 75-94)

**Existing correct-match branch — exact insertion point** (current lines 75-94):
```typescript
if (currentTarget !== null && acceptableCodes(currentTarget, mode).includes(event.code)) {
  // The Z-completion test must run against the target being LEFT, before
  // selectNext advances it — nextInSequence wraps unconditionally, so by
  // the time selectNext has returned, currentTarget is already 'A' and
  // testing afterwards would either never fire or fire on the wrong
  // letter (MODE-04).
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
  // ← NEW: playChime() and speakTarget(...) join here
}
```
Critical ordering note (already documented in the existing Z-completion comment three lines above, same caution applies to the new calls): capture the *outgoing* `currentTarget` value in a local (e.g. `const matched = currentTarget`) **before** the `currentTarget = selectNext(...)` reassignment on the line above, since `speakTarget()` must announce the character that was just matched, not the newly-selected one.

**Import block convention to extend** (current lines 7-10):
```typescript
import { DIGITS, LETTERS, acceptableCodes, nextInSequence, pickRandom, renderTarget } from './game'
import { cancelPendingCelebration, celebrate, celebrateAlphabetComplete } from './celebrate'
import { addTrailStar, clearTrail, mountTrailLayer, unmountTrailLayer } from './trail'
import { readSettings } from './settings-store'
```
Add `import { playChime, speakTarget } from './audio'` alongside the existing sibling-module imports, same named-import style, no default exports anywhere in this codebase.

**`DIGITS`/`LETTERS` frozen pools — the source for `speakTarget()`'s spoken-text derivation** (game.ts lines 11-17):
```typescript
export const LETTERS: readonly string[] = Object.freeze([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
])

export const DIGITS = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
```
A digit→word lookup keyed off this same `DIGITS` array (per RESEARCH.md Pitfall 6) belongs in `audio.ts`, not `game.ts` — `game.ts` owns character *pools*, `audio.ts` owns how a matched character is spoken.

---

## Shared Patterns

### Silent-degrade-on-failure (applies to all of `audio.ts`, and to no other new code this phase)
**Source:** `src/clipboard.ts` lines 34-43, `src/celebrate.ts` lines 82-84, `src/settings-store.ts` lines 39-41, 52-56
**Apply to:** Every risky browser-API call inside `audio.ts` (`new AudioContext()`, oscillator/gain scheduling, `speechSynthesis.getVoices()`, `new SpeechSynthesisUtterance(...)`, `speechSynthesis.speak(...)`).
```typescript
try {
  // risky browser-API call
} catch {
  // <feature> is decorative/non-critical — swallow failures so the core game keeps working.
}
```
No file in this codebase logs swallowed errors (no `console.error`/`console.warn` calls anywhere in `celebrate.ts`, `clipboard.ts`, or `settings-store.ts`) — match that exactly; a bare comment-only `catch` block is the established idiom, not a defect to "fix" by adding logging.

### `textContent`-only DOM construction (applies to the new Sound toggle row's label)
**Source:** `src/settings.ts` lines 41-43 (`toggleLabel.textContent = 'Reset trail on mistake'`)
**Apply to:** The new row's `toggleLabel.textContent = 'Sound'` — never `innerHTML`, matching the codebase-wide invariant already enforced by every existing DOM-construction site in `settings.ts`, `menu.ts`, and `game-screen.ts`.

### Fresh settings read per call (never cache `readSettings()` at mount/module scope)
**Source:** `src/game-screen.ts` lines 94-99
```typescript
// Read fresh on every wrong key press (not cached at mount) so
// flipping the toggle in Settings and returning to a mode takes
// effect immediately.
if (readSettings().resetTrailOnMistake) {
  clearTrail()
}
```
**Apply to:** `audio.ts`'s `playChime()`/`speakTarget()` — each must call `readSettings().soundEnabled` at the top of its own function body on every invocation, not read it once and cache the boolean, so toggling Sound off/on in Settings takes effect on the very next correct match with no page reload.

### Merge-write for `writeSettings()` (applies to every call site, old and new, in `settings.ts`)
**Source:** RESEARCH.md Pattern 3, current bug at `src/settings.ts:71`
```typescript
writeSettings({ ...readSettings(), <field>: next } satisfies AppSettings)
```
**Apply to:** Both the existing trail-reset toggle's branch and the new Sound toggle's branch inside `settings.ts`'s single `handleClick` function — there is exactly one `writeSettings()` call site to fix today, and it must become two merge-write calls (or one call site parameterized by which field changed), never a bare object literal.

### Chokepoint-function shape (guard → try → risky calls → catch-swallow)
**Source:** `src/celebrate.ts` lines 70-85 (`fireBurst`)
**Apply to:** `audio.ts`'s internal structure — `playChime()` and `speakTarget()` should each read as "early-return guard, then a single try block wrapping all risky calls, then an empty/comment-only catch," mirroring `fireBurst`'s shape but WITHOUT its dynamic `import()` (Web Audio/Web Speech are browser globals, not bundled deps — no code-splitting benefit).

## No Analog Found

None — every file this phase touches either extends an existing file in place (three of four) or is close enough in role/shape to an existing utility module (`audio.ts` ↔ `celebrate.ts`) that RESEARCH.md's own Code Examples section already supplies the missing browser-API-specific detail (`OscillatorNode`/`GainNode`/`AudioParam` scheduling, `SpeechSynthesisUtterance`/`getVoices()`/`voiceschanged` caching) that has no in-repo precedent to copy from. That gap is expected and already flagged in RESEARCH.md's own Confidence breakdown ("Pitfalls: MEDIUM — grounded in MDN via web search, not in-repo") — the planner should treat RESEARCH.md's Pattern 1/Pattern 2/Code Examples sections as the source of truth for the *browser-API-specific* mechanics, and this PATTERNS.md as the source of truth for *codebase-convention* mechanics (module doc-comment style, guard/try/catch shape, settings-gate read timing, silent-degrade idiom).

## Metadata

**Analog search scope:** `src/` (11 files: `celebrate.ts`, `clipboard.ts`, `fullscreen.ts`, `game-screen.ts`, `game.ts`, `main.ts`, `menu.ts`, `router.ts`, `settings-store.ts`, `settings.ts`, `style.css`)
**Files scanned:** 6 read in full this session (`settings-store.ts`, `settings.ts`, `celebrate.ts`, `game-screen.ts`, `clipboard.ts`, `game.ts`), plus targeted `style.css` toggle-CSS read (lines 338-388)
**Pattern extraction date:** 2026-08-14

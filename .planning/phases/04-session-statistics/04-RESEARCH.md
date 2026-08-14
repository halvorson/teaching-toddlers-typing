# Phase 4: Session Statistics - Research

**Researched:** 2026-08-14
**Domain:** Client-side aggregated stats recording, versioned localStorage persistence, CSS-bar histogram rendering (vanilla TypeScript, no framework)
**Confidence:** HIGH

## Summary

Phase 4 adds no new runtime dependencies and no new architectural pattern — it is a straight
application of two patterns this codebase already has in production: the versioned/shape-checked
localStorage record (`settings-store.ts`) and the windowed-panel screen module
(`settings.ts`/`menu.ts`). The entire phase is: (1) a new `stats-store.ts` mirroring
`settings-store.ts` under its own storage key, holding aggregated counters instead of raw events;
(2) two new call sites inside `game-screen.ts`'s existing keydown handler (correct and incorrect
branches) that call the store's record function; (3) a new `stats.ts` screen module mirroring
`settings.ts`, rendering the UI-SPEC's exact markup/CSS; (4) three small wiring additions —
`router.ts`'s `Screen` union, `main.ts`'s `mountScreen` switch, and `menu.ts`'s dispatch — that
each already have a live precedent for the `'settings'` screen to copy.

The one genuinely new piece of logic is reaction-time capture: the existing code re-renders the
target via `renderTarget()` both at mount (`mountGameScreen`) and after every correct match (inside
the keydown handler, right after `selectNext`/`renderTarget`). A reaction-time clock must start at
each of those two render call sites and stop at the next correct keydown, before being bucketed
into one of the five fixed histogram bins. Nothing in this domain requires a library: buckets are
five integers, LPM/accuracy are two-line arithmetic, and the histogram is five `<div>` elements
sized by inline `style.height`.

**Primary recommendation:** Build `stats-store.ts` as a structural mirror of `settings-store.ts`
(own key `keyboard-quest-stats`, own `version: 1`, same try/catch shape-check-on-read /
silent-degrade-on-write contract), add a single `recordCorrectMatch(reactionMs)` /
`recordIncorrectMatch()` pair of exported functions called from `game-screen.ts`'s two existing
branches, and track the "last render timestamp" as module-level state inside `game-screen.ts`
(same lifecycle tier as `currentTarget`), passed into `recordCorrectMatch` as an elapsed
millisecond count computed at the call site.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Match outcome detection (correct/incorrect) | Browser / Client (`game-screen.ts` keydown handler) | — | Already exists; this phase adds calls at the two existing branch sites, doesn't move detection logic. |
| Reaction-time clock (start/stop) | Browser / Client (`game-screen.ts` module state) | — | Must live alongside `currentTarget`/`renderTarget()` call sites — the only place that knows exactly when a new target rendered. |
| Stats aggregation (counters, histogram buckets, timestamps) | Browser / Client (`stats-store.ts`) | — | Pure computation on data already in memory; no server, no async boundary. |
| Persistence (localStorage read/write) | Browser / Client (`stats-store.ts`) | — | Static site, no backend (CLAUDE.md constraint) — `localStorage` is the only persistence tier available. |
| Statistics screen rendering (DOM/CSS) | Browser / Client (`stats.ts`) | — | Mirrors `settings.ts`; a single-page app with no SSR tier. |
| Screen routing/URL sync | Browser / Client (`router.ts`, `main.ts`) | — | Existing hand-rolled router; no new tier introduced. |
| Reset action | Browser / Client (`stats.ts` click handler → `stats-store.ts` reset fn) | — | Pure client-side state mutation + re-render, no confirmation step, no server round-trip. |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Model**
- One cumulative pool, not per-session buckets (STAT-04's "reset ALL" implies a single pool).
- Aggregated counters, not a raw match log — `correctCount`, `incorrectCount`, a fixed 5-bucket
  reaction-time histogram (counts, not raw samples), `firstMatchAt`/`lastMatchAt` timestamps.
  Storage size is O(1) regardless of play duration.
- What counts as a "match": every non-repeat keydown while a game screen is mounted that isn't
  Escape — exactly the same correct/incorrect branch `game-screen.ts` already has; both branches
  now also update the stats record. `event.repeat` is already filtered before either branch runs.
- Reaction time is recorded only for correct matches (time from target render to correct keypress).
  An incorrect keypress only increments `incorrectCount`.
- Histogram buckets (fixed, 5 bins): `<1s`, `1-2s`, `2-4s`, `4-8s`, `8s+`.
- All modes (Letters, Numbers, Alphabet) count toward one aggregate — no per-mode breakdown.
- LPM formula: `correctCount / ((lastMatchAt - firstMatchAt) / 60000)`, both timestamps updated on
  every match, only since the last reset. Freezes once play stops. If `correctCount` is 0 or the
  two timestamps are equal (first-ever match), LPM displays as "—" rather than dividing by zero.
- Accuracy formula: `correctCount / (correctCount + incorrectCount)`, displayed as a percentage;
  "—" when both are 0.

**Persistence**
- Separate localStorage key from settings (`keyboard-quest-stats`, own `version: 1` field).
- Write after every match (both correct and incorrect update and persist), mirroring
  `settings-store.ts`'s `readSettings()`/`writeSettings()` idiom directly.
- Same silent-degrade contract as everywhere else: a read/write failure degrades to an
  in-memory-only record for the current page load, no error UI.
- Shape-checked reads, same pattern as `settings-store.ts`: a missing key, `JSON.parse` failure,
  wrong version, or any field failing its `typeof` check resolves to a fresh zeroed record rather
  than throwing or trusting a corrupted value.

**Statistics Screen**
- Reuses the existing windowed (non-fullscreen) panel pattern from Settings — same
  `.settings-panel`-style card over the drifting background, same `← Back`/Escape exit.
- Histogram rendering: plain CSS bars, no canvas, no charting library. Five `<div>` bars, one per
  bucket, `height`/`flex-basis` driven by each bucket's count relative to the largest bucket.
- Reset is a genuine one-click action, no confirmation dialog. Clicking Reset immediately zeroes
  the record and re-renders the screen with all values back to "—"/empty.
- Reset lives on the Statistics screen. Settings gets a link/button that navigates to Statistics
  rather than a second, duplicate reset control (satisfies SET-02).

### Claude's Discretion
- Exact CSS class names, spacing, and layout for the histogram bars and stat rows, within "reuses
  the windowed panel pattern, no new design system." (Resolved by 04-UI-SPEC.md — see below.)
- Exact wording for the "no data yet" empty state ("—" vs. a short phrase) — pick one, apply
  consistently. (Resolved by 04-UI-SPEC.md: single em dash "—".)
- Internal module name/file for the stats-recording logic (`stats-store.ts` mirroring
  `settings-store.ts`, plus a `stats.ts` screen module mirroring `settings.ts`). (Confirmed by
  04-UI-SPEC.md Assumption 7.)

### Deferred Ideas (OUT OF SCOPE)
- Per-mode stats breakdown (separate accuracy/LPM for Letters vs. Numbers vs. Alphabet).
- Live in-game HUD showing running stats (explicitly out of scope per STAT-05).
- Any historical/per-session browsing of past stats — out of scope, matches STAT-04's "reset ALL"
  wording implying a single pool.
</user_constraints>

**Note:** 04-UI-SPEC.md (already approved) supersedes CONTEXT.md's "Claude's Discretion" items with
exact markup, CSS, copy, and behavior contracts — see Code Examples below. The planner should treat
UI-SPEC.md as the binding visual/interaction contract and CONTEXT.md as the binding data-model
contract; there is no conflict between them, UI-SPEC only fills gaps CONTEXT.md left open.

## Phase Requirements

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAT-01 | The app records per-session stats: accuracy, letters-per-minute, and per-match reaction time | `stats-store.ts` aggregated-counter model (Code Examples); recording call sites in `game-screen.ts`'s existing keydown handler branches |
| STAT-02 | Stats persist in the browser (localStorage) across sessions, with a versioned schema | `stats-store.ts` mirrors `settings-store.ts`'s exact versioned/shape-checked read-write pattern (verified at `src/settings-store.ts:1-65`) |
| STAT-03 | The Statistics screen shows accuracy, letters-per-minute, and a reaction-time histogram | `stats.ts` mirrors `settings.ts`'s panel-mount pattern; exact markup/CSS/bar-height formula specified in 04-UI-SPEC.md |
| STAT-04 | The Statistics screen has a one-click action to reset all recorded stats | `.stats-reset` button, no confirmation dialog, calls store reset fn + re-render (UI-SPEC "Reset behavior") |
| STAT-05 | Stats are recorded but not shown live during gameplay (no in-game HUD yet) | Recording calls are pure store writes with no DOM output; game-screen.ts renders nothing new during play |
| SET-02 | Settings screen provides access to reset stats | `.panel-link` "View Statistics →" row added to `settings.ts`, routing to the Statistics screen where Reset lives (per CONTEXT.md's resolved reading) |
</phase_requirements>

## Standard Stack

### Core

No new libraries. This phase is 100% vanilla TypeScript + native browser APIs, consistent with
CLAUDE.md's "Vanilla TypeScript (no UI framework)" and "no charting/animation library" constraints.

| Capability | API | Purpose | Why Standard (for this codebase) |
|------------|-----|---------|-----------------------------------|
| Persistence | `localStorage` (Web Storage API) | Read/write the stats record | Same API `settings-store.ts` already uses; zero new surface. `[VERIFIED: src/settings-store.ts:36,59]` — `localStorage.getItem(STORAGE_KEY)` / `localStorage.setItem(STORAGE_KEY, ...)` |
| Timing | `performance.now()` or `Date.now()` | Reaction-time clock (render → correct keypress) | Native, no dependency. `performance.now()` is monotonic and immune to system-clock adjustments mid-session; `Date.now()` is what `firstMatchAt`/`lastMatchAt` should use since those are wall-clock timestamps meant to survive reload (persisted to localStorage) and be human-meaningful, whereas the reaction-time delta is a same-page-lifetime interval. `[ASSUMED]` — training-knowledge API guidance, not fetched from MDN this session, but both APIs are long-stable Web Platform primitives with no compatibility risk. |
| DOM construction | `document.createElement`, `textContent`, `classList` | Statistics/Settings screen rendering | Same idiom as `settings.ts`/`menu.ts` — `[VERIFIED: src/settings.ts:31-91]` (full panel built via `createElement`+`textContent`, zero `innerHTML` assignments in the file). |

### Supporting

None. No histogram/charting library, no state-management library, no test framework — all
explicitly excluded by CLAUDE.md's "What NOT to Use" table (tsparticles/GSAP/Anime.js/Framer
Motion for the histogram; Jest/Vitest for this project's scope).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Aggregated counters + fixed histogram buckets | A raw per-match event log (`{timestamp, correct, reactionMs}[]`) | Unbounded storage growth over the app's real lifetime; CONTEXT.md explicitly rejected this for exactly that reason. Aggregated counters are O(1) storage forever. |
| `performance.now()` for reaction-time delta | `Date.now()` for both the render timestamp and the persisted `firstMatchAt`/`lastMatchAt` | `Date.now()` works fine for both if the codebase prefers one API everywhere — `performance.now()`'s only advantage (monotonicity, sub-ms precision) doesn't matter at toddler reaction-time scale (100ms-8s+). Either is a defensible planner choice; not a decision this research needs to force. |
| Plain CSS `<div>` bars | SVG `<rect>` bars | UI-SPEC.md already locks the exact markup as `<div class="reaction-histogram__bar">` with inline `style.height` — SVG would be a deviation from the approved contract, not a genuine alternative. |

**Installation:** None — no `npm install` needed for this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** All functionality uses native
browser APIs (`localStorage`, DOM APIs) already exercised by the existing codebase, plus the
`canvas-confetti` dependency already installed and audited in an earlier phase. No new entries in
`package.json` are required.

## Architecture Patterns

### System Architecture Diagram

```
Keydown event (physical key press)
        │
        ▼
game-screen.ts keydown handler (existing, event.repeat/Escape filtered)
        │
        ├── match found (event.code in acceptableCodes) ─────┐
        │                                                     ▼
        │                                     existing: celebrate() / addTrailStar() /
        │                                     playChime() / speakTarget()
        │                                                     │
        │                                     NEW: reactionMs = now - lastRenderTimestamp
        │                                     NEW: recordCorrectMatch(reactionMs) ──────┐
        │                                                                                │
        └── no match ─────────────────────────────────────────┐                         │
                                             existing: incorrect-flash class,            │
                                             readSettings().resetTrailOnMistake          │
                                                                │                         │
                                             NEW: recordIncorrectMatch() ────────────────┤
                                                                                          │
                                                                                          ▼
                                                                          stats-store.ts (in-memory
                                                                          mutation + localStorage
                                                                          write, shape-checked read
                                                                          on first access)
                                                                                          │
                                                                                          ▼
                                                                          localStorage['keyboard-quest-stats']

Separately, on renderTarget() calls (mount + every correct match):
        NEW: lastRenderTimestamp = now()  ← module state in game-screen.ts, same tier as currentTarget


Statistics screen (parent-initiated, on demand):
menu.ts 'stats' row click ──▶ main.ts mountScreen('stats') ──▶ stats.ts mountStatsScreen()
                                                                        │
                                                                        ▼
                                                        stats-store.ts readStats() (shape-checked)
                                                                        │
                                                                        ▼
                                                        stats.ts renders stat-list + histogram bars
                                                        (bar height = count/maxCount * 96px, per UI-SPEC)
                                                                        │
                                          "Reset Stats" click ──────────┤
                                                                        ▼
                                                        stats-store.ts resetStats() → zeroed record,
                                                        persisted, panel re-renders in place
```

### Recommended Project Structure

No new directories — this project is a flat `src/` with one file per concern. Two new files,
following the existing naming convention exactly:

```
src/
├── stats-store.ts   # NEW — mirrors settings-store.ts: versioned record, readStats/writeStats,
│                     # recordCorrectMatch/recordIncorrectMatch, resetStats
├── stats.ts          # NEW — mirrors settings.ts: mountStatsScreen/unmountStatsScreen
├── game-screen.ts     # MODIFIED — two new call sites (correct/incorrect branches) + reaction-time
│                     # module state alongside currentTarget
├── settings.ts        # MODIFIED — new "View Statistics →" panel-link row + click dispatch
├── router.ts           # MODIFIED — Screen union gains 'stats'; VALID_SCREENS gains 'stats'
├── main.ts              # MODIFIED — mountScreen switch gains 'stats' case (both unmount and mount arms)
└── menu.ts                # MODIFIED — handleClick dispatches 'stats' row to a new onOpenStats handler
```

### Pattern 1: Versioned, shape-checked localStorage record

**What:** A `version: 1` field plus an explicit `typeof`/equality check on every field before
trusting a parsed record; any failure (missing key, parse error, wrong version, wrong field type)
resolves to a fresh default record rather than throwing.

**When to use:** Any new persisted record in this codebase — this is the established, only
pattern (`settings-store.ts` is the sole precedent and this phase's `stats-store.ts` must match it
field-for-field in structure, just with different field names/types).

**Example (verified from the actual file this session):**
```typescript
// Source: src/settings-store.ts:34-50 (read this session, verbatim)
export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
    if (!isValid) {
      return { ...DEFAULT_SETTINGS }
    }

    const soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled
    return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean, soundEnabled }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
```
`stats-store.ts`'s `readStats()` should follow this exact shape: check `version === 1` plus
`typeof correctCount === 'number'`, `typeof incorrectCount === 'number'`, an array-shape check on
the histogram buckets (`Array.isArray(parsed.histogram) && parsed.histogram.length === 5 &&
parsed.histogram.every((n) => typeof n === 'number')`), and `typeof firstMatchAt`/`lastMatchAt` as
`'number' | 'null'` (both start `null` until the first-ever match).

### Pattern 2: Windowed-panel screen module (mount/unmount lifecycle)

**What:** A screen module exports `mountXScreen(container, onBack)` / `unmountXScreen()`. Mount
defensively calls unmount first (idempotent), builds the panel via `createElement`+`textContent`
only, registers one delegated click listener on the panel plus one document-level `keydown`
listener for Escape, and stores refs in module-level `let` variables that unmount nulls out.

**When to use:** The new `stats.ts` Statistics screen — this is a structural copy of
`settings.ts`'s existing lifecycle, with the click handler switched to branch on
`.stats-reset`/`.panel-back` instead of `.toggle-switch`/`.panel-back`.

**Example (verified from the actual file this session):**
```typescript
// Source: src/settings.ts:27-126 (structure, read this session, verbatim)
export function mountSettingsScreen(container: HTMLElement, onBack: () => void): void {
  unmountSettingsScreen()
  container.replaceChildren()
  // ...build panel via createElement/textContent...
  const handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    // ...closest() delegation on click...
  }
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.repeat) return
    if (event.key === 'Escape') onBack()
  }
  clickListener = handleClick
  keydownListener = handleKeydown
  panel.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeydown)
  mountedPanel = panel
}

export function unmountSettingsScreen(): void {
  if (mountedPanel && clickListener) {
    mountedPanel.removeEventListener('click', clickListener)
  }
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener)
  }
  clickListener = null
  keydownListener = null
  if (mountedPanel?.parentElement) {
    mountedPanel.parentElement.replaceChildren()
  }
  mountedPanel = null
}
```

### Pattern 3: Fresh-read-per-call (never cache at mount)

**What:** Every read of a persisted record happens at the point of use (`readSettings()` called
inline), never cached in a module-level variable at mount time — so a change made on another
screen (e.g. flipping a toggle in Settings) is reflected immediately the next time the value is
read, with no explicit invalidation/sync mechanism needed.

**When to use:** `stats.ts`'s render function should call `readStats()` fresh on every mount and
immediately after every Reset click (not once and cache) — matching the exact precedent already in
`game-screen.ts`'s incorrect-match branch.

**Example (verified from the actual file this session):**
```typescript
// Source: src/game-screen.ts:104-109 (read this session, verbatim)
// Read fresh on every wrong key press (not cached at mount) so
// flipping the toggle in Settings and returning to a mode takes
// effect immediately.
if (readSettings().resetTrailOnMistake) {
  clearTrail()
}
```

### Pattern 4: Screen wiring (Screen union → mountScreen switch → menu dispatch)

**What:** Adding a new screen requires touching exactly four files in a fixed order:
`router.ts` (add to `Screen` union + `VALID_SCREENS`), `main.ts` (add both the unmount arm and the
mount arm of `mountScreen`'s two switch statements, plus a handler on `menuHandlers` if launched
from the menu), `menu.ts` (dispatch the row in `handleClick`, add the handler to `MenuHandlers`
interface), and the new screen module itself.

**Example (verified from the actual files this session):**
```typescript
// Source: src/router.ts:8,10 (read this session, verbatim)
export type Screen = 'menu' | 'letters' | 'numbers' | 'alphabet' | 'settings'
const VALID_SCREENS: readonly Screen[] = Object.freeze(['menu', 'letters', 'numbers', 'alphabet', 'settings'])
// → both need a new 'stats' member.

// Source: src/main.ts:28-60 (read this session, verbatim) — both switch statements need a new case:
switch (currentScreen) {
  case 'menu': unmountMenu(); break
  // ...
  case 'settings': unmountSettingsScreen(); break
  // → new: case 'stats': unmountStatsScreen(); break
}
switch (screen) {
  case 'menu': mountMenu(app, menuHandlers); break
  // ...
  case 'settings': mountSettingsScreen(app, quitToMenu); break
  // → new: case 'stats': mountStatsScreen(app, quitToMenu); break
}

// Source: src/menu.ts:296-300 (read this session, verbatim) — the dispatch comment names this exact phase:
} else if (row === 'settings') {
  handlers.onOpenSettings()
}
// stats stays undispatched — its real content belongs to the phase that
// owns that screen (Phase 4).
// → new: add `else if (row === 'stats') { handlers.onOpenStats() }` and extend
//   the MenuHandlers interface (src/menu.ts:35-39) with `onOpenStats(): void`.
```

### Anti-Patterns to Avoid

- **Caching `readStats()` result at `stats.ts` module-mount time and reusing it after Reset:**
  breaks Pattern 3 above — Reset must re-read (or directly reuse the freshly-zeroed in-memory
  record returned by the reset function) and re-render, not reuse a stale closure variable.
- **Storing the reaction-time clock inside `stats-store.ts`:** the store should be a pure
  data/persistence layer with no knowledge of *when* a target was rendered — that timing
  information only exists in `game-screen.ts` (the module that calls `renderTarget()`). Keep
  `lastRenderTimestamp` as `game-screen.ts` module state, passed into the store's record function
  as an already-computed `reactionMs` number.
- **Using `innerHTML` for the histogram bars or any new markup:** codebase-wide invariant, `[VERIFIED: src/settings.ts]` (zero `innerHTML` usages in the file this session) and explicitly called out in CONTEXT.md ("textContent/createElement, never innerHTML").
- **A second, duplicate Reset button on the Settings screen:** CONTEXT.md explicitly resolved
  SET-02 as "a link that navigates to the single Reset control on Statistics," not a second
  destructive-action implementation — UI-SPEC.md confirms this with the `.panel-link` "View
  Statistics →" markup, not a second `.stats-reset`-style button.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reaction-time histogram | A binning/scaling library or D3-style scale function | The UI-SPEC's own fixed 5-bucket linear scan (`if reactionMs < 1000 → bucket0`, etc.) | Five fixed, non-configurable buckets on a toddler-scale reaction-time domain (0-8s+) need no general-purpose binning algorithm — a single `if/else if` chain is both simpler and the literal spec. |
| Bar-height normalization | A charting library's automatic axis scaling | `Math.max(4, Math.round((count / maxCount) * 96))` per UI-SPEC's "Bar-height calculation" contract | The formula and its edge cases (`maxCount === 0`, 4px floor for a zero-count bucket among non-zero others) are already fully specified — introducing a library would replace a 1-line formula with a dependency and configuration surface. |
| Versioned schema migration | A generic schema-migration/versioning library | The same one-shot "wrong version → fresh default record" pattern `settings-store.ts` already uses | There is exactly one version (`1`) and no migration path defined yet for either store — a migration library solves a problem (multi-version upgrade paths) that doesn't exist in this codebase yet. If a `version: 2` is ever introduced, the existing precedent (invalidate-and-reset, not migrate-in-place) is the established codebase convention to extend, not to route around with a new tool. |

**Key insight:** Every "problem" in this phase already has a solved, in-repo precedent from
Phases 1-3. The correct action for the planner is near-verbatim structural imitation of
`settings-store.ts` and `settings.ts`, not net-new design.

## Common Pitfalls

### Pitfall 1: Reaction-time clock started at the wrong point, or not reset on mode entry

**What goes wrong:** If the "target rendered" timestamp is only set once at `mountGameScreen` and
never updated after each subsequent `renderTarget()` call inside the keydown handler, every
reaction time after the first would measure from the *original* mount, not the *most recent*
target — producing wildly inflated bucket values after a few matches.

**Why it happens:** `renderTarget()` is called from two places in `game-screen.ts`
(`mountGameScreen` for the opening target, and inside the correct-match branch of the keydown
handler for every subsequent target) — `[VERIFIED: src/game-screen.ts:65,95]` (`renderTarget(target, currentTarget)` appears at both line 65 and line 95). Both call sites must update the
reaction-time-clock start timestamp, not just the first.

**How to avoid:** Set the "last render" timestamp immediately after *every* `renderTarget()` call
in `game-screen.ts`, not just at mount. The natural placement is right next to each existing
`renderTarget(target, currentTarget)` call.

**Warning signs:** Reaction-time histogram bars all cluster in the `8s+` bucket even for a fast
player, or the value grows monotonically across a session instead of reflecting per-match speed.

### Pitfall 2: Counting an incorrect keypress that also fails the `event.repeat`/Escape filters

**What goes wrong:** Double-counting a held key as multiple incorrect matches, or counting Escape
as an "incorrect match" (it should exit the game entirely, never touch stats).

**Why it happens:** The keydown handler's existing filter order is: `event.repeat` returns early
first, then `Escape` returns early second, and only after both guards does the correct/incorrect
branch run — `[VERIFIED: src/game-screen.ts:69-76]` (`if (event.repeat) return` at line 69,
`if (event.key === 'Escape') { onQuit(); return }` at lines 71-74, match check begins line 76). The
new stats-recording calls must be added *inside* the existing correct/incorrect branches (after
both guards), not as a separate top-level listener that could run before/without those guards.

**How to avoid:** Place `recordCorrectMatch(...)` and `recordIncorrectMatch()` calls directly
inside the existing `if (currentTarget !== null && acceptableCodes(...).includes(event.code))`
branch and its `else` — exactly where CONTEXT.md's code_context section says they join — never in
a new independent listener.

**Warning signs:** Accuracy percentage looks implausibly low (Escape presses counting as misses),
or LPM looks implausibly high (held-key repeats counting as extra correct matches, though CORE-04
should already prevent this if the guard order is preserved).

### Pitfall 3: LPM divide-by-zero or negative-duration edge cases

**What goes wrong:** `correctCount / ((lastMatchAt - firstMatchAt) / 60000)` throws or displays
`Infinity`/`NaN` when `correctCount` is 0 (no matches yet), or when `firstMatchAt === lastMatchAt`
(exactly one correct match ever recorded — zero elapsed time, division by zero).

**Why it happens:** CONTEXT.md explicitly names this exact edge case and mandates a display
fallback (`"—"`), but the *computation* itself must guard it before formatting — a naive port of
the formula without a zero-check will produce `Infinity` or `NaN`, which then needs a *second*
special-case in the render layer to avoid literally printing "Infinity/min" or "NaN%" to a parent.

**How to avoid:** Compute LPM only when `correctCount > 0 && lastMatchAt !== firstMatchAt`;
otherwise return a sentinel (e.g. `null`) that the render layer maps to `"—"` — do this check in
one place (either the store's derived-value helper or the screen's render function, not both, to
avoid duplicated logic drifting out of sync).

**Warning signs:** `8.3/min` renders as `Infinity/min` or `NaN/min` on the very first play session
before a parent has ever checked Statistics.

### Pitfall 4: Forgetting to persist immediately after Reset, leaving a reload showing stale data

**What goes wrong:** Reset zeroes the in-memory record and re-renders the panel correctly, but if
the reset function forgets to call the store's write function (mirroring `writeSettings()`), a
page reload immediately after Reset would read the old, un-reset values back from localStorage.

**Why it happens:** Easy to treat "zero the record" and "persist the record" as one step mentally,
but `settings-store.ts`'s pattern is two explicit functions (`readSettings`/`writeSettings`) with
every mutation site responsible for calling both — a reset function that only mutates an in-memory
object and skips the `localStorage.setItem` call would silently violate STAT-02's "persist across
sessions" requirement for the one operation (Reset) where persistence matters most.

**How to avoid:** `resetStats()` in `stats-store.ts` must call the same `writeStats()` helper every
other mutation path uses, not a bespoke inline `localStorage.setItem`.

**Warning signs:** Manual QA: click Reset, reload the page, Statistics screen still shows the
pre-reset numbers.

### Pitfall 5: `firstMatchAt`/`lastMatchAt` typed as non-nullable, breaking the "no data yet" shape check

**What goes wrong:** If the stored record's `firstMatchAt`/`lastMatchAt` fields default to `0` or
`Date.now()` at store-creation time instead of `null`, the shape-check read (`typeof x ===
'number'`) will treat a genuinely-never-played record as valid, and the LPM formula's
"`firstMatchAt === lastMatchAt`" first-match check will spuriously fire as true on a record that
was simply just initialized, not one where exactly one match occurred.

**Why it happens:** `AppSettings`'s fields are all non-nullable booleans, so there's no existing
in-repo precedent for a nullable persisted field to copy exactly — this is the one place
`stats-store.ts` must diverge in *shape* (not in *pattern*) from `settings-store.ts`.

**How to avoid:** Type `firstMatchAt`/`lastMatchAt` as `number | null` in the `StatsRecord`
interface, default both to `null`, and set both explicitly on the *first* correct match only
(subsequent correct matches update only `lastMatchAt`, leaving `firstMatchAt` fixed until Reset).
The shape check must accept `null` as valid for these two fields specifically (`typeof x ===
'number' || x === null`), not require `'number'` unconditionally like the boolean fields do.

**Warning signs:** A freshly-reset record (right after clicking Reset Stats) shows a non-`"—"` LPM
value, or the very first play session after Reset immediately shows a computed (not `"—"`) LPM.

## Code Examples

### Statistics screen markup (verbatim from the approved UI-SPEC — the binding contract)

```html
<!-- Source: .planning/phases/04-session-statistics/04-UI-SPEC.md:219-257 -->
<section class="settings-panel">
  <button type="button" class="panel-back">← Back</button>
  <h1 class="panel-title">Statistics</h1>

  <div class="stat-list">
    <div class="stat-row">
      <span class="stat-row__label">Accuracy</span>
      <span class="stat-row__value">92%</span>
    </div>
    <div class="stat-row">
      <span class="stat-row__label">Letters per minute</span>
      <span class="stat-row__value">8.3/min</span>
    </div>
  </div>

  <div class="reaction-histogram">
    <span class="reaction-histogram__label">Reaction Time</span>
    <div class="reaction-histogram__bars">
      <div class="reaction-histogram__bar" style="height: 12px"></div>
      <div class="reaction-histogram__bar" style="height: 48px"></div>
      <div class="reaction-histogram__bar" style="height: 96px"></div>
      <div class="reaction-histogram__bar" style="height: 24px"></div>
      <div class="reaction-histogram__bar" style="height: 4px"></div>
    </div>
    <div class="reaction-histogram__buckets">
      <span>&lt;1s</span>
      <span>1-2s</span>
      <span>2-4s</span>
      <span>4-8s</span>
      <span>8s+</span>
    </div>
    <!-- only rendered when correctCount === 0 (no reaction-time samples yet): -->
    <p class="reaction-histogram__empty">—</p>
  </div>

  <button type="button" class="stats-reset">Reset Stats</button>
</section>
```

Full corresponding CSS block, bar-height formula, Settings-screen delta markup, and exact copy
strings are specified in `.planning/phases/04-session-statistics/04-UI-SPEC.md` ("Statistics
Screen Contract" and "Settings Screen Contract" sections) — the planner should reference that file
directly for the CSS rules rather than duplicating the full block here; it is already approved and
should be treated as final.

### Suggested `stats-store.ts` interface shape (derived from CONTEXT.md's locked data model)

```typescript
// Illustrative shape only — not a verified file, this file does not exist yet.
// Field names/types derived directly from CONTEXT.md's "Data Model" and "Persistence" decisions.
export interface StatsRecord {
  version: 1
  correctCount: number
  incorrectCount: number
  histogram: [number, number, number, number, number] // <1s, 1-2s, 2-4s, 4-8s, 8s+
  firstMatchAt: number | null
  lastMatchAt: number | null
}
```

## State of the Art

Not applicable — this phase uses only long-stable Web Platform primitives (`localStorage`, DOM
APIs) with no version-sensitive behavior. No "old vs. current approach" axis exists for this
domain; the existing codebase patterns from Phases 1-3 already represent current best practice for
a vanilla-TS static site.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `performance.now()` (vs. `Date.now()`) is the better choice specifically for the reaction-time *interval* clock, while `Date.now()` remains correct for the persisted `firstMatchAt`/`lastMatchAt` wall-clock fields | Standard Stack | Low — both APIs are functionally interchangeable at toddler reaction-time scale (no sub-millisecond precision need); using `Date.now()` everywhere instead is a valid, simpler planner choice with no correctness downside. |

**If this table is empty:** N/A — one low-risk assumption logged above; everything else in this
research is `[VERIFIED]` against source files read this session or is a direct restatement of
CONTEXT.md/UI-SPEC.md's own locked decisions.

## Open Questions

1. **Where exactly does `lastRenderTimestamp` live, and does it need resetting on unmount?**
   - What we know: It must be module-level state in `game-screen.ts` (same tier as `currentTarget`),
     set at both `renderTarget()` call sites (mount + post-match).
   - What's unclear: Whether `unmountGameScreen()` needs to null it out explicitly (like
     `currentTarget = null` at line 138) for hygiene, even though a fresh `mountGameScreen()` call
     will immediately overwrite it before it could ever be read stale.
   - Recommendation: Null it out alongside `currentTarget = null` in `unmountGameScreen()` for
     consistency with the existing pattern, even though it's not strictly required for correctness —
     costs one line, matches the file's existing defensive-reset style.

2. **Does the Settings→Statistics "View Statistics" link need a `Screen` round-trip through the
   router, or can it call `mountScreen('stats')` directly?**
   - What we know: `menu.ts`'s existing rows all go through `MenuHandlers` callbacks that `main.ts`
     wires to `mountScreen(...)` calls; `settings.ts`'s `panel-link` would need an equivalent callback
     threaded through `mountSettingsScreen(container, onBack)`'s signature (currently only takes
     `onBack`, not a general navigation callback).
   - What's unclear: Whether the planner should extend `mountSettingsScreen`'s signature to accept a
     second callback (e.g. `onViewStats: () => void`), or whether `main.ts`'s `menuHandlers`-style
     object should be generalized/reused for the Settings screen too.
   - Recommendation: Add a second parameter to `mountSettingsScreen(container, onBack, onViewStats)`
     — smallest change consistent with the existing one-callback-per-purpose signature style, avoids
     introducing a bigger "screen handlers object" refactor that this phase doesn't need.

## Environment Availability

Skipped — this phase has no external dependencies beyond the browser itself (no new npm packages,
no external services, no new CLI tools). `localStorage`, `Date.now()`/`performance.now()`, and DOM
APIs are universally available in every browser this project already targets (Phase 3's CLAUDE.md
stack table already confirms `SpeechSynthesis`/`HTMLAudioElement` browser support for the same
target matrix; `localStorage` has strictly broader support than either).

## Validation Architecture

> Note: `.planning/config.json` has `workflow.nyquist_validation: true` (default), which normally
> requires this section. However, project CLAUDE.md explicitly directs (under "What NOT to Use"):
> *"Jest/Vitest + full test-suite scaffolding... disproportionate for a solo hobby app whose
> primary QA is 'does the child enjoy playing it'... Manual testing during development."* Per this
> agent's instructions, CLAUDE.md directives carry the same authority as locked decisions and
> override default tool-config behavior. No test framework exists in this repo (`[VERIFIED: package.json]` — no `vitest`/`jest`/`@testing-library/*` in `devDependencies`; `[VERIFIED: filesystem]` — `find . -name "*.test.*" -o -name "*.spec.*"` returns zero results outside `node_modules`).
> This section therefore documents **manual browser-verification steps** as the phase's validation
> plan, not an automated test suite, consistent with the project's explicit constraint.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (by explicit CLAUDE.md directive) |
| Config file | none |
| Quick run command | `npm run dev` — manual verification in the running dev server |
| Full suite command | `npm run build` (type-checks via `tsc` + production build) — the only automated gate this project uses |

### Phase Requirements → Manual Verification Map
| Req ID | Behavior | Verification Type | Manual Steps | Automatable? |
|--------|----------|-------------------|--------------|---------------|
| STAT-01 | Records accuracy, LPM, per-match reaction time | manual | Play a mode, press several correct and incorrect keys with varying pauses; open DevTools → Application → Local Storage → `keyboard-quest-stats`; confirm `correctCount`/`incorrectCount`/`histogram`/timestamps update after each press | No — requires real keypress timing and a browser context; `tsc` build alone can't exercise runtime behavior |
| STAT-02 | Persists across sessions, versioned schema | manual | Record some matches, reload the page (`Cmd/Ctrl+R`), reopen Statistics, confirm values survived; separately, hand-edit the localStorage value to `{"version":2}` in DevTools and reload, confirm it resets to a fresh zeroed record instead of throwing | No — requires real `localStorage` persistence across a real page reload |
| STAT-03 | Statistics screen shows accuracy, LPM, histogram | manual | Open Statistics screen after some play; visually confirm all three values render and match the console-inspected localStorage record; confirm the tallest bucket's bar is exactly 96px tall (per UI-SPEC formula) | Partially — a value cross-check between rendered DOM and localStorage is scriptable via a throwaway browser console snippet during dev, but no repo test harness exists to automate this |
| STAT-04 | One-click reset, no confirmation | manual | Click "Reset Stats" once; confirm all three displays immediately show "—"/empty with no dialog; reload the page and confirm the reset persisted (not just in-memory) | No |
| STAT-05 | No live HUD during gameplay | manual | Play a mode; visually confirm no stats numbers/counters appear anywhere on the game screen (only the target character, per existing CORE-01/02 behavior) | No — a negative/absence assertion, easiest verified by eye |
| SET-02 | Settings provides access to reset stats | manual | Open Settings, click "View Statistics →", confirm it navigates to the Statistics screen where Reset lives | No |

### Sampling Rate
- **Per task commit:** `npm run build` (type-check + build must pass — this is the only automated
  gate available in this project).
- **Per wave merge:** Full manual walkthrough of the table above in a real browser (`npm run dev`).
- **Phase gate:** All six manual verification rows above pass before `/gsd:verify-work` — consistent
  with this project's existing verification-deferred-to-human pattern already used for Phases 02,
  02.1, and 03 (`[VERIFIED: .planning/STATE.md]` — "Deferred Verification" table lists all three
  prior phases as `verification_deferred_human`).

### Wave 0 Gaps
- None — no test framework install is being introduced (would contradict CLAUDE.md). The "gap" this
  phase has instead is the absence of any automated coverage for the new store logic
  (`stats-store.ts`'s LPM/accuracy math, bucket-selection logic); if the planner wants a lightweight
  automated safety net without violating CLAUDE.md's "no Jest/Vitest" directive, the only in-repo
  precedent for automated checking is `tsc`'s type-check step — pure-function unit assertions are
  not currently possible without introducing a test runner, which this project's constraints
  explicitly reject. Flagged for visibility, not treated as a blocking gap.

## Security Domain

> `.planning/config.json` has `workflow.security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No accounts/auth exist anywhere in this app (CLAUDE.md: "Auth libraries... No user accounts exist or are planned"). |
| V3 Session Management | No | No server sessions; the only "session" concept is a browser tab's lifetime, not a security boundary. |
| V4 Access Control | No | No privilege tiers — every visitor to the page has identical access to their own browser's localStorage. |
| V5 Input Validation | Yes | Shape-checked reads on every localStorage access — `typeof`/array-shape/equality checks before trusting any parsed field, exactly the pattern already in `settings-store.ts` (verified this session) and required again for `stats-store.ts`. A hand-edited or corrupted localStorage value must never be trusted into a computed display value (e.g. a manually-set giant `correctCount` should not crash the histogram render — `Math.max`/division guards, per Pitfall 3, are the input-validation control here). |
| V6 Cryptography | No | No secrets, no encryption need — stats are non-sensitive local play-pattern data (match counts, timing), not PII in any meaningful sense (no name, no identity — CLAUDE.md's redaction incident in Phase 1 was about a *different* kind of PII, the child's real name in doc files, not gameplay stats). |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Hand-edited/corrupted localStorage value (e.g. via DevTools, or a browser extension writing garbage into the shared origin storage) causing a crash, `NaN`/`Infinity` display, or unbounded histogram bar | Tampering | Shape-checked read (Pattern 1 above) resolves any invalid record to a fresh zeroed default rather than trusting partial/malformed data; LPM/accuracy computation guards divide-by-zero explicitly (Pitfall 3). This is the same mitigation already proven correct for `settings-store.ts` in prior phases. |
| A malicious/buggy value for `histogram` (e.g. a negative number, or a value inflated to make `Math.round((count/maxCount)*96)` overflow) breaking the bar-height CSS | Tampering | The shape check enforces `typeof n === 'number'` per bucket but should additionally reject negative values (`n >= 0`) during validation, since a negative count is not representable by any real gameplay sequence and would otherwise silently corrupt the `maxCount`/ratio calculation (e.g. a negative bucket count could make another bucket's computed height exceed the 96px container if `Math.max` isn't applied defensively at the ratio, not just the floor). |
| Denial of legitimate play via localStorage quota exhaustion (many small `setItem` calls, one per match, over a very long play history) | Denial of Service (self, not adversarial) | Already covered by CONTEXT.md's aggregated-counters design (O(1) storage regardless of match count) and the existing silent-degrade-on-write-failure contract (`settings-store.ts`'s established pattern) — a quota failure degrades to session-only stats, never crashes gameplay. |

No new attack surface is introduced by this phase beyond what `settings-store.ts` already
established and has presumably already passed prior-phase security review — `stats-store.ts` should
inherit the identical mitigations, not invent new ones.

## Sources

### Primary (HIGH confidence — read directly this session)
- `src/settings-store.ts` (full file, 65 lines) — versioned/shape-checked localStorage pattern
- `src/settings.ts` (full file, 145 lines) — windowed-panel mount/unmount lifecycle
- `src/game-screen.ts` (full file, 141 lines) — keydown handler correct/incorrect branches, `renderTarget()` call sites
- `src/game.ts` (full file, 96 lines) — `renderTarget()` implementation, mode-aware selection helpers
- `src/router.ts` (full file, 41 lines) — `Screen` union, `VALID_SCREENS` allow-list pattern
- `src/menu.ts` (full file, 397 lines) — `MenuRow`/`MenuHandlers`, undispatched `'stats'` row comment (line 299-300)
- `src/main.ts` (full file, 93 lines) — `mountScreen` switch, `menuHandlers` wiring
- `src/style.css` lines 1-10, 295-389 — CSS custom properties, `.settings-panel`/`.panel-back`/`.panel-title`/`.toggle-row`/`.toggle-switch` rules
- `package.json` — confirmed no test framework, no new dependency needed
- `.planning/config.json` — confirmed `nyquist_validation: true`, `security_enforcement: true`, `security_asvs_level: 1`
- `.planning/phases/04-session-statistics/04-CONTEXT.md` — locked data-model and persistence decisions
- `.planning/phases/04-session-statistics/04-UI-SPEC.md` — approved markup/CSS/copy/behavior contract
- `.planning/REQUIREMENTS.md` — STAT-01..05, SET-02 exact wording
- `.planning/STATE.md` — prior-phase verification-deferred-to-human precedent

### Secondary (MEDIUM confidence)
- None used — no web search was needed; every claim in this research derives from files read
  directly in the working repo this session, or from the already-locked CONTEXT.md/UI-SPEC.md
  decisions.

### Tertiary (LOW confidence)
- `performance.now()` vs `Date.now()` API guidance (Assumptions Log A1) — training knowledge, not
  verified against MDN this session; both are long-stable, low-risk primitives.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, every pattern verified against source files read this session
- Architecture: HIGH — direct structural mirror of two existing, working modules (`settings-store.ts`, `settings.ts`)
- Pitfalls: HIGH — derived from exact line-level reading of the keydown handler and render call sites, not speculation

**Research date:** 2026-08-14
**Valid until:** No expiry driver — this research depends only on the current (already-read) state of the local codebase, not on any external package or API that could drift. Re-verify only if `game-screen.ts`, `settings-store.ts`, or `settings.ts` change materially before this phase is planned/executed.

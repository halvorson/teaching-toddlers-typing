# Architecture Research

**Domain:** Small single-page, animation-heavy, client-only browser game (toddler letter/number keyboard matching)
**Researched:** 2026-08-12
**Confidence:** MEDIUM (standard web-platform patterns, verified across MDN + multiple independent tutorials; no project-specific prior art for this exact game shape)

## Standard Architecture

This class of app (Vite + TypeScript, no framework, single page, few screens, heavy on feel/animation, light on data) is best served by a **tiny hand-rolled state machine + pub/sub event bus**, not a framework or a state-management library. Pulling in React/Redux/XState for ~5 screens and one input listener would add build complexity disproportionate to the problem — the "framework-light" constraint in PROJECT.md is the right call, and research confirms this is the standard approach for small vanilla-JS games (Jake Gordon's *Javascript Game Foundations*, *Game Programming Patterns* State chapter, and multiple 2024-2025 vanilla-JS game tutorials all converge on this pattern).

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         App Shell (main.ts)                        │
│   Owns: root DOM container, AppStateMachine instance, boot order   │
├───────────────────────────────────────────────────────────────────┤
│                      AppStateMachine (screens)                     │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐            │
│  │  Menu    │  │  Game     │  │ Stats  │  │ Settings │            │
│  │  Screen  │  │  Screen   │  │ Screen │  │  Screen  │            │
│  └────┬─────┘  └─────┬─────┘  └───┬────┘  └────┬─────┘            │
│       │  each screen: enter(), exit(), owns its own DOM subtree    │
├───────┴──────────────┴─────────────┴─────────────┴─────────────────┤
│                     Cross-cutting Services (singletons)             │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │  Keyboard  │ │  Celebration │ │ Fullscreen │ │  EventBus     │  │
│  │  Input     │ │  /Animation  │ │ Controller │ │  (pub/sub)    │  │
│  │  Handler   │ │  Module      │ │            │ │               │  │
│  └────────────┘ └──────────────┘ └────────────┘ └──────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                       Persistence Layer                             │
│  ┌──────────────────┐        ┌──────────────────┐                  │
│  │  StatsStore       │        │  SettingsStore    │                  │
│  │  (localStorage)   │        │  (localStorage)   │                  │
│  └──────────────────┘        └──────────────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| App shell (`main.ts`) | Boots the app, creates singletons in dependency order, mounts the state machine into the root DOM node | Single entry file; no logic beyond wiring |
| AppStateMachine | Holds "current screen," exposes `goTo(screenName)`, calls `exit()` on old screen and `enter()` on new screen | Small class or closure-based object; enum/union of screen names |
| Menu Screen | Renders vertical list (Letters/Numbers/Alphabet/Statistics/Settings/Quit), routes selection to `AppStateMachine.goTo()` | Plain DOM builder function + click/keyboard handlers scoped to menu only |
| Game Screen | One shared screen instance parameterized by **mode strategy** (Letters/Numbers/Alphabet); owns target-generation, renders the big target glyph, listens to match events | Composition: `GameScreen` takes a `TargetStrategy` interface injected per mode |
| Target Generation Strategies | Produce next target given game state (random letter, random digit, sequential letter with wraparound) | 3 small strategy objects/functions implementing one interface (`next(state): Target`) |
| Keyboard Input Handler | Single `keydown` listener attached once (likely at document level, active only while Game Screen is mounted); normalizes `event.key`, filters modifiers/repeats, emits a normalized "key pressed" event | Owned/activated by Game Screen on `enter()`, torn down on `exit()` to avoid leaks across screens |
| Match Logic | Compares normalized key to current target, decides correct/incorrect | Pure function, lives inside Game Screen or a small `matcher.ts` — no DOM/animation coupling |
| Celebration/Animation Module | Plays visual (and optional audio) celebration on correct match; distinguishes normal vs. "big" (alphabet-complete) celebration | Self-contained module exposing `celebrate(kind: 'normal' | 'big')`; owns its own DOM overlay/CSS classes and timers, no knowledge of game logic |
| Fullscreen Controller | Enters fullscreen on Play (user-gesture-triggered), exits on leaving game, listens for `fullscreenchange` to stay in sync with OS/browser-driven exits (Esc key, swipe) | Small module wrapping `requestFullscreen()`/`exitFullscreen()` + a `fullscreenchange` listener; exposes `enter()`, `exit()`, `isFullscreen()` |
| StatsStore | Records per-session stats (correct/incorrect counts, reaction times, timestamps) and persists to `localStorage`; exposes read/append/reset API | Class or module wrapping a versioned JSON blob in `localStorage`, with try/catch parse guarding |
| SettingsStore | Holds sound on/off and stats-collection on/off; persists to `localStorage`; read synchronously at boot | Same versioned-JSON pattern as StatsStore, separate key |
| EventBus (optional but recommended) | Decouples Game Screen from Celebration Module and StatsStore — publishes `match:correct` / `match:incorrect` events; subscribers react independently | ~15-line pub/sub class: `on(event, cb)`, `emit(event, payload)` |

## Recommended Project Structure

```
src/
├── main.ts                    # boot: construct stores, state machine, mount
├── app-state-machine.ts       # screen switching (enter/exit lifecycle)
├── event-bus.ts                # tiny pub/sub, shared singleton
├── screens/
│   ├── menu-screen.ts          # vertical menu, Slay-the-Spire style
│   ├── game-screen.ts          # shared engine: renders target, wires input+match+celebration
│   ├── stats-screen.ts         # reads StatsStore, renders accuracy/LPM/histogram
│   └── settings-screen.ts      # reads/writes SettingsStore
├── game/
│   ├── target-strategies.ts    # LettersStrategy, NumbersStrategy, AlphabetStrategy (one interface)
│   ├── matcher.ts               # normalizeKey(), isMatch(target, event) — pure functions
│   └── types.ts                 # GameMode, Target, MatchResult types
├── services/
│   ├── keyboard-input.ts        # attach/detach keydown listener, emits normalized events
│   ├── celebration.ts           # celebrate('normal' | 'big'), owns its DOM/CSS/timers
│   ├── fullscreen.ts            # enter/exit/isFullscreen + fullscreenchange sync
│   └── sound.ts                 # optional audio playback, respects SettingsStore
├── storage/
│   ├── stats-store.ts            # versioned localStorage schema for session stats
│   └── settings-store.ts         # versioned localStorage schema for settings
└── styles/
    └── ...                       # CSS for pearlescent/dark theme, celebration keyframes
```

### Structure Rationale

- **`screens/` vs `services/` vs `game/` split:** screens own DOM and lifecycle (what's currently visible); services are cross-cutting singletons that outlive any one screen (fullscreen, celebration, sound); `game/` is pure logic with zero DOM dependencies, making target generation and match-checking trivially unit-testable without a browser.
- **`storage/` isolated from `game/`:** the game engine never touches `localStorage` directly — it emits events (or calls a passed-in callback) and `StatsStore` decides what/how to persist. This keeps the engine reusable and testable, and keeps schema/versioning concerns in one place.
- **One `game-screen.ts`, three strategies:** avoids duplicating the target-display-and-listen-for-match loop three times. `PROJECT.md` explicitly frames Letters/Numbers/Alphabet as three modes of one system, which maps directly to the Strategy pattern.

## Architectural Patterns

### Pattern 1: Pushdown-lite Finite State Machine for Screens

**What:** A single `currentScreen` reference; `goTo(next)` calls `currentScreen.exit()`, swaps the reference, then calls `next.enter()`. No history stack is needed here since the child's app has no nested modals — Quit/back always returns to Menu.
**When to use:** Any app with a small, fixed set of mutually-exclusive top-level views. This is exactly the Menu/Game/Stats/Settings shape in PROJECT.md.
**Trade-offs:** Trivial to implement and reason about; the only cost is manual discipline to always tear down a screen's listeners/timers in `exit()` — skipping this is the most likely source of bugs (see Anti-Patterns).

**Example:**
```typescript
interface Screen {
  enter(): void;
  exit(): void;
}

class AppStateMachine {
  private current: Screen | null = null;
  goTo(next: Screen) {
    this.current?.exit();
    this.current = next;
    next.enter();
  }
}
```

### Pattern 2: Strategy Object for Target Generation

**What:** One `GameScreen` implementation, injected with a `TargetStrategy` (`{ next(prevTarget, history): Target }`) per mode. Letters picks random A-Z (optionally avoiding immediate repeats), Numbers picks random 0-9, Alphabet advances sequentially and wraps A→Z→A with a "big celebration" flag on wraparound.
**When to use:** When several game modes share ~90% of their loop (render target → listen for key → match → celebrate → advance) and differ only in "what's next."
**Trade-offs:** Keeps `GameScreen` mode-agnostic and easy to extend (a future "Words" mode is just a new strategy); slight indirection cost that's well worth it for 3 modes with this much shared logic.

**Example:**
```typescript
interface TargetStrategy {
  mode: 'letters' | 'numbers' | 'alphabet';
  next(prev: string | null): { value: string; isWrapCompletion: boolean };
}

const alphabetStrategy: TargetStrategy = {
  mode: 'alphabet',
  next(prev) {
    const A = 'A'.charCodeAt(0), Z = 'Z'.charCodeAt(0);
    const nextCode = prev ? (prev.charCodeAt(0) === Z ? A : prev.charCodeAt(0) + 1) : A;
    return { value: String.fromCharCode(nextCode), isWrapCompletion: prev === 'Z' };
  },
};
```

### Pattern 3: Pub/Sub Event Bus for Cross-Cutting Reactions

**What:** Game Screen doesn't call `celebration.celebrate()` and `statsStore.recordCorrect()` directly inline — it `emit('match:correct', { target, reactionTimeMs, isWrapCompletion })` on a shared bus. Celebration module and StatsStore each subscribe independently.
**When to use:** When one input event (a correct keypress) needs to trigger multiple independent side effects (animation + sound + stat recording + advancing to next target) that shouldn't need to know about each other.
**Trade-offs:** Adds one layer of indirection versus direct function calls; worth it here because it keeps `matcher.ts`/`game-screen.ts` free of persistence and animation concerns, and makes it trivial to add a future feature (e.g., a live stats HUD, explicitly deferred per PROJECT.md) by adding a new subscriber with zero changes to the game loop. For a project this size, a direct-call approach (`onMatch(result) { celebration.celebrate(...); stats.record(...); }`) is also acceptable — the event bus is a nice-to-have, not a hard requirement. Recommend the event bus specifically because PROJECT.md flags a **future** stats HUD/game-over screen as a known extension point.

**Example:**
```typescript
class EventBus {
  private listeners = new Map<string, Set<(payload: any) => void>>();
  on(event: string, cb: (payload: any) => void) {
    (this.listeners.get(event) ?? this.listeners.set(event, new Set()).get(event)!).add(cb);
  }
  emit(event: string, payload: any) {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }
}
```

## Data Flow

### Primary Flow: Correct Keypress in Game Screen

```
Physical keydown
    ↓
KeyboardInputHandler (attached only while Game Screen is mounted)
  - reads event.key (layout-aware, matches printed keycap)
  - ignores event.repeat === true (held key)
  - ignores modifier-only keys (Shift, Control, Alt, Meta, CapsLock, Tab, Escape, etc.)
  - lowercases both event.key and the target value for comparison
    ↓
matcher.isMatch(currentTarget, normalizedKey)
    ↓ (correct)                              ↓ (incorrect)
GameScreen.onMatch()                    GameScreen.onMiss()
    ↓                                        ↓
emit('match:correct', {                 subtle neutral flicker
  target, reactionTimeMs,                (no stat penalty per
  isWrapCompletion })                     PROJECT.md — "no
    ↓                                     punitive" requirement)
  ├─→ CelebrationModule.celebrate(
  │     isWrapCompletion ? 'big' : 'normal')
  ├─→ SoundModule.play() (if settings.soundOn)
  ├─→ StatsStore.recordAttempt({ correct: true, reactionTimeMs, target, ts })
  └─→ GameScreen requests next target from active TargetStrategy
        ↓
      re-render target glyph, reset reaction-time clock
```

### Screen Navigation Flow

```
User selects Menu item (click or Enter/Space on focused item)
    ↓
MenuScreen calls AppStateMachine.goTo(screen)
    ↓
current.exit()  — e.g. GameScreen.exit() detaches keyboard listener,
                  calls FullscreenController.exit(), clears any pending timers
    ↓
next.enter()    — e.g. GameScreen.enter() attaches keyboard listener,
                  calls FullscreenController.enter() (only from a user gesture,
                  so this must happen synchronously inside the click handler
                  that triggered goTo, not after an await)
```

**Important sequencing note:** Because `requestFullscreen()` requires an active user-gesture call stack, `FullscreenController.enter()` must be invoked synchronously from the "Play" click handler — if `GameScreen.enter()` does any `await` before calling it, the browser will silently reject the fullscreen request. Keep the gesture-to-fullscreen call chain synchronous.

### Persistence Flow (Stats)

```
StatsStore.recordAttempt(entry)
    ↓
append entry to in-memory session array
    ↓
serialize { schemaVersion, sessions: [...] } → JSON.stringify
    ↓
localStorage.setItem('keyboard-quest:stats', json)   (wrapped in try/catch —
                                                        localStorage can throw
                                                        in private-browsing/
                                                        quota-exceeded cases)
```

Read path on boot: `localStorage.getItem(...)` → try/catch `JSON.parse` → check `schemaVersion` → if mismatched/missing, discard or migrate → hydrate `StatsStore`. Same pattern for `SettingsStore` under a separate key.

### State Management Approach (Explicit Recommendation)

For this project's scope, **no state library is needed.** The right-sized approach is:

1. **Screen-level state** (which screen is active) → the hand-rolled `AppStateMachine` (Pattern 1).
2. **Game-loop state** (current target, reaction-time clock start, mode) → owned locally inside `GameScreen`, not global. It's reset on every `enter()`.
3. **Cross-cutting/persistent state** (stats, settings) → two small store modules (`StatsStore`, `SettingsStore`) that wrap `localStorage`, expose plain getter/setter methods, and are constructed once in `main.ts` and passed (or imported as singletons) into whichever screens need them.
4. **Cross-component notifications** (match happened, mode changed) → the lightweight `EventBus` (Pattern 3), optional but recommended given the explicitly-deferred future stats HUD.

This avoids both extremes: no framework-scale state library (Redux/Zustand/XState) is justified for ~4 screens and one shared piece of session data, and no fully-global mutable singleton soup either — each store has a narrow, explicit API.

## Scaling Considerations

This is a single-family hobby app with no user growth trajectory, no backend, and no realistic path to needing horizontal scale. "Scaling" here means code complexity as features are added, not traffic.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current scope (4 screens, 3 modes, 1 device) | Exactly the structure above — hand-rolled FSM + pub/sub + 2 localStorage stores. No build step beyond Vite's default. |
| If more game modes are added (e.g. future "Words" mode, uppercase/lowercase toggle) | Add another `TargetStrategy` implementation; no architectural change needed — this is the entire point of the Strategy pattern here. |
| If a live in-session stats HUD is added (explicitly deferred in PROJECT.md) | Subscribe a new `HudModule` to the existing `match:correct`/`match:incorrect` events on the EventBus — zero changes to `GameScreen` or `matcher.ts` required, validating the pub/sub choice now. |
| If stats data model grows complex (e.g., per-letter mastery tracking, multiple child profiles) | `StatsStore`'s versioned-schema pattern already supports migrations; add a `schemaVersion` bump + migration function rather than a new storage engine. Still does not warrant IndexedDB at this data volume (a few hundred attempts/session, plain JSON is well under localStorage's ~5MB cap). |

### Scaling Priorities

1. **First (and only realistic) bottleneck:** `localStorage` quota/corruption edge cases (private browsing, quota exceeded, manually-edited storage). Mitigate now with try/catch + schema versioning (Pattern in Data Flow above) rather than treating it as a later concern — it's cheap to build in from the start and prevents a corrupted stats blob from crashing app boot.
2. **Second, lower priority:** keyboard listener leaks if `exit()` lifecycle discipline isn't followed when adding new screens later — mitigate by making listener attach/detach part of the `Screen` interface contract (documented, not just convention) from the first phase that implements it.

## Anti-Patterns

### Anti-Pattern 1: Global `document.addEventListener('keydown', ...)` Registered Once at App Boot

**What people do:** Attach the keyboard listener in `main.ts` at startup and leave it active for the app's whole lifetime, with an `if (currentScreen === 'game')` guard inside the handler.
**Why it's wrong:** Couples the input handler to knowledge of which screen is active, makes it easy to accidentally process keystrokes meant for a text input on the Settings screen (if one is ever added) as game matches, and scatters "is game active" checks across the handler instead of using screen lifecycle.
**Do this instead:** Attach the `keydown` listener inside `GameScreen.enter()` and remove it in `GameScreen.exit()`. The listener only exists while the Game Screen is mounted — this is the direct payoff of the FSM lifecycle pattern.

### Anti-Pattern 2: Coupling Match Logic to DOM/Animation Code

**What people do:** Put the "is this the right key" check directly inside the `keydown` handler alongside DOM manipulation and CSS class toggling for the celebration.
**Why it's wrong:** Makes `matcher.ts`-equivalent logic untestable without a browser/DOM, and conflates three concerns (input normalization, matching, presentation) that change for different reasons — e.g., changing celebration visuals shouldn't risk breaking match detection.
**Do this instead:** Keep `normalizeKey()` and `isMatch()` as pure functions with no DOM access, unit-testable directly. Presentation (`celebration.ts`) only ever receives a `celebrate(kind)` call after the match decision is already made.

### Anti-Pattern 3: Storing Raw, Unversioned JSON in localStorage

**What people do:** `localStorage.setItem('stats', JSON.stringify(sessions))` with no wrapper, no schema marker, and unguarded `JSON.parse` on read.
**Why it's wrong:** Any future change to the stats shape (e.g., adding reaction-time histograms, per-mode breakdowns) either silently breaks on old data or requires defensive `?.`-chaining scattered through `stats-screen.ts`. A corrupted or manually-edited value (or a private-browsing quota error) throws an uncaught exception on app boot, taking down the whole app before the user sees the menu.
**Do this instead:** Wrap every read in try/catch, store a `schemaVersion` field, and give `StatsStore`/`SettingsStore` a single choke point for parsing so this is handled once rather than at every call site.

### Anti-Pattern 4: Triggering `requestFullscreen()` Outside the User Gesture

**What people do:** Call `goTo(gameScreen)` on click, and inside `GameScreen.enter()` do some async setup (e.g., `await loadSomething()`) before calling `requestFullscreen()`.
**Why it's wrong:** Browsers require fullscreen requests to originate synchronously within a user-gesture call stack; an intervening `await` breaks that chain and the browser silently rejects the promise, leaving the game not fullscreen with no obvious error.
**Do this instead:** Call `FullscreenController.enter()` synchronously as the first thing in the click handler (or make `GameScreen.enter()` itself synchronous, deferring anything async to run after fullscreen is requested).

## Integration Points

### External Services

None. This app is fully static/client-only per PROJECT.md constraints (no backend, no auth, no accounts). The only "external" integration is the browser Fullscreen API and, optionally, the Web Audio/`<audio>` element for celebration sound — both are browser-native APIs, not third-party services.

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Fullscreen API | `Element.requestFullscreen()` / `document.exitFullscreen()` + `fullscreenchange` listener | Must be user-gesture-triggered; listen for `fullscreenchange` to catch OS/browser-driven exits (Esc, mobile swipe) and sync app state back to Menu if the child accidentally exits fullscreen mid-game |
| Web Audio / `<audio>` | Preload short celebration/letter-name clips, play on `celebrate()` if `settings.soundOn` | Respect the Settings toggle; keep sound optional and muted-by-default-friendly for a toddler context (some browsers also require a user gesture before audio playback is allowed, which the Play-button click satisfies) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MenuScreen ↔ AppStateMachine | Direct method call (`goTo(screen)`) | One-directional; Menu doesn't need to know screen internals |
| GameScreen ↔ KeyboardInputHandler | GameScreen owns/attaches it in `enter()`, receives normalized "key pressed" callbacks | Keeps raw `KeyboardEvent` handling in one place, isolated from match logic |
| GameScreen ↔ TargetStrategy | Composition/dependency injection — GameScreen calls `strategy.next(prev)` | Strategy has zero knowledge of DOM or input; purely data-in/data-out |
| GameScreen ↔ CelebrationModule | Either direct call (`celebration.celebrate(kind)`) or via EventBus | Direct call is fine for MVP; EventBus recommended if the deferred stats-HUD/game-over screen is likely to land soon after MVP |
| GameScreen ↔ StatsStore | Same as above — direct call or EventBus subscriber | StatsStore should never be reached into from CelebrationModule or vice versa; each is a separate subscriber/consumer of the match event |
| GameScreen ↔ FullscreenController | GameScreen calls `enter()`/`exit()` on screen transition; FullscreenController calls back (via EventBus or a passed callback) if `fullscreenchange` reports an unexpected exit, so GameScreen can route back to Menu | Two-directional — this is the one place a callback/event is needed rather than a one-way call, since fullscreen can be exited from outside the app's control |
| SettingsScreen ↔ SettingsStore | Direct read/write | SettingsStore is the single source of truth; SettingsScreen just renders/toggles it |
| StatsScreen ↔ StatsStore | Direct read (aggregation: accuracy %, letters-per-minute, reaction-time histogram computed in `stats-screen.ts` or a small `stats-aggregation.ts` helper from raw StatsStore data) | Read-only from StatsScreen's perspective; "reset stats" button calls `StatsStore.reset()` |

## Suggested Build Order

Dependency-driven order for roadmap phase structure (each item depends on what's above it):

1. **App shell + AppStateMachine + one empty screen** — establishes the FSM skeleton and boot wiring before any feature exists to hang off it.
2. **SettingsStore + StatsStore (persistence layer, schema-versioned)** — build and unit-test these standalone before any screen consumes them; they have no DOM dependency and are the easiest thing to get right in isolation.
3. **KeyboardInputHandler + matcher.ts (pure logic)** — normalize/match logic can be built and tested with synthetic `KeyboardEvent`-like objects before any Game Screen UI exists.
4. **Target strategies (Letters, Numbers, Alphabet)** — pure functions, no DOM, buildable/testable independently of the screen that will use them.
5. **GameScreen** — wires together KeyboardInputHandler + matcher + one TargetStrategy + StatsStore recording; this is the first point all the pure pieces above become a working (unstyled) game loop.
6. **CelebrationModule** — layer in animation/visual feedback once the core match loop works; deliberately last among game-loop pieces since it's the most iteration-heavy (tuning "feel") and easiest to keep decoupled if built after the logic it decorates.
7. **FullscreenController** — wire into GameScreen's `enter()`/`exit()` once GameScreen itself is stable; depends on having a working Play-button user gesture to hook into.
8. **MenuScreen** — can be built visually in parallel with steps 2-4 (it only needs `AppStateMachine.goTo` as a dependency), but should be wired to route to a real GameScreen only once step 5 exists.
9. **StatsScreen and SettingsScreen** — depend on StatsStore/SettingsStore (step 2) being finalized; naturally follow GameScreen since stats have no data to display until real sessions have been recorded.
10. **Share-link affordance, GitHub Pages deploy config** — orthogonal to the above; can be done anytime but is natural to sequence last as a "wrap-up" concern once the core app is navigable end-to-end.

This ordering front-loads the parts with no DOM dependency (pure logic, persistence) so they can be built and verified in isolation, and defers the most subjective/iterative part (celebration "feel") until the mechanical loop it decorates is already correct.

## Sources

- MDN — [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) (MEDIUM confidence, cross-verified)
- MDN — [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) (MEDIUM confidence, cross-verified)
- MDN — [Element.requestFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) (MEDIUM confidence, cross-verified)
- MDN — [Document: fullscreenchange event](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event) (MEDIUM confidence, cross-verified)
- MDN — [Fullscreen API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide) (MEDIUM confidence, cross-verified)
- Jake Gordon — [Javascript Game Foundations: State Management](https://codeincomplete.com/articles/javascript-game-foundations-state-management/) (MEDIUM confidence)
- Robert Nystrom — [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html) (MEDIUM confidence)
- tinykeys (jamiebuilds) — [README / modifier-key handling approach](https://github.com/jamiebuilds/tinykeys/blob/main/README.md) (MEDIUM confidence, illustrates modifier-matching pattern; not proposed as a dependency for this project — recommend hand-rolling the ~10 lines needed rather than adding a library)
- Sinclair Software — [Type safe local storage](https://www.sinclair.software/articles/typesafe-localstorage/) (MEDIUM confidence, illustrates versioned schema + try/catch pattern)
- go makethings — [Going full screen with vanilla JS](https://gomakethings.com/going-full-screen-with-vanilla-js/) (MEDIUM confidence, cross-verified against MDN)
- Project context: `/Users/michael/Coding/teaching-toddlers-typing/.planning/PROJECT.md`

---
*Architecture research for: toddler keyboard letter/number matching game (Vite + TypeScript, no framework, GitHub Pages static deploy)*
*Researched: 2026-08-12*

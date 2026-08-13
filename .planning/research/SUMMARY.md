# Project Research Summary

**Project:** Keyboard Quest (teaching-toddlers-typing)
**Domain:** Small, animation-heavy, static browser game for toddlers (2-3yo) — physical-keyboard letter/number matching, no backend
**Researched:** 2026-08-12
**Confidence:** HIGH

## Executive Summary

Keyboard Quest is a solo hobby project: a single-page, framework-free browser game that teaches a toddler to match a big on-screen letter or number to the correct physical keyboard key, celebrating every correct match with a muted, pearlescent-themed animation. It sits deliberately between two existing app genres — "smash the keyboard" cause-and-effect toys (which reward any keypress, no correctness concept) and structured letter-recognition apps for slightly older kids (3-6yo, often with phonics/tracing curricula). Its differentiator is combining the zero-friction, always-succeed feedback loop of the former with the accurate key-to-letter matching mechanic of the latter, tuned to be forgiving enough for the 2-3yo band. Research across all four dimensions (stack, features, architecture, pitfalls) converges strongly and consistently: this is a well-understood problem shape (small static site, standard web platform APIs) with no exotic technology risk — the real risk is entirely in the fine-grained UX/input-handling details of building for a toddler.

The recommended approach is Vite + TypeScript 5.9.x with **zero UI framework** — a hand-rolled finite-state-machine for screen navigation (Menu/Game/Stats/Settings), a Strategy-pattern game engine shared across Letters/Numbers/Alphabet modes, and two small `localStorage`-backed stores (stats, settings) with versioned schemas from day one. The only runtime dependency needed is `canvas-confetti` (~6KB) for the celebration burst; everything else (speech, audio, fullscreen, persistence) is native browser API. Deployment is GitHub Pages via the official first-party GitHub Actions workflow.

The key risks are concentrated in browser-platform edge cases that are invisible during normal developer testing but surface immediately in real toddler use: fullscreen must be entered synchronously from the Play click (not after any `await`) and must gracefully resync when the toddler/OS exits it unexpectedly (Escape, swipe); keyboard matching must use `event.code` (physical key) rather than `.key` so Shift/Caps Lock/layout never produces a false "wrong" result, and must ignore `event.repeat` so a held key doesn't flood stats/celebrations; `localStorage` must be wrapped defensively (private browsing throws, iOS Safari evicts, schema can drift across deploys with no staging environment); and celebration animations must use only `transform`/`opacity` to stay smooth on the lower-end tablets/laptops toddlers typically inherit. None of these require new technology — they require disciplined, deliberate implementation choices captured explicitly in the phase plan below.

## Key Findings

### Recommended Stack

Vite 8.2.1 + TypeScript 5.9.3 (explicitly pinned below the `latest` 7.x tag, which breaks `typescript-eslint` compatibility) + native HTML5/CSS3, with **no UI framework** — confirming the project's own stated direction. The single runtime dependency is `canvas-confetti` for the celebration burst; `SpeechSynthesis`, `HTMLAudioElement`, `localStorage`, and the Fullscreen API are all used as browser globals with no install. Deployment is GitHub Pages via the official `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages` workflow, triggered on push to `main` (matching the "no staging, every push is prod" constraint).

**Core technologies:**
- Vite 8.2.1 — build tool/dev server — zero-config scaffold (`vanilla-ts` template), HMR, production-optimized static build for GitHub Pages
- TypeScript 5.9.3 — type safety — pinned below 6.1.0 because `typescript-eslint@8.67.0` explicitly rejects TS 7.x (no stable Compiler API yet)
- Vanilla TypeScript, no framework — application logic — ~5 screens and one keydown listener don't justify React/Vue/Svelte's virtual-DOM and bundle overhead
- canvas-confetti 1.9.4 — celebration burst — 6KB, zero deps, canvas-based, tunable to a muted pearlescent palette; the only third-party runtime dependency
- Web Speech API / HTMLAudioElement (native) — optional spoken letter + chime sound — no install, gated behind the same user-gesture requirement the game already satisfies via keypress

### Expected Features

The product must borrow the "always succeed, zero setup, fullscreen safety" mechanics of smash-toy toys while adding real key-to-letter accuracy — a combination almost no competitor does cleanly for the 2-3yo band. All findings are MEDIUM confidence (informal product category, no official specs) but consistent across many independently-reviewed sources.

**Must have (table stakes):**
- Instant visual+audio reaction to correct input (<0.5-1s)
- Big, high-contrast, single focal target (no clutter)
- No failure/punitive state — neutral flicker only, never a red-X/buzzer
- Fullscreen, distraction-free play mode with reliable exit handling
- Zero reading required in child-facing gameplay UI (menu text is parent-facing only)
- No accounts/login/setup friction
- Forgiving handling of physical-key mis-hits (imprecise toddler motor control)
- No flashing/strobing/jarring stimuli
- No forced session length, timers, or countdowns
- Optional sound with an easy, persistent mute
- Reliable physical-keyboard `keydown` handling (including held/repeat keys)
- No immediate repeat of the same random target

**Should have (differentiators — already scoped as Active requirements):**
- Accurate key-to-letter matching (the core pedagogical differentiator vs. smash toys)
- Three modes: Letters (random), Numbers (random), Alphabet (sequential A→Z with wraparound)
- Bigger celebration on Alphabet Z-completion, distinct from the per-letter celebration
- Post-hoc Statistics screen (accuracy, letters-per-minute, reaction-time histogram) — parent-facing, not shown live during gameplay
- Spoken letter/number on correct match (Web Speech API, Settings-gated)
- Share-link affordance (copy current URL) — no accounts/leaderboards

**Defer (v2+):**
- Multiple visual themes (single dark/pearlescent theme first; validate before investing in variety)
- Reaction-time histogram visualization (ship simple counts/averages first; histogram is a pure UI layer on already-collected data)
- Parent-gate lock / hold-to-exit protection (reasonable stretch goal, not MVP-required for a trusted single-family device)

**Explicit anti-features:** ads/IAP, accounts/cloud sync, timers/countdowns, punitive feedback, on-screen keyboard hint overlay, leaderboards/multiplayer, complex settings surface, multi-digit numbers/phonics, aggressive analytics, autoplay video/rapid scene changes.

### Architecture Approach

The right-sized architecture for this scope is a hand-rolled finite-state-machine for screen switching plus a lightweight pub/sub event bus for cross-cutting reactions (celebration, stats, sound) to a single "correct match" event — explicitly avoiding any framework or state-management library. Game logic (target generation, key matching) is kept as pure, DOM-free functions so it's trivially testable and decoupled from presentation, following the Strategy pattern to share one `GameScreen` implementation across all three modes.

**Major components:**
1. `AppStateMachine` — owns current screen, calls `exit()`/`enter()` lifecycle hooks on screen transitions (Menu/Game/Stats/Settings)
2. `GameScreen` + `TargetStrategy` (Letters/Numbers/Alphabet) — one shared game loop parameterized by mode-specific "what's next" logic
3. `KeyboardInputHandler` + `matcher.ts` — pure, DOM-free input normalization and match-checking, attached/detached only while `GameScreen` is mounted
4. `CelebrationModule`, `FullscreenController`, `SoundModule` — cross-cutting singleton services, decoupled from game logic via direct calls or the event bus
5. `StatsStore` / `SettingsStore` — versioned-schema `localStorage` wrappers, isolated from game logic, with try/catch on every read/write

### Critical Pitfalls

1. **Fullscreen requested outside a synchronous user gesture** — silently rejected by the browser if any `await` precedes it. Call `requestFullscreen()` as the first synchronous statement in the Play click handler.
2. **No `fullscreenchange` listener for unrequested exits** (Escape, swipe, OS) — leaves UI state out of sync. Register one global listener treating `document.fullscreenElement` as source of truth; always route back to the menu on any exit.
3. **Using `.key` instead of `.code` for matching** — Shift/Caps Lock/keyboard layout would falsely fail a physically-correct keypress for a toddler who doesn't understand Shift. Match on `event.code` (`KeyA`, `Digit5`), stripped of prefix, ignoring case entirely.
4. **Key-repeat flooding** — held keys fire `keydown` at 20-30/sec, corrupting stats and garbling celebration overlap if `event.repeat` isn't filtered. Ignore repeated events; add a short lockout window after each match.
5. **Vite `base` misconfigured for GitHub Pages** — the single most common cause of a blank-page/404-assets production deploy. Set `base: '/repo-name/'` explicitly and verify against the live URL, not just `vite preview`.
6. **`localStorage` failures in private browsing / iOS eviction / schema drift** — must wrap every access in try/catch, degrade to in-memory-only on failure, and store a `schemaVersion` from the very first write so a future stats-shape change doesn't crash the Statistics screen on old data.

## Implications for Roadmap

Based on combined research, the suggested phase structure front-loads DOM-free, testable logic and de-risks the deploy pipeline early, before investing in the most iteration-heavy/subjective part (celebration "feel").

### Phase 1: Project Scaffold & Deploy Pipeline
**Rationale:** Pitfall research is explicit that Vite `base`-path misconfiguration is the single most common GitHub Pages failure and is invisible locally — de-risk the deploy pipeline with a minimal "hello world" before building real features on top.
**Delivers:** Vite + TypeScript project scaffolded (`vanilla-ts` template, TS pinned to 5.9.x), ESLint/Prettier configured, GitHub Actions workflow deploying a placeholder page to GitHub Pages, `base` correctly set and verified against the live URL.
**Addresses:** No user-facing feature yet — pure infrastructure.
**Avoids:** Pitfall 5 (Vite base misconfiguration), Pitfall 6 (SPA routing 404s — resolved by architectural decision to avoid path-based routing entirely).

### Phase 2: App Shell, State Machine & Persistence Layer
**Rationale:** Architecture research's suggested build order puts the FSM skeleton and the DOM-free persistence stores first, since they have no UI dependency and are the easiest to get right in isolation; pitfalls research stresses that `schemaVersion` must exist from the very first `localStorage` write.
**Delivers:** `AppStateMachine` with `enter()`/`exit()` screen lifecycle, empty placeholder screens (Menu/Game/Stats/Settings), `StatsStore` and `SettingsStore` with versioned JSON schema and try/catch-guarded reads/writes.
**Uses:** TypeScript, native `localStorage`.
**Implements:** `AppStateMachine` (Pattern 1), `StatsStore`/`SettingsStore` persistence pattern.
**Avoids:** Pitfall 7 (localStorage private-mode/quota failures), Pitfall 8 (stale schema on updates).

### Phase 3: Core Input & Matching Logic
**Rationale:** Pure, DOM-free logic (`matcher.ts`, `KeyboardInputHandler`) can and should be built/testable with synthetic `KeyboardEvent`-like objects before any Game Screen UI exists — this is the most pitfall-dense area of the whole project (4 of 6 critical pitfalls trace here) and must be gotten right before layering animation on top.
**Delivers:** `KeyboardInputHandler` (normalizes `event.code`, filters modifiers and `event.repeat`), `matcher.ts` (pure match-checking), the three `TargetStrategy` implementations (Letters/Numbers/Alphabet with A→Z wraparound).
**Addresses:** Table-stakes "forgiving input," "no immediate repeat," and the core differentiator "accurate key-to-letter matching."
**Avoids:** Pitfall 3 (`.key` vs `.code` / Shift-Caps sensitivity), Pitfall 4 (key-repeat flooding).

### Phase 4: Game Screen, Celebration & Fullscreen
**Rationale:** With input/matching logic already correct and tested, this phase wires the first working (initially unstyled) game loop, then layers celebration animation last since it's the most iteration-heavy/subjective piece and easiest to keep decoupled once the logic it decorates is stable. Fullscreen is wired in once GameScreen has a real Play-button user gesture to hook into.
**Delivers:** `GameScreen` (renders target, wires input+match+celebration+stats-emit), `CelebrationModule` (transform/opacity-only animations, `canvas-confetti` burst tuned to the pearlescent palette, distinct "big" celebration for Alphabet Z-completion), `FullscreenController` (synchronous gesture-triggered enter, `fullscreenchange`-synced exit routing back to Menu), optional `SoundModule` (gesture-primed audio, Web Speech API for spoken letters).
**Addresses:** Instant visual+audio reaction, big focal target, no-penalty incorrect handling, fullscreen distraction-free play, three-mode differentiation, spoken-letter differentiator.
**Avoids:** Pitfall 1 (fullscreen outside gesture), Pitfall 2 (no fullscreenchange sync), Pitfall 9 (animation jank on lower-end devices), Pitfall 10 (audio autoplay failures), Pitfall 11 (accidental navigation away).

### Phase 5: Menu, Statistics & Settings Screens
**Rationale:** These screens depend on `StatsStore`/`SettingsStore` (Phase 2) being finalized and naturally follow the Game Screen since Statistics has no real data to display until sessions have actually been recorded; Menu can be built visually in parallel but only wired to a real GameScreen once Phase 4 exists.
**Delivers:** `MenuScreen` (vertical mode-selection list), `StatsScreen` (accuracy, LPM, reaction-time histogram computed from `StatsStore`), `SettingsScreen` (sound toggle, stats reset), share-link affordance (copy current URL).
**Addresses:** Menu with mode selection, Settings sound toggle, Statistics differentiator, Share-link differentiator.
**Avoids:** Pitfall 8 (schema drift — verified end-to-end once real stats render).

### Phase Ordering Rationale

- Deploy pipeline first because it's the cheapest thing to de-risk and the pitfall most likely to silently block every subsequent phase's "does this actually work in production" verification.
- Persistence and pure logic (Phases 2-3) come before any DOM-heavy screen work because they have zero DOM dependency and are the easiest to build/test in isolation — this mirrors both the Architecture research's explicit "Suggested Build Order" and the Pitfalls research's emphasis that input-matching bugs (Shift/Caps/repeat) are invisible without deliberate testing.
- Celebration/animation is deliberately sequenced after the mechanical game loop is proven, since it's explicitly called out as "the most iteration-heavy, easiest to keep decoupled if built after the logic it decorates."
- Statistics/Settings screens are last among functional work because they're read-heavy consumers of data that doesn't exist until the game loop has been played — building them earlier would mean testing against empty/fake data.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Game Screen, Celebration & Fullscreen):** Highest concentration of platform-specific edge cases (fullscreen gesture timing, iOS Safari quirks, audio autoplay, animation performance on lower-end hardware) — worth a focused `--research-phase` pass on cross-browser/cross-device fullscreen and autoplay behavior specifically, since PITFALLS.md flags this as where "looks done but isn't" failures concentrate.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold & Deploy):** Fully documented, verified directly against Vite's official static-deploy guide — no ambiguity remains.
- **Phase 2 (State Machine & Persistence):** Well-established patterns (FSM, versioned localStorage schema) with clear code examples already in ARCHITECTURE.md.
- **Phase 3 (Input & Matching):** MDN-verified KeyboardEvent behavior (`.code`, `.repeat`) is stable, long-documented — implementation guidance is already concrete and unambiguous.
- **Phase 5 (Menu/Stats/Settings):** Standard read/render screens against already-built stores; no new architectural questions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified directly against npm registry package metadata and Vite's official documentation; version-compatibility constraints (TS 5.9.x vs 7.x) explicitly cross-checked. |
| Features | MEDIUM | No official/authoritative spec exists for this informal product category (toddler keyboard-smash toys); findings are cross-checked across many independent vendor/product/parenting-content sources that converge consistently, but no single high-authority source exists. |
| Architecture | MEDIUM | Standard web-platform patterns verified against MDN and multiple independent vanilla-JS game-architecture writeups; no project-specific prior art exists for this exact game shape, so patterns are extrapolated from adjacent, well-established practice rather than a canonical reference. |
| Pitfalls | HIGH | Core platform behaviors (Fullscreen API, KeyboardEvent, localStorage quotas, autoplay policy) are stable, long-documented behaviors verified against MDN/web.dev/Chromium official docs; GitHub Pages+Vite deploy specifics corroborated across multiple community discussions aligned with official docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **iOS Safari fullscreen support variance:** Older iPhone Safari (pre-16.4/17.2) doesn't support element fullscreen at all; exact device/OS-version behavior for the family's actual hardware should be validated directly during Phase 4 rather than assumed from documentation alone.
- **Toddler-specific forgiveness tuning (near-miss physical rows):** PITFALLS/FEATURES research flags "accepting near-miss physical rows" as a possible fallback if exact key-matching proves too hard for the youngest end of 2-3yo — this is a UX tuning question that can only be resolved through real usage with the child, not further research; flag for iterative hardening after MVP ships.
- **Parent-gate/exit-lock scope:** Explicitly deferred as a "reasonable stretch goal, not required for MVP" — revisit only if real-world toddler-mashing testing (the child) surfaces an actual accidental-exit problem.
- **Multiple visual themes:** No research gap per se, but explicitly deferred pending validation that the single pearlescent theme sustains repeat-play interest — flag for a future milestone decision, not this one.

## Sources

### Primary (HIGH confidence)
- npm registry (`registry.npmjs.org`) — Vite 8.2.1, TypeScript 5.9.3 vs 7.0.2, canvas-confetti 1.9.4, eslint 10.8.1, typescript-eslint 8.67.0 peerDependencies
- vite.dev/guide/static-deploy — official GitHub Actions deploy workflow and `base`-path guidance
- MDN Web Docs — `KeyboardEvent.key`/`.code`/`.repeat`, `Element.requestFullscreen()`, `fullscreenchange` event, Storage quotas and eviction criteria, CSS/JS animation performance
- web.dev — Fullscreen experiences, jank-busting rendering performance
- Chromium — Autoplay Policy Design Rationale; Chrome for Developers Autoplay policy
- GitHub actions/cache and actions/setup-node official caching docs

### Secondary (MEDIUM confidence)
- tinyfingers.net (project's own stated design inspiration) — fullscreen handling, parent panel, theme system, "smash report" pattern
- BabyBash, Baby Smash!, ToddlerSmash, TotType, ABC Kids, TypeTastic — competitor product pages informing table-stakes/anti-feature findings
- SplashLearn, ScreenWiseApp, Brightwheel, Stay at Home Educator, Child Mind Institute, Happiest Baby, Blueberry Pediatrics, PositivePsychology.com — toddler attention-span, positive-reinforcement, and letter-recognition milestone findings
- Jake Gordon (Javascript Game Foundations), Robert Nystrom (Game Programming Patterns) — state-machine architecture pattern
- go makethings, Sinclair Software — vanilla-JS fullscreen and typesafe localStorage implementation patterns
- GitHub community discussions (#59575, #61478, #176242) and sitek94/vite-deploy-demo — Vite + GitHub Pages base-path deploy pattern, corroborated against official docs

### Tertiary (LOW confidence)
- None — all findings in this research set were cross-checked against at least one MEDIUM-or-higher source.

---
*Research completed: 2026-08-12*
*Ready for roadmap: yes*

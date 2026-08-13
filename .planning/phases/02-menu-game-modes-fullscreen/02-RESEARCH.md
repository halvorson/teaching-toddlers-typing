# Phase 2: Menu, Game Modes & Fullscreen - Research

**Researched:** 2026-08-13
**Domain:** Browser Fullscreen API, Clipboard API, hand-rolled client-side routing (URLSearchParams/History API), accessible keyboard menu navigation, CSS-only parallax, vanilla-TS state-machine restructuring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Home Menu Visual & Layout**
- Menu items render as a plain text list — large tap targets, no button chrome/borders, matching the Slay-the-Spire-inspired minimalist vertical menu aesthetic
- Background is an animated particle/parallax treatment built from layered CSS gradients + subtle motion — no image assets, stays within the existing pearlescent custom-property palette
- Menu navigation supports both Up/Down arrow + Enter AND mouse/touch click; no letter-key hotkeys (avoids colliding with the physical-key-matching mental model used elsewhere in the app)
- The focused/selected menu item is indicated with an accent-color glow/underline, reusing the existing `--color-accent` custom property

**Mode Switching & Navigation Flow**
- Escape key always returns to the home menu from any gameplay mode (and exits fullscreen as part of that action) — no separate on-screen quit button; the app is parent-operated for navigation, not toddler-operated
- Statistics and Settings screens are windowed (NOT fullscreen) — only the three gameplay modes (Letters/Numbers/Alphabet) trigger fullscreen
- Transitions between the menu and game screens use a simple CSS opacity crossfade, reusing the ~100ms transition pattern already established in Phase 1's `style.css`
- No `beforeunload`/focus-lock protection against accidental tab-close or browser-back in this phase — already explicitly deferred in PROJECT.md's Out of Scope section; only the fullscreen resync (FULL-02) handles unexpected exits

**Fullscreen Behavior & Edge Cases**
- If `requestFullscreen()` rejects or is unavailable (e.g. the iOS Safari variance flagged in Phase 1 research), gameplay continues windowed — fullscreen success is never a gate on starting a mode
- Quitting a mode calls `exitFullscreen()` immediately and synchronously — no fade, no confirmation dialog
- The native `fullscreenchange` event is the single source of truth for UI resync: any exit from fullscreen — expected (Quit) or unexpected (Escape while fullscreen, OS gesture) — is treated identically as "return to menu." No separate manual/auto-exit code paths.
- Alphabet-mode's bigger Z-completion celebration plays fullscreen as normal, with no special fullscreen handling — it's just a bigger version of the same celebration Phase 1 already built

**Share Affordance**
- The share control is its own menu row (icon + "Share" text label), not a corner icon or bottom-of-page link
- On successful copy, feedback is a brief inline text change ("Copied!" for ~1.5s) — no toast library, no confetti (that's reserved for gameplay celebrations)
- If `navigator.clipboard` is unavailable or the permission is denied, fall back to the legacy `document.execCommand('copy')` via a temporary hidden input; if that also fails, show the URL in a selectable text box as a last resort
- The URL copied is `window.location.href` as-is (the current page URL, including any URLSearchParams state) — not a hardcoded canonical root

### Claude's Discretion
- Exact CSS/animation implementation of the particle/parallax menu background (layer count, gradient stops, motion timing) within the "no image assets, subtle motion" description
- Exact opacity-crossfade timing/easing for menu↔game transitions beyond "reuse the ~100ms pattern"
- Internal routing/state-machine shape for menu vs. mode vs. settings/stats screens (CLAUDE.md already establishes the general pattern: URLSearchParams on load, `history.replaceState` on mode change, no router library)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Audio (Phase 3) and full Statistics screen content/reset (Phase 4) are already correctly scoped to later phases in ROADMAP.md; this phase only needs their menu entry points to exist and navigate correctly.

**Also locked by `02-UI-SPEC.md` (verified, 6/6 dimensions passed):**
- Menu row order: `Letters`, `Numbers`, `Alphabet` (24px gaps) → 24px group gap → `Statistics`, `Settings`, `Share` (24px gaps) → 32px group gap → `Quit`
- First menu item (`Letters`) auto-focused on load; keyboard navigation wraps around (Down from Quit → Letters, Up from Letters → Quit)
- Windowed screens (Statistics, Settings) exit via `Escape` **and** a visible `← Back` row; render as a centered `max-width: 480px` panel (`--color-surface` background, `border-radius: 12px`, `xl`/32px padding) over the same animated background — never a separate blank page
- Menu item tap target: `min-height: 56px`; menu row font-size `clamp(20px, 4vh, 28px)`; menu column `max-width: 400px`, centered
- Focus/selection indicator: text color `--color-fg` → `--color-accent`, 2px accent underline with `box-shadow: 0 0 8px var(--color-accent)`, `color 100ms ease-out` transition, underline appears/disappears instantly (no transition)
- Parallax background: 3 stacked `position: fixed; z-index: -1` layers — solid `--color-bg` base, then 2-3 `--color-surface`-at-~10%-opacity radial-gradient blobs animating `transform: translate(...)` over `40s ease-in-out infinite alternate`, then 1-2 `--color-accent`-at-~6%-opacity blobs over `65s ease-in-out infinite alternate`; both blob layers freeze (no `animation`) under `prefers-reduced-motion: reduce`
- Alphabet Z-completion celebration: reuses `celebrate()`, fires **three** sequential bursts at 0ms/120ms/240ms from left/center/right screen positions, each with `particleCount: 120, spread: 100, startVelocity: 35, ticks: 200, gravity: 1, scalar: 1.1, colors: CONFETTI_COLORS` (vs. normal single burst's `40/60/25/150/1/0.8`)
- Share flow: `navigator.clipboard.writeText(window.location.href)` → on success swap label to "Copied!" for ~1.5s → on failure, hidden-input + `execCommand('copy')` → on failure, render a selectable `<input readonly value={window.location.href}>` inline with copy text "Couldn't copy the link automatically — select and copy it here:"
- Icon library: none — one hand-authored inline SVG (20×20 outlined "export" glyph, `stroke: currentColor`, `stroke-width: 2`, no fill) for the Share row only
- Copy: menu labels exactly `Letters`, `Numbers`, `Alphabet`, `Statistics`, `Settings`, `Share`, `Quit`; windowed back row `← Back`; Statistics stub body "Stats tracking isn't turned on yet. Come back soon!"; Settings stub body "Sound and other settings are coming soon."
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MENU-01 | Home screen shows a vertical menu: Letters, Numbers, Alphabet, Statistics, Settings, Quit | Architecture Patterns → Recommended Project Structure + Pattern 3 (menu component); UI-SPEC already locks row order/spacing |
| MENU-02 | Menu uses a dark, moody, illustrated/gradient background (Slay-the-Spire-inspired) | Architecture Patterns → Pattern 5 (CSS-only parallax); `[CITED]` performance guidance on `transform`-based vs `background-position`-based animation |
| MENU-03 | Quit exits fullscreen and returns to the home menu | Common Pitfalls → Pitfall 1 (the `fullscreenchange`-never-fires edge case) + Code Examples → `returnToMenu()` pattern |
| MODE-01 | Letters mode: random A-Z, never repeats the same letter twice in a row | Architecture Patterns → Pattern 2 (generalizing `game.ts`); reuses Phase 1's `pickTarget` logic verbatim, renamed/generalized |
| MODE-02 | Numbers mode: random single digit 0-9, never repeats twice in a row | **Critical verified finding**: physical key code for digits is `Digit0`-`Digit9`, NOT `Key0`-`Key9` — see Common Pitfalls → Pitfall 2 |
| MODE-03 | Alphabet mode: letters in sequential A→Z order | Architecture Patterns → Pattern 2 (`nextInSequence` function, distinct from `pickRandom`) |
| MODE-04 | Completing Z in Alphabet mode triggers a distinctly bigger celebration before looping to A | Code Examples → `celebrateAlphabetComplete()`; UI-SPEC already locks exact confetti parameters |
| FULL-01 | Starting any game mode automatically enters fullscreen | Architecture Patterns → Pattern 4 (fire-and-forget fullscreen entry, never gates UI) |
| FULL-02 | Leaving a game mode (Quit / navigating back) automatically exits fullscreen | Same as FULL-01/MENU-03 — Pattern 4 + Pitfall 1 |
| FULL-03 | An unexpected fullscreen exit (Escape, OS gesture) gracefully resyncs the UI instead of breaking | `fullscreenchange` event research (Sources); Common Pitfalls → Pitfall 1 covers the specific gap CONTEXT.md's decision leaves open on iOS Safari |
| SHARE-01 | Home menu includes a share affordance that copies the current page URL | Architecture Patterns → Pattern 6 (three-tier Clipboard fallback); Common Pitfalls → Pitfall 3 (Safari user-activation timing) |
</phase_requirements>

## Summary

Phase 2 is a restructuring phase more than a new-technology phase: every API involved (Fullscreen, Clipboard, History) is a browser built-in already anticipated by CLAUDE.md and CONTEXT.md, and the only "new library decision" this research surfaces is a **negative** one — do not add `screenfull.js` or any fullscreen-wrapper package, because the vendor-prefix problem it solves no longer exists on any of this project's real targets, and it cannot fix the actual problem this app faces (see below).

The single most consequential finding is a live, multi-source-triangulated confirmation of the risk STATE.md already flagged: **iOS Safari's Fullscreen API on non-video elements remains only "partial support" through the current 26.3 point release** (`[CITED: caniuse.com/fullscreen]`, fetched live), and this is not a stale caveat — WebKit's own bug tracker and Apple Developer Forums thread show it was briefly enabled in a 2024 beta and then explicitly *disabled* due to unresolved issues, with no permanent fix landed since (`[CITED: developer.apple.com/forums/thread/133248]`). A June-2026-dated aggregate source independently confirms `requestFullscreen()` "is not reliable" and "silently fails on iPhone" today (`[CITED: bugnet.io, cross-checked against the two sources above]`). This validates CONTEXT.md's "fullscreen success is never a gate" decision as load-bearing, not just cautious — and it surfaces a gap that decision doesn't fully close: if fullscreen never actually activated (the iOS Safari case), the `fullscreenchange` event CONTEXT.md designates as "the single source of truth" for exit-resync will **never fire** when Escape is pressed, because there is no fullscreen state to change. The Escape-key handler therefore needs a direct path back to the menu screen that doesn't depend on that event — see Common Pitfalls → Pitfall 1 for the concrete, CONTEXT.md-compatible fix.

The second consequential finding is a verified, checkable fact that would otherwise silently break Numbers mode: **the physical-key `KeyboardEvent.code` value for the digit row is `Digit0`–`Digit9`, not `Key0`–`Key9`** (`[VERIFIED: developer.mozilla.org/.../Keyboard_event_code_values]`) — a naive generalization of Phase 1's `` `Key${letter}` `` template-string pattern to `` `Key${digit}` `` would produce codes that never match a real keypress. `game.ts` needs a mode-aware code-mapping function, not a single parameterized template.

Third: this phase's "menu-first entry point" replaces `main.ts`'s current unconditional Letters-mode boot with a small hand-rolled router (URLSearchParams read on load + `history.replaceState`, per CLAUDE.md's already-locked pattern, confirmed against current History API documentation) driving a `switch`-based screen mount/unmount — no library, ~6 screen states, well within the "don't hand-roll a router, but a router library is also overkill" sweet spot CLAUDE.md already identified.

**Primary recommendation:** Generalize `game.ts`'s `pickTarget`/`targetCode` into pool-and-strategy-aware functions (`pickRandom(pool, exclude)`, `nextInSequence(pool, current)`, `letterCode()`/`digitCode()` returning an array of acceptable codes), add a `fullscreen.ts` helper that fires-and-forgets `requestFullscreen()` and treats `fullscreenchange` as the *primary but not sole* resync trigger (Escape must also directly navigate), reuse `celebrate()` for the Alphabet Z-completion burst via a parameterized options object fired three times, and implement the router as a plain `URLSearchParams` read + `history.replaceState` + `switch` — no new npm dependency of any kind.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home menu rendering & keyboard/mouse navigation | Browser / Client | — | Pure DOM + a `keydown`/`click` delegate listener; no server round-trip |
| Screen routing (menu/Letters/Numbers/Alphabet/Stats/Settings state) | Browser / Client | — | `URLSearchParams` + `history.replaceState`, in-memory `switch` — no router library, no server |
| Game-mode target selection (random no-repeat / sequential) | Browser / Client | — | Generalized in-memory pool logic, same tier as Phase 1's `pickTarget` |
| Fullscreen lifecycle (enter/exit/resync) | Browser / Client | — | Native Fullscreen API is 100% client-side; no server involvement, no CDN involvement |
| Share-link clipboard write + fallback chain | Browser / Client | — | `navigator.clipboard` / `execCommand` / selectable input — no server-generated short link, no backend |
| Parallax background animation | Browser / Client | — | Pure CSS `@keyframes`/`transform`, no image asset, so no CDN/static-asset tier involvement beyond the already-bundled CSS file |
| Alphabet Z-completion celebration (3x confetti burst) | Browser / Client | — | Same `celebrate()`/canvas-confetti mechanism as Phase 1, just parameterized differently |
| Static asset delivery (bundled JS/CSS) | CDN / Static | — | GitHub Pages serves the built `dist/`, unchanged from Phase 1 |

This app remains exactly two tiers (**Browser/Client** for 100% of runtime logic, **CDN/Static** for build+hosting only) — Phase 2 adds substantially more client-side surface area (routing, fullscreen, clipboard, parallax) but introduces no new tier. Any task that proposes a server round-trip, a database, or an API call for anything in this phase (e.g. "call a URL-shortener service for Share") is architecturally wrong for this project and should be flagged in plan review.

## Project Constraints (from CLAUDE.md)

CLAUDE.md is the authoritative, already-verified stack decision document for this project. The following directives are locked and apply directly to Phase 2's scope (routing, fullscreen wrapper choice, no new dependencies):

- **No client-side router library** — CLAUDE.md's own "Stack Patterns by Variant" section already prescribes the exact pattern this phase must use: "Read `URLSearchParams` on load to set initial screen/mode; update `history.replaceState` (not `pushState`, to avoid polluting back-button history) when mode changes... the entire 'router' is a few lines against the native `URL`/`History` APIs." This phase is where that previously-dormant guidance is first exercised.
- **`canvas-confetti` remains the only runtime dependency** — the Alphabet Z-completion "distinctly bigger" celebration must reuse the existing `celebrate()`/canvas-confetti call with different parameters, not a second animation system (CLAUDE.md's "Stack Patterns by Variant" explicitly anticipates exactly this: "Reuse the same canvas-confetti call with a higher `particleCount`/wider `spread`/longer `ticks`... keeps the celebration vocabulary consistent").
- **No third-party fullscreen wrapper** (e.g. `screenfull.js`) — not explicitly named in CLAUDE.md, but falls under the same "no dependency for a problem this small" philosophy already applied to routing/animation/audio in CLAUDE.md's "What NOT to Use" table; this research's own findings (see Don't Hand-Roll) confirm no such wrapper is needed or would even help.
- **`KeyboardEvent.code` (physical key) matching, never `event.key`** — applies to Numbers mode too, per REQUIREMENTS.md's MODE-02, and per this research's critical `Digit*` vs `Key*` finding (Common Pitfalls → Pitfall 2). Note this constraint applies to *gameplay* key matching specifically — the menu's Up/Down/Enter navigation is a different concern and should use `event.key` (see Common Pitfalls → Pitfall 4 for why).
- **No CSS framework, no icon library** — the Share row's icon is one hand-authored inline SVG (already locked in UI-SPEC), not an icon-font/library dependency.
- **No automated test framework** — unchanged from Phase 1; Phase 2's Validation Architecture section below remains manual-only, consistent with CLAUDE.md's explicit "What NOT to Use" entry for Jest/Vitest/Cypress/Playwright.
- **GSD Workflow Enforcement** — file-changing work must flow through a GSD command; applies to how this phase's plan is executed.

## Standard Stack

### Core
No new core libraries this phase. The existing Phase 1 stack (Vite 8.2.1, TypeScript 5.9.3, `canvas-confetti` 1.9.4) is unchanged and sufficient for every Phase 2 requirement — every capability needed (routing, fullscreen, clipboard, parallax, accessible menu) is a native browser API or hand-rolled CSS/TS, per CLAUDE.md's existing "What NOT to Use" guidance.

`[VERIFIED: npm registry]` — `npm view canvas-confetti version` still returns `1.9.4` (last published 2025-10-25), matching the version already pinned in `package.json`; no action needed.

### Supporting
No new supporting libraries. Everything Phase 2 needs is a browser built-in:

| API | Purpose | Browser Support Note |
|-----|---------|----------------------|
| Fullscreen API (`Element.requestFullscreen`, `Document.exitFullscreen`, `fullscreenchange`) | FULL-01/02/03 | `[CITED: caniuse.com/fullscreen]` — full unprefixed support on Chrome/Firefox/Edge/desktop Safari 16.4+; **iOS Safari remains "partial support" through the current 26.3 release** — see Common Pitfalls → Pitfall 1 |
| Clipboard API (`navigator.clipboard.writeText`) | SHARE-01 | `[CITED: developer.mozilla.org/.../Clipboard/writeText]` — Baseline widely-available since March 2020; requires a secure context (GitHub Pages HTTPS qualifies) and a genuine user gesture |
| `document.execCommand('copy')` (legacy fallback) | SHARE-01 fallback tier 2 | `[CITED, cross-referenced across multiple sources]` — deprecated but still broadly implemented; CONTEXT.md's own fallback chain already anticipates needing it |
| `URLSearchParams` / `history.replaceState` | Routing | `[CITED: developer.mozilla.org History API docs]` — universal support, no polyfill needed |
| WAI-ARIA roving-tabindex pattern | Menu keyboard nav | `[CITED: w3.org/WAI/ARIA/apg/practices/keyboard-interface]` — not a library, a hand-implementable pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled fullscreen fire-and-forget wrapper (~15 lines) | `screenfull.js` (npm package, unifies vendor-prefixed fullscreen APIs) | **Rejected.** `screenfull.js` solves the vendor-prefix normalization problem (`webkitRequestFullscreen` vs `mozRequestFullScreen` etc.), which no longer applies to any browser this project targets in 2026 — Chrome/Firefox/Edge/desktop Safari 16.4+ all ship the unprefixed API. It does **not** solve — and cannot solve — the actual problem (iOS Safari's own WebKit implementation being unreliable on non-video elements); adding the dependency would add supply-chain surface for zero benefit. |
| `URLSearchParams` + `history.replaceState` (hand-rolled, ~10 lines) | A micro-router library (e.g. `navigo`, `page.js`) | Rejected per CLAUDE.md's existing explicit decision — this app has ~6 flat screen states and no nested/parameterized routes; a router library's matching/middleware machinery solves a problem this app doesn't have. |
| Native `<button>` elements + hand-rolled Arrow-key focus-move listener | A full WAI-ARIA `role="menu"` implementation (submenus, typeahead, `aria-activedescendant`) | The full APG menu pattern solves problems (nested submenus, disabled items, typeahead-to-select) this 7-row flat list doesn't have. Native `<button>` gets click/Enter/Space activation for free from the browser; only Up/Down/Home/End need hand-rolling. See Architecture Patterns → Pattern 3. |
| `celebrate()` reused with a parameterized options object, called 3x | A dedicated "big celebration" module/second particle system | Rejected per CLAUDE.md's explicit "reuse the same canvas-confetti call... rather than introducing a second animation system" guidance, and UI-SPEC already locks the exact 3x-burst parameter values. |

**Installation:** None — no new packages this phase.

**Version verification performed this session:**
- `npm view canvas-confetti version` → `1.9.4` (unchanged, still current; last publish 2025-10-25)
- `gsd_run query package-legitimacy check --ecosystem npm canvas-confetti` → verdict `OK` (8,220,654 weekly downloads, repo `github.com/catdad/canvas-confetti`, no postinstall script, not deprecated) — re-confirmed, not re-added
- `package.json` read directly this session — confirms `devDependencies`/`dependencies` are unchanged from Phase 1's already-verified set; no drift to correct

## Package Legitimacy Audit

**No new packages are installed this phase.** Every capability (routing, fullscreen, clipboard, accessible menu, parallax background) is implemented with browser built-ins or hand-rolled TypeScript/CSS, per CLAUDE.md's existing zero-extra-dependency stance. The Package Legitimacy Gate is therefore not triggered — the table below documents the re-confirmation of the one existing runtime dependency for completeness, and the explicit rejection of a package that might otherwise be tempting to add.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| canvas-confetti (existing, unchanged) | npm | published 2018, last publish 2025-10-25 | 8,220,654/wk | github.com/catdad/canvas-confetti | OK | Unchanged — already approved in Phase 1, re-confirmed this session |
| screenfull.js (considered, NOT added) | npm | n/a — not installed | n/a | github.com/sindresorhus/screenfull.js | Not checked (not being installed) | **Rejected by design** — see Alternatives Considered above; would not be blocked by legitimacy (it's a legitimate, well-known package), the rejection is purely architectural (solves a non-problem for this project's targets) |

**Packages removed due to `[SLOP]` verdict:** none — no new packages were proposed.
**Packages flagged as suspicious `[SUS]`:** none.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Browser (client tier — 100% of Phase 2 runtime logic, unchanged tier      │
│ shape from Phase 1)                                                        │
│                                                                              │
│  Page load                                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  router.ts: read URLSearchParams(location.search) → initial screen         │
│  (default 'menu' if absent/invalid)                                        │
│     │                                                                       │
│     ▼                                                                       │
│  main.ts: switch(screen) { mount the matching screen module }              │
│     │                                                                       │
│     ├──▶ screen='menu' ──▶ menu.ts                                         │
│     │        renders 7-row list + parallax bg (always mounted, z-index -1) │
│     │        keydown (ArrowUp/Down/Home/End/Enter) + click listeners        │
│     │        on row activation:                                             │
│     │          ├─ Letters/Numbers/Alphabet → history.replaceState(mode url) │
│     │          │      → mount game screen (Pattern 2) → fullscreen.ts      │
│     │          │        fires requestFullscreen() in parallel (Pattern 4)  │
│     │          ├─ Statistics/Settings → replaceState → windowed panel      │
│     │          │      (renders OVER the same parallax bg, no fullscreen)   │
│     │          └─ Share → clipboard.ts 3-tier fallback chain (Pattern 6)   │
│     │                                                                       │
│     ├──▶ screen='letters'|'numbers'|'alphabet' ──▶ game.ts (generalized)   │
│     │        keydown: if (e.repeat) return; e.code ∈ acceptableCodes(target)│
│     │          YES → celebrate() + pickNext(pool, strategy) + render        │
│     │          NO  → neutral flicker (Phase 1 pattern, unchanged)          │
│     │        Escape → exitFullscreen() (best-effort) + returnToMenu()      │
│     │          directly (NOT solely via fullscreenchange — Pitfall 1)      │
│     │                                                                       │
│     └──▶ screen='stats'|'settings' ──▶ windowed panel (stub content)       │
│              Escape / '← Back' click → replaceState('menu') + show menu    │
│                                                                               │
│  document.addEventListener('fullscreenchange', ...) — registered ONCE at   │
│  app boot, not per-mode-entry: if document.fullscreenElement === null,     │
│  call the SAME returnToMenu() function Escape uses (Pitfall 1)             │
└──────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  static files (unchanged from Phase 1)
┌──────────────────────────────────────────────────────────────────────────┐
│ GitHub Pages (CDN/Static tier) — unchanged from Phase 1                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── main.ts          # MODIFIED: app boot — reads router, mounts initial screen,
│                     # registers the ONE fullscreenchange listener for the whole app
├── router.ts          # NEW: readInitialScreen() from URLSearchParams,
│                        # navigateTo(screen, mode?) → history.replaceState + mount
├── menu.ts              # NEW: home menu — 7-row list render, roving focus-index
│                          # state, keydown/click delegate listener, mounts parallax bg
├── game.ts                # MODIFIED: generalized — LETTERS/DIGITS pools,
│                            # pickRandom(pool, exclude), nextInSequence(pool, current),
│                            # letterCode()/digitCode() (see Pitfall 2), renderTarget()
│                            # unchanged from Phase 1
├── fullscreen.ts            # NEW: enterFullscreen(el) / returnToMenu()-agnostic
│                              # exitFullscreen() — fire-and-forget wrappers, isolates
│                              # the .catch(() => {}) swallow in one place (Pattern 4)
├── clipboard.ts               # NEW: shareCurrentUrl() — 3-tier fallback chain
│                                # (Pattern 6), returns a result the caller renders
├── panels.ts                   # NEW: renderStatsPanel()/renderSettingsPanel() stubs
│                                 # — both windowed, both reuse the same panel shell
├── celebrate.ts                  # MODIFIED: parameterize celebrate() to accept an
│                                   # options override; add celebrateAlphabetComplete()
│                                   # (3x sequential burst, Pattern 2 in Code Examples)
└── style.css                       # MODIFIED: menu/panel/parallax/focus-indicator
                                      # styles added, existing rules unchanged
```
This is a recommendation, not a mandate — the planner may consolidate files differently (e.g. fold `router.ts` into `main.ts`) as long as the underlying invariants below hold regardless of file boundaries:
1. `game.ts`'s pool-selection and code-mapping functions are generalized (not copy-pasted per mode)
2. Exactly one `fullscreenchange` listener exists for the whole app lifetime (not re-registered per mode-entry)
3. Exactly one "return to menu" function exists, called from both the `fullscreenchange` listener AND the in-game Escape handler (Pitfall 1)
4. `celebrate()`'s canvas-confetti call is reused, not duplicated, for the Alphabet Z-completion burst

### Pattern 1: Router — `URLSearchParams` read + `history.replaceState`, no library
**What:** On load, parse `new URLSearchParams(window.location.search)` for a `screen` (and optionally `mode`) param to determine the initial view; on every subsequent screen transition, build a new `URL`, mutate its `searchParams`, and call `history.replaceState(null, '', url)` — never `pushState`.
**When to use:** Every screen transition in this app (menu → mode, mode → menu, menu → stats/settings, stats/settings → menu).
**Why `replaceState` not `pushState`:** `[CITED: developer.mozilla.org History API docs]` — `pushState` adds a new browser-history entry, meaning the Back button would step through every menu/mode transition the child or parent ever made in the session; `replaceState` updates the current entry in place with no new history stack growth — CLAUDE.md's own guidance already specifies this exact choice ("not `pushState`, to avoid polluting back-button history").
**Example:**
```typescript
// router.ts
export type Screen = 'menu' | 'letters' | 'numbers' | 'alphabet' | 'stats' | 'settings'

const VALID_SCREENS: readonly Screen[] = ['menu', 'letters', 'numbers', 'alphabet', 'stats', 'settings']

export function readInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('screen')
  return (VALID_SCREENS as readonly string[]).includes(requested ?? '')
    ? (requested as Screen)
    : 'menu'
}

export function navigateTo(screen: Screen): void {
  const url = new URL(window.location.href)
  if (screen === 'menu') {
    url.searchParams.delete('screen') // keep the shareable root URL clean
  } else {
    url.searchParams.set('screen', screen)
  }
  history.replaceState(null, '', url)
}
```
Note: `popstate` (fired on user-driven Back/Forward) does not need a listener here, because this app never calls `pushState` — there is no forward-navigable history stack to resync against. `[CITED: developer.mozilla.org History_API]`.

### Pattern 2: Generalizing `game.ts` — pool + selection-strategy, not per-mode duplication
**What:** Replace Phase 1's `LETTERS`-specific `pickTarget`/`targetCode` with pool-parameterized functions shared across all three modes.
**When to use:** Any place Letters/Numbers/Alphabet mode logic is implemented — the three modes differ only in (a) which pool, (b) random-no-repeat vs. sequential selection, (c) which code-mapping function.
**Example:**
```typescript
// game.ts — generalized from Phase 1's LETTERS/pickTarget/targetCode
export const LETTERS: readonly string[] = Object.freeze([
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
])
export const DIGITS: readonly string[] = Object.freeze(['0','1','2','3','4','5','6','7','8','9'])

/** Random, no-immediate-repeat selection — used by Letters and Numbers modes. */
export function pickRandom(pool: readonly string[], exclude?: string): string {
  const candidates = exclude === undefined ? pool : pool.filter((c) => c !== exclude)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** Sequential wraparound selection — used by Alphabet mode. Passing `current: null`
 * (first render) returns pool[0]. Wrapping (pool.length-1 → 0) is the Z→A loop point;
 * callers should check `current === pool[pool.length - 1]` BEFORE calling this to
 * decide whether to fire the bigger completion celebration (MODE-04). */
export function nextInSequence(pool: readonly string[], current: string | null): string {
  if (current === null) return pool[0]
  const index = pool.indexOf(current)
  return pool[(index + 1) % pool.length]
}
```
See Common Pitfalls → Pitfall 2 for the code-mapping half of this generalization (`letterCode`/`digitCode`), which is NOT a simple template-string parameterization.

### Pattern 3: Accessible menu — native `<button>` + hand-rolled Arrow-key focus move
**What:** Render each menu row as a real `<button>` element (styled with no visible chrome per UI-SPEC), get native click/Enter/Space activation for free, and add one delegated `keydown` listener on the menu container for `ArrowUp`/`ArrowDown`/`Home`/`End` that calls `.focus()` on the target row.
**When to use:** MENU-01's 7-row vertical menu, and the windowed panels' `← Back` row.
**Why native `<button>` over a hand-rolled roving-tabindex-over-`<div>` implementation:** `[CITED: w3.org/WAI/ARIA/apg/practices/keyboard-interface]` establishes the roving-tabindex *mechanic* (which element has `tabindex=0` vs `-1`), but that mechanic exists to solve the problem of making *non-natively-focusable* elements (`<div>`, `<span>`) behave like a single Tab-stop with internal Arrow-key navigation. A `<button>` element is already natively focusable and already fires `click` on Enter/Space — reaching for the full roving-tabindex machinery here re-solves a problem `<button>` doesn't have. The only piece actually needed is the Arrow-key-driven `.focus()` move.
**Example:**
```typescript
// menu.ts
const ROWS = ['letters', 'numbers', 'alphabet', 'stats', 'settings', 'share', 'quit'] as const

function focusRow(buttons: HTMLButtonElement[], index: number): void {
  buttons.forEach((b, i) => b.classList.toggle('focused', i === index))
  buttons[index].focus()
}

menuContainer.addEventListener('keydown', (e: KeyboardEvent) => {
  const buttons = Array.from(menuContainer.querySelectorAll<HTMLButtonElement>('button.menu-item'))
  const currentIndex = buttons.findIndex((b) => b === document.activeElement)
  const count = buttons.length
  switch (e.key) { // event.key is correct HERE — see Pitfall 4 for why this differs
                    // from the gameplay .code rule
    case 'ArrowDown':
      e.preventDefault()
      focusRow(buttons, (currentIndex + 1 + count) % count) // wraps Quit → Letters
      break
    case 'ArrowUp':
      e.preventDefault()
      focusRow(buttons, (currentIndex - 1 + count) % count) // wraps Letters → Quit
      break
    case 'Home':
      e.preventDefault()
      focusRow(buttons, 0)
      break
    case 'End':
      e.preventDefault()
      focusRow(buttons, count - 1)
      break
    // Enter/Space: no case needed — native <button> already fires 'click' for both
  }
})
```
The `.focused` class drives the exact CSS already locked in UI-SPEC's Focus/selection indicator block (`color`, `::after` underline + glow) — applying the class on both keyboard focus-move AND `mouseenter` (not shown above, same `focusRow` call) gives the unified "focused-or-hovered" treatment UI-SPEC specifies without juggling separate `:focus`/`:hover` CSS selectors that could disagree with the keyboard-driven state.

### Pattern 4: Fullscreen — fire-and-forget entry, never a gate
**What:** Call `requestFullscreen()` without awaiting it before rendering/gating anything; swallow rejection; never block the game-screen crossfade on the promise settling.
**When to use:** Every mode-entry (Letters/Numbers/Alphabet), per FULL-01 and UI-SPEC's explicit "not gated on the requestFullscreen() promise resolving" sequencing.
**Why:** This phase's own research confirms `requestFullscreen()` is unreliable specifically on iOS Safari (see Common Pitfalls → Pitfall 1) and that failures on that platform are documented as "silent" (no reliably-catchable rejection) rather than a clean throw — so any implementation that *waits* for the promise before showing gameplay risks a stuck/blank screen on exactly the device class most likely to need it (a parent's iPhone/iPad, per STATE.md's own flagged concern).
**Example:**
```typescript
// fullscreen.ts
export function enterFullscreen(el: HTMLElement): void {
  el.requestFullscreen?.().catch(() => {
    // Intentionally swallowed. iOS Safari (partial support through the current
    // 26.3 release — see RESEARCH.md Pitfall 1) and any other non-supporting
    // browser must never block gameplay. No retry, no error UI (CONTEXT.md explicit).
  })
}

export function exitFullscreenIfActive(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {})
  }
  // If fullscreenElement is already null (never entered, or already exited),
  // this is correctly a no-op — see Pitfall 1 for why the CALLER must still
  // navigate to the menu regardless of whether this branch ran.
}
```

### Pattern 5: CSS-only parallax background
**What:** Three `position: fixed; z-index: -1` full-viewport layers — solid base + two blob layers animating `transform: translate(...)`, per UI-SPEC's already-locked exact values.
**When to use:** MENU-02's moody animated background.
**Why `transform`, not `background-position`/`background-size`:** `[CITED, cross-referenced across multiple CSS-performance sources]` — animating `background-size`/`background-position` forces the browser to repaint on every frame; animating `transform` lets the compositor handle the motion on its own layer (GPU-composited), which matters here because the animation runs continuously for the entire time the menu (or windowed stats/settings panel, which renders over the same background) is visible, not just during a brief transition.
**Example:** (exact values already locked in UI-SPEC — reproduced here as the pattern, not new values)
```css
/* Source: 02-UI-SPEC.md → Home Menu & Background Contract → Parallax background,
   cross-checked against CSS transform-vs-background-position performance guidance */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
.bg-layer--blob-a {
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-surface) 10%, transparent), transparent 60%),
              radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--color-surface) 10%, transparent), transparent 60%);
  animation: drift-a 40s ease-in-out infinite alternate;
}
.bg-layer--blob-b {
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 55%);
  animation: drift-b 65s ease-in-out infinite alternate;
}
@keyframes drift-a { to { transform: translate(4%, -3%); } }
@keyframes drift-b { to { transform: translate(-3%, 4%); } }

@media (prefers-reduced-motion: reduce) {
  .bg-layer--blob-a, .bg-layer--blob-b { animation: none; }
}
```

### Pattern 6: Share — three-tier Clipboard fallback
**What:** Attempt `navigator.clipboard.writeText()`; on failure, fall back to a hidden-input `execCommand('copy')`; on failure, render a selectable read-only input.
**When to use:** SHARE-01, exactly as CONTEXT.md's fallback chain already specifies.
**Example:**
```typescript
// clipboard.ts
export type ShareResult = 'copied' | 'fallback-executed' | 'manual-required'

export async function shareCurrentUrl(): Promise<ShareResult> {
  const url = window.location.href
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url) // must run inside a real click/keydown
                                                  // handler — see Pitfall 3
      return 'copied'
    }
  } catch {
    // NotAllowedError or unavailable — fall through to legacy path
  }

  try {
    const input = document.createElement('input')
    input.value = url
    input.style.position = 'fixed'
    input.style.top = '-1000px' // off-screen, not display:none (some browsers
    input.style.left = '-1000px' // won't let execCommand('copy') select a
    document.body.appendChild(input) // display:none element)
    input.focus()
    input.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(input)
    if (ok) return 'fallback-executed'
  } catch {
    // fall through to manual
  }

  return 'manual-required' // caller renders the Error-state selectable <input>
}
```

### Anti-Patterns to Avoid
- **Awaiting `requestFullscreen()` before rendering the game screen:** breaks FULL-01 on any device where the promise never settles cleanly (see Pitfall 1) — the game-screen crossfade must render regardless of fullscreen outcome (already locked in UI-SPEC).
- **A single `` `${prefix}${char}` `` template for both letter and digit key-code mapping:** produces wrong codes for digits (`Key0` instead of `Digit0`) — see Pitfall 2.
- **Registering a new `fullscreenchange` listener every time a mode is entered:** leaks listeners across mode transitions; register exactly once at app boot (see Recommended Project Structure invariant #2).
- **Relying solely on `fullscreenchange` to route Escape back to the menu:** silently breaks on any browser/device where fullscreen never actually activated (see Pitfall 1) — this is the single most important pitfall this research surfaces.
- **Using `event.key` for gameplay letter/digit matching, or `event.code` for menu Arrow-key navigation:** these are inverted from what's correct for each context — see Pitfall 4.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Cross-browser fullscreen vendor-prefix normalization | A prefix-detection wrapper, or install `screenfull.js` | The unprefixed Fullscreen API directly, feature-detected via optional chaining (`el.requestFullscreen?.()`) | Every currently-shipping browser this project targets (Chrome, Firefox, Edge, desktop Safari 16.4+) ships the unprefixed API — `[CITED: caniuse.com/fullscreen]`. The one real gap (iOS Safari) is a WebKit *implementation* bug no wrapper library can patch around; adding the dependency buys nothing. |
| Client-side routing for ~6 flat screen states | A router library (even a "tiny" one) | `URLSearchParams` + `history.replaceState`, already CLAUDE.md's locked pattern | No nested routes, no route params beyond a single `screen` value, no code-splitting-per-route need — a router's matching/middleware layer solves problems this app structurally doesn't have. |
| Full WAI-ARIA menu widget (submenus, typeahead, `aria-activedescendant`) | A generic "accessible menu" implementation lifted wholesale from the APG example | Native `<button>` rows + a ~15-line Arrow-key focus-move listener (Pattern 3) | The full APG menu pattern solves submenu nesting, disabled-item skipping, and type-to-select — none of which this flat 7-row list needs; the subset actually needed is small enough to hand-roll clearly rather than adapt a general-purpose pattern. |
| A second celebration/animation system for the Alphabet Z-completion burst | New particle code, or a different animation library | The existing `celebrate()`/canvas-confetti call, reused with different parameters, called 3x | CLAUDE.md already explicitly anticipates this exact reuse; Phase 1's `celebrate.ts` doc comment already names "a planned Phase 2 Alphabet-mode Z-completion burst" as a future caller of the same function. |

**Key insight:** Phase 2's temptation to hand-roll is inverted from the usual pattern — the risk here isn't "will I reinvent something a library already solved," it's "will I reach for a library (router, fullscreen wrapper, menu-widget framework) to solve a problem that's actually small enough to hand-roll in a dozen lines, and that a general-purpose library would solve *less* precisely than the app's own exact 7-row/3-mode/3-fallback-tier requirements." Every "Don't Hand-Roll" entry above is a rejection of a library, not a recommendation for one — consistent with CLAUDE.md's existing minimal-dependency stance.

## Common Pitfalls

### Pitfall 1: `fullscreenchange`-as-sole-resync-trigger silently breaks Escape on iOS Safari
**What goes wrong:** CONTEXT.md locks "the native `fullscreenchange` event is the single source of truth for UI resync... any exit from fullscreen... is treated identically as 'return to menu.'" Implemented literally — i.e., the in-game Escape handler ONLY calls `exitFullscreen()` and waits for `fullscreenchange` to route back to the menu — this works perfectly on any browser where fullscreen actually activated, but on iOS Safari (where `requestFullscreen()` is documented as silently failing on non-video elements — see Standard Stack table), there was never a fullscreen state to exit, so `document.exitFullscreen()` is a no-op, **`fullscreenchange` never fires**, and pressing Escape in "windowed fallback" gameplay does nothing — the child/parent is stuck in the game screen with no way back to the menu via keyboard.
**Why it happens:** CONTEXT.md's fullscreen-exit decision was written adjacent to (and consistent with) its own fullscreen-*entry* decision ("if `requestFullscreen()` rejects or is unavailable... gameplay continues windowed"), but the exit decision's phrasing ("any exit FROM fullscreen") implicitly assumes fullscreen was successfully entered — it doesn't explicitly address the windowed-fallback case its own preceding bullet creates.
**How to avoid:** Implement ONE `returnToMenu()` function and call it from **two** trigger sites: (1) the `fullscreenchange` listener when `document.fullscreenElement === null`, and (2) directly from the in-game Escape `keydown` handler, alongside (not instead of) calling `exitFullscreenIfActive()`. This does not violate CONTEXT.md's "no separate manual/auto-exit code paths" — there is still exactly one resync *implementation*; it simply has two valid entry points, one of which (the direct Escape call) is necessary precisely because "was fullscreen active" cannot be assumed. If both fire (real fullscreen case: Escape triggers exit → `fullscreenchange` also fires), calling `returnToMenu()` twice must be harmless (idempotent — a no-op if already showing the menu).
```typescript
// The single resync function, called from both trigger sites:
function returnToMenu(): void {
  if (currentScreenIsAlreadyMenu()) return // idempotent guard
  unmountCurrentGameScreen()
  navigateTo('menu')
  showMenu()
}

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === null) returnToMenu()
})

// Inside the game-mode's keydown handler:
if (event.key === 'Escape') {
  exitFullscreenIfActive() // best-effort; may be a no-op if never entered
  returnToMenu()            // ALWAYS runs — this is the fix
}
```
**Warning signs:** Manual QA on an actual iPhone (already flagged as necessary in STATE.md's Blockers/Concerns) shows Escape doing nothing during gameplay, while Escape works fine when testing on desktop Chrome/Firefox.

### Pitfall 2: Digit physical-key codes are `Digit0`-`Digit9`, not `Key0`-`Key9`
**What goes wrong:** Phase 1's `targetCode(letter) => \`Key${letter}\`` pattern, naively generalized to `` `Key${digit}` `` for Numbers mode, produces strings like `"Key5"` — which **no real keyboard ever emits**. Every digit keypress would register as a non-match, making Numbers mode completely unplayable while looking correct in code review (the pattern visually mirrors the working Letters-mode code).
**Why it happens:** `KeyboardEvent.code`'s naming convention isn't a single uniform `Key<char>` scheme — it's `Key<letter>` for the alphabetic row specifically, and a *different* prefix, `Digit<n>`, for the numeric row, with yet another prefix, `Numpad<n>`, for the separate numeric keypad. `[VERIFIED: developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values]` — fetched and read directly this session; confirmed both the `Digit0`-`Digit9` top-row values and the separate `Numpad0`-`Numpad9` keypad values.
**How to avoid:** Use mode-aware code-mapping functions, not a single parameterized template:
```typescript
export function letterCode(letter: string): readonly string[] {
  return [`Key${letter}`]
}
/** Accepts BOTH the top-row digit AND the numeric keypad's equivalent digit,
 * since a toddler on a keyboard with a numpad pressing "the 5" should still
 * count as correct — this is an implementation recommendation (not locked by
 * CONTEXT.md/UI-SPEC, which don't mention numpad handling); see Assumptions Log A1. */
export function digitCode(digit: string): readonly string[] {
  return [`Digit${digit}`, `Numpad${digit}`]
}
// Match check becomes:
if (acceptableCodes(currentTarget, currentMode).includes(event.code)) { onCorrectMatch() }
```
**Warning signs:** Numbers mode appears to render correctly (the digit displays) but every physical digit keypress produces the neutral incorrect-flash, never a celebration — this would likely surface immediately in manual QA (per this project's manual-only Validation Architecture) but is exactly the kind of bug that's invisible in a code diff/review if the reviewer assumes the letter-mode pattern generalizes directly.

### Pitfall 3: Safari's stricter clipboard user-activation timing
**What goes wrong:** `navigator.clipboard.writeText()` throws `NotAllowedError` in Safari specifically if it's called after an `await` (or any microtask boundary) inside the click/keydown handler, even though the handler itself WAS triggered by a real user gesture — Safari's notion of "still within the gesture" is stricter/shorter than Chromium's.
**Why it happens:** `[CITED, cross-referenced across web.dev/articles/async-clipboard + community/GitHub-issue sources]` — WebKit treats "transient user activation" as expiring faster / more strictly than Blink does; an `async` handler that does other `await`ed work (e.g. fetching something, or awaiting an unrelated promise) before calling `writeText()` risks losing the activation window on Safari even though the same code works fine on Chrome.
**How to avoid:** Call `navigator.clipboard.writeText(url)` as the *first* awaited operation inside the Share row's click/Enter handler — don't do other async work first. The `shareCurrentUrl()` pattern in Code Examples already does this correctly (the `writeText` call is the first line of the function body, called directly from the row's event listener).
**Warning signs:** Share works in manual QA on desktop Chrome but fails (falls through to the `execCommand` tier, or further) specifically on Safari — this is exactly the kind of cross-browser divergence the Validation Architecture section below should explicitly test for, not assume away from one browser's success.

### Pitfall 4: `event.key` vs `event.code` — the two DIFFERENT correct choices in this same phase
**What goes wrong:** CLAUDE.md and REQUIREMENTS.md both emphasize `event.code` (never `event.key`) for gameplay matching — a blind "always use `.code` per project convention" reading could lead to implementing the menu's Arrow-key navigation with `event.code` (`"ArrowUp"`/`"ArrowDown"`/`"Enter"` values under `.code` are actually the SAME strings as under `.key` for these specific keys, so this particular mistake wouldn't even break anything — but it signals a misunderstanding that could bite on a genuinely different key later), or conversely, using `.key` for the gameplay digit/letter matching (which WOULD break under Shift/CapsLock/non-US layouts, the exact bug CORE-02 was written to prevent in Phase 1).
**Why it happens:** The project has exactly one previously-established keyboard-handling convention (`.code`, physical-key, layout-independent) from Phase 1, and it's tempting to apply it uniformly everywhere keyboard input appears in the codebase, without noticing that the *reason* for that convention — layout-independence for alphanumeric character matching — doesn't apply to Arrow/Enter/Escape/Home/End, which are non-printable "action" keys whose `.key` values (`"ArrowUp"`, `"Enter"`, `"Escape"`) are already layout-independent by nature (there's no "Dvorak version" of the up-arrow key).
**How to avoid:** Two explicit rules, not one: (1) gameplay letter/digit matching → always `event.code`, checked against `letterCode()`/`digitCode()` (Pitfall 2); (2) UI navigation (menu Arrow/Home/End/Enter, in-game Escape, windowed-panel Back) → `event.key`, the conventional and simpler choice for semantic action keys, matching the ARIA APG's own examples (`[CITED: w3.org/WAI/ARIA/apg/practices/keyboard-interface]`, which uses `.key` values throughout).
**Warning signs:** Code review should flag any `event.code === 'Escape'` or `event.code === 'ArrowDown'` comparison (technically not wrong for these specific keys, but inconsistent with the rest of the codebase's `.key` usage for action keys) as a signal worth double-checking the author understood *why* `.code` matters for gameplay and isn't cargo-culting it everywhere.

## Code Examples

### Alphabet Z-completion: reusing `celebrate()` with parameterized options (MODE-04)
```typescript
// celebrate.ts — extending Phase 1's existing celebrate() rather than duplicating it.
// All parameter values below are the exact locked values from 02-UI-SPEC.md's
// "Alphabet mode Z-completion celebration" block, quoted verbatim there.
interface BurstOptions {
  particleCount: number
  spread: number
  startVelocity: number
  ticks: number
  gravity: number
  scalar: number
  origin: { x: number; y: number }
}

async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({ ...opts, colors: CONFETTI_COLORS })
  } catch {
    // Decorative — swallow load failures, same as Phase 1's celebrate().
  }
}

/** MODE-04: three sequential bursts, left/center/right, at 0ms/120ms/240ms. */
export function celebrateAlphabetComplete(): void {
  const positions = [0.2, 0.5, 0.8] // normalized x fractions — left/center/right
  const big = { particleCount: 120, spread: 100, startVelocity: 35, ticks: 200, gravity: 1, scalar: 1.1 }
  positions.forEach((x, i) => {
    setTimeout(() => void fireBurst({ ...big, origin: { x, y: 0.5 } }), i * 120)
  })
}
```
Caller (in the generalized game loop, Alphabet mode only):
```typescript
// BEFORE picking the next target — checking against the CURRENT target, since
// nextInSequence() already returns 'A' either way (wraparound is unconditional).
if (currentMode === 'alphabet' && currentTarget === LETTERS[LETTERS.length - 1]) {
  celebrateAlphabetComplete() // bigger burst instead of the normal celebrate()
} else {
  void celebrate(target.getBoundingClientRect()) // normal per-match burst, unchanged
}
currentTarget = nextInSequence(LETTERS, currentTarget)
renderTarget(target, currentTarget)
```

### Menu row markup (no button chrome, per UI-SPEC)
```html
<!-- Source: 02-UI-SPEC.md → Home Menu & Background Contract → Layout -->
<button type="button" class="menu-item" data-screen="letters">Letters</button>
```
```css
/* Source: 02-UI-SPEC.md Layout + Focus/selection indicator sections */
.menu-item {
  display: block;
  width: 100%;
  min-height: 56px;
  background: none;
  border: none;
  padding: 0;
  font: inherit; /* buttons don't inherit font by default in most browsers —
                    this line is required, not stylistic preference */
  font-size: clamp(20px, 4vh, 28px);
  font-weight: 700;
  color: var(--color-fg);
  text-align: left;
  cursor: pointer;
}
.menu-item:focus-visible { outline: none; } /* replaced by .focused, JS-managed */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Vendor-prefixed fullscreen (`webkitRequestFullscreen`, `mozRequestFullScreen`, `msRequestFullscreen`) required for cross-browser support | Unprefixed `Element.requestFullscreen()`/`Document.exitFullscreen()` supported natively on every currently-shipping desktop browser | Desktop Safari unprefixed since 16.4 (2023); Chrome/Firefox/Edge unprefixed for years prior | Any tutorial/StackOverflow snippet showing prefix-detection chains (`docEl.requestFullscreen \|\| docEl.webkitRequestFullScreen \|\| ...`) is solving an already-solved problem for this project's targets — including such code adds dead branches, not compatibility. |
| iOS Safari fullscreen assumed "just not supported, full stop" | iOS Safari fullscreen is "partially supported" per caniuse's live table, with a documented but unresolved history of being briefly enabled (Safari 17.4 beta, early 2024) then explicitly disabled again due to bugs — status unchanged as of June-2026-dated sources | Ongoing/unresolved as of this research date (2026-08-13) | Do not write code (or plan tasks) assuming iOS Safari fullscreen "doesn't exist" (which would skip the fire-and-forget/graceful-degradation pattern as unnecessary) OR "now works" (which would skip testing the windowed-fallback path) — it must be treated as unreliable-but-sometimes-present, which is exactly what CONTEXT.md's existing "never gate on it" decision already handles correctly. |
| `document.execCommand('copy')` as the primary clipboard-write mechanism | Async `navigator.clipboard.writeText()` as primary, `execCommand` demoted to a documented-deprecated fallback | Clipboard API reached Baseline widely-available status March 2020 | CONTEXT.md's 3-tier fallback chain (clipboard API → execCommand → selectable input) is already correctly ordered newest-to-oldest; no change needed, just confirming the ordering matches current best practice. |

**Deprecated/outdated:**
- `document.execCommand()` generally (including `'copy'`) is a deprecated API per current MDN documentation — `[CITED]`. It remains broadly implemented today and is the correct fallback tier per CONTEXT.md's locked decision, but should not be treated as a long-term-stable API if this project is revisited years from now.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Numbers mode should accept BOTH `Digit<n>` (top-row) AND `Numpad<n>` (numeric keypad) physical keys as a correct match for a given digit target | Common Pitfalls → Pitfall 2, Code Examples | Low — CONTEXT.md/UI-SPEC don't address numpad handling at all (silent gap, not a contradicted decision); if wrong, the fix is a one-line change to `digitCode()`'s return array. Recommended default is the more forgiving option (accept both) since the target hardware (a toddler hunting-and-pecking on a physical keyboard, likely a laptop) makes a numpad press unlikely but harmless to also accept. |
| A2 | The fullscreen target element should be `document.documentElement` (whole page) rather than the `#app` div specifically | Architecture Patterns → Pattern 4 | Low — both are valid `Element.requestFullscreen()` targets; since `#app` already fills the viewport (`min-height: 100vh`, Phase 1's `style.css`), the visual result is identical either way. Not explicitly locked by CONTEXT.md/UI-SPEC. |
| A3 | Recommended file split (`router.ts`, `menu.ts`, `fullscreen.ts`, `clipboard.ts`, `panels.ts` as separate modules) is a suggestion, not a requirement | Architecture Patterns → Recommended Project Structure | None if the planner consolidates differently — the section explicitly states the 4 underlying invariants that matter regardless of file boundaries. |

**All other claims in this research were directly fetched/verified this session** — via `WebFetch`/`WebSearch` against MDN, W3C, caniuse.com, and Apple Developer Forums (not summarized training knowledge), via `npm view`/`package-legitimacy check` for the one existing dependency, and via direct `Read` of this project's own `game.ts`/`main.ts`/`celebrate.ts`/`style.css`/`CONTEXT.md`/`02-UI-SPEC.md` — rather than carried from training data. Per the source-provenance protocol governing this document, single-source `WebFetch`/`WebSearch` findings are tagged `[CITED: url]` (MEDIUM); the iOS Safari fullscreen finding specifically is corroborated across three independent live sources this session (caniuse.com's live compatibility table, the Apple Developer Forums thread's multi-year bug history, and a June-2026-dated aggregate search result) and is treated as the strongest-evidence finding in this document accordingly.

## Open Questions

1. **Does Safari's stricter clipboard user-activation timing (Pitfall 3) actually matter for THIS app's specific call site?**
   - What we know: the Share row's click/Enter handler calls `shareCurrentUrl()` directly with no other `await` beforehand, which is exactly the recommended-safe pattern.
   - What's unclear: whether any router/screen-transition logic that also runs on the same click event (e.g. focus management) could introduce an intervening microtask before `writeText()` actually executes, subtly reintroducing the Safari timing issue.
   - Recommendation: manual QA should explicitly test the Share row on Safari (desktop and/or iOS) as part of Phase 2's verification pass, not just assume Chrome's more permissive timing generalizes.

2. **Does `document.fullscreenEnabled` reliably report `false` on iOS Safari's partial-support case, or `true` with the request still silently failing?**
   - What we know: MDN documents `fullscreenEnabled` as a synchronous pre-flight boolean; none of the sources fetched this session document its specific behavior on iOS Safari's partial-support implementation.
   - What's unclear: whether checking it before calling `requestFullscreen()` would provide any earlyresource-saving benefit, or whether it would incorrectly report `true` (since the docs frame it around plugin/iframe restrictions, not platform-implementation completeness) and provide false confidence.
   - Recommendation: don't rely on it as a gate either way (Pattern 4 already recommends against this) — this question doesn't block implementation, it just means `fullscreenEnabled` isn't worth adding as a pre-check optimization; if added anyway, it must not change the fire-and-forget/never-gate behavior.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Vite 8 build/dev server | ✓ | v24.14.0 | — (unchanged from Phase 1) |
| npm | package scripts, `npm ci` in CI | ✓ | 11.16.0 | — |
| Fullscreen API (browser, not local-tooling) | FULL-01/02/03 | Browser-dependent — full on Chrome/Firefox/Edge/desktop Safari 16.4+, **partial/unreliable on iOS Safari** (see Standard Stack, Pitfall 1) | n/a (runtime feature, not installed) | Windowed gameplay continues (already locked in CONTEXT.md) |
| Clipboard API (browser) | SHARE-01 | Browser-dependent — Baseline widely-available (Chrome 66+/Firefox 63+/Safari 13.1+) | n/a | `execCommand('copy')` → selectable input (3-tier chain, already locked) |
| `document.execCommand` (browser) | SHARE-01 fallback tier 2 | Broadly available but deprecated | n/a | Selectable input (tier 3, already locked) |

**Missing dependencies with no fallback:** none — every browser-API dependency this phase relies on already has a locked, researched fallback path.
**Missing dependencies with fallback:** Fullscreen API on iOS Safari (fallback: windowed gameplay); Clipboard API on any non-supporting browser (fallback: execCommand, then selectable input).

## Validation Architecture

> Unchanged project constraint from Phase 1: CLAUDE.md explicitly forbids scaffolding an automated test framework for v1. This section remains manual-only by design, consistent with Phase 1's own Validation Architecture section and STATE.md's own note that iOS Safari fullscreen behavior specifically should be "validate[d] directly against the family's actual hardware rather than assuming from docs."

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none — explicitly excluded by CLAUDE.md for v1, unchanged from Phase 1 |
| Config file | none |
| Quick run command | manual: `npm run dev`, interact via physical keyboard + mouse/touch |
| Full suite command | manual: `npm run build && npm run preview`, then the live GitHub Pages URL, across **multiple browsers** (see Sampling Rate) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| MENU-01 | 7-row vertical menu visible on load | manual-only | none — visual check | N/A |
| MENU-02 | Dark moody parallax background renders, animates, freezes under reduced-motion | manual-only | none — visual check + OS reduced-motion toggle | N/A |
| MENU-03 | Quit exits fullscreen and returns to menu | manual-only | none — physical Quit-row activation while in a mode | N/A |
| MODE-01 | Letters mode: random, no immediate repeat | manual-only | none — play several rounds, observe no back-to-back repeat | N/A |
| MODE-02 | Numbers mode: random digit, `Digit*` physical key required (Pitfall 2) | manual-only | none — **must physically press top-row digit keys**, not rely on visual-only inspection, since the Pitfall 2 bug is invisible without an actual keypress | N/A |
| MODE-03 | Alphabet mode: strict A→Z sequential | manual-only | none — play through several letters, confirm order | N/A |
| MODE-04 | Z completion → bigger celebration → loop to A | manual-only | none — play through to Z, observe 3x burst, confirm next target is A | N/A |
| FULL-01 | Mode entry auto-enters fullscreen | manual-only | none — **test on desktop Chrome/Firefox/Safari AND actual iOS device** (Pitfall 1's core risk) | N/A |
| FULL-02 | Quit auto-exits fullscreen | manual-only | none — same multi-browser requirement | N/A |
| FULL-03 | Escape/OS-gesture exit resyncs UI | manual-only | none — **critically, test Escape specifically on iOS Safari** where fullscreen may never have activated (Pitfall 1) — this is the single highest-value manual test in this phase | N/A |
| SHARE-01 | Share copies current URL | manual-only | none — test on desktop Chrome AND Safari (Pitfall 3's timing risk); verify all 3 fallback tiers by simulating clipboard-denied if possible | N/A |

### Sampling Rate
- **Per task commit:** manual `npm run dev` smoke check of the change just made, on the primary development browser.
- **Per wave merge:** manual `npm run build && npm run preview` full walkthrough of all 11 requirements above, on at least two browser engines (e.g. Chrome + Safari).
- **Phase gate:** visit the *live* GitHub Pages URL and repeat the full manual walkthrough, explicitly including **an actual iOS device** for FULL-01/02/03 — this is the single highest-priority manual verification in this phase, directly addressing the risk flagged in STATE.md's Blockers/Concerns and confirmed as still-current by this research.

### Wave 0 Gaps
None — no test infrastructure is being introduced this phase, per CLAUDE.md's explicit decision (unchanged from Phase 1).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|---------------------|
| V2 Authentication | No | No accounts/auth exist or are planned anywhere in this project (unchanged from Phase 1) |
| V3 Session Management | No | No sessions — fully stateless static site (unchanged) |
| V4 Access Control | No | No protected resources (unchanged) |
| V5 Input Validation | Yes (narrow) | The `screen` URL param read by the router is validated against a fixed allow-list (`VALID_SCREENS`) before use, defaulting to `'menu'` for anything else — prevents an arbitrary/malformed `?screen=` query value from reaching a `switch` in an unexpected state. The Share fallback's selectable `<input readonly value=...>` must be set via the `.value` property (never `innerHTML`), consistent with Phase 1's `textContent`-only rule. |
| V6 Cryptography | No | No secrets, no encrypted data (unchanged) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-------------------------|
| Fullscreen API used for UI-redress/phishing (a malicious page mimics browser chrome while in fullscreen to spoof a fake address bar) | Spoofing | This is a known threat *pattern* for the Fullscreen API generally, not a vulnerability this app's own code introduces — this app's fullscreen usage displays only its own game content, never fake browser UI. Documented here per protocol as the standard threat class associated with this API family, not as an app-specific finding. |
| Unvalidated `screen`/`mode` URL parameter driving a `switch` statement | Tampering | Allow-list validation against `VALID_SCREENS` before the value is used anywhere (see V5 above) — a malformed/unexpected value falls back to `'menu'`, never propagates into an unhandled branch. |
| Clipboard write of attacker-controlled data | Tampering | Not applicable — this app only ever writes `window.location.href` (its own current URL, browser-controlled) to the clipboard, never user-supplied or externally-sourced text. |
| `history.replaceState` used for open-redirect-style tricks | Tampering | Not applicable — `replaceState` can only rewrite the URL shown for the *current* origin/document; it cannot navigate to nor spoof a different origin. |
| Supply-chain risk from new dependencies | Tampering | Not applicable this phase — zero new packages installed (see Package Legitimacy Audit). |

## Sources

### Primary (HIGH confidence)
- Direct `Read` of this project's own `src/main.ts`, `src/game.ts`, `src/celebrate.ts`, `src/style.css`, `package.json`, `vite.config.ts`, `tsconfig.json`, `.planning/phases/02-menu-game-modes-fullscreen/02-CONTEXT.md`, `.planning/phases/02-menu-game-modes-fullscreen/02-UI-SPEC.md`, `.planning/phases/01-playable-core-loop-live-deploy/01-RESEARCH.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` — this session
- `developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values` — fetched directly this session; confirmed the `Digit0`-`Digit9` vs `Key0`-`Key9` vs `Numpad0`-`Numpad9` distinction (Pitfall 2's critical finding)
- `npm view canvas-confetti version` + `gsd-tools query package-legitimacy check` — direct registry re-confirmation this session

### Secondary (MEDIUM confidence — `[CITED]`, official documentation fetched directly this session)
- `developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API`, `.../Element/requestFullscreen`, `.../Document/fullscreenchange_event`, `.../Document/fullscreenEnabled`, `.../Clipboard/writeText` — fetched directly
- `caniuse.com/fullscreen` — fetched directly, live current compatibility table (iOS Safari 12-26.3 partial-support finding)
- `developer.apple.com/forums/thread/133248` — fetched directly, multi-year (2020-2024+) history of the iOS Safari non-video-element fullscreen bug
- `web.dev/articles/fullscreen`, `web.dev/articles/async-clipboard` — fetched directly
- `w3.org/WAI/ARIA/apg/practices/keyboard-interface` — fetched directly, roving-tabindex and keyboard-convention guidance

### Tertiary (LOW confidence — WebSearch aggregation, cross-checked against the primary/secondary sources above where they overlapped)
- WebSearch results on iOS Safari fullscreen status "as of June 2026" (bugnet.io and related aggregator content) — corroborates, does not solely establish, the caniuse.com + Apple Developer Forums finding
- WebSearch results on `execCommand('copy')` hidden-textarea fallback pattern — generic, well-documented technique, cross-checked against the general shape already locked in CONTEXT.md's fallback chain
- WebSearch results on CSS-only parallax/`transform`-vs-`background-position` performance — general web-performance guidance, not project-specific; the exact CSS values used are UI-SPEC's own already-locked values, not derived from these search results
- WebSearch results on generic TypeScript state-machine/router patterns — standard software-engineering knowledge, used only to confirm the hand-rolled `switch`-based approach is conventional, not to source any specific code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, existing dependency re-verified against the live npm registry this session.
- Architecture: HIGH — the router/generalization/fullscreen patterns are grounded in direct reads of this project's own existing code plus directly-fetched official documentation, not summarized secondhand knowledge.
- Pitfalls: HIGH — Pitfall 2 (digit code values) is independently `[VERIFIED]` against MDN's own code-value tables; Pitfall 1 (iOS Safari fullscreen) is corroborated across three independent live sources this session, the strongest evidentiary basis in this document; Pitfalls 3-4 are `[CITED]` MEDIUM, single/paired-source but from authoritative documentation.

**Research date:** 2026-08-13
**Valid until:** 2026-09-12 (30 days — the iOS Safari fullscreen status specifically is an actively-evolving WebKit implementation area per its multi-year history; re-verify against caniuse.com/Apple Developer Forums if planning is picked back up after this window, especially before the Phase 2 gate's mandatory on-device iOS test)

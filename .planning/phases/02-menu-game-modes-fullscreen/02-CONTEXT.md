# Phase 2: Menu, Game Modes & Fullscreen - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 turns the Phase 1 walking skeleton (one hardcoded Letters-mode game screen) into
the real product shell: a proper home menu, all three game modes (Letters, Numbers,
Alphabet), fullscreen play, and a share affordance. It does NOT add audio (Phase 3) or
statistics collection/display (Phase 4) — the Statistics and Settings menu rows exist as
navigable entries in this phase but their actual content/functionality is stubbed or
minimal until Phases 3-4 land.

</domain>

<decisions>
## Implementation Decisions

### Home Menu Visual & Layout
- Menu items render as a plain text list — large tap targets, no button chrome/borders,
  matching the Slay-the-Spire-inspired minimalist vertical menu aesthetic
- Background is an animated particle/parallax treatment built from layered CSS
  gradients + subtle motion — no image assets, stays within the existing pearlescent
  custom-property palette
- Menu navigation supports both Up/Down arrow + Enter AND mouse/touch click; no
  letter-key hotkeys (avoids colliding with the physical-key-matching mental model used
  elsewhere in the app)
- The focused/selected menu item is indicated with an accent-color glow/underline,
  reusing the existing `--color-accent` custom property

### Mode Switching & Navigation Flow
- Escape key always returns to the home menu from any gameplay mode (and exits
  fullscreen as part of that action) — no separate on-screen quit button; the app is
  parent-operated for navigation, not toddler-operated
- Statistics and Settings screens are windowed (NOT fullscreen) — only the three
  gameplay modes (Letters/Numbers/Alphabet) trigger fullscreen
- Transitions between the menu and game screens use a simple CSS opacity crossfade,
  reusing the ~100ms transition pattern already established in Phase 1's `style.css`
- No `beforeunload`/focus-lock protection against accidental tab-close or browser-back
  in this phase — already explicitly deferred in PROJECT.md's Out of Scope section;
  only the fullscreen resync (FULL-02) handles unexpected exits

### Fullscreen Behavior & Edge Cases
- If `requestFullscreen()` rejects or is unavailable (e.g. the iOS Safari variance
  flagged in Phase 1 research), gameplay continues windowed — fullscreen success is
  never a gate on starting a mode
- Quitting a mode calls `exitFullscreen()` immediately and synchronously — no fade,
  no confirmation dialog
- The native `fullscreenchange` event is the single source of truth for UI resync: any
  exit from fullscreen — expected (Quit) or unexpected (Escape while fullscreen, OS
  gesture) — is treated identically as "return to menu." No separate manual/auto-exit
  code paths.
- Alphabet-mode's bigger Z-completion celebration plays fullscreen as normal, with no
  special fullscreen handling — it's just a bigger version of the same celebration Phase
  1 already built

### Share Affordance
- The share control is its own menu row (icon + "Share" text label), not a corner icon
  or bottom-of-page link
- On successful copy, feedback is a brief inline text change ("Copied!" for ~1.5s) — no
  toast library, no confetti (that's reserved for gameplay celebrations)
- If `navigator.clipboard` is unavailable or the permission is denied, fall back to the
  legacy `document.execCommand('copy')` via a temporary hidden input; if that also
  fails, show the URL in a selectable text box as a last resort
- The URL copied is `window.location.href` as-is (the current page URL, including any
  URLSearchParams state) — not a hardcoded canonical root

### Claude's Discretion
- Exact CSS/animation implementation of the particle/parallax menu background (layer
  count, gradient stops, motion timing) within the "no image assets, subtle motion"
  description
- Exact opacity-crossfade timing/easing for menu↔game transitions beyond "reuse the
  ~100ms pattern"
- Internal routing/state-machine shape for menu vs. mode vs. settings/stats screens
  (CLAUDE.md already establishes the general pattern: URLSearchParams on load,
  `history.replaceState` on mode change, no router library)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/game.ts` — `LETTERS` (frozen A-Z array), `pickTarget()` (no-repeat random
  selection), `targetCode()` (physical-key mapping), `renderTarget()` (textContent +
  opacity-crossfade re-trigger). Numbers mode needs an equivalent `DIGITS` pool and
  `digitCode()`; Alphabet mode needs a sequential-not-random variant of `pickTarget`.
- `src/celebrate.ts` — `celebrate()` dynamically imports `canvas-confetti`, already
  gated behind a `prefers-reduced-motion` check. The Alphabet Z-completion "distinctly
  bigger" celebration should reuse this same function with a higher `particleCount`/
  wider `spread`, not a second animation system (per CLAUDE.md's stack guidance).
- `src/style.css` — `--color-bg`, `--color-surface`, `--color-accent`, `--color-fg`,
  `--color-destructive` custom properties; `correct-pulse`/`incorrect-flash` keyframe
  patterns (remove-class/reflow/re-add-class to force animation restart) — the
  menu-item focus indicator and opacity-crossfade transitions should follow the same
  restart pattern where applicable.

### Established Patterns
- Physical-key matching via `event.code`, never `event.key` (CORE constraint, applies
  to Numbers mode too)
- `event.repeat` guard as the first statement in keydown handlers
- Textcontent-only DOM rendering, never `innerHTML`
- No router library — CLAUDE.md's documented pattern is `URLSearchParams` read on load
  to set initial screen/mode, `history.replaceState` (not `pushState`) on mode change

### Integration Points
- `src/main.ts` currently wires a single hardcoded game loop directly on page load —
  this phase replaces that with a menu-first entry point that then mounts the chosen
  mode's game loop
- New screens needed: home menu, Statistics (stub/minimal), Settings (stub/minimal) —
  Letters mode's existing loop becomes one of three mode variants

</code_context>

<specifics>
## Specific Ideas

No additional specific visual references beyond the decisions above and PROJECT.md's
existing guidance (Slay the Spire menu inspiration, tinyfingers.net fullscreen
inspiration, dark pearlescent palette).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Audio (Phase 3) and full Statistics
screen content/reset (Phase 4) are already correctly scoped to later phases in
ROADMAP.md; this phase only needs their menu entry points to exist and navigate
correctly.

</deferred>

# Roadmap: Keyboard Quest

## Overview

Keyboard Quest ships as four vertical slices, each one a playable step toward the full game. Phase 1 proves the entire pipeline end-to-end — a real, deployed, playable single-mode game — de-risking the GitHub Pages deploy before anything else is built on top of it. Phase 2 turns that skeleton into the real product: a proper menu, all three game modes, fullscreen play, and the share link. Phase 3 adds the sound and voice layer that makes each celebration land. Phase 4 closes the loop with session statistics a parent can review and reset. Every phase leaves the app in a state the child (or another toddler) could actually sit down and play.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Playable Core Loop & Live Deploy** - A single game mode is playable end-to-end, live on GitHub Pages (completed 2026-08-13)
- [ ] **Phase 2: Menu, Game Modes & Fullscreen** - Full menu, all three modes, fullscreen play, and share link
- [ ] **Phase 2.1: Progression Trail & Celebration Polish (INSERTED)** - Ambient star trail on correct matches, bigger/viewport-scaled confetti
- [ ] **Phase 3: Sound & Audio Settings** - Correct matches chime and speak, with a sound toggle
- [ ] **Phase 4: Session Statistics** - Parents can review and reset accuracy, speed, and reaction-time stats

## Phase Details

### Phase 1: Playable Core Loop & Live Deploy

**Goal**: A toddler can play one real round of the letter-matching game, live on the internet at the GitHub Pages URL
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DEPLOY-01, DEPLOY-02, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05
**Success Criteria** (what must be TRUE):

  1. Visiting the deployed GitHub Pages URL loads a working game — not a blank page or 404 — validating the deploy pipeline early
  2. Child sees one large, high-contrast letter centered on screen as the current target
  3. Pressing the physical key matching the target (regardless of Shift/Caps Lock/keyboard layout) triggers a muted, dark-pearlescent celebration and immediately selects a new target
  4. Pressing a non-matching key produces only a brief neutral flicker — never a punitive cue — and held/repeated keys never spam extra celebrations or attempt records
  5. Every push to main automatically rebuilds and redeploys the live site

**Plans**: 2/2 plans executed

Plans:

- [x] 01-01-PLAN.md — Walking skeleton: scaffold Vite + TypeScript, render one big letter, publish live on GitHub Pages (DEPLOY-01, DEPLOY-02, CORE-01)
- [x] 01-02-PLAN.md — Core letter-matching loop: random target, physical-key match, muted celebration, non-punitive flicker, repeat guard, redeploy (CORE-01..05, DEPLOY-01)

**UI hint**: yes

### Phase 2: Menu, Game Modes & Fullscreen

**Goal**: From a proper home menu, a player can choose among Letters/Numbers/Alphabet modes, play fullscreen, and share the app
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MENU-01, MENU-02, MENU-03, MODE-01, MODE-02, MODE-03, MODE-04, FULL-01, FULL-02, FULL-03, SHARE-01
**Success Criteria** (what must be TRUE):

  1. Home screen shows a vertical menu — Letters, Numbers, Alphabet, Statistics, Settings, Quit — over a dark, moody, Slay-the-Spire-inspired background
  2. Letters and Numbers modes present non-repeating random letters/digits; Alphabet mode presents letters in strict sequential A→Z order
  3. Completing Z in Alphabet mode plays a distinctly bigger celebration, then loops back to A
  4. Starting any mode auto-enters fullscreen; Quit or an unexpected exit (Escape, OS gesture) reliably exits fullscreen, resyncs the UI, and returns to the home menu
  5. Home menu has a share affordance that copies the current page URL

**Plans**: 4/4 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Router, fullscreen wrappers, menu shell, and the Letters + Numbers modes end-to-end

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Menu keyboard navigation, accent selection indicator, and the drifting parallax background
- [x] 02-03-PLAN.md — Alphabet mode's strict A→Z sequence and the bigger Z-completion celebration

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-04-PLAN.md — Share row: export glyph, three-tier clipboard copy chain, and the Copied! feedback

**UI hint**: yes

### Phase 2.1: Progression Trail & Celebration Polish (INSERTED)

**Goal**: Correct matches leave a quiet, persistent ambient visual trail (never a stats HUD), and the celebration burst reads clearly at any screen size — the two polish items flagged as higher priority than Phase 3/4
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TRAIL-01, TRAIL-02, CELEB-01, CELEB-02
**Success Criteria** (what must be TRUE):

  1. Each correct match adds a subtle star to a persistent background trail — purely decorative, no numbers or stats surfaced, distinct from the deferred POLISH-02 stats HUD
  2. The trail persists across the play session by default; a Settings toggle (default off) can make it reset on an incorrect key press instead
  3. The confetti celebration scales with viewport/fullscreen size so it's clearly visible on high-resolution monitors, not just small windows
  4. The confetti burst travels further / covers more area than Phase 1's tuning, at the same animation speed

**Plans**: 3/3 plans executed
**UI hint**: yes

Plans:
**Wave 1**

- [x] 02.1-01-PLAN.md — Ambient star trail end-to-end: `trail.ts` layer, z-index rewire, star append on every correct match, pop-in + reduced-motion (TRAIL-01)
- [x] 02.1-02-PLAN.md — Viewport-proportional celebration: clamped `viewportScaleFactor()` threaded through `fireBurst()` (CELEB-01, CELEB-02)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02.1-03-PLAN.md — Settings screen: versioned localStorage store, windowed panel + `role="switch"` toggle, menu reachability, toggle-gated trail wipe (TRAIL-02)

### Phase 3: Sound & Audio Settings

**Goal**: Correct matches feel and sound celebratory, with a simple parent-facing sound control
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: AUDIO-01, AUDIO-02, SET-01
**Success Criteria** (what must be TRUE):

  1. A correct match plays a short celebratory chime when sound is enabled
  2. A correct match optionally speaks the target letter/number name aloud when sound is enabled
  3. Settings screen lets a parent toggle sound on or off, and the toggle persists across sessions

**Plans**: 1 plan
**UI hint**: yes

Plans:
**Wave 1**

- [ ] 03-01-PLAN.md — Synthesized chime + spoken letter/digit wired into the correct-match branch, and the default-on Sound toggle that silences both (AUDIO-01, AUDIO-02, SET-01)

### Phase 4: Session Statistics

**Goal**: A parent can see how a play session went, on demand, and reset the record any time
**Mode:** mvp
**Depends on**: Phase 2, Phase 3
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, SET-02
**Success Criteria** (what must be TRUE):

  1. Each play session records accuracy, letters-per-minute, and per-match reaction time
  2. Recorded stats persist in the browser (localStorage) across sessions, with a versioned schema that won't crash on future changes
  3. Statistics screen displays accuracy, letters-per-minute, and a reaction-time histogram
  4. A one-click action resets all recorded stats, accessible from Statistics or Settings
  5. Stats are recorded silently in the background — no live HUD appears during gameplay

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Playable Core Loop & Live Deploy | 2/2 | Complete    | 2026-08-13 |
| 2. Menu, Game Modes & Fullscreen | 4/4 | In Progress|  |
| 2.1. Progression Trail & Celebration Polish (INSERTED) | 3/3 | In Progress|  |
| 3. Sound & Audio Settings | 0/1 | Planned | - |
| 4. Session Statistics | 0/TBD | Not started | - |

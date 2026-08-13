# Requirements: Keyboard Quest

**Defined:** 2026-08-12
**Core Value:** Every correct physical key press produces an immediate, delightful, low-stakes celebration — that instant feedback loop is what teaches the letter/key association and keeps a toddler engaged.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Gameplay

- [ ] **CORE-01**: Child sees one big, high-contrast letter or number centered on screen as the current target
- [ ] **CORE-02**: Pressing the physical key matching the target (case/layout-insensitive) triggers a celebration and immediately selects a new target
- [ ] **CORE-03**: Pressing any non-matching key produces no penalty — only a subtle, neutral flicker, never a punitive cue
- [ ] **CORE-04**: Held keys / key-repeat events don't spam repeated celebrations or incorrect-attempt records
- [ ] **CORE-05**: Celebration animations use a dark, pearlescent, muted palette (deep blues/purples/greens) — never a full-page flash or strobe

### Audio

- [ ] **AUDIO-01**: A correct match plays a short celebratory chime (when sound is enabled)
- [ ] **AUDIO-02**: A correct match optionally speaks the target letter/number name aloud (when sound is enabled)

### Game Modes

- [ ] **MODE-01**: Letters mode presents a random letter (A-Z, no digits), never repeating the same letter twice in a row
- [ ] **MODE-02**: Numbers mode presents a random single digit (0-9), never repeating the same digit twice in a row
- [ ] **MODE-03**: Alphabet mode presents letters in sequential order (A→Z)
- [ ] **MODE-04**: Completing Z in Alphabet mode triggers a distinctly bigger celebration before looping back to A

### Fullscreen

- [ ] **FULL-01**: Starting any game mode automatically enters fullscreen
- [ ] **FULL-02**: Leaving a game mode (Quit / navigating back) automatically exits fullscreen
- [ ] **FULL-03**: An unexpected fullscreen exit (Escape, OS gesture) gracefully resyncs the UI instead of breaking

### Menu

- [ ] **MENU-01**: Home screen shows a vertical menu: Letters, Numbers, Alphabet, Statistics, Settings, Quit
- [ ] **MENU-02**: Menu uses a dark, moody, illustrated/gradient background (Slay-the-Spire-inspired)
- [ ] **MENU-03**: Quit exits fullscreen and returns to the home menu

### Statistics

- [ ] **STAT-01**: The app records per-session stats: accuracy, letters-per-minute, and per-match reaction time
- [ ] **STAT-02**: Stats persist in the browser (localStorage) across sessions, with a versioned schema
- [ ] **STAT-03**: The Statistics screen shows accuracy, letters-per-minute, and a reaction-time histogram
- [ ] **STAT-04**: The Statistics screen has a one-click action to reset all recorded stats
- [ ] **STAT-05**: Stats are recorded but not shown live during gameplay (no in-game HUD yet)

### Settings

- [ ] **SET-01**: Settings screen has a toggle to enable/disable sound (chime + spoken letter)
- [ ] **SET-02**: Settings screen provides access to reset stats

### Sharing

- [ ] **SHARE-01**: Home menu includes a share affordance that copies the current page URL

### Deployment

- [ ] **DEPLOY-01**: App builds via Vite and deploys automatically to GitHub Pages on every push to main
- [ ] **DEPLOY-02**: A minimal working deploy is validated early (before full game logic) to de-risk the GitHub Pages base-path config

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Polish

- **POLISH-01**: Multiple selectable visual themes (beyond the single dark/pearlescent look)
- **POLISH-02**: Live in-session stats HUD / a game-over or pause screen surfacing stats mid-play
- **POLISH-03**: Optional parent-gate/lock on Settings or Quit

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / login / cloud sync | Unneeded friction and privacy liability for a single-family static app |
| Multi-digit numbers | Developmentally beyond a 2-3yo for now; single digits only |
| On-screen keyboard diagram/hint | Pure hunt-and-peck on the physical keyboard is the pedagogical point |
| Ads, in-app purchases, leaderboards, multiplayer | Irrelevant and developmentally inappropriate for this audience/scope |
| Timers, countdowns, session-length pressure | Contradicts positive-reinforcement pedagogy for this age group |
| Aggressive analytics / tracking | Inconsistent with a private family tool |
| Separate dev/staging branch | Single production deploy is sufficient per the stated constraint |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | TBD | Pending |
| CORE-02 | TBD | Pending |
| CORE-03 | TBD | Pending |
| CORE-04 | TBD | Pending |
| CORE-05 | TBD | Pending |
| AUDIO-01 | TBD | Pending |
| AUDIO-02 | TBD | Pending |
| MODE-01 | TBD | Pending |
| MODE-02 | TBD | Pending |
| MODE-03 | TBD | Pending |
| MODE-04 | TBD | Pending |
| FULL-01 | TBD | Pending |
| FULL-02 | TBD | Pending |
| FULL-03 | TBD | Pending |
| MENU-01 | TBD | Pending |
| MENU-02 | TBD | Pending |
| MENU-03 | TBD | Pending |
| STAT-01 | TBD | Pending |
| STAT-02 | TBD | Pending |
| STAT-03 | TBD | Pending |
| STAT-04 | TBD | Pending |
| STAT-05 | TBD | Pending |
| SET-01 | TBD | Pending |
| SET-02 | TBD | Pending |
| SHARE-01 | TBD | Pending |
| DEPLOY-01 | TBD | Pending |
| DEPLOY-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️ (roadmap creation pending)

---
*Requirements defined: 2026-08-12*
*Last updated: 2026-08-12 after initial definition*

# Requirements: Teaching Toddlers Typing

**Defined:** 2026-08-12
**Core Value:** Every correct physical key press produces an immediate, delightful, low-stakes celebration — that instant feedback loop is what teaches the letter/key association and keeps a toddler engaged.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Gameplay

- [x] **CORE-01**: Child sees one big, high-contrast letter or number centered on screen as the current target
- [x] **CORE-02**: Pressing the physical key matching the target (case/layout-insensitive) triggers a celebration and immediately selects a new target
- [x] **CORE-03**: Pressing any non-matching key produces no penalty — only a subtle, neutral flicker, never a punitive cue
- [x] **CORE-04**: Held keys / key-repeat events don't spam repeated celebrations or incorrect-attempt records
- [x] **CORE-05**: Celebration animations use a dark, pearlescent, muted palette (deep blues/purples/greens) — never a full-page flash or strobe

### Audio

- [ ] **AUDIO-01**: A correct match plays a short celebratory chime (when sound is enabled)
- [ ] **AUDIO-02**: A correct match optionally speaks the target letter/number name aloud (when sound is enabled)
- [x] **AUDIO-03**: Spoken letters say just the letter name ("E"), never "Capital E" or any other prefix

### Game Modes

- [ ] **MODE-01**: Letters mode presents a random letter (A-Z, no digits), never repeating the same letter twice in a row
- [ ] **MODE-02**: Numbers mode presents a random single digit (0-9), never repeating the same digit twice in a row
- [ ] **MODE-03**: Alphabet mode presents letters in sequential order (A→Z)
- [ ] **MODE-04**: Completing Z in Alphabet mode triggers a distinctly bigger celebration before looping back to A

### Fullscreen

- [ ] **FULL-01**: Starting any game mode automatically enters fullscreen
- [ ] **FULL-02**: Leaving a game mode (Quit / navigating back) automatically exits fullscreen
- [ ] **FULL-03**: An unexpected fullscreen exit (Escape, OS gesture) gracefully resyncs the UI instead of breaking
- [ ] **FULL-04**: A Settings toggle controls whether starting a mode auto-enters fullscreen, defaulting to on (matching today's behavior)

### Menu

- [ ] **MENU-01**: Home screen shows a vertical menu: Letters, Numbers, Alphabet, Statistics, Settings, Quit
- [ ] **MENU-02**: Menu uses a dark, moody, illustrated/gradient background (Slay-the-Spire-inspired)
- [ ] **MENU-03**: Quit exits fullscreen and returns to the home menu
- [x] **MENU-04**: The home menu's drifting parallax background is visibly rendering (regression fix — built and verified in Phase 2 but not appearing live)
- [x] **MENU-05**: The menu list is left-aligned with an on-screen title reading "Teaching Toddlers Typing", Slay-the-Spire-style
- [ ] **MENU-06**: Quit's behavior is reconsidered through discussion and either redesigned or removed

### Statistics

- [ ] **STAT-01**: The app records per-session stats: accuracy, letters-per-minute, and per-match reaction time
- [ ] **STAT-02**: Stats persist in the browser (localStorage) across sessions, with a versioned schema
- [ ] **STAT-03**: The Statistics screen shows accuracy, letters-per-minute, and a reaction-time histogram
- [ ] **STAT-04**: The Statistics screen has a one-click action to reset all recorded stats
- [ ] **STAT-05**: Stats are recorded but not shown live during gameplay (no in-game HUD yet)

### Settings

- [ ] **SET-01**: Settings screen has a toggle to enable/disable sound (chime + spoken letter)
- [ ] **SET-02**: Settings screen provides access to reset stats
- [ ] **SET-03**: Settings' sound control is 3-state — Off / Chime / Spoken letter — replacing the binary on/off toggle, still persisted

### Session Length

- [ ] **SESSION-01**: Settings screen has a "Max # of letters" control that sets a session length cap (number of correct matches), applying to Letters, Numbers, and Alphabet modes
- [ ] **SESSION-02**: Reaching the cap — or, in Alphabet mode, reaching Z, whichever comes first — ends the session gracefully with the existing bigger (Alphabet-completion-style) celebration, followed by a Game Over/Congrats screen
- [ ] **SESSION-03**: The correct-match counter resets whenever a mode is (re-)entered
- [ ] **SESSION-04**: The Game Over/Congrats screen offers a subtle "One more letter" option (a nod to the "one more turn" mechanic) that overrides the cap and continues the session for one more round

### Sharing

- [ ] **SHARE-01**: Home menu includes a share affordance that copies the current page URL

### Deployment

- [x] **DEPLOY-01**: App builds via Vite and deploys automatically to GitHub Pages on every push to main
- [x] **DEPLOY-02**: A minimal working deploy is validated early (before full game logic) to de-risk the GitHub Pages base-path config

### Progression & Celebration Polish

- [ ] **TRAIL-01**: A correct match adds a subtle star to a persistent ambient background trail — decorative only, no numbers or stats shown — that stays visible across the play session
- [ ] **TRAIL-02**: A Settings toggle controls whether the trail resets on an incorrect key press, defaulting to off (trail persists through mistakes)
- [x] **TRAIL-03**: The star trail is visibly rendering during gameplay after correct matches (regression fix — built and verified in Phase 2.1 but not appearing live)
- [ ] **CELEB-01**: The correct-match celebration burst scales relative to viewport/fullscreen size so it reads clearly on high-resolution displays, not just small windows
- [ ] **CELEB-02**: The correct-match celebration burst travels further and covers more area (bigger explosion / longer drop) while keeping the same animation speed/timing

### Documentation & Branding

- [x] **DOCS-01**: `.claude/CLAUDE.md` and `.planning/PROJECT.md` consistently refer to the project as "Teaching Toddlers Typing" — "Keyboard Quest" does not appear as the product name anywhere

### Mobile Support

- [ ] **MOBILE-01**: A subtly-shaded icon in the top-right corner of gameplay screens summons the device's on-screen/virtual keyboard on mobile
- [ ] **MOBILE-02**: Letters, Numbers, and Alphabet mode screens each have a visible on-screen back control that returns to the home menu, alongside existing Escape support

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
| Visible timers, countdowns, or any in-session pressure/urgency cue | Contradicts positive-reinforcement pedagogy for this age group. Distinct from SESSION-01..04 (Phase 4.1): a parent-set correct-match cap that ends the session with a celebration, not a ticking-clock mechanic the child perceives |
| Aggressive analytics / tracking | Inconsistent with a private family tool |
| Separate dev/staging branch | Single production deploy is sufficient per the stated constraint |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| AUDIO-01 | Phase 3 | Pending |
| AUDIO-02 | Phase 3 | Pending |
| MODE-01 | Phase 2 | Pending |
| MODE-02 | Phase 2 | Pending |
| MODE-03 | Phase 2 | Pending |
| MODE-04 | Phase 2 | Pending |
| FULL-01 | Phase 2 | Pending |
| FULL-02 | Phase 2 | Pending |
| FULL-03 | Phase 2 | Pending |
| MENU-01 | Phase 2 | Pending |
| MENU-02 | Phase 2 | Pending |
| MENU-03 | Phase 2 | Pending |
| STAT-01 | Phase 4 | Pending |
| STAT-02 | Phase 4 | Pending |
| STAT-03 | Phase 4 | Pending |
| STAT-04 | Phase 4 | Pending |
| STAT-05 | Phase 4 | Pending |
| SET-01 | Phase 3 | Pending |
| SET-02 | Phase 4 | Pending |
| SHARE-01 | Phase 2 | Pending |
| DEPLOY-01 | Phase 1 | Complete |
| DEPLOY-02 | Phase 1 | Complete |
| TRAIL-01 | Phase 2.1 | Pending |
| TRAIL-02 | Phase 2.1 | Pending |
| CELEB-01 | Phase 2.1 | Pending |
| CELEB-02 | Phase 2.1 | Pending |
| AUDIO-03 | Phase 3.1 | Complete |
| MENU-04 | Phase 3.1 | Complete |
| TRAIL-03 | Phase 3.1 | Complete |
| MENU-05 | Phase 3.1 | Complete |
| DOCS-01 | Phase 3.1 | Complete |
| SET-03 | Phase 4.1 | Pending |
| MENU-06 | Phase 4.1 | Pending |
| FULL-04 | Phase 4.1 | Pending |
| SESSION-01 | Phase 4.1 | Pending |
| SESSION-02 | Phase 4.1 | Pending |
| SESSION-03 | Phase 4.1 | Pending |
| SESSION-04 | Phase 4.1 | Pending |
| MOBILE-01 | Phase 4.2 | Pending |
| MOBILE-02 | Phase 4.2 | Pending |

**Coverage:**

- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-12*
*Last updated: 2026-08-15 — added SESSION-01..04 (Phase 4.1) per user request*

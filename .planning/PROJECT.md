# Keyboard Quest

## What This Is

A dark, pearlescent-themed toddler typing game for 2-3 year olds learning to associate letters and numbers on a physical keyboard with what's shown on screen. One big target character sits center-screen; the child hunts and pecks the matching physical key, and a muted celebratory animation (plus optional sound) plays before a new target appears. Built specifically for the child, who loves "playing working," but shareable with any toddler via a simple link.

## Core Value

Every correct physical key press produces an immediate, delightful, low-stakes celebration — that instant feedback loop is what teaches the letter/key association and keeps a toddler engaged.

## Requirements

### Validated

- ✓ Deployed as a static site to GitHub Pages, single production deploy on every push — Phase 1

### Active

- [ ] Big centered letter/number display that swaps to a new random/next target on a correct match — letter half shipped in Phase 1 (Letters mode only); numbers pending Phase 2
- [ ] Three game modes: Letters (random A-Z, no digits), Numbers (random single digit 0-9), Alphabet (sequential A→Z) — Letters mode shipped standalone in Phase 1 (no mode switcher yet); Numbers/Alphabet pending Phase 2
- [ ] Alphabet mode plays a bigger celebration on completing Z, then loops back to A
- [ ] No penalty for incorrect key presses — subtle neutral flicker only, never punitive — shipped in Phase 1 for Letters mode
- [ ] Celebratory animation on correct match (dark, pearlescent, muted — no full-page flashes), with optional sound/spoken letter — muted confetti+pulse celebration shipped in Phase 1 (respects prefers-reduced-motion); sound/speech pending Phase 3
- [ ] Auto-enter fullscreen on Play, auto-exit on leaving — matching tinyfingers.net's handling
- [ ] Top-level menu: Letters / Numbers / Alphabet / Statistics / Settings / Quit, Slay-the-Spire-style vertical list
- [ ] Statistics screen: accuracy, letters-per-minute, and a reaction-time histogram, recorded per play session
- [ ] Stats persist in-browser across sessions, with an easy one-click reset
- [ ] Settings screen: toggle sound, manage stats collection/reset
- [ ] Share-link affordance on the home menu (copies current URL — no accounts, no backend)

### Out of Scope

- User accounts / auth — unnecessary for a single-family toddler app
- Live in-session stats HUD — deferred; stats are recorded per session but not displayed during play for now (data model should support a future game-over/pause screen showing them)
- Multi-digit numbers — deferred, single digits (0-9) only for now
- On-screen keyboard diagram/hint — pure hunt-and-peck on the physical keyboard by design
- Separate dev/staging environment — single production deploy is sufficient for this scope

## Context

- Directly inspired by https://tinyfingers.net/ for its fullscreen handling and celebratory feel — but that site uses big colorful buttons, not accurate key-to-letter matching.
- Primary user is the child (2-3 years old), who enjoys "playing working"; the app should feel playful, not academic.
- Brand-new project — no existing codebase at project init.
- Visual language: dark background, pearlescent/traditional dark blues, purples, and greens; celebratory but muted — no full-page flashes.
- Menu inspiration: Slay the Spire's title screen (vertical list menu over an illustrated/moody background).
- **Privacy note (Phase 1):** the child's real first name briefly appeared in tracked planning docs (`.claude/CLAUDE.md`, `.planning/*.md`) in this now-public repo. Redacted to a generic placeholder in all current files and scrubbed from every past commit via `git filter-repo --replace-text` + force-push (repo had 0 forks/PRs at the time, so no surviving copy of the old history exists). Going forward: never put the child's real name in any tracked file — use a generic placeholder in all planning docs and commit messages.

## Constraints

- **Hosting**: GitHub Pages — the user is near their Firebase usage limit and wants the simplest, cheapest deploy path.
- **Branching**: No dev/staging branch — every push deploys straight to production.
- **Auth/Backend**: None — fully static, no user accounts, no server.
- **Audience**: Must be usable by a 2-3 year old with zero reading ability — feedback must be visual/audible, not text-based.
- **Tech stack**: Vite + TypeScript static site, chosen for minimal overhead and a clean GitHub Pages deploy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite + TypeScript over React | Lightweight, no framework overhead needed for a single-page animated app | ✓ Confirmed — Phase 1 |
| GitHub Pages over Firebase Hosting | Free, simple, avoids nearing Firebase usage limits | ✓ Confirmed — Phase 1, live at halvorson.github.io/teaching-toddlers-typing |
| No dev/staging branch | Solo hobby project for family use; simplicity over process | ✓ Confirmed — Phase 1, every push to main auto-deploys |
| Alphabet mode is sequential A→Z (not random) | Teaches alphabet order distinctly from Letters mode | — Pending Phase 2 |
| Stats collected per-session but not shown live | Keeps gameplay screen distraction-free now; data model ready for a future game-over/pause screen | — Pending Phase 4 |
| Generic branding (no real name in title) | Keeps the app easily shareable with other families | ✓ Confirmed — Phase 1 (title/README/app code); see Context note on the planning-docs exposure incident |
| `KeyboardEvent.code` (physical key) matching, never the character property | Layout/Shift/Caps-Lock independent — matches by physical key position, not typed character | ✓ Confirmed — Phase 1 |
| Public GitHub repo, Claude creates+pushes via authenticated `gh` CLI | Required for free-tier GitHub Pages via the Actions build type; simplest path to a shareable link | ✓ Confirmed — Phase 1 |
| Deploy workflow: non-cancelling `concurrency` group (`cancel-in-progress: false`) | An in-flight production deploy is never aborted by a following push — most-recently-completed deploy always wins | ✓ Confirmed — Phase 1 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-13 after Phase 1*

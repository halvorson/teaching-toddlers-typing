# Phase 1: Playable Core Loop & Live Deploy - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 proves the entire pipeline end-to-end: a real, deployed, playable single-mode
game. It ships exactly one game mode (Letters — random A-Z), the core target/celebrate/
flicker loop, and a working GitHub Pages deploy pipeline. No menu, no fullscreen, no
audio, no stats — those arrive in Phases 2-4. The page loads directly into gameplay.

</domain>

<decisions>
## Implementation Decisions

### Deploy & Repo Setup
- GitHub repo name: `teaching-toddlers-typing` (matches existing local directory name;
  user explicitly chose this over the "keyboard-quest" product-name alternative)
- Live Pages URL will be `https://halvorson.github.io/teaching-toddlers-typing/`
- Vite `base` config must be `/teaching-toddlers-typing/`
- Repo visibility: Public (required for free-tier GitHub Pages via Actions)
- Claude creates and pushes the GitHub repo now via the authenticated `gh` CLI
  (account: halvorson) — do not wait on the user to create it manually
- Browser tab `<title>`: "Teaching Toddlers Typing" (user's explicit choice — overrides
  the "Keyboard Quest" product name for the page title; still satisfies PROJECT.md's
  "generic branding, no real name reference" decision)
- Deploy via the official 3-action GitHub Actions workflow (configure-pages,
  upload-pages-artifact, deploy-pages), triggered on push to `main`, per CLAUDE.md

### Core Gameplay Visual & Interaction
- Phase 1 ships exactly one mode: Letters (random A-Z, no digits) — the primary
  teaching hook; Numbers/Alphabet modes and the mode-select menu arrive in Phase 2
- Target letter: huge (~45% viewport height), bold sans-serif, high-contrast
  light-on-dark, centered on screen
- Celebration on correct match: small canvas-confetti burst tuned to the dark
  pearlescent palette (deep blues/purples/greens, muted — no primary rainbow colors)
  plus a brief scale/glow pulse on the letter itself
- Incorrect key press: quick (~150ms) subtle border/background flash in a muted
  neutral tone; the target letter itself stays still (no shake) — never a punitive cue
- No full-page flashes or strobing per CORE-05

### Input Handling & State Logic
- Key matching uses `KeyboardEvent.code` (physical key position) so matching is
  layout- and Shift/CapsLock-independent — never compare against `event.key` for the
  match check
- Held-key/key-repeat events are ignored via `event.repeat === true` — prevents
  spamming celebrations or incorrect-attempt records
- Target selection is random, excluding the immediately-previous target (no two
  consecutive rounds show the same letter)
- On initial page load, the first random target is shown immediately — no "get
  ready"/splash gate before gameplay starts

### Claude's Discretion
- Exact confetti tuning parameters (particleCount, spread, ticks) within the "small,
  muted burst" description
- Exact flicker/pulse animation timing curves beyond the ~150ms guidance
- Internal code structure/module layout (state machine shape, file organization)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
None — greenfield project. Only `.claude/CLAUDE.md` exists in the repo so far.

### Established Patterns
None yet. Follow the stack decisions already recorded in CLAUDE.md: Vite +
TypeScript (vanilla-ts template), TypeScript pinned to 5.9.3, canvas-confetti as the
sole runtime dependency, native CSS custom properties for the pearlescent theme, a
hand-rolled state machine (no router/framework).

### Integration Points
This phase establishes the initial project structure from scratch: Vite scaffold,
`vite.config.ts` with the `/teaching-toddlers-typing/` base path, `src/main.ts` entry,
the game state machine, and the `.github/workflows/deploy.yml` Pages workflow.

</code_context>

<specifics>
## Specific Ideas

No additional specific references beyond the decisions above — CLAUDE.md's stack
recommendations and PROJECT.md's visual language (dark, pearlescent, deep
blues/purples/greens, muted celebration) are the guiding specifics.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Menu, fullscreen, Numbers/Alphabet
modes, audio, and stats are already correctly scoped to later phases in ROADMAP.md.

</deferred>

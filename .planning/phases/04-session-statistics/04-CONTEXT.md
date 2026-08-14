# Phase 4: Session Statistics - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning
**Mode:** Autonomous — self-accepted defaults (Phase 3's verifier was running in parallel; user
asked to keep moving rather than block on non-critical decisions). This phase has more data-model
surface than Phase 3, so every non-obvious modeling choice below is spelled out explicitly with its
rationale, fully revisable before/during execution.

<domain>
## Phase Boundary

A parent can open a Statistics screen showing accuracy, letters-per-minute, and a reaction-time
histogram for cumulative play since the last reset, and reset that record from either Statistics
or Settings. Recording happens silently in the background during gameplay — no live HUD
(STAT-01..05, SET-02).

</domain>

<decisions>
## Data Model

- **One cumulative pool, not per-session buckets.** STAT-04 says "reset ALL recorded stats" (a
  single pool), not "reset the current session" — there is no requirement for browsing past
  sessions individually, so the simplest model that satisfies every literal requirement is a
  single running record that accumulates from first play until the parent resets it.
- **Aggregated counters, not a raw match log.** Storing every individual match event forever would
  make localStorage grow unboundedly over the app's real lifetime (unlike Phase 2.1's trail, which
  is ephemeral DOM state, not persisted). Instead: running totals (`correctCount`,
  `incorrectCount`), a fixed-size reaction-time histogram (bucket counts, not raw samples), and
  `firstMatchAt`/`lastMatchAt` timestamps for the LPM rate. Storage size is O(1) regardless of how
  long the app has been played.
- **What counts as a "match" for accuracy:** every non-repeat keydown while a game screen is
  mounted that isn't Escape — i.e. exactly the same correct/incorrect branch `game-screen.ts`
  already has, both branches now also update the stats record. `event.repeat` presses are already
  filtered before either branch runs, so no new repeat-guard is needed.
- **Reaction time is recorded only for correct matches** (time from the target's render to the
  correct keypress) — an incorrect keypress doesn't resolve a target, so there's no "reaction
  time" to record for it, only an increment to `incorrectCount`.
- **Histogram buckets (fixed, 5 bins):** `<1s`, `1-2s`, `2-4s`, `4-8s`, `8s+`. Chosen as a simple,
  fixed partition appropriate for toddler-scale reaction times — no dynamic binning/scaling needed
  for a "simple parent-facing" screen.
- **All modes count toward one aggregate** — Letters, Numbers, and Alphabet correct matches all
  feed the same `correctCount`/histogram/LPM. The requirements don't ask for a per-mode breakdown;
  the "letters-per-minute" label is used loosely to mean "characters per minute" across all modes,
  consistent with Numbers mode already reusing every other Letters-mode mechanism since Phase 2.
- **Letters-per-minute (LPM) formula:** `correctCount / ((lastMatchAt - firstMatchAt) / 60000)`,
  both timestamps updated on every match, only since the last reset. This freezes at whatever rate
  was reached once play stops (rather than continuing to drop while the tab sits idle/unattended),
  which reads more intuitively on a screen a parent checks after the fact. If `correctCount` is 0
  or the two timestamps are equal (first-ever match), LPM displays as "—" / not-yet-available
  rather than dividing by zero.
- **Accuracy formula:** `correctCount / (correctCount + incorrectCount)`, displayed as a
  percentage; "—" when both are 0 (no data yet).

## Persistence

- **Separate localStorage key from settings** (`keyboard-quest-stats`, own `version: 1` field) —
  stats and settings are different concerns with different growth/reset semantics; conflating them
  into one blob would make a stats-only reset accidentally require touching unrelated settings
  fields.
- **Write after every match** (both correct and incorrect update and persist), mirroring
  `settings-store.ts`'s existing `readSettings()`/`writeSettings()` idiom directly — matches this
  codebase's established pattern rather than introducing a new batching/flush mechanism. Match
  frequency (seconds between keypresses) makes per-match writes cheap.
- **Same silent-degrade contract as everywhere else** in this codebase: a read/write failure
  (private browsing, quota, disabled storage) degrades to an in-memory-only record for the current
  page load, no error UI. Stats are non-critical, decorative-adjacent data, same tier as settings.
- **Shape-checked reads**, same pattern as `settings-store.ts`: a missing key, `JSON.parse`
  failure, wrong version, or any field failing its `typeof` check resolves to a fresh zeroed
  record rather than throwing or trusting a corrupted value.

## Statistics Screen

- **Reuses the existing windowed (non-fullscreen) panel pattern** built in Phase 2.1/3's Settings
  screen — same `.settings-panel`-style card over the drifting background, same `← Back`/Escape
  exit. This is the first phase to give the "stats" menu row real content (currently undispatched
  per `menu.ts`'s own comment).
- **Histogram rendering: plain CSS bars, no canvas, no charting library.** Five `<div>` bars (one
  per bucket) with `height`/`flex-basis` driven by each bucket's count relative to the largest
  bucket — matches CLAUDE.md's "no charting/animation library" constraints and the project's
  hand-authored-DOM-only precedent (`textContent`/`createElement`, never `innerHTML`).
- **Reset is a genuine one-click action, no confirmation dialog** — STAT-04's own wording says
  "one-click," and this matches the app's existing no-confirmation precedent (Quit has none
  either, per Phase 2's CONTEXT.md). Clicking Reset immediately zeroes the record and re-renders
  the screen with all values back to "—"/empty.
- **Reset lives on the Statistics screen** (where the data being cleared is displayed — the
  natural place for a destructive action on that data), satisfying STAT-04. **Settings gets a
  link/button that navigates to Statistics** rather than a second, duplicate reset control —
  satisfies SET-02's "provides access to reset stats" without maintaining two copies of
  destructive-action logic. (If this reading of SET-02 is wrong and a literal second button on
  Settings is wanted instead, that's a one-line planner-level change; flagged here for visibility.)

## Claude's Discretion

- Exact CSS class names, spacing, and layout for the histogram bars and stat rows, within "reuses
  the windowed panel pattern, no new design system."
- Exact wording for the "no data yet" empty state ("—" vs. a short phrase) — pick one, apply
  consistently across accuracy/LPM/histogram.
- Internal module name/file for the stats-recording logic (e.g. `stats-store.ts` mirroring
  `settings-store.ts`, plus a `stats.ts` screen module mirroring `settings.ts`).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/settings-store.ts` — the exact versioned-record, shape-checked-read, silent-degrade-write
  pattern this phase's `stats-store.ts` should mirror (separate key, same idiom).
- `src/settings.ts` — the windowed-panel mount/unmount lifecycle (`document.createElement` +
  `textContent`, delegated click listener, document-level Escape listener) this phase's
  `stats.ts` should mirror for the Statistics screen.
- `src/game-screen.ts`'s keydown handler — both the correct-match branch (where `celebrate()`,
  `addTrailStar()`, `playChime()`, `speakTarget()` already fire) and the incorrect branch (where
  `readSettings().resetTrailOnMistake` is already read fresh) are where the new stats-recording
  calls join, following the exact "read fresh, never cache at mount" pattern already established
  there for the trail-reset toggle.
- `src/menu.ts` — `MenuRow` already includes `'stats'`; the comment at `menu.ts:299` explicitly
  flags it as undispatched, waiting for this phase.
- `src/router.ts` — already has a `'settings'` `Screen` member and `VALID_SCREENS` pattern (added
  in Phase 2.1) to mirror for a new `'stats'` screen value.

### Established Patterns
- Fresh-read-per-call for settings (no caching at mount) — `game-screen.ts`'s existing
  `readSettings().resetTrailOnMistake` read is the direct precedent for this phase's own
  settings/stats reads.
- Silent-degrade-on-failure for all decorative/utility/persistence code — `clipboard.ts`,
  `celebrate.ts`, `settings-store.ts`, `audio.ts` — no error UI anywhere in this codebase.
- `textContent`-only DOM construction, never `innerHTML`, codebase-wide invariant.

### Integration Points
- `game-screen.ts`'s correct/incorrect branches (stats-recording call sites).
- `router.ts`'s `Screen` union/`VALID_SCREENS` (new `'stats'` member).
- `main.ts`'s `mountScreen` switch (new case) and `menu.ts`'s `handleClick` dispatch (new
  `onOpenStats` handler, mirroring `onOpenSettings`).
- `settings.ts` (Settings screen gains a "View Statistics" link/button per the Claude's Discretion
  note above).

</code_context>

<specifics>
## Specific Ideas

- None beyond the ROADMAP's own success criteria.

</specifics>

<deferred>
## Deferred Ideas

- Per-mode stats breakdown (separate accuracy/LPM for Letters vs. Numbers vs. Alphabet) — out of
  scope, one aggregate across all modes per the literal requirements.
- Live in-game HUD showing running stats — explicitly out of scope per STAT-05.
- Any historical/per-session browsing of past stats (as opposed to one cumulative pool) — out of
  scope, matches STAT-04's "reset ALL" wording implying a single pool.

</deferred>

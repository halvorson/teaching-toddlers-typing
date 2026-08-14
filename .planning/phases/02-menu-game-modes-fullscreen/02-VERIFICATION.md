---
phase: 02-menu-game-modes-fullscreen
verified: 2026-08-14T01:10:02Z
status: human_needed
score: 11/12 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Starting a mode auto-enters fullscreen; Quit or an unexpected fullscreen exit (Escape, OS gesture, system fullscreen control) reliably exits fullscreen and resyncs the UI back to the home menu (FULL-01/02/03)"
    test: "In a real browser: click a mode row and confirm the browser actually goes fullscreen; then trigger each of (a) the in-game Escape key, (b) the OS/browser fullscreen-exit gesture (e.g. clicking the browser's own 'exit fullscreen' control) while still in a mode, and (c) Quit from a mode reached via a direct ?screen=letters URL load (where fullscreen was never entered at all)"
    expected: "All three paths land back on the home menu with fullscreen fully exited (or, for (c), no error/stall despite fullscreen never having been active), and the drifting background reappears"
    why_human: "The Fullscreen API requires a real user gesture and a live browser context this environment cannot provide; this is a cancellation/cleanup/resync invariant (main.ts's single fullscreenchange listener + quitToMenu()) that grep/presence checks can confirm is wired but cannot confirm actually fires and resolves correctly at runtime"
human_verification:
  - test: "Load the app and visually confirm the seven-row menu (Letters, Numbers, Alphabet, Statistics, Settings, Share, Quit) renders over a dark, slowly drifting two-layer gradient background with no image request in DevTools Network"
    expected: "Matches 02-02-PLAN.md Task 2 human-check: soft, slow, non-distracting drift; menu fades in; background freezes under OS reduce-motion; background disappears (plain dark field) behind gameplay; reappears on Escape back to menu"
    why_human: "Visual/subjective rendering and motion judgment — not assertable by static analysis"
  - test: "Confirm keyboard-only menu navigation end to end: Letters is pre-highlighted on load with no initial Tab; Down walks through all seven rows and wraps Quit→Letters; Up wraps Letters→Quit; Home/End jump to first/last; mouse hover produces the identical highlight with no leftover second highlight; native Tab/Shift+Tab also keeps the highlight in sync (WR-01 fix); Enter/Space activates the highlighted row"
    expected: "Matches 02-02-PLAN.md Task 1 human-check plus the WR-01 code-review fix"
    why_human: "Live keyboard/mouse interaction and visual focus-indicator agreement — not assertable by static analysis"
  - test: "Play Letters mode and physically press every A-Z key; confirm each registers a match regardless of Shift/Caps Lock, that the same letter never repeats twice in a row over ~10 rounds, and that a held/repeated key produces at most one celebration"
    expected: "Matches 02-01-PLAN.md Task 1 human-check; WINDOWS.md ledger item 2"
    why_human: "Live physical-keyboard interaction — not assertable by static analysis"
  - test: "Play Numbers mode and physically press every top-row digit key 0-9, and the numeric keypad digits if available; confirm each registers a match and the same digit never repeats twice in a row over ~10 rounds"
    expected: "Matches 02-01-PLAN.md Task 2 human-check; WINDOWS.md ledger item 3 — this is the one check that can silently fail (render correct while every press misses) if the code-vs-Numpad prefix logic were wrong, per 02-RESEARCH.md Pitfall 2"
    why_human: "Live physical-keyboard interaction — not assertable by static analysis"
  - test: "Play Alphabet mode through to Z and confirm the three-burst sweep (left/centre/right) is visibly and distinctly bigger than the ordinary single-burst celebration every other letter produces, that play continues immediately from A with no pause or end screen, and that both celebration sizes are fully suppressed under OS reduce-motion"
    expected: "Matches 02-03-PLAN.md Task 2 human-check"
    why_human: "Visual size/scale comparison and motion-suppression judgment — not assertable by static analysis"
  - test: "Activate Share and confirm a paste yields the exact address-bar URL and the row shows Copied! for ~1.5s; then in DevTools force the modern Clipboard API to fail and confirm the legacy execCommand tier still copies successfully with arrow-key menu navigation intact afterward; then force both tiers to fail and confirm the manual fallback box appears once, is read-only, doesn't stack on repeat activation, and disappears on mode launch. Repeat the basic copy check in an actual Safari instance (not just Chromium) per 02-RESEARCH.md Pitfall 3"
    expected: "Matches 02-04-PLAN.md Task 1 and Task 2 human-check sections"
    why_human: "Live clipboard/browser-permission behavior and cross-browser (Safari) verification — not assertable by static analysis"
---

# Phase 2: Menu, Game Modes & Fullscreen Verification Report

**Phase Goal:** From a proper home menu, a player can choose among Letters/Numbers/Alphabet modes, play fullscreen, and share the app
**Verified:** 2026-08-14T01:10:02Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Verified against the actual codebase (`src/*.ts`, `src/style.css`) at HEAD (`02abeaa`), not against
SUMMARY.md narrative. All four plans' commits exist in `git log`, `npm run build` (tsc strict + vite
build) exits 0, and the phase's own code-review cycle (`02-REVIEW.md` → 3 warnings found → all 3 fixed
in `02-REVIEW-FIX.md`, confirmed re-reviewed at 0 critical/0 warning) is independently confirmed present
in the current source, not just claimed in the review report — see "Code Review Fix Confirmation" below.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Home menu shows seven rows — Letters, Numbers, Alphabet, Statistics, Settings, Share, Quit — over a dark, moody, CSS-only gradient background (MENU-01, MENU-02) | ✓ VERIFIED | `src/menu.ts:15-30` `MENU_ROWS`/`MENU_LABELS` exact order/labels; `src/style.css:16-63` two-layer `body::before`/`::after` radial-gradient parallax, `color-mix` against existing tokens only, no `url(` anywhere in the stylesheet |
| 2 | Quit exits fullscreen and returns to the home menu (MENU-03) | ✓ VERIFIED | `src/main.ts:66-70` `quitToMenu()` calls `exitFullscreenIfActive()` unconditionally then navigates to menu; wired from `menuHandlers.onQuit` (`main.ts:15-17`) |
| 3 | Letters mode presents a random letter (A-Z only), never repeating twice in a row, matched via physical key regardless of Shift/Caps Lock/layout (MODE-01) | ✓ VERIFIED | `src/game.ts:11-14,24-28,50-52` `LETTERS` pool, `pickRandom(pool, exclude)` filters the excluded member before indexing (structurally cannot repeat), `letterCode` maps to `KeyboardEvent.code` (layout/case-insensitive by construction); reimplementation spot-check over 2000 draws produced 0 immediate repeats |
| 4 | Numbers mode presents a random single digit (0-9), never repeating twice in a row, matched via the physical digit-row key or numeric keypad (MODE-02) | ✓ VERIFIED | `src/game.ts:17,64-66` `DIGITS` pool (10 members), `digitCode` returns `Digit${n}`/`Numpad${n}` — never the alphabetic `Key` prefix (02-RESEARCH.md Pitfall 2 explicitly guarded against); `game-screen.ts:24-26` `poolFor('numbers')` routes through the same `pickRandom` no-repeat logic as Letters |
| 5 | Alphabet mode presents letters in strict sequential A→Z order — never random, always the same run (MODE-03) | ✓ VERIFIED | `src/game.ts:41-45` `nextInSequence` is index-based (`indexOf` + `% pool.length`), deterministic by construction; `game-screen.ts:34-39` `selectNext` routes Alphabet mode through it exclusively; reimplementation spot-check of the algorithm produced exactly `ABCDEFGHIJKLMNOPQRSTUVWXYZA` |
| 6 | Completing Z fires a distinctly bigger three-burst celebration than any other letter, then loops straight back to A with no pause or end screen (MODE-04) | ✓ VERIFIED | `src/celebrate.ts:74-91` `celebrateAlphabetComplete()` — 3 bursts, particleCount 120/spread 100 vs. ordinary 40/60, at 0/120/240ms, left/centre/right; `game-screen.ts:76-84` tests `currentTarget === LETTERS[LETTERS.length-1]` *before* `selectNext` advances (unconditional wraparound), so the branch fires on Z and the very next call returns A with no special-cased pause |
| 7 | The bigger celebration is the same confetti mechanism as every other celebration — no second library/particle system (MODE-04 constraint) | ✓ VERIFIED | `src/celebrate.ts:31-40` single `fireBurst()` helper is the module's one dynamic `import('canvas-confetti')` site, used by both `celebrate()` and `celebrateAlphabetComplete()`; `npm run build` output shows exactly one code-split `confetti.module-*.js` chunk; `package.json` lists exactly one runtime dependency |
| 8 | Starting any mode auto-enters fullscreen; Quit or an unexpected exit reliably exits fullscreen and resyncs the UI back to the home menu (FULL-01, FULL-02, FULL-03) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code is present and wired: `main.ts:52-58` `launchMode` mounts the screen then fire-and-forget `enterFullscreen`; `main.ts:74-78` the single `fullscreenchange` listener calls `quitToMenu()` whenever `document.fullscreenElement === null`; `game-screen.ts:67-70` Escape calls `onQuit` (= `quitToMenu`) independent of any fullscreen state. This is a live cancellation/cleanup/resync invariant the Fullscreen API only exercises under a real user gesture in a real browser — routed to human verification below, not asserted VERIFIED on presence alone |
| 9 | The URL reflects the current screen via an in-place-rewritten query parameter (no history-stack growth); an unrecognised `?screen=` value falls back to the menu | ✓ VERIFIED | `src/router.ts:19-23` `readInitialScreen()` checks the allow-list, defaults to `'menu'` on any miss; `router.ts:32-40` `navigateTo()` uses `history.replaceState` exclusively — repo-wide grep confirms no `pushState` reference anywhere in `src/` |
| 10 | Home menu has a share affordance that copies the current page URL, with an honest three-tier fallback (modern Clipboard API → legacy execCommand → manual copy box) and no silent failure (SHARE-01) | ✓ VERIFIED | `src/clipboard.ts:31-80` `shareCurrentUrl()` — clipboard write is the function's first `await` (Safari activation-window ordering), legacy `execCommand('copy')` tier only reached on tier-1 throw, terminal `'manual-required'` always reached if both fail; `src/menu.ts:115-142` `renderManualFallback()` renders a read-only, pre-selected input sourced from the same `currentShareUrl()` every tier reads, so displayed and copied links can never diverge |
| 11 | Menu is keyboard-navigable (Arrow/Home/End, wraparound) with a single, unified hover-or-focus indicator that never desyncs, including on native Tab (WR-01 fix) | ✓ VERIFIED | `src/menu.ts:65-69` `focusRow()` is the sole site toggling `.focused`/calling `.focus()`; `menu.ts:256-281` keydown handles the four navigation keys; `menu.ts:283-290` hover routes through `focusRow`; `menu.ts:296-303` a `focusin` listener (the WR-01 fix) resyncs on native Tab — confirmed present in current source, registered at `menu.ts:312` and torn down at `menu.ts:325` |
| 12 | Held/repeated keys never spam duplicate celebrations, flickers, or menu-navigation jumps (CORE-04 carryover into Phase 2's new screens) | ✓ VERIFIED | `game-screen.ts:65` `if (event.repeat) return` precedes all match logic; `menu.ts:257` the identical guard precedes the menu's arrow/home/end handling |

**Score:** 11/12 truths verified (1 present, behavior-unverified)

### Code Review Fix Confirmation

`02-REVIEW.md` (first pass) found 3 warnings; `02-REVIEW-FIX.md` claims all 3 fixed; the current
source was independently checked, not the fix report's narrative:

| Finding | Claimed fix | Confirmed in current source |
|---|---|---|
| WR-01 (Tab focus desync) | Added `focusin` listener resyncing `focusRow` | ✓ `src/menu.ts:296-312,325` `handleFocusIn` registered/removed |
| WR-02 (uncancelled Z-completion timers) | Return + track + clear timer ids on unmount | ✓ `src/celebrate.ts:74-91` returns `number[]`; `src/game-screen.ts:18,79,110-111` `pendingCelebrationTimers` tracked and cleared in `unmountGameScreen` |
| WR-03 (no double-mount guard) | `mountGameScreen` calls `unmountGameScreen()` first | ✓ `src/game-screen.ts:52` first statement in `mountGameScreen` |

The re-review (`02-REVIEW.md` frontmatter, current file) confirms `critical: 0, warning: 0, info: 3`
— the 3 remaining Info-tier items (inconsistent reduced-motion coverage on the incorrect-flash
animation, a duplicated row-membership-check pattern, and `pickRandom`'s unreachable-today
empty-pool edge case) are non-blocking style/robustness notes, not functional gaps.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/router.ts` | Screen union, allow-listed URL read, in-place rewrite | ✓ VERIFIED | Exports `Screen`, `readInitialScreen`, `navigateTo`; no `pushState` anywhere |
| `src/fullscreen.ts` | Fire-and-forget enter/exit, never gates gameplay | ✓ VERIFIED | Exports `enterFullscreen`, `exitFullscreenIfActive`; both swallow rejections, feature-detected |
| `src/menu.ts` | Seven-row menu, roving focus, hover/Tab unification, share row UI | ✓ VERIFIED | Exports `MenuRow`, `MENU_ROWS`, `MENU_LABELS`, `MenuHandlers`, `mountMenu`, `unmountMenu`; `focusRow`, `handleFocusIn`, share glyph/feedback/fallback all present |
| `src/game-screen.ts` | Mode-parameterized gameplay screen | ✓ VERIFIED | Exports `GameMode`, `mountGameScreen`, `unmountGameScreen`; `selectNext`, Z-completion branch, idempotent re-mount guard present |
| `src/main.ts` | Boot, mount switch, single `fullscreenchange` listener, `quitToMenu` | ✓ VERIFIED | Single `fullscreenchange` registration confirmed (repo-wide grep: 1 occurrence); `quitToMenu` is the sole resync function |
| `src/game.ts` | Pools + selection + code-mapping primitives | ✓ VERIFIED | Exports `LETTERS`, `DIGITS`, `pickRandom`, `nextInSequence`, `letterCode`, `digitCode`, `acceptableCodes`, `renderTarget` |
| `src/celebrate.ts` | Shared burst helper, ordinary + Z-completion celebrations | ✓ VERIFIED | Exports `CONFETTI_COLORS`, `celebrate`, `celebrateAlphabetComplete`; single dynamic-import site, single reduced-motion guard site |
| `src/clipboard.ts` | Share-URL source + three-tier copy chain | ✓ VERIFIED | Exports `ShareResult`, `currentShareUrl`, `shareCurrentUrl`; `execCommand` legacy tier present with `finally`-clause cleanup |
| `src/style.css` | Menu/background/share styling | ✓ VERIFIED | `.menu-item`, `.focused`, parallax layers, `data-chrome` suppression, `.share-icon`, `.share-manual` all present |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/main.ts` | `src/menu.ts` | `mountMenu(app, menuHandlers)` | ✓ WIRED | `main.ts:42` |
| `src/main.ts` | `src/game-screen.ts` | `mountGameScreen(app, screen, quitToMenu)` | ✓ WIRED | `main.ts:47` |
| `src/main.ts` | `src/fullscreen.ts` | `enterFullscreen(...)` / `exitFullscreenIfActive()` | ✓ WIRED | `main.ts:57,67` |
| `src/main.ts` | `src/router.ts` | `readInitialScreen()` / `navigateTo(screen)` | ✓ WIRED | `main.ts:37,83` |
| `src/game-screen.ts` | `src/game.ts` | pool/selection/code-mapping imports | ✓ WIRED | `game-screen.ts:7` |
| `src/game-screen.ts` | `src/celebrate.ts` | `celebrate(...)` / `celebrateAlphabetComplete()` | ✓ WIRED | `game-screen.ts:8,79,81` |
| `src/menu.ts` | `src/clipboard.ts` | `shareCurrentUrl()` / `currentShareUrl()` | ✓ WIRED | `menu.ts:13,129,152` |
| `src/style.css` | `src/main.ts` | `body[data-chrome="game"]` suppression reads the attribute `main.ts` sets | ✓ WIRED | `main.ts:38` sets it; `style.css:60-63` reads it |
| `src/style.css` | `src/menu.ts` | `.focused` class toggled by `focusRow` drives the accent/underline rule | ✓ WIRED | `menu.ts:67`; `style.css:132-143` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MENU-01 | 02-01, 02-02 | Vertical menu: Letters/Numbers/Alphabet/Statistics/Settings/Quit | ✓ SATISFIED | `menu.ts` row list + labels; keyboard nav in `menu.ts` |
| MENU-02 | 02-02 | Dark, moody, illustrated/gradient background | ✓ SATISFIED | `style.css` parallax layers |
| MENU-03 | 02-01 | Quit exits fullscreen, returns to home menu | ✓ SATISFIED | `main.ts` `quitToMenu` |
| MODE-01 | 02-01 | Letters mode, random, no immediate repeat | ✓ SATISFIED | `game.ts`/`game-screen.ts` |
| MODE-02 | 02-01 | Numbers mode, random digit, no immediate repeat | ✓ SATISFIED | `game.ts` `DIGITS`/`digitCode` |
| MODE-03 | 02-03 | Alphabet mode, strict sequential | ✓ SATISFIED | `game.ts` `nextInSequence` |
| MODE-04 | 02-03 | Z completion bigger celebration, loops to A | ✓ SATISFIED | `celebrate.ts` `celebrateAlphabetComplete` |
| FULL-01 | 02-01 | Starting a mode auto-enters fullscreen | ⚠️ Present, behavior-unverified | `main.ts` `launchMode` — see truth 8 |
| FULL-02 | 02-01 | Leaving a mode auto-exits fullscreen | ⚠️ Present, behavior-unverified | `main.ts` `quitToMenu` — see truth 8 |
| FULL-03 | 02-01 | Unexpected fullscreen exit gracefully resyncs | ⚠️ Present, behavior-unverified | `main.ts` `fullscreenchange` listener — see truth 8 |
| SHARE-01 | 02-04 | Share affordance copies current URL | ✓ SATISFIED | `clipboard.ts`/`menu.ts` |

No orphaned requirements — all 11 IDs declared in this phase's plans (`02-01`, `02-02`, `02-03`,
`02-04`) exactly match the 11 IDs the phase-verifier was asked to check and the 11 IDs
`ROADMAP.md`'s Phase 2 entry lists.

### Anti-Patterns Found

None. Repo-wide scan of all 9 phase-modified files for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`,
`console.*`, and stub-shaped empty-return patterns (`return null|{}|[]`, `=> {}`) found zero matches.
`npm run build` (tsc strict + vite build) exits 0.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Alphabet sequence wraps A→Z→A deterministically | Reimplementation of `nextInSequence`'s exact algorithm run standalone in Node (game.ts's real module cannot be imported outside a browser context due to its DOM-touching sibling imports) | Produced exactly `ABCDEFGHIJKLMNOPQRSTUVWXYZA` | ✓ PASS |
| `pickRandom` never returns the immediately-preceding value | Same reimplementation, 2000 draws | 0 repeats out of 2000 | ✓ PASS |
| `npm run build` succeeds and confetti stays code-split | `npm run build` | tsc + vite exit 0; `confetti.module-*.js` emitted as a separate chunk | ✓ PASS |
| Every exported symbol from this phase's new modules has a live call site | `grep -rn` each export name across `src/*.ts` | All 14 checked symbols (`enterFullscreen`, `mountMenu`, `nextInSequence`, `shareCurrentUrl`, etc.) have 2+ non-export-line occurrences | ✓ PASS |

Full browser-dependent behaviors (real Fullscreen API transitions, real keyboard input, real
clipboard permission prompts, visual rendering) could not be spot-checked in this environment —
see Human Verification below.

### Probe Execution

Not applicable — this phase has no `scripts/*/tests/probe-*.sh` probes and none are referenced in
its PLAN/SUMMARY files. Skipped.

### Human Verification Required

See the `human_verification` list in the frontmatter above (6 items) plus the
`behavior_unverified_items` entry (fullscreen enter/exit/resync). All six correspond to the
`<human-check>` sections the four plans themselves flagged as unrunnable in this environment, and
to the four open `unrun-verify` entries already recorded in `.planning/WINDOWS.md` (ids 2, 3, 4).

### Gaps Summary

No blocking gaps. Every artifact this phase's plans committed to exists, is substantive (no stub
patterns), and is wired end-to-end through the actual call graph — confirmed by direct source
reading, not by trusting SUMMARY.md's claims. The phase's own code-review cycle found and fixed 3
real warnings (Tab-focus desync, uncancelled celebration timers, missing double-mount guard); all
3 fixes were independently re-confirmed present in the current source rather than taken on the
review report's word.

The only thing keeping this phase out of a clean `passed` status is that this project has no
browser test harness (explicitly out of scope per `.claude/CLAUDE.md`), so the Fullscreen API's
actual runtime behavior — the one true state-transition/cleanup invariant this phase introduces —
cannot be exercised without a human at a real keyboard in a real browser, mirroring exactly how
Phase 1's verification was resolved (human_needed → human confirmed → passed). The other five
human-verification items are standard visual/interactive/cross-browser checks any UI phase in this
project would need.

---

_Verified: 2026-08-14T01:10:02Z_
_Verifier: Claude (gsd-verifier)_

---
phase: 2
slug: menu-game-modes-fullscreen
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — explicitly excluded by `.claude/CLAUDE.md` for v1, unchanged from Phase 1 |
| **Config file** | none |
| **Quick run command** | manual: `npm run dev`, interact via physical keyboard + mouse/touch |
| **Full suite command** | manual: `npm run build && npm run preview`, then the live GitHub Pages URL, across **multiple browsers including an actual iOS device** |
| **Estimated runtime** | ~5-8 minutes per full manual walkthrough (11 requirements, multi-browser) |

---

## Sampling Rate

- **After every task commit:** Manual `npm run dev` smoke check of the change just made, on the primary development browser.
- **After every plan wave:** Manual `npm run build && npm run preview` full walkthrough of all 11 requirements below, on at least two browser engines (e.g. Chrome + Safari).
- **Before `/gsd:verify-work`:** Visit the *live* GitHub Pages URL and repeat the full manual walkthrough, explicitly including **an actual iOS device** for FULL-01/02/03 — the single highest-priority manual verification in this phase (02-RESEARCH.md Pitfall 1).
- **Max feedback latency:** ~5-8 minutes (manual walkthrough), instant for `npm run dev` HMR smoke checks.

---

## Per-Task Verification Map

*Populated by the planner once task IDs exist (PLAN.md creation). Every task below must carry a
real shell-assertion `<automated>` gate — no test framework is introduced, per CLAUDE.md — plus a
`<human-check>` for the manual-only behaviors listed below.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | MENU-01, MENU-03, MODE-01, FULL-01, FULL-02, FULL-03 | T-02-01, T-02-02, T-02-03, T-02-04 | `screen` query param allow-listed before it reaches the mount switch; one resync path; auto-repeat guard precedes the match check; no HTML-string assignment anywhere under `src/` | shell gate + manual | `npm run build` + router allow-list / no-history-append / fullscreen-catch / single-`fullscreenchange` / seven-label / source-order greps | src/router.ts, src/fullscreen.ts, src/menu.ts, src/game-screen.ts, src/main.ts, src/game.ts, src/style.css | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | MODE-02 | T-02-02 | Digit/Numpad codes resolved through the single `acceptableCodes` match path — no second comparison branch | shell gate + manual | `npm run build` + `Digit`/`Numpad` prefix greps, alphabetic-prefix-never-on-digit gate, node check that `DIGITS` enumerates 10 members | src/game.ts, src/game-screen.ts, src/menu.ts | ⬜ pending |
| 02-02-T1 | 02-02 | 2 | MENU-01 | — | Action-key handling only — this file never references the physical-key-code property, keeping the gameplay match path single-sourced | shell gate + manual | `npm run build` + `ArrowDown`/`ArrowUp`/`Home`/`End`/`preventDefault`/`focusRow(0)` greps, single class-toggle and single focus-call counts, no-`.code` gate | src/menu.ts, src/style.css | ⬜ pending |
| 02-02-T2 | 02-02 | 2 | MENU-02 | — | Background is CSS-only — no image asset is fetched, so no new static-asset origin is introduced | shell gate + manual | `npm run build` + `drift-a`/`drift-b`/`prefers-reduced-motion`/`data-chrome` greps | src/style.css | ⬜ pending |
| 02-03-T1 | 02-03 | 2 | MODE-03 | — | Sequential selection routed through the same single match path as the random modes | shell gate + manual | `npm run build` + `nextInSequence` greps in `game.ts` and `game-screen.ts` | src/game.ts, src/game-screen.ts | ⬜ pending |
| 02-03-T2 | 02-03 | 2 | MODE-04 | — | One confetti mechanism reused with different parameters; reduced-motion guard enforced at the module's single entry point | shell gate + manual | `npm run build` + `celebrateAlphabetComplete` greps, single `import('canvas-confetti')` gate | src/celebrate.ts, src/game-screen.ts | ⬜ pending |
| 02-04-T1 | 02-04 | 3 | SHARE-01 | T-02-SC, T-02-06, T-02-09, T-02-10 | Clipboard write is the first awaited operation in both `clipboard.ts` and `menu.ts` (Safari user-activation, 02-RESEARCH.md Pitfall 3); only the app's own URL is written, from the single `currentShareUrl()` source; glyph built via the namespaced element-creation API, never an HTML string; pending revert timer cleared on re-activation and on unmount | shell gate + manual | `npm run build` + `await`-vs-`writeText(` and `await`-vs-`shareCurrentUrl()` source-order gates, `COPIED_FEEDBACK_MS = 1500` / `'Copied!'` / `MENU_LABELS.share` / `createElementNS` greps, no-HTML-string gates, cross-plan single class-toggle + single focus-call counts | src/clipboard.ts, src/menu.ts, src/style.css | ⬜ pending |
| 02-04-T2 | 02-04 | 3 | SHARE-01 | T-02-07, T-02-08, T-02-11 | Manual-copy box is `readOnly` and receives its URL through the `value` property; offscreen legacy input removed in a `finally` clause and prior focus restored; tier order (modern → legacy → manual) asserted by source position | shell gate + manual | `npm run build` + `execCommand`/`finally`/`activeElement`/`.remove()`/`readOnly` greps, tier-order line-number gates, exact UI-SPEC error-copy grep, no-HTML-string gates | src/clipboard.ts, src/menu.ts, src/style.css | ⬜ pending |

> Threat IDs refer to the `<threat_model>` STRIDE registers in `02-01-PLAN.md` (T-02-SC, T-02-01 … T-02-05)
> and `02-04-PLAN.md` (T-02-06 … T-02-11). Plans 02-02 and 02-03 add no new trust boundary — they extend
> presentation and target-selection inside boundaries plan 02-01 already registered.

---

## Wave 0 Requirements

None — no test infrastructure is being introduced this phase, per CLAUDE.md's explicit decision (unchanged from Phase 1).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| 7-row vertical menu visible on load | MENU-01 | Visual/subjective judgment | Load the page, confirm all 7 rows render in order over the parallax background |
| Parallax background renders, animates, freezes under reduced-motion | MENU-02 | Visual/subjective judgment + OS setting | Load the page; toggle the OS "reduce motion" setting and confirm the background motion stops |
| Quit exits fullscreen and returns to menu | MENU-03 | Requires a physical Quit-row activation while in a mode | Enter any mode, activate Quit, confirm fullscreen exits and the menu returns |
| Letters/Numbers modes never repeat the same target twice in a row | MODE-01, MODE-02 | Requires playing several rounds and observing | Play ~10 rounds each in Letters and Numbers, confirm no back-to-back repeat |
| Numbers mode registers physical digit-row keys (02-RESEARCH.md Pitfall 2: `Digit0`-`Digit9`, not `Key0`-`Key9`) | MODE-02 | Requires an actual physical keypress — the bug is invisible without one | In Numbers mode, physically press each top-row digit key 0-9 and confirm each registers as correct when it's the target |
| Alphabet mode presents strict A→Z sequential order | MODE-03 | Requires playing through and observing order | Play through several letters in Alphabet mode, confirm strict A→Z order with no skips or randomness |
| Z completion → bigger celebration → loops to A | MODE-04 | Visual/subjective judgment of "distinctly bigger" | Play Alphabet mode through to Z, confirm a visibly bigger celebration burst, then confirm the next target is A |
| Fullscreen auto-enters on mode start | FULL-01 | Requires real browser fullscreen behavior, varies by browser/OS | Start any mode on desktop Chrome, Firefox, Safari, **and an actual iOS device**; confirm fullscreen behavior on each (iOS Safari is known partial-support per 02-RESEARCH.md Pitfall 1 — confirm gameplay still works windowed) |
| Escape / OS-gesture exit resyncs UI without breaking | FULL-03 | Requires triggering an unexpected fullscreen exit and observing UI state, especially where fullscreen never activated (iOS) | Press Escape while in fullscreen on desktop; on iOS Safari, exit via the OS gesture; confirm the app returns to the menu cleanly both ways (02-RESEARCH.md Pitfall 1 — `returnToMenu()` must fire from both the Escape handler directly and the `fullscreenchange` listener) |
| Share copies current URL | SHARE-01 | Requires clipboard permission behavior across browsers | Click Share on desktop Chrome and Safari; confirm "Copied!" feedback and that the clipboard actually contains the current URL; if possible, simulate a clipboard-denied state to exercise the fallback tiers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references — N/A, no test infra introduced
- [ ] No watch-mode flags
- [ ] Feedback latency < 480s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — to be filled in by gsd-planner during Phase 2 plan creation

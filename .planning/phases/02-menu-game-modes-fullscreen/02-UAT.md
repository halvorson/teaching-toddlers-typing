---
status: complete
phase: 02-menu-game-modes-fullscreen
source: [02-VERIFICATION.md]
started: 2026-08-14T01:10:02Z
updated: 2026-09-12T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Home menu visual/motion check
expected: Matches 02-02-PLAN.md Task 2 human-check — soft, slow, non-distracting drift; menu fades in; background freezes under OS reduce-motion; background disappears behind gameplay; reappears on Escape back to menu. No image request in DevTools Network.
result: pass

### 2. Keyboard-only menu navigation end to end
expected: Matches 02-02-PLAN.md Task 1 human-check plus the WR-01 code-review fix — Letters pre-highlighted on load with no initial Tab; Down/Up wrap correctly; Home/End jump to first/last; mouse hover matches keyboard highlight exactly; native Tab/Shift+Tab keeps the highlight in sync; Enter/Space activates the highlighted row.
result: pass

### 3. Letters mode physical-key matching
expected: Matches 02-01-PLAN.md Task 1 human-check; WINDOWS.md ledger item 2 — every A-Z key registers regardless of Shift/Caps Lock; no immediate repeat over ~10 rounds; held/repeated key produces at most one celebration.
result: skipped
reason: "Key matching confirmed working (incl. Shift/Caps Lock per user's note: 'I did the Alphabet setting'). No-immediate-repeat behavior over ~10 rounds was NOT specifically validated — user opted to skip that sub-check."

### 4. Numbers mode physical-key matching
expected: Matches 02-01-PLAN.md Task 2 human-check; WINDOWS.md ledger item 3 — every top-row digit and numeric keypad digit registers; no immediate repeat over ~10 rounds. This is the check most likely to silently fail per 02-RESEARCH.md Pitfall 2.
result: pass

### 5. Alphabet mode Z-completion celebration
expected: Matches 02-03-PLAN.md Task 2 human-check — three-burst sweep (left/centre/right) visibly and distinctly bigger than the ordinary single-burst celebration; play continues immediately from A with no pause/end screen; both celebration sizes suppressed under OS reduce-motion.
result: pass
reason: "Z-sweep and continuous replay confirmed. Reduce-motion suppression sub-check not tested — user opted to pass without it."

### 6. Share row clipboard chain (including Safari)
expected: Matches 02-04-PLAN.md Task 1 and Task 2 human-check — paste yields exact address-bar URL; Copied! shows ~1.5s; legacy execCommand tier works when modern Clipboard API is forced to fail; manual fallback box appears once (read-only, no stacking, disappears on mode launch) when both tiers fail; basic copy check repeated in real Safari per 02-RESEARCH.md Pitfall 3.
result: pass

### 7. Fullscreen enter/exit/resync invariant (FULL-01/02/03)
expected: Clicking a mode row enters real browser fullscreen; each of (a) in-game Escape, (b) the browser's own exit-fullscreen control while in a mode, and (c) Quit from a mode reached via a direct ?screen=letters URL load (fullscreen never entered) lands back on the home menu with fullscreen fully exited (or no error/stall for case c) and the drifting background reappears.
result: pass

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

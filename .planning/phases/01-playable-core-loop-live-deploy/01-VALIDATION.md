---
phase: 1
slug: playable-core-loop-live-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — explicitly excluded for v1 by `.claude/CLAUDE.md`'s "What NOT to Use" table ("Jest/Vitest + full test-suite scaffolding ... disproportionate for a solo hobby app"). This is a locked project constraint, not an unaddressed gap. |
| **Config file** | none |
| **Quick run command** | manual: `npm run dev`, interact via physical keyboard |
| **Full suite command** | manual: `npm run build && npm run preview`, then visit the live GitHub Pages URL after deploy |
| **Estimated runtime** | ~2-3 minutes per manual walkthrough |

---

## Sampling Rate

- **After every task commit:** Manual `npm run dev` smoke check of the change just made.
- **After every plan wave:** Manual `npm run build && npm run preview` full walkthrough of all 7 requirements below.
- **Before `/gsd:verify-work`:** Visit the *live* GitHub Pages URL (not `vite preview`) and repeat the full manual walkthrough — the single most important gate per this project's own STATE.md concern about base-path failures only surfacing in production.
- **Max feedback latency:** ~2-3 minutes (manual walkthrough), instant for `npm run dev` HMR smoke checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-*-* | TBD | TBD | DEPLOY-01 | — | Actions workflow scoped to `contents: read, pages: write, id-token: write` only | manual | none — verify via Actions tab green check + visiting live URL | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | DEPLOY-02 | — | n/a | manual | none — sequencing itself (deploy skeleton before full game logic) is the validation | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | CORE-01 | — | n/a | manual | none — visual check on load | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | CORE-02 | — | `textContent` only, never `innerHTML`, when rendering the target letter | manual | none — physical keypress on the actual deployed/dev page | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | CORE-03 | — | n/a | manual | none — physical keypress | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | CORE-04 | — | n/a | manual | none — hold a key down, observe no repeated celebration | N/A | ⬜ pending |
| 01-*-* | TBD | TBD | CORE-05 | — | n/a | manual | none — visual check during correct and incorrect presses | N/A | ⬜ pending |

*Task IDs/plan/wave columns are filled in by the planner once PLAN.md task numbers exist.*

---

## Wave 0 Requirements

*None — no test framework is being introduced this phase, per CLAUDE.md's explicit decision. This is a stated exclusion, not an unfilled gap. "Existing infrastructure covers all phase requirements" in the sense that manual QA is the chosen infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live deploy loads a working game | DEPLOY-01, DEPLOY-02 | No test framework (CLAUDE.md); base-path/404 failures only surface against the real GitHub Pages URL, not `vite preview` | Push to `main`, wait for Actions workflow to go green, visit `https://halvorson.github.io/teaching-toddlers-typing/`, confirm the game loads (not blank/404) |
| Big high-contrast centered letter on load | CORE-01 | Visual/subjective judgment | Load the page, confirm one large letter is centered and readable at a glance |
| Correct key press → celebration + new target | CORE-02 | Requires a physical keypress and visual celebration judgment | Press the physical key matching the on-screen letter; confirm confetti+glow pulse plays and a new (different) letter appears immediately |
| Case/layout independence | CORE-02 | Requires testing with Shift/Caps Lock held | Toggle Caps Lock and hold Shift, confirm matching key still registers as correct |
| Incorrect key → neutral flicker only | CORE-03 | Visual/subjective judgment (must NOT feel punitive) | Press a non-matching key; confirm only a brief muted background flash occurs, letter itself does not move |
| Held/repeated keys don't spam | CORE-04 | Requires holding a key down and observing over time | Hold any key down for 2+ seconds; confirm only zero or one celebration/flicker fires, not a rapid-fire stream |
| No full-page flash/strobe ever | CORE-05 | Visual/subjective judgment across both celebration and flicker | Trigger both correct and incorrect presses repeatedly; confirm `<body>` background never flashes, only the letter/localized effects |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies — N/A, manual-only phase per locked CLAUDE.md constraint
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify — N/A, manual-only phase
- [ ] Wave 0 covers all MISSING references — N/A, no test infra introduced
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter — deferred to plan-phase step 5.5 completion

**Approval:** pending

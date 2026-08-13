---
phase: 1
slug: playable-core-loop-live-deploy
status: approved
nyquist_compliant: true
wave_0_complete: true
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
| 01-01-T1 | 01-01 | 1 | DEPLOY-02, CORE-01 | T-01-SC, T-01-04 | Exact-pinned audited installs only; letter rendered via text-content, never HTML-string assignment | shell gate + manual | `npm run build` exits 0; `grep -q '/teaching-toddlers-typing/assets/' dist/index.html`; typescript pin and `esModuleInterop` asserted via `node -e`; negative grep for HTML-string rendering under `src/` | ✓ (built artifacts + source) | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | DEPLOY-01, DEPLOY-02 | T-01-01, T-01-02, T-01-03, T-01-05 | Workflow `permissions` limited to `contents: read, pages: write, id-token: write`; only first-party `actions/*` steps; credential-pattern scan across tracked files before the public push | shell gate + manual | `gh run list … conclusion == success`; `curl -fsS` live URL contains base-prefixed assets; every `dist/assets/*` fetched at 200; workflow permission/action/concurrency greps; `git ls-files \| xargs grep` secret-pattern scan | ✓ (workflow + live site) | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | CORE-01, CORE-02, CORE-05 | T-02-01, T-02-03 | `textContent` only; confetti bundled locally via code-split dynamic import, no third-party origin | shell gate + manual | `npm run build`; `grep -Eq '\.code\b' src/main.ts`; negative greps for the character property, HTML-string rendering, and document-body style mutation; `@keyframes correct-pulse` present; ≥2 emitted JS chunks | ✓ (source + build output) | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | CORE-03, CORE-04, CORE-05 | T-02-02 | Repeat-flag early return bounds celebration dispatch; no destructive token on the incorrect path; no `html`/body animation rule | shell gate + manual | `npm run build`; source-ordering assertion that the repeat guard precedes the physical-key comparison; `@keyframes incorrect-flash` and the locked `color-mix` expression present; negative greps for the destructive token and body-style mutation | ✓ (source) | ⬜ pending |
| 01-02-T3 | 01-02 | 2 | DEPLOY-01 | T-02-03, T-02-04 | Live page fetches only from its own origin; README stays generically branded | shell gate + manual | two `deploy.yml` runs concluded `success` (one documentation-only); every `dist/assets/*` returns 200 under the live base path; `HEAD == origin/main`; clean `git status` | ✓ (live site) | ⬜ pending |

*Task IDs are `{phase}-{plan}-T{n}` and map to the ordered `<task>` elements in each PLAN.md.*

**Note on "automated" here:** no test *framework* is introduced (locked by `.claude/CLAUDE.md`). Every
gate above is a real, runnable shell assertion — build exit codes, source greps, `gh`/`curl` checks —
so each task carries a genuine `<automated>` block alongside its `<human-check>` walkthrough. This
satisfies Nyquist sampling without violating the no-test-framework constraint.

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — all 5 tasks carry runnable shell-assertion gates (no test framework introduced)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — every task has one
- [x] Wave 0 covers all MISSING references — N/A, no test infra introduced and no `MISSING` markers emitted
- [x] No watch-mode flags
- [x] Feedback latency < 180s — local gates are seconds; the two live-URL gates wait on a GitHub Actions run (~1-2 min)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved — filled in by gsd-planner during phase-1 plan creation

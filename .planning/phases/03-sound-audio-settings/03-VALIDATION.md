---
phase: 03
slug: sound-audio-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-14
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — explicitly excluded by `.claude/CLAUDE.md` for v1, unchanged from Phases 1-2.1 |
| **Config file** | none |
| **Quick run command** | `npm run dev` — manual interaction via physical keyboard |
| **Full suite command** | `npm run build && npm run preview` — manual walkthrough across at least Chrome and Safari (per the `getVoices()`/`voiceschanged` divergence flagged in research) |
| **Estimated runtime** | ~1 min (build) + manual walkthrough |

`npm run build` (`tsc` strict + `vite build`) remains this project's one automated gate.

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (must exit 0) + manual `npm run dev` smoke check.
- **After every plan wave:** Run `npm run build && npm run preview`, manual walkthrough across at
  least Chrome and Safari.
- **Before `/gsd:verify-work`:** Full manual walkthrough of all 3 requirements (AUDIO-01, AUDIO-02,
  SET-01) on the live GitHub Pages URL, including an extended-session chime check and a
  settings-persistence reload check.
- **Max feedback latency:** ~1 min (build time).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | TBD | AUDIO-01 | shell gate + manual | `npm run build` + grep confirming `playChime(` call sits in `game-screen.ts`'s correct-match branch alongside `celebrate(`/`addTrailStar(` | ❌ new file `src/audio.ts` — Wave 0 | ⬜ pending |
| 03-01-02 | 01 | TBD | AUDIO-01 (toggle-off, no chime) | manual only | manual: toggle Sound off, verify silence on next correct match | ❌ depends on new toggle | ⬜ pending |
| 03-01-03 | 01 | TBD | AUDIO-02 | shell gate + manual | `npm run build` + grep confirming `speakTarget(` call sits in the same branch | ❌ extends `src/audio.ts` | ⬜ pending |
| 03-01-04 | 01 | TBD | AUDIO-02 (chime/speech independence) | manual only | manual: force a speech failure (DevTools), confirm chime still plays and vice versa | ❌ new code path | ⬜ pending |
| 03-02-01 | 02 | TBD | SET-01 | shell gate + manual | `npm run build` + grep for `soundEnabled` literal in both `settings-store.ts` and `settings.ts`, plus a reload-and-recheck manual pass | ❌ extends existing files — Wave 0 | ⬜ pending |
| 03-02-02 | 02 | TBD | SET-01 (merge-write correctness) | shell gate + manual | `npm run build` + grep confirming every `writeSettings(` call site uses the spread-merge form `{ ...readSettings(), ... }`, never a bare object literal | ❌ bugfix + extension | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Task IDs are provisional — the planner assigns final wave/task numbers.*

---

## Wave 0 Requirements

- [ ] `src/audio.ts` does not exist yet — new module needed for `playChime()`/`speakTarget()`, the
  `AudioContext` singleton, and the cached-voice-list logic (synchronous `getVoices()` call at
  startup plus a `voiceschanged` listener, since Firefox/Safari may never fire the event).
- [ ] No test framework install needed — "none" is the correct, intentional state per CLAUDE.md.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Chime sounds celebratory and matches the muted/pearlescent tone, not jarring | AUDIO-01 | Subjective audio judgment — not assertable by static analysis | Play several correct matches, confirm the chime is short, soft, and pleasant |
| Chime doesn't degrade/click after extended play | AUDIO-01 | No automated audio-quality harness exists | Play an extended session (30+ correct matches), confirm the chime still sounds clean, not distorted |
| Spoken letter/number is intelligible and correctly pronounced across Chrome and Safari | AUDIO-02 | TTS voice/pronunciation quality varies by browser/OS — not assertable by static analysis | Play Letters, Numbers, and Alphabet modes in both Chrome and Safari, confirm each spoken name is correct and clear |
| Chime/speech independence on failure | AUDIO-02 | Requires forcing one API to fail without the other | With DevTools, disable/break `speechSynthesis` and confirm the chime still plays; separately simulate an AudioContext failure and confirm speech still fires |
| Sound toggle persists across a full page reload | SET-01 | Live browser reload + localStorage inspection | Toggle Sound off, reload the page, confirm it's still off; repeat for on |
| Toggling Sound never resets the trail-reset toggle, and vice versa | SET-01 | Live interaction across both toggles | Set both toggles to non-default values, toggle one, reload, confirm both retained their values |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (shell gate) or Wave 0 dependencies (`src/audio.ts`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (`src/audio.ts`)
- [x] No watch-mode flags — this project has no test framework to watch
- [x] Feedback latency < 60s (build time)
- [ ] `nyquist_compliant: true` set in frontmatter — deferred until the planner finalizes actual
  wave/task numbers against this map

**Approval:** pending

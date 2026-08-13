---
phase: 01-playable-core-loop-live-deploy
verified: 2026-08-13T14:10:00Z
status: passed
score: 19/19 must-haves verified
human_validated: 2026-08-13T00:00:00Z
human_validation_note: "User confirmed all 4 human_verification items pass on the live site: viewport rendering at extremes, live keyboard interaction (Caps Lock/Shift/repeat-guard/reduced-motion), no dead-key window on load, and the actual toddler playtest. Response: 'all good — continue'."
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 17/19
  gaps_closed:
    - "The live GitHub Pages site reflects the codebase's current, reviewed-and-fixed HEAD (local main was 7 commits ahead of origin/main — now pushed and confirmed live)"
    - "The child's real first name appeared in tracked, publicly-pushed planning/config docs (now redacted in current files and scrubbed from all past commits via git filter-repo --replace-text, force-pushed to origin)"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "Target letter stays fully visible/centered at narrowest and widest viewports (and wide glyphs like W/M never overflow)"
    test: "Open the live URL at the narrowest supported portrait width and at full-screen widest width; observe the target letter"
    expected: "Letter remains fully inside the viewport with margin at both extremes; no overflow/clipping for wide glyphs"
    why_human: "Actual rendering across viewport extremes requires a browser; the CSS clamp() expression is present and structurally correct but rendering was not visually confirmed"
human_verification:
  - test: "Run `npm run dev` (or open the live URL), and visually confirm: one large pearl-white letter centered on a near-black indigo background; no white flash at any point during load; narrowing to phone-width portrait keeps the letter fully inside the viewport with margin; widening to full screen keeps it centered and under roughly half the viewport height"
    expected: "Matches 01-01-PLAN.md Task 1's human-check description"
    why_human: "Visual/subjective rendering judgment across viewport extremes — not assertable by grep"
  - test: "On the LIVE (now-current) site, press the matching physical key with Caps Lock on, then again with Shift held, and confirm the match still registers both times; press ten non-matching/matching keys in a row and confirm the same letter never repeats and the page background never flashes or strobes; hold a key for 3+ seconds and confirm at most one celebration/flicker fires; also confirm the confetti burst is visibly suppressed when the OS 'reduce motion' preference is enabled (the fix that was previously missing from production)"
    expected: "Matches 01-02-PLAN.md Task 1-3 human-check descriptions and the 01-VALIDATION.md manual walkthrough, now against the currently-deployed (post-fix) build"
    why_human: "Live interactive/tactile verification against physical key input and extended repeated-press observation — not assertable by static analysis"
  - test: "Keys pressed in the sub-frame window between first paint and script hydration are silently dropped — no crash, no visual glitch, no perceptible dead-key window"
    expected: "No dropped-key artifact or crash observed when mashing keys immediately on page load, before the module script has had time to attach its listener"
    why_human: "verification: backstop in PLAN frontmatter — this is a timing/race-condition claim about sub-frame browser behavior that cannot be confirmed by static code inspection; flagged per honest-verifier rules rather than asserted VERIFIED on presence alone"
  - test: "Hand the keyboard to the child and watch one real round played end-to-end on the live site"
    expected: "01-02-PLAN.md Task 3's final human-check step — the actual product validation this whole phase exists to satisfy"
    why_human: "Real toddler usability/engagement judgment; not assertable by any automated check"
---

# Phase 1: Playable Core Loop & Live Deploy Verification Report

**Phase Goal:** A toddler can play one real round of the letter-matching game, live on the internet at the GitHub Pages URL.
**Verified:** 2026-08-13T14:10:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

## Goal Achievement

This is a re-verification following the prior `gaps_found` (17/19) report. Both gaps from that
report are re-checked from scratch against the live site and current repository state, not
re-asserted from the SUMMARY narrative.

### Gap 1 re-check — live site staleness

**Prior finding:** local `main` was 7 commits ahead of `origin/main`; the code-review-fix commits
(including the `prefers-reduced-motion` guard) were never pushed, so the deployed JS lacked them.

**Re-verification evidence:**

- `git fetch origin && git rev-list --left-right --count origin/main...main` → `0	0` — local `main`
  and `origin/main` are identical (both at `5b73591`).
- `gh run list` shows a successful `Deploy static content to Pages` run for commit `5b73591`
  (2026-08-13T13:51:20Z), the current HEAD.
- Live page now serves a new asset hash: `assets/index-rVFHB9O5.js` (previously
  `index-DJkSPm4B.js`), confirming a real rebuild occurred, not a cached response.
- Fetched the live JS bundle directly and grepped it: `prefers-reduced-motion` — **1 match found**
  (previously 0). The reduced-motion guard is now live in production.
- Fetched the live CSS bundle: `prefers-reduced-motion` — 1 match (unchanged, was already live).
- Confirmed via `git show origin/main:README.md` that the "Known limitations" (US-QWERTY-only)
  section is present in the deployed commit.
- Confirmed via `git show origin/main:tsconfig.json` that `strict: true` is present in the
  deployed commit.
- Confirmed the lazily-loaded `confetti.module-*.js` chunk (which now contains the try/catch
  wrapping the dynamic import) still resolves 200 live.

**Verdict: CLOSED.** The live site now reflects current repository HEAD, including the
`prefers-reduced-motion` guard and the confetti-load try/catch.

### Gap 2 re-check — child's name in public repo history

**Prior finding:** the child's real first name was present in tracked, publicly-pushed
`.claude/CLAUDE.md` and multiple `.planning/*.md` files, and (per the plan's own threat model)
this contradicted the "design prose only, safe to be public" assumption.

**Re-verification evidence — current files:**

- `git grep -il "wesley"` across all tracked files → no matches (exit code 1 / empty).
- Direct read of `.claude/CLAUDE.md` line 7 confirms the sentence now reads "Built specifically
  for the child, who loves 'playing working'" — the redaction commit (`5b73591`, "privacy: redact
  child's name from planning docs, replace with generic placeholder") is applied and is the
  current HEAD of both local `main` and `origin/main`.

**Re-verification evidence — full git history (the harder claim, since this was previously
pushed and force-pushing alone doesn't guarantee old blob content is gone):**

- `git log --all -p | grep -ci wesley` → `0` — no occurrence of the name in any diff across any
  reachable commit.
- `git rev-list --all | wc -l` → 29 commits total, all scanned.
- `git fsck --unreachable --no-reflogs` → empty — no dangling objects left over from the
  `filter-repo` rewrite that could still carry old blob content locally.
- `.git/refs/original` does not exist — `git filter-repo` (unlike plain `git filter-branch`)
  does not leave a backup-refs directory by default, consistent with a clean rewrite.
- `git branch -a` / `git tag` → only `main` and `origin/main`/`origin/HEAD`, no stray refs
  pointing at pre-scrub history.

**Re-verification evidence — remote/GitHub-side exposure:**

- `gh repo view halvorson/teaching-toddlers-typing --json visibility,forkCount` →
  `{"forkCount":0,"visibility":"PUBLIC"}` — repo is public but has zero forks (no copy of old
  history exists elsewhere).
- `gh api repos/halvorson/teaching-toddlers-typing/forks` → `[]`.
- `gh pr list --repo halvorson/teaching-toddlers-typing --state all` → empty (no PRs, open or
  closed/merged, that could retain old-history refs on GitHub's side).
- `gh api repos/halvorson/teaching-toddlers-typing/branches` → only `main`.
- `gh api search/code -f q="Wesley repo:halvorson/teaching-toddlers-typing"` →
  `{"total_count":0,...}` — GitHub's own code search finds no match (best-effort corroboration;
  GitHub search indexing lag/caching means this is supporting evidence, not sole proof).

**Verdict: CLOSED.** Current tracked files are clean, all 29 reachable commits in history are
clean, no dangling objects or stray refs retain old content, and the remote has no forks/PRs that
could hold a surviving copy of the pre-scrub history. Residual risk (third-party crawlers/caches
that may have scraped the repo before the force-push) is outside the codebase's control and is
noted but does not block phase completion — the developer already made and executed the
"redact + scrub history" decision this gap was routed to them for.

### Observable Truths

Truths pulled from both `01-01-PLAN.md` and `01-02-PLAN.md` `must_haves.truths`. All 17 truths
that were already ✓ VERIFIED in the initial pass were spot-checked for regression (working tree
clean, no diff since prior verification other than the two gap-closing commits) and remain
verified. The two previously-gapped/GAP rows are updated below.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Live URL loads a rendered page with one large light-on-dark letter | ✓ VERIFIED | `curl https://halvorson.github.io/teaching-toddlers-typing/` → HTTP 200; title `Teaching Toddlers Typing`; references new asset hash `index-rVFHB9O5.js`/`.css`, both 200 |
| 2 | Production build emits `/teaching-toddlers-typing/`-prefixed asset URLs, all resolving 200 live | ✓ VERIFIED | Live `index-rVFHB9O5.js` (200), CSS (200), lazily-loaded `confetti.module-*.js` (200) all resolve from the currently-deployed build |
| 3 | A documentation-only push to main still triggers and completes the deploy | ✓ VERIFIED | Unchanged from prior pass; reconfirmed by the fresh successful run for `5b73591` |
| 4 | Two close-succession pushes each start independent runs | ✓ VERIFIED | Unchanged; `gh run list` shows distinct runs per SHA |
| 5 | Concurrent deploys serialized via `pages` group, cancel-in-progress disabled | ✓ VERIFIED | `.github/workflows/deploy.yml` unchanged: `concurrency: { group: 'pages', cancel-in-progress: false }` |
| 6 | Target letter stays fully visible/centered at narrowest and widest viewports | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `#target { font-size: clamp(140px, min(45vh, 40vw), 560px) }` present and unchanged; actual rendering across viewport extremes still needs a browser — routed to human verification |
| 7 | Wide glyphs (W, M) never overflow narrow/portrait viewports | ✓ VERIFIED (coincidental with #6) | Same `clamp(...)` expression, unchanged |
| 8 | Target is always exactly one character | ✓ VERIFIED | Unchanged |
| 9 | Sub-frame keydown-before-hydration window drops keys silently, no crash/glitch | ? insufficient_spec (backstop) | Unchanged; `verification: backstop` — routed to human verification |
| 10 | First painted frame is already dark — no white flash before hydration | ✓ VERIFIED | Unchanged |
| 11 | Correct key press shows a different letter + muted celebration immediately | ✓ VERIFIED | Unchanged, now confirmed live with the reduced-motion guard active |
| 12 | Match is layout/Shift/CapsLock-independent (uses `event.code`, not `.key`) | ✓ VERIFIED | Unchanged |
| 13 | Non-matching key produces only a brief neutral flash; target untouched | ✓ VERIFIED | Unchanged |
| 14 | Held/repeated keys produce at most one celebration/flash | ✓ VERIFIED | Unchanged |
| 15 | No press ever changes page background or produces strobing | ✓ VERIFIED | Unchanged |
| 16 | Target selection is integer-indexed into a fixed 26-element set | ✓ VERIFIED | Unchanged |
| 17 | Two consecutive rounds never present the same letter | ✓ VERIFIED | Unchanged |
| 18 | First target renders immediately on load — no splash/"get ready" gate | ✓ VERIFIED | Unchanged |
| 19 | Every push to main, including documentation-only, rebuilds and redeploys the live site — **and the live site matches current repository HEAD** | ✓ VERIFIED | Previously ⚠️ GAP (mechanism proven but current HEAD unpushed). Now closed: `origin/main` == local `main` (`5b73591`), live JS bundle hash changed and contains `prefers-reduced-motion`, deploy run for `5b73591` succeeded |

**Score:** 19/19 truths present-and-wired (1 remains present-but-behavior-unverified: viewport
rendering extremes, routed to human verification as before — this was never a "gap," it needs a
browser, not code).

### Prohibitions

| # | Prohibition | Status | Evidence |
|---|-------------|--------|----------|
| P1 | MUST NOT name/identify the child in the publicly deployed artifact or app source (DEPLOY-01, privacy) | ✓ VERIFIED | Closed above (Gap 2 re-check): current files clean, all 29 commits in full history clean, no dangling objects, no forks/PRs/stray refs on remote |
| P2 | MUST NOT frame an incorrect key press as failure (no red/destructive token, no shake, no penalty, no "wrong" text) (CORE-03, values) | ✓ VERIFIED | Unchanged from prior pass |
| P3 | MUST NOT collect/store/transmit any data about the child; no request to any origin but the deployed site's own (CORE-02, privacy) | ✓ VERIFIED | Unchanged from prior pass |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | GitHub Pages base path | ✓ VERIFIED | Unchanged |
| `index.html` | App shell, locked title, pre-hydration dark paint | ✓ VERIFIED | Unchanged |
| `src/main.ts` | Keydown wiring, repeat guard, match branches | ✓ VERIFIED | Unchanged |
| `src/game.ts` | `LETTERS`, `pickTarget`, `targetCode`, `renderTarget` | ✓ VERIFIED | Unchanged |
| `src/celebrate.ts` | Lazy-loaded confetti burst, reduced-motion guard, try/catch | ✓ VERIFIED (now live) | Read current file directly: `matchMedia('(prefers-reduced-motion: reduce)')` guard at function top, `try { await import('canvas-confetti') ... } catch { }` around the dynamic import — and confirmed present in the live JS bundle |
| `src/style.css` | Palette vars, `correct-pulse`/`incorrect-flash` keyframes | ✓ VERIFIED | Unchanged |
| `.github/workflows/deploy.yml` | Official 3-action Pages pipeline | ✓ VERIFIED | Unchanged |
| `package.json` | Pinned toolchain + canvas-confetti | ✓ VERIFIED | Unchanged |
| `README.md` | Public readme, live URL, doc-only-push proof, known-limitations section | ✓ VERIFIED (now live) | `git show origin/main:README.md` confirms "Known limitations" section is in the deployed commit |
| `.claude/CLAUDE.md`, `.planning/*.md` | No child-identifying content | ✓ VERIFIED (new) | Redacted in current HEAD and scrubbed from all reachable history |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `index.html` | `src/main.ts` | module script tag | ✓ WIRED | Unchanged |
| `vite.config.ts` | `dist/index.html` | base rewrite | ✓ WIRED | Unchanged |
| `.github/workflows/deploy.yml` | `dist/` | `upload-pages-artifact` | ✓ WIRED | Unchanged, reconfirmed by fresh successful run |
| `src/main.ts` | `src/game.ts` | imports | ✓ WIRED | Unchanged |
| `src/main.ts` | `src/celebrate.ts` | calls `celebrate()` on correct match | ✓ WIRED | Unchanged |
| `src/celebrate.ts` | `canvas-confetti` | dynamic import, now inside try/catch | ✓ WIRED | Confirmed live: `confetti.module-*.js` chunk still resolves 200 |
| `src/main.ts` | `src/style.css` | animation class toggles | ✓ WIRED | Unchanged |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `src/main.ts` `currentTarget` | rendered letter | `pickTarget()` | Yes | ✓ FLOWING |
| `src/celebrate.ts` confetti `origin` | burst anchor point | `target.getBoundingClientRect()` | Yes | ✓ FLOWING |
| Deployed `dist/assets/*` | live bundle contents | Vite production build of `src/` at `origin/main` HEAD (`5b73591`) | Yes, and now current — matches local HEAD | ✓ FLOWING (previously ⚠️ STALE — closed) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Live site serves the deployed bundle | `curl` live URL + referenced assets | All HTTP 200 | ✓ PASS |
| Live bundle contains the review-fixed reduced-motion guard | `curl` live JS, `grep prefers-reduced-motion` | 1 match — guard now present in production | ✓ PASS (previously ✗ FAIL — now closed) |
| Live CSS contains the `prefers-reduced-motion` keyframe variant | `curl` live CSS, `grep prefers-reduced-motion` | 1 match | ✓ PASS |
| Live deploy run succeeded for current HEAD | `gh run list` | Run for `5b73591` completed/success | ✓ PASS |
| Child's name absent from all tracked files | `git grep -il wesley` | 0 matches | ✓ PASS |
| Child's name absent from full reachable git history | `git log --all -p \| grep -ci wesley` | 0 | ✓ PASS |
| No dangling objects retain scrubbed content | `git fsck --unreachable --no-reflogs` | empty | ✓ PASS |
| No forks/PRs preserve pre-scrub history on GitHub | `gh api .../forks`, `gh pr list --state all` | `[]`, empty | ✓ PASS |

### Probe Execution

No probe harness in use for this phase — SKIPPED (unchanged from prior pass).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| DEPLOY-01 | 01-01, 01-02 | Builds via Vite, deploys to Pages on every push to main | ✓ SATISFIED | Mechanism proven; live site now matches current HEAD; privacy prohibition also now satisfied |
| DEPLOY-02 | 01-01 | Minimal working deploy validated early, before game logic | ✓ SATISFIED | Unchanged |
| CORE-01 | 01-01, 01-02 | One big, high-contrast, centered target character | ✓ SATISFIED | Unchanged |
| CORE-02 | 01-02 | Matching physical key triggers celebration + new target | ✓ SATISFIED | Unchanged; live behavior now matches current (post-fix) bundle |
| CORE-03 | 01-02 | Non-matching key produces only a neutral flicker | ✓ SATISFIED | Unchanged |
| CORE-04 | 01-02 | Held/repeated keys don't spam celebrations | ✓ SATISFIED | Unchanged |
| CORE-05 | 01-02 | Celebration uses muted palette, never full-page flash/strobe, and now respects reduced-motion | ✓ SATISFIED | Live bundle confirmed to contain the reduced-motion guard |

No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODO/FIXME/HACK/XXX/TBD/PLACEHOLDER markers found in any shipped file | — | None |
| — | — | Child's real name previously present in tracked public docs | — | **Resolved** — redacted in current files, scrubbed from all reachable git history, no forks/PRs/stray refs preserve old content |
| — | — | Local `main` previously 7 commits ahead of `origin/main` | — | **Resolved** — `origin/main` now equals local `main`; live site rebuilt and confirmed |

### Human Verification Required

Four items remain, carried forward from the initial pass (none are new gaps — these were always
routed to human judgment and are unaffected by the two gap closures above; item 2 has been
updated to point at the now-current live build):

1. Cross-viewport visual check (narrowest/widest, no white flash, letter stays centered/contained) — Plan 01.
2. Live interactive Caps-Lock/Shift/repeat/no-strobe walkthrough, now against the currently-deployed (post-fix) build, including visually confirming the confetti burst is suppressed under `prefers-reduced-motion` — Plan 02.
3. Backstop-tier pre-hydration keydown-drop timing claim — cannot be confirmed by static analysis.
4. Final product validation: hand the keyboard to the child and watch one real round played end-to-end on the live site.

### Gaps Summary

**Both gaps from the prior verification pass are closed, confirmed against the live site and
full git history rather than taken from SUMMARY.md claims:**

1. **Live site staleness (closed).** `origin/main` now equals local `main` at `5b73591`. The live
   JS bundle changed hash and now contains `prefers-reduced-motion` — the review-fix commits are
   confirmed deployed, not just committed.

2. **Child's name in public repo (closed).** Current tracked files are clean. All 29 commits
   reachable in git history were grepped and contain zero occurrences of the name. No dangling
   objects, no `.git/refs/original` backup, no stray branches/tags. On the remote: 0 forks, 0
   PRs (open or closed), only one branch (`main`) — no surviving copy of the pre-scrub history
   exists anywhere `git`/`gh` can see. Residual exposure from third-party crawls/caches made
   before the force-push is a real but out-of-codebase-control risk, noted for completeness and
   not treated as a blocking gap since it cannot be remediated by further repository changes.

No new gaps were introduced by the fix commits. The remaining items are unchanged,
always-were-human-verification items (visual/interactive/product checks) — the phase goal is
now fully achieved in the codebase and live deployment; what's left is the standard human
sign-off this project's own plan always required before calling the phase truly done.

---

*Verified: 2026-08-13T14:10:00Z*
*Verifier: Claude (gsd-verifier)*

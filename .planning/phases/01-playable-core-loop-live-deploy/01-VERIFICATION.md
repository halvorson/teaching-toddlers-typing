---
phase: 01-playable-core-loop-live-deploy
verified: 2026-08-13T07:03:52Z
status: gaps_found
score: 17/19 must-haves verified
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "The live GitHub Pages site reflects the codebase's current, reviewed-and-fixed HEAD (Plan 01-02 Task 3 acceptance criterion: 'the local main is level with origin/main')"
    status: failed
    reason: >
      Local `main` is 7 commits ahead of `origin/main` (git status: "Your branch is ahead of
      'origin/main' by 7 commits"). The last commit that was ever pushed/deployed is
      825d3d9 (docs(01-02): complete core letter-matching loop plan). The subsequent
      code-review + auto-fix loop (01-REVIEW.md / 01-REVIEW-FIX.md, commits e23bf16
      through 06cbcd3) produced real source changes — most importantly WR-01
      (src/celebrate.ts: gate the confetti burst behind
      `window.matchMedia('(prefers-reduced-motion: reduce)')`, moved from main.ts into
      celebrate() itself) and WR-02 (wrap the dynamic `import('canvas-confetti')` in
      try/catch so a chunk-load failure doesn't throw an unhandled rejection) — that were
      committed locally but never pushed to `origin/main`, so `deploy.yml` never ran
      against them and the live site was never rebuilt with the fix.
      Confirmed directly: fetching the live JS bundle
      (https://halvorson.github.io/teaching-toddlers-typing/assets/index-DJkSPm4B.js) and
      grepping it for "prefers-reduced-motion" returns zero matches — the live production
      JS is the pre-review-fix build. `git diff origin/main HEAD -- src/celebrate.ts`
      confirms the exact functional delta that is missing from production.
    artifacts:
      - path: "src/celebrate.ts"
        issue: "Local HEAD has the reduced-motion guard + try/catch; deployed origin/main (and therefore the live site) does not"
      - path: "README.md"
        issue: "Local HEAD has the 'Known limitations' (US-QWERTY-only) section; not live"
      - path: "tsconfig.json"
        issue: "Local HEAD has strict:true; not live (dev-time only, no runtime effect, but still part of the un-synced diff)"
    missing:
      - "Push the 7 pending local commits to origin/main (git push) so deploy.yml redeploys the reviewed, fixed codebase and the live URL matches repository HEAD"
      - "After pushing, re-verify the live JS bundle contains the prefers-reduced-motion guard and the confetti try/catch"
  - truth: "MUST NOT name or otherwise identify the child anywhere in the publicly deployed artifact or in app source (privacy prohibition, DEPLOY-01)"
    status: partial
    reason: >
      Literal scope check: no `src/`, `index.html`, `README.md`, or repo-description
      occurrence of the child's name was found — the deployed app artifact itself is clean.
      However, the repository is PUBLIC (`gh repo view` confirms visibility: PUBLIC) and its
      full commit history — including `.claude/CLAUDE.md` and every file under
      `.planning/` (PROJECT.md, ROADMAP.md, 01-CONTEXT.md, 01-RESEARCH.md, 01-UI-SPEC.md,
      research/ARCHITECTURE.md, research/PITFALLS.md, research/STACK.md, research/SUMMARY.md)
      — is tracked and pushed, and these files name the child by first name multiple times.
      The plan's own threat model (01-01-PLAN.md T-01-03) explicitly identifies "Public
      repository commit history (includes .planning/)" as a disclosure risk and accepts it
      on the stated rationale that ".planning/ contains design prose only" — but that
      rationale does not hold: the design prose repeatedly names the child. The prohibition's
      literal wording scopes to "app source" (page title, headings, README, repo description,
      commit-visible app code) and is arguably satisfied on that narrow reading, since
      `.claude/` and `.planning/` are project-management docs, not application source.
      Flagging this as a human-judgment call rather than an automatic FAIL because of that
      scope ambiguity — but the real-world exposure is concrete and current: anyone can visit
      the public repository right now and find the child's first name tied to a project
      explicitly built for a toddler.
    artifacts:
      - path: ".claude/CLAUDE.md"
        issue: "Names the child in the tracked, publicly-pushed project-instructions file"
      - path: ".planning/PROJECT.md"
        issue: "Names the child; tracked and publicly pushed"
      - path: ".planning/ROADMAP.md"
        issue: "Names the child; tracked and publicly pushed"
      - path: ".planning/phases/01-playable-core-loop-live-deploy/01-CONTEXT.md"
        issue: "Names the child; tracked and publicly pushed"
    missing:
      - "Developer decision needed: either scrub the child's name from tracked .claude/ and .planning/ docs (and rewrite public git history, since it's already been pushed and is potentially cached/crawled), or make the repository private (trading off the free-tier GitHub Pages constraint), or explicitly accept this residual risk with eyes open"
deferred: []
human_verification:
  - test: "Confirm whether the child's name appearing in tracked .claude/CLAUDE.md and .planning/*.md files in the now-PUBLIC repository is an acceptable risk, or requires remediation (scrub + history rewrite, or make repo private)"
    expected: "An explicit developer decision one way or the other — this is a real, current, live exposure, not a hypothetical"
    why_human: "Requires a privacy/risk-tolerance judgment call outside the literal wording of the plan's 'app source' prohibition scope"
  - test: "Run `npm run dev`, open the printed URL, and visually confirm: one large pearl-white letter centered on a near-black indigo background; no white flash at any point during load; narrowing to phone-width portrait keeps the letter fully inside the viewport with margin; widening to full screen keeps it centered and under roughly half the viewport height"
    expected: "Matches 01-01-PLAN.md Task 1's human-check description"
    why_human: "Visual/subjective rendering judgment across viewport extremes — not assertable by grep"
  - test: "On the LIVE site, press the matching physical key with Caps Lock on, then again with Shift held, and confirm the match still registers both times; press ten non-matching/matching keys in a row and confirm the same letter never repeats and the page background never flashes or strobes; hold a key for 3+ seconds and confirm at most one celebration/flicker fires"
    expected: "Matches 01-02-PLAN.md Task 1-3 human-check descriptions and the 01-VALIDATION.md manual walkthrough"
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
**Verified:** 2026-08-13T07:03:52Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Truths pulled from both `01-01-PLAN.md` and `01-02-PLAN.md` `must_haves.truths` (roadmap has no separate `success_criteria` array beyond what these plans encode).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Live URL loads a rendered page with one large light-on-dark letter | ✓ VERIFIED | `curl https://halvorson.github.io/teaching-toddlers-typing/` → HTTP 200; title `Teaching Toddlers Typing`; page references `/teaching-toddlers-typing/assets/index-DJkSPm4B.js` and `.css`, both fetched at 200 |
| 2 | Production build emits `/teaching-toddlers-typing/`-prefixed asset URLs, all resolving 200 live | ✓ VERIFIED | `dist/index.html` contains the prefixed path; live `index-DJkSPm4B.js` (200), `index-BkgkGCEY.css` (200), and the lazily-loaded `confetti.module-BYDB1iN2.js` (200) all resolve from the currently-deployed build |
| 3 | A documentation-only push to main still triggers and completes the deploy | ✓ VERIFIED | `gh run list` shows a `success` run for commit `06b10e4` ("add public project README"), a docs-only commit, and `deploy.yml`'s `push` trigger has no `paths`/`paths-ignore` filter |
| 4 | Two close-succession pushes each start independent runs | ✓ VERIFIED | `gh run list` shows 5 distinct runs, one per distinct push SHA (`1502fc5`, `36f8bb2`, `d318fba`, `06b10e4`, `825d3d9`), each `success` |
| 5 | Concurrent deploys serialized via `pages` group, cancel-in-progress disabled | ✓ VERIFIED | `.github/workflows/deploy.yml`: `concurrency: { group: 'pages', cancel-in-progress: false }` |
| 6 | Target letter stays fully visible/centered at narrowest and widest viewports | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `#target { font-size: clamp(140px, min(45vh, 40vw), 560px) }` is present and matches spec; actual rendering across viewport extremes needs a browser, not grep — routed to human verification |
| 7 | Wide glyphs (W, M) never overflow narrow/portrait viewports | ✓ VERIFIED (coincidental with #6) | Same `clamp(...min(45vh, 40vw)...)` expression clamps against both height and width by construction; letter-count is fixed at 1 char so no wrapping path exists to overflow |
| 8 | Target is always exactly one character — no truncation/wrapping handling needed | ✓ VERIFIED | `LETTERS` is a 26-element single-uppercase-character array; `renderTarget` assigns via `textContent`, no substring/wrap/ellipsis logic anywhere in `src/` |
| 9 | Sub-frame keydown-before-hydration window drops keys silently, no crash/glitch | ? insufficient_spec (backstop) | `verification: backstop` in PLAN frontmatter — a timing/race claim about pre-hydration browser behavior; not assertable by static inspection, routed to human verification |
| 10 | First painted frame is already dark — no white flash before hydration | ✓ VERIFIED | `index.html` inline `<style>` in `<head>` sets `html, body { background: #0A0E1B }` before the module `<script>` tag |
| 11 | Correct key press shows a different letter + muted celebration immediately | ✓ VERIFIED | `src/main.ts` keydown handler: on `event.code === targetCode(currentTarget)`, calls `pickTarget(currentTarget)` (excludes current), `renderTarget`, restarts `correct-pulse`, calls `celebrate()` |
| 12 | Match is layout/Shift/CapsLock-independent (uses `event.code`, not `.key`) | ✓ VERIFIED | `grep -rE '\.key\b' src/` → no matches; `src/main.ts` compares `event.code` against `targetCode(currentTarget)` |
| 13 | Non-matching key produces only a brief neutral flash; target untouched | ✓ VERIFIED | Incorrect branch toggles `incorrect-flash` on `#app` only; no transform/scale/color/target-advance in that branch; `--color-destructive` absent from all `src/` TS and from the `incorrect-flash` keyframe block |
| 14 | Held/repeated keys produce at most one celebration/flash | ✓ VERIFIED | `if (event.repeat) return` is the literal first statement of the keydown handler, before the `.code` comparison |
| 15 | No press ever changes page background or produces strobing | ✓ VERIFIED | No `html`/`body` CSS rule carries an `animation`; no `document.body.style` mutation anywhere in `src/`; confetti origin is computed from the letter's own bounding rect, not a full-page point |
| 16 | Target selection is integer-indexed into a fixed 26-element set (no float/tie ambiguity) | ✓ VERIFIED | `Math.floor(Math.random() * pool.length)` indexes into a frozen `LETTERS`/filtered-pool array |
| 17 | Two consecutive rounds never present the same letter | ✓ VERIFIED | `pickTarget(exclude)` filters the excluded letter out of the candidate pool before indexing (structural, not retry-based); 100,000-trial local re-implementation smoke test never returned the excluded letter |
| 18 | First target renders immediately on load — no splash/"get ready" gate | ✓ VERIFIED | `src/main.ts` calls `pickTarget()` + `renderTarget()` synchronously at module scope, no loading state |
| 19 | Every push to main, including documentation-only, rebuilds and redeploys the live site | ⚠️ GAP (mechanism proven; current HEAD not pushed) | The auto-deploy mechanism itself is proven (see #3), but as of this verification, local `main` is 7 commits ahead of `origin/main` — the code-review-fix commits were never pushed, so the live site is stale relative to the reviewed/fixed codebase. See Gaps below. |

**Score:** 17/19 truths verified (1 present-but-behavior-unverified, 1 gap)

### Prohibitions

| # | Prohibition | Status | Evidence |
|---|-------------|--------|----------|
| P1 | MUST NOT name/identify the child in the publicly deployed artifact or app source (DEPLOY-01, privacy) | ⚠️ PARTIAL — see Gaps | App source (`src/`, `index.html`, `README.md`, repo description) is clean. But the child's name is present in tracked, publicly-pushed `.claude/CLAUDE.md` and multiple `.planning/*.md` files in the now-PUBLIC repository — outside the prohibition's literal "app source" wording but a real, current exposure. Routed to human decision. |
| P2 | MUST NOT frame an incorrect key press as failure (no red/destructive token, no shake, no penalty, no "wrong" text) (CORE-03, values) | ✓ VERIFIED | `--color-destructive` absent from `src/*.ts` and from the `incorrect-flash` keyframe block; incorrect branch has zero text output, zero transform on the letter |
| P3 | MUST NOT collect/store/transmit any data about the child; no request to any origin but the deployed site's own (CORE-02, privacy) | ✓ VERIFIED | `grep -rE 'https?://' src/ index.html` → no matches; built JS bundles contain no external URL literals; live page's only cross-file references are its own `/teaching-toddlers-typing/assets/*` paths |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | GitHub Pages base path | ✓ VERIFIED | `base: '/teaching-toddlers-typing/'` |
| `index.html` | App shell, locked title, pre-hydration dark paint | ✓ VERIFIED | Title `Teaching Toddlers Typing`; inline `background: #0A0E1B` before `<script type="module">` |
| `src/main.ts` | Keydown wiring, repeat guard, match branches | ✓ VERIFIED | Single `document.addEventListener('keydown', ...)`, repeat guard first, both branches implemented |
| `src/game.ts` | `LETTERS`, `pickTarget`, `targetCode`, `renderTarget` | ✓ VERIFIED | All four exported, matches spec (26-element array, structural exclusion, `KeyX` mapping, `textContent` render) |
| `src/celebrate.ts` | Lazy-loaded confetti burst | ✓ VERIFIED (locally; not yet live — see Gaps) | Dynamic `import('canvas-confetti')`, exact locked params/colors present in HEAD; live JS bundle lacks the reduced-motion guard + try/catch added by the review-fix loop |
| `src/style.css` | Palette vars, `correct-pulse`/`incorrect-flash` keyframes | ✓ VERIFIED | Both keyframes present, `prefers-reduced-motion` block present, `--color-bg`/clamp() values match spec |
| `.github/workflows/deploy.yml` | Official 3-action Pages pipeline | ✓ VERIFIED | `actions/checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`; permissions scoped to `contents:read`/`pages:write`/`id-token:write`; no third-party actions |
| `package.json` | Pinned toolchain + canvas-confetti | ✓ VERIFIED | `typescript: "5.9.3"` exact, `canvas-confetti: "1.9.4"`, `@types/canvas-confetti: "1.9.0"` |
| `README.md` | Public readme, live URL, doc-only-push proof | ✓ VERIFIED locally / ⚠️ not yet live | Contains live URL and dev/build commands; the "Known limitations" section (WR-04 fix) exists in HEAD but not in the deployed version |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `index.html` | `src/main.ts` | module script tag | ✓ WIRED | `<script type="module" src="/src/main.ts">` |
| `vite.config.ts` | `dist/index.html` | base rewrite | ✓ WIRED | Local build and live deployment both carry the `/teaching-toddlers-typing/assets/` prefix |
| `.github/workflows/deploy.yml` | `dist/` | `upload-pages-artifact` | ✓ WIRED | `path: './dist'` |
| `src/main.ts` | `src/game.ts` | imports `pickTarget`/`targetCode`/`renderTarget` | ✓ WIRED | `import { pickTarget, targetCode, renderTarget } from './game'` |
| `src/main.ts` | `src/celebrate.ts` | calls `celebrate()` on correct match | ✓ WIRED | `void celebrate(target.getBoundingClientRect())` |
| `src/celebrate.ts` | `canvas-confetti` | dynamic import | ✓ WIRED | `await import('canvas-confetti')` inside `celebrate()`; local build confirms a separate `confetti.module-*.js` chunk |
| `src/main.ts` | `src/style.css` | animation class toggles | ✓ WIRED | `correct-pulse`/`incorrect-flash` classes added/removed with forced reflow |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `src/main.ts` `currentTarget` | rendered letter | `pickTarget()` (real RNG over a real 26-element array) | Yes | ✓ FLOWING |
| `src/celebrate.ts` confetti `origin` | burst anchor point | `target.getBoundingClientRect()` passed from `main.ts` | Yes | ✓ FLOWING |
| Deployed `dist/assets/*` | live bundle contents | Vite production build of `src/` at `origin/main` HEAD (825d3d9) | Yes, but stale relative to current repo HEAD | ⚠️ STALE — see Gaps |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run build` exits 0, code-splits confetti | `npm run build` | 2 JS chunks + 1 CSS emitted (`index-*.js`, `confetti.module-*.js`) | ✓ PASS |
| `pickTarget(exclude)` structurally never returns `exclude` | Node re-implementation, 100,000 trials | Never returned excluded letter | ✓ PASS |
| Live site serves the deployed bundle | `curl` live URL + every referenced/dynamic asset | All HTTP 200 | ✓ PASS |
| Live bundle contains the review-fixed reduced-motion guard | `curl` live JS, `grep prefers-reduced-motion` | 0 matches — guard absent from production | ✗ FAIL (see Gaps) |
| Live CSS contains the `prefers-reduced-motion` keyframe variant | `curl` live CSS, `grep prefers-reduced-motion` | 1 match — present | ✓ PASS |
| No debt markers (TODO/FIXME/HACK/XXX/TBD/PLACEHOLDER) in shipped files | `grep` across `src/`, `index.html`, `README.md`, workflow, configs | 0 matches | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or PLAN/SUMMARY-declared probes exist for this phase — SKIPPED (no probe harness in use; this project has no test framework per `.claude/CLAUDE.md`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| DEPLOY-01 | 01-01, 01-02 | Builds via Vite, deploys to Pages on every push to main | ⚠️ PARTIAL | Mechanism proven (5 independent successful runs across the phase); however current repo HEAD is not pushed/deployed — see Gaps |
| DEPLOY-02 | 01-01 | Minimal working deploy validated early, before game logic | ✓ SATISFIED | Plan 01 (Wave 1) shipped and validated the tracer-slice deploy before Plan 02 (Wave 2) added game logic |
| CORE-01 | 01-01, 01-02 | One big, high-contrast, centered target character | ✓ SATISFIED | `#target` styling + live rendering confirmed |
| CORE-02 | 01-02 | Matching physical key triggers celebration + new target | ✓ SATISFIED | Verified in code and live asset resolution; live behavior matches deployed (pre-review-fix) bundle |
| CORE-03 | 01-02 | Non-matching key produces only a neutral flicker | ✓ SATISFIED | Incorrect branch verified, no destructive token, no letter movement |
| CORE-04 | 01-02 | Held/repeated keys don't spam celebrations | ✓ SATISFIED | Repeat guard is the first statement in the handler |
| CORE-05 | 01-02 | Celebration uses muted palette, never full-page flash/strobe | ✓ SATISFIED | No `html`/`body` animation rule; confetti colors match locked palette |

No orphaned requirements — REQUIREMENTS.md's Phase 1 traceability row set (CORE-01…05, DEPLOY-01, DEPLOY-02) exactly matches the union of `requirements:` declared across both plan frontmatters.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODO/FIXME/HACK/XXX/TBD/PLACEHOLDER markers found in any shipped file | — | None |
| `.claude/CLAUDE.md`, `.planning/*.md` (multiple) | various | Child's real first name present in tracked, publicly-pushed files | ℹ️ Info / flagged | See Gaps and Human Verification — privacy exposure, outside literal "app source" prohibition wording but a real current disclosure |
| (git state) | — | Local `main` 7 commits ahead of `origin/main` | 🛑 Blocker | Live site does not reflect the reviewed/fixed codebase; violates Plan 01-02 Task 3's own acceptance criterion ("local main is level with origin/main") |

### Human Verification Required

See frontmatter `human_verification` — five items: (1) a privacy-risk decision on the child's name being present in the public repo's tracked planning/config docs, (2) the standard cross-viewport visual check from Plan 01, (3) the live interactive Caps-Lock/Shift/repeat/no-strobe walkthrough from Plan 02, (4) the backstop-tier pre-hydration keydown-drop claim, and (5) the final "hand the keyboard to the child and watch one real round" product validation.

### Gaps Summary

Two concrete gaps prevent a clean `passed` verdict:

1. **The live site is 7 commits stale.** Plan 01-02's own Task 3 acceptance criterion required `git status --porcelain` to be empty *and* local `main` to be level with `origin/main` — true at the moment Plan 02 finished, but the subsequent code-review + auto-fix loop (which found and fixed a real Warning: the confetti celebration wasn't respecting `prefers-reduced-motion`, plus a resilience fix wrapping the dynamic import in try/catch) produced 7 more local commits that were never pushed. The deploy mechanism itself works perfectly (proven by 5 independent green runs); nobody has yet triggered the 6th push. This is a one-command fix (`git push`) but it is not yet done, and until it is, "the codebase" this verification is asked to certify and "the live URL" the phase goal names are two different builds.

2. **The child's real name is present in tracked, now-public planning/config files.** `.claude/CLAUDE.md` and several `.planning/*.md` files name the child and are pushed to the public `halvorson/teaching-toddlers-typing` repository. The plan's own threat model flagged and "accepted" the risk of `.planning/` becoming public on the assumption it was safe design prose — an assumption this content contradicts. This sits just outside the literal wording of the plan's privacy prohibition (which is scoped to "app source"), so it's routed to human judgment rather than an automatic fail, but it is a real, current, live exposure worth an explicit decision now rather than later.

Everything else — the actual playable game loop, the deploy pipeline's mechanics, the accessibility/non-punitive/no-strobe design contract, and requirements coverage — checks out cleanly against the codebase.

---

*Verified: 2026-08-13T07:03:52Z*
*Verifier: Claude (gsd-verifier)*

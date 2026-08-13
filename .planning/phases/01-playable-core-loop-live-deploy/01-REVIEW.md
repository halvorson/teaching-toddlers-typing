---
phase: 01-playable-core-loop-live-deploy
reviewed: 2026-08-13T00:30:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - .github/workflows/deploy.yml
  - .gitignore
  - README.md
  - index.html
  - package.json
  - public/favicon.svg
  - src/celebrate.ts
  - src/game.ts
  - src/main.ts
  - src/style.css
  - tsconfig.json
  - vite.config.ts
findings:
  critical: 0
  warning: 0
  info: 6
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-13T00:30:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This is iteration 3 (final auto-fix loop iteration) of the re-review, verifying commit
`79e47a8` which addressed the single outstanding Warning from the prior pass (WR-01:
reduced-motion guard living only at the `main.ts` call site instead of inside
`celebrate()`). I independently re-read every in-scope file (not just the diff), re-ran
`npx tsc -p tsconfig.json --noEmit` (exit 0, zero diagnostics) and `npm run build` (exit 0,
`dist/` emits `index.html`, `index-*.css`, `index-*.js`, and a separately code-split
`confetti.module-*.js` chunk as expected from the dynamic `import()`), and diffed
`79e47a8` directly against the fix the prior review prescribed.

**Verification of the WR-01 fix — confirmed correct and complete:**

- `src/celebrate.ts:12-17` now opens with
  `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return` before the
  `try`/dynamic-import block, with a doc comment explaining the rationale (single exported
  entry point, guards future Phase 2 callers).
- `src/main.ts:25` was simplified back to the unconditional `void celebrate(...)` one-liner;
  the old `if (!window.matchMedia(...).matches) { ... }` wrapper at the call site was
  removed entirely — no leftover dead code, no duplicated guard, no stray unused import.
- The two changes exactly match the prior review's prescribed fix, byte-for-byte in intent.
  `celebrate()` remains the module's only exported function (`CONFETTI_COLORS` is a const,
  not a call site), so the invariant is now enforced exactly once for all current and future
  callers.
- No regression: the CSS-side reduced-motion pulse variant (`src/style.css:64-80`, gating
  `#target.correct-pulse`'s animation-name swap) is untouched and still operates
  independently and correctly alongside the JS-side confetti guard.
- No new bugs introduced by this change: `celebrate()`'s early return happens before the
  dynamic `import('canvas-confetti')`, so reduced-motion users also avoid loading the
  confetti chunk at all (a side benefit, not a defect).

No Critical or Warning findings this pass. Six Info-level items remain outstanding from the
original (iteration 1) review — they were not part of the WR-01 fix scope and are unchanged
in the current tree. They are re-listed below for completeness/traceability since this is
the final auto-fix loop iteration; none of them block shipping.

## Info

### IN-01: No ESLint/Prettier configuration present

**File:** `package.json`
**Issue:** `CLAUDE.md`'s own stack table specifies `eslint@10.8.1` + `typescript-eslint@8.67.0` and `prettier@3.9.6` as this project's chosen tooling, but neither is installed and there is no `.eslintrc`/`eslint.config.js`/`.prettierrc` in the repo. Documented stack and actual repo have drifted apart.
**Fix:** Add the recommended `eslint`/`typescript-eslint`/`prettier` devDependencies + config, or note in `CLAUDE.md`/ROADMAP that lint tooling is deferred to a later phase.

### IN-02: `package.json` has no `engines` field

**File:** `package.json`
**Issue:** `CLAUDE.md` states `vite@8.2.1` requires Node 20.19+/22.12+, but nothing in the repo enforces or documents that for a contributor on an older Node install.
**Fix:**
```json
"engines": { "node": ">=20.19.0" }
```

### IN-03: `@types/canvas-confetti` pinned below the runtime package version

**File:** `package.json:12,17`
**Issue:** `canvas-confetti` runtime dependency is `1.9.4` but `@types/canvas-confetti` devDependency is still pinned to `1.9.0`. Currently harmless, but a version-drift smell.
**Fix:** Bump `@types/canvas-confetti` to match, or use `^1.9.0` so it tracks patch releases.

### IN-04: Duplicated "force animation restart" pattern

**File:** `src/main.ts:21-23,27-29`, `src/game.ts:33-40`
**Issue:** The `classList.remove(...)` → `void el.offsetWidth` → `classList.add(...)` reflow-forcing sequence is hand-written three separate times across two files. Will multiply as more animated states are added (e.g. Phase 2 alphabet-completion burst).
**Fix:** Extract a small shared helper, e.g. `retrigger(el: HTMLElement, className: string): void`, in `game.ts` or a new `src/dom.ts`.

### IN-05: `CONFETTI_COLORS` exported but only used within its own module

**File:** `src/celebrate.ts:7-10`
**Issue:** Exported (with a comment noting it's meant to be shared with a future Phase 2 Alphabet-completion burst) but nothing in the current codebase imports it from outside `celebrate.ts` — speculative generality until that consumer exists.
**Fix:** No action needed if Phase 2 is imminent; otherwise inline as a local `const` until there's a second consumer.

### IN-06: Non-null assertion on `#app` lookup has no diagnostic fallback

**File:** `src/main.ts:5`
**Issue:** `document.querySelector<HTMLDivElement>('#app')!` will throw a bare `Cannot read properties of null` with no context if `#app` is ever missing from `index.html`. Currently safe since `index.html:11` always includes it, but no early, descriptive failure if that invariant breaks.
**Fix:**
```ts
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app container missing from index.html')
```

---

_Reviewed: 2026-08-13T00:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---
phase: 01-playable-core-loop-live-deploy
reviewed: 2026-08-12T23:45:00Z
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
  warning: 4
  info: 7
  total: 11
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-12T23:45:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the Phase 1 walking-skeleton implementation: Vite/TS scaffold, the letter-matching core loop (`game.ts`, `main.ts`), the lazy-loaded confetti celebration (`celebrate.ts`), styling, and the GitHub Pages deploy workflow. The core logic is small, well-commented, and free of the classic security anti-patterns (no `innerHTML`, no `eval`, no hardcoded secrets, `textContent`-only DOM writes as the code itself documents). I verified `npm run build` succeeds cleanly and inspected the emitted `dist/` output, confirming the relative favicon path and Vite `base` config resolve correctly together (no build-time or path bug there, despite it looking suspicious on first read).

No Critical/BLOCKER findings — nothing here risks data loss, a security breach, or an unrecoverable crash. There are four Warnings worth fixing before this ships further (reduced-motion inconsistency, an unhandled promise rejection path, a missing `tsconfig` strict-mode flag, and a physical-keyboard-layout assumption that's worth documenting or scoping), plus several Info-level polish items.

## Warnings

### WR-01: Confetti celebration ignores `prefers-reduced-motion`

**File:** `src/celebrate.ts:12-27` (called from `src/main.ts:25`)
**Issue:** `src/style.css:64-80` already gates the `correct-pulse` scale/drop-shadow animation behind `@media (prefers-reduced-motion: reduce)`, swapping to a reduced variant. The confetti burst fired from `celebrate()`, however, has no equivalent check — it always fires a 40-particle canvas burst regardless of the user's OS-level reduced-motion preference. This is inconsistent within the same feature (the "muted celebratory animation" described in `CLAUDE.md`) and defeats the accessibility intent already implemented elsewhere in this same phase.
**Fix:**
```ts
// src/main.ts
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  void celebrate(target.getBoundingClientRect())
}
```
or thread the check into `celebrate()` itself so all call sites get it automatically.

### WR-02: Unhandled promise rejection if the confetti chunk fails to load

**File:** `src/main.ts:25`, `src/celebrate.ts:12-13`
**Issue:** `void celebrate(target.getBoundingClientRect())` fires the async function and discards the returned promise. `celebrate()` performs a dynamic `import('canvas-confetti')` with no try/catch. If that import ever rejects (flaky network on GitHub Pages, ad-blocker/extension interference, browser blocking the chunk), the rejection is never handled, producing an uncaught promise rejection on every subsequent correct match for that session. The game keeps working, but this is a real, easily-triggered robustness gap with no user-facing indication.
**Fix:**
```ts
// src/celebrate.ts
export async function celebrate(anchor: DOMRect): Promise<void> {
  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({ /* ... */ })
  } catch {
    // Confetti is decorative — swallow load failures so the core game keeps working.
  }
}
```

### WR-03: `tsconfig.json` does not enable `strict` mode

**File:** `tsconfig.json:2-23`
**Issue:** The config sets `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `noFallthroughCasesInSwitch`, but never sets `"strict": true` (or any of `strictNullChecks` / `noImplicitAny` individually). The stock `npm create vite@latest -- --template vanilla-ts` scaffold ships with `strict: true` by default, and `CLAUDE.md` cites "type safety" as TypeScript's stated purpose in this project — but that guarantee isn't actually turned on. I confirmed `npx tsc -p tsconfig.json --strict` currently produces zero new errors on the existing code, so enabling it now is a free, low-risk fix — but leaving it off means the next contributor's null-unsafe or implicitly-`any` code won't be caught by the compiler at all.
**Fix:**
```json
{
  "compilerOptions": {
    "strict": true,
    // ...existing options
  }
}
```

### WR-04: Physical-key mapping assumes a US-QWERTY layout

**File:** `src/game.ts:22-25`
**Issue:** `targetCode()` maps every on-screen letter directly to `Key<Letter>` and `main.ts` matches against `event.code`, which is physical-position-based, not label-based. This is fine on US-QWERTY, but on QWERTZ (German/Swiss/Austrian) keyboards the Y/Z keys are physically swapped, and AZERTY (French) keyboards shift several other letter positions. A child on one of those layouts pressing the physically-labeled key matching the on-screen target will register a *different* letter than the one shown (e.g., the on-screen "Z" would require pressing the key physically printed "Y" on a German keyboard), directly undermining the "immediate, delightful, low-stakes celebration" feedback loop the project's core value describes. This may be an acceptable, deliberate MVP scope decision (the code comment does call it out as intentional), but it isn't documented as a known limitation anywhere user-facing (README), so it's worth an explicit decision/doc note rather than silent scope-narrowing.
**Fix:** Either document the US-QWERTY-only assumption in `README.md`, or detect layout via the (currently limited-availability) `navigator.keyboard.getLayoutMap()` API and remap accordingly for non-US layouts if this ships beyond a single known keyboard.

## Info

### IN-01: No ESLint/Prettier configuration present

**File:** `package.json`
**Issue:** `CLAUDE.md`'s own stack table specifies `eslint@10.8.1` + `typescript-eslint@8.67.0` (with the TypeScript `<6.1.0` peer-dependency constraint called out explicitly) and `prettier@3.9.6` as this project's chosen tooling, but `package.json` has neither installed, and there is no `.eslintrc`/`eslint.config.js`/`.prettierrc` anywhere in the repo. If this is an intentional Phase-1 scope cut, that's reasonable, but as written the documented stack and the actual repo have drifted apart.
**Fix:** Either add the recommended `eslint`/`typescript-eslint`/`prettier` devDependencies + config now, or note in `CLAUDE.md`/ROADMAP that lint tooling is deferred to a later phase.

### IN-02: `package.json` has no `engines` field

**File:** `package.json`
**Issue:** `CLAUDE.md` states `vite@8.2.1` requires Node 20.19+/22.12+, but nothing in the repo enforces or documents that for a contributor with an older Node install — they'd hit an unclear Vite/npm failure instead of a clear "Node version too old" message.
**Fix:**
```json
"engines": { "node": ">=20.19.0" }
```

### IN-03: `@types/canvas-confetti` pinned below the runtime package version

**File:** `package.json:12,17`
**Issue:** `canvas-confetti` runtime dependency is `1.9.4` but `@types/canvas-confetti` devDependency is pinned to `1.9.0`. Currently harmless (the API surface used here is stable), but it's a version-drift smell that could silently hide a type mismatch if the runtime package's API changes in a later 1.9.x patch.
**Fix:** Bump `@types/canvas-confetti` to match, or use a caret range (`^1.9.0`) so it tracks patch releases.

### IN-04: Duplicated "force animation restart" pattern

**File:** `src/main.ts:21-23,27-29`, `src/game.ts:33-40`
**Issue:** The `classList.remove(...)` → `void el.offsetWidth` → `classList.add(...)` reflow-forcing sequence is hand-written three separate times across two files (once for `correct-pulse`, once for `incorrect-flash`, once conceptually inside `renderTarget`'s opacity dip). Small today, but as more animated states are added (Phase 2 alphabet-completion burst, etc.) this duplication will multiply.
**Fix:** Extract a small shared helper, e.g. `retrigger(el: HTMLElement, className: string): void`, in `game.ts` or a new `src/dom.ts`.

### IN-05: `CONFETTI_COLORS` exported but only used within its own module

**File:** `src/celebrate.ts:7-10`
**Issue:** `CONFETTI_COLORS` is exported (with a comment noting it's meant to be shared with a future Phase 2 Alphabet-completion burst) but nothing in the current codebase imports it — it's speculative generality until that consumer exists.
**Fix:** No action needed if Phase 2 is imminent and this is deliberate; otherwise inline it as a local `const` until there's a second consumer.

### IN-06: Non-null assertion on `#app` lookup has no diagnostic fallback

**File:** `src/main.ts:5`
**Issue:** `document.querySelector<HTMLDivElement>('#app')!` will throw a bare `Cannot read properties of null` with no context if `#app` is ever missing from `index.html` (e.g., a future edit renames/removes the div). Currently safe since `index.html:11` always includes it, but there's no early, descriptive failure if that invariant breaks.
**Fix:**
```ts
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app container missing from index.html')
```

### IN-07: `color-mix()` in the incorrect-flash keyframes has a modern-browser-only requirement with no fallback

**File:** `src/style.css:23-33`
**Issue:** `color-mix(in srgb, var(--color-surface) 55%, transparent)` requires Safari 16.2+/Chrome 111+/Firefox 113+. On an older or budget tablet (plausible for a toddler's device), the property is simply invalid and the flash keyframe becomes a no-op — the wrong-key feedback silently disappears with no visible error, rather than degrading to a flat semi-transparent color.
**Fix:** Add a static fallback background-color declaration before the `color-mix` one so older browsers get *some* flash even without the mix:
```css
30% {
  background-color: rgba(30, 35, 64, 0.55); /* fallback */
  background-color: color-mix(in srgb, var(--color-surface) 55%, transparent);
}
```

---

_Reviewed: 2026-08-12T23:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

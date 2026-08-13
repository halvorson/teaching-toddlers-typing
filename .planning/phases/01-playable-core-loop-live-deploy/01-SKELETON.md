# Walking Skeleton — Keyboard Quest (teaching-toddlers-typing)

**Phase:** 1
**Generated:** 2026-08-13

## Capability Proven End-to-End

A child sitting at a physical keyboard can load `https://halvorson.github.io/teaching-toddlers-typing/`,
see one large letter, press the matching physical key, and get an immediate muted celebration plus a
new letter — with the whole path from source to live CDN exercised by an automated push-to-deploy
pipeline.

> This project has no database and no backend tier. The Walking Skeleton's anchor deliverable is
> therefore the **one real UI interaction** (keypress → match → celebrate), standing in for the usual
> "one real DB read and write". `01-RESEARCH.md`'s Architectural Responsibility Map confirms this app
> has exactly two tiers — Browser/Client and CDN/Static — and that introducing a third would be wrong.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build tool | Vite 8.2.1, `vanilla-ts` template | Fastest zero-config path from scaffold to an optimized static bundle with content-hashed assets; the only build tool `.claude/CLAUDE.md` sanctions. |
| Language / UI layer | TypeScript 5.9.3, no UI framework | Five screens and one `keydown` listener do not justify a virtual DOM. 5.9.3 specifically because `typescript-eslint@8.67.0` caps TypeScript below 6.1.0, and the registry `latest` tag (7.x) has no stable Compiler API. Pin is exact, never a range. |
| Data layer | None in Phase 1; `localStorage` from Phase 4 | No accounts, no server, no sync. Statistics persistence (Phase 4) is the only persistence this project will ever have, and it stays client-side with a versioned schema. |
| Auth | None, ever | No identity concept exists in this product (`REQUIREMENTS.md` → Out of Scope). |
| Styling | Native CSS custom properties + `@keyframes`, no framework | The palette is five tokens and the motion is two keyframes; a CSS framework would be pure overhead. Tokens are declared in `src/style.css` `:root`. |
| Runtime dependencies | Exactly one: `canvas-confetti@1.9.4`, loaded via dynamic `import()` | Particle physics is the one thing worth not hand-rolling. Dynamic import keeps it off the initial page load. Any addition in a later phase must re-run the package-legitimacy gate. |
| Deployment target | GitHub Pages project site, "Deploy from GitHub Actions" source mode | Free, static, no Firebase quota pressure. Requires `base: '/teaching-toddlers-typing/'` in `vite.config.ts` and the Pages source explicitly set to the Actions build type via `POST /repos/{owner}/{repo}/pages` with `build_type=workflow`. |
| CI/CD | Official 3-action workflow (`configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`) on push to `main` | First-party, no third-party supply-chain surface. `permissions:` scoped to `contents: read`, `pages: write`, `id-token: write`. `concurrency.group: 'pages'` with in-progress cancellation **disabled**, so an in-flight production deploy is never aborted. |
| Branching | Single `main` branch; every push deploys to production | Locked project constraint — simplicity over process. |
| Directory layout | Flat `src/` modules, one concern each | `src/main.ts` (entry + input wiring), `src/game.ts` (target state machine), `src/celebrate.ts` (effect wrapper), `src/style.css` (tokens + motion). Phase 2's screen router becomes a single in-memory `screen` variable in `src/main.ts`, not a router library. |
| Rendering safety | `textContent` only, never HTML-string assignment | Defense in depth for a render path every later phase inherits. |
| Input model | `KeyboardEvent.code` (physical key position), repeat-flag early return | Layout / Shift / Caps Lock independent by browser design; the repeat guard is the first statement of the handler. |
| Testing | Manual QA only — no test framework | Locked by `.claude/CLAUDE.md`'s "What NOT to Use". Automated gates in this project are shell assertions (build exit codes, source greps, live-URL `curl` checks), not a test runner. |

## Stack Touched in Phase 1

- [x] Project scaffold — Vite + TypeScript, exact-pinned toolchain, hand-authored `vite.config.ts`
- [x] Routing — single implicit route; the page loads directly into gameplay with no splash gate
- [x] Data layer — **not applicable**: this application has no database or backend tier in any phase
- [x] UI — one real interaction wired end-to-end: physical keypress → physical-key match → instant new target → muted celebration
- [x] Deployment — live on GitHub Pages via the official Actions workflow, validated against the live URL (not `vite preview`)

## Out of Scope (Deferred to Later Slices)

Explicit, so later phases do not re-litigate Phase 1's minimalism:

- Home menu, mode selection, and the Slay-the-Spire-inspired background (Phase 2)
- Numbers mode and sequential Alphabet mode, including the bigger Z-completion celebration (Phase 2)
- Fullscreen entry/exit and unexpected-exit resync (Phase 2)
- Share affordance that copies the page URL (Phase 2)
- Chime audio, spoken letter names, and the sound toggle (Phase 3)
- Session statistics, `localStorage` persistence with a versioned schema, the histogram, and stat reset (Phase 4)
- Any test framework, lint/format tooling, service worker, PWA manifest, router library, CSS framework, backend, or auth — permanently out of scope for v1
- A "keyboard not detected" fallback for touch-only visitors (accepted gap; `01-UI-SPEC.md` assumption 8)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering the architectural
decisions above:

- **Phase 2** — a player picks a mode from a real home menu, plays Letters / Numbers / Alphabet
  fullscreen, and can copy the share link. Adds a `screen` state variable to `src/main.ts` and a
  target-source abstraction to `src/game.ts`; reuses `src/celebrate.ts` with a larger particle count
  for the Alphabet-completion burst rather than introducing a second animation system.
- **Phase 3** — a correct match chimes and optionally speaks the character, with a parent-facing
  sound toggle. Adds a native `HTMLAudioElement` and `SpeechSynthesis` wrapper alongside
  `src/celebrate.ts`; introduces the first `localStorage` write (the toggle).
- **Phase 4** — a parent reviews accuracy, letters-per-minute, and a reaction-time histogram, and can
  reset them. Adds a versioned `localStorage` stats schema and a Statistics screen; stats are
  recorded silently with no in-game HUD.

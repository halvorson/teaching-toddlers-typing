# Stack Research

**Domain:** Small, animation-heavy, static browser game/app (toddler educational, no backend)
**Researched:** 2026-08-12
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite | 8.2.1 | Build tool / dev server | Fastest, simplest way to scaffold a zero-framework static TS site. `npm create vite@latest -- --template vanilla-ts` gives HMR dev server + optimized production build with zero config. Requires Node 20.19+/22.12+. Confirmed current via npm registry. |
| TypeScript | 5.9.3 | Type safety, editor DX | Latest **5.x** stable, not the npm `latest` tag (7.0.2). TypeScript 7.0 shipped July 2026 with a native Go compiler (`tsgo`) but has **no stable Compiler API yet** — `typescript-eslint` 8.67.0's own `peerDependencies` cap TypeScript at `>=4.8.4 <6.1.0`, i.e. it explicitly rejects 7.x. Using 7.0 today breaks ESLint, ts-morph, and most tooling. 5.9.3 (or the 6.0.x bridge release) gives full IDE + lint compatibility with zero loss of features needed for this project. |
| HTML5 + CSS3 (native) | — | Structure, layout, animation | No CSS framework needed. A single-page app with a menu and one game screen doesn't need Tailwind/Bootstrap overhead. Native CSS custom properties (`--color-bg`, `--color-accent`, etc.) give you the "dark pearlescent" theme system with zero build cost, and CSS `@keyframes`/`transition` handle the muted celebration animation without a runtime animation library. |
| Vanilla TypeScript (no UI framework) | — | Application logic | Confirms the user's existing decision. React/Vue/Svelte add virtual-DOM diffing, bundle size, and framework mental overhead for what is fundamentally: one big letter on screen, a `keydown` listener, and a state machine with ~5 screens (menu, letters, numbers, alphabet, stats/settings). A hand-rolled tiny view-swap function is simpler to reason about and debug for a solo/hobby project than any framework's lifecycle. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| canvas-confetti | 1.9.4 | Celebration burst effect | Fire a **restrained** confetti burst (low `particleCount`, narrow `spread`, muted custom `colors` array matching the pearlescent palette — deep blues/purples/greens, not primary rainbow) on correct match and a bigger burst on Alphabet-mode Z completion. Zero dependencies, ~6KB gzipped, canvas-based, dynamically `import()`-able so it doesn't cost anything on the initial page load. This is the *only* third-party runtime dependency this project needs. |
| Web Speech API (`SpeechSynthesis`, browser built-in) | — | Optional spoken letter/number name | No install — it's a browser global (`window.speechSynthesis`). Supported in all modern desktop/mobile browsers (Chrome 33+, Edge, Firefox, Safari, Samsung Internet per caniuse). Use `SpeechSynthesisUtterance` to speak the letter/number on correct match, gated by the Settings sound toggle. Two caveats to design around: (1) some browsers (notably Safari/iOS) only allow speech synthesis after a genuine user gesture — this project already requires a keypress to trigger it, so that's naturally satisfied; (2) `speechSynthesis.getVoices()` can return `[]` on first call — listen for the `voiceschanged` event once at startup and cache the voice list. |
| HTMLAudioElement (browser built-in) | — | Chime sound effect | For the short "correct" chime, a plain `new Audio('/chime.mp3').play()` (or a pre-created, reused `Audio` element to avoid GC churn) is all this needs. Do **not** reach for Howler.js or the Web Audio API graph — those solve mixing/spatial-audio/streaming problems this app doesn't have. One short sound, played on demand, is a one-liner. |
| ESLint + typescript-eslint | eslint 10.8.1, typescript-eslint 8.67.0 | Linting | Standard modern flat-config ESLint setup. Confirms compatibility constraint above (requires TS <6.1.0). |
| Prettier | 3.9.6 | Formatting | Optional but recommended for a project with celebratory CSS keyframes and state-machine logic that benefits from consistent formatting. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite dev server | Local development with HMR | `npm run dev`; instant TS/CSS hot reload, no config needed for a vanilla-ts template. |
| `vite build` | Production bundling | Outputs to `dist/`; minifies JS/CSS, hashes filenames for cache-busting — exactly what a GitHub Pages static deploy needs. |
| GitHub Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) | CI/CD deploy to GitHub Pages | Official, first-party GitHub Actions — no third-party deploy action needed. Triggered on push to `main` (matches the "no dev/staging branch, every push deploys to prod" constraint). |
| Browser DevTools (Lighthouse, Fullscreen/Speech API panels) | Manual QA | No automated testing framework is recommended for v1 given project scope (see "What NOT to Use"). |

## Installation

```bash
# Scaffold
npm create vite@latest keyboard-quest -- --template vanilla-ts
cd keyboard-quest

# Pin TypeScript to the tooling-compatible 5.x line (Vite scaffolds may install `latest`, i.e. 7.x)
npm install -D typescript@5.9.3

# The one runtime dependency
npm install canvas-confetti
npm install -D @types/canvas-confetti

# Linting/formatting (optional but recommended)
npm install -D eslint@10 typescript-eslint@8 prettier@3
```

No other runtime dependencies. `SpeechSynthesis`, `Audio`, `localStorage`, and the `Fullscreen` API are all browser globals — nothing to install.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Vanilla TS + Vite | React/Preact + Vite | If the app were expected to grow into many interacting stateful views, nested component trees, or needed a large contributor team. This project is ~5 screens and a keypress listener — not that. |
| TypeScript 5.9.x | TypeScript 7.0 (native Go compiler) | Once `typescript-eslint`, VS Code's built-in TS server, and the wider ecosystem finish migrating (TS 7.1 is expected to restore a stable Compiler API in autumn 2026) — revisit then for the 7-10x faster type-checking. Not worth the tooling breakage today for a small codebase where compile times are irrelevant anyway. |
| canvas-confetti | tsparticles | Only if you want a full configurable particle *system* (snow, fireworks, connected dots, physics). Massive overkill here — 20-100KB vs 6KB, and far more configuration surface than "small muted burst on correct answer." |
| canvas-confetti | Hand-rolled CSS-only burst (e.g. react-confetti-explosion's approach, ported to vanilla) | If you want to avoid canvas entirely and prefer a handful of `<span>` elements animated with CSS `@keyframes` + `transform`/`opacity`. Fully viable and even lighter (0KB dependency) — reasonable to prototype this first and only reach for canvas-confetti if the DOM-based version looks too flat/uniform for the celebratory feel wanted. |
| Native `Audio`/`SpeechSynthesis` | Howler.js | If the app later needs audio sprites, crossfading, or precise timing across many simultaneous sounds. Not needed for one chime + optional speech. |
| GitHub Actions official Pages workflow | Third-party marketplace actions (e.g. "Vite GitHub Pages Deployer") | Avoid — see "What NOT to Use" below. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| React/Vue/Svelte/Angular | Adds a rendering framework, build-tool integration surface, and mental model overhead for a single-page app with ~5 screens and no complex shared state. Directly contradicts the user's own stated decision ("Vite + TypeScript over React... no framework overhead needed"). | Vanilla TypeScript with a small hand-written view-router/state-machine (a `switch` on a `screen` enum is enough). |
| Any backend/server framework (Express, Fastify, etc.) or BaaS (Firebase, Supabase) | Project has explicitly no accounts, no backend, no persistence beyond the browser. The user is *already* trying to get away from Firebase usage limits. | `localStorage` for all persistence; GitHub Pages for all hosting. |
| Auth libraries (Auth0, Clerk, NextAuth, Firebase Auth) | No user accounts exist or are planned ("Out of Scope: User accounts / auth"). | Nothing — there is no identity concept in this app. |
| TypeScript 7.0 (`latest` npm tag) as of today | No stable Compiler API; `typescript-eslint` explicitly refuses to install alongside it (`peerDependencies: typescript ">=4.8.4 <6.1.0"`). Installing "whatever `npm install typescript` gives you" today silently pulls 7.0.2 and breaks lint tooling. | Pin `typescript@5.9.3` explicitly in `package.json`. |
| tsparticles / GSAP / Anime.js / Framer Motion | Full animation/particle engines are disproportionate to "one muted celebration burst + simple screen transitions." They add real bundle weight and API surface for effects achievable with a handful of CSS `@keyframes` plus, at most, canvas-confetti for the particle burst. | CSS `@keyframes`/`transition` for UI motion; canvas-confetti (or a hand-rolled DOM burst) for the celebration particles. |
| Howler.js / Tone.js | Solve audio-mixing, spatial-audio, and multi-track problems this app doesn't have (one chime, optionally one spoken word, never overlapping in a meaningful way). | Native `HTMLAudioElement` for the chime; native `SpeechSynthesis` for spoken letters. |
| Jest/Vitest + full test-suite scaffolding, Cypress/Playwright E2E | Reasonable for a team project, disproportionate for a solo hobby app whose primary QA is "does the child enjoy playing it." Setting up a test harness here is process overhead the user explicitly wants to avoid (mirrors their "no dev/staging branch, simplicity over process" decision). | Manual testing during development; revisit if the project grows or gains contributors. |
| Third-party "Vite GitHub Pages Deployer" marketplace Actions | GitHub's own `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages` are first-party, actively maintained, and documented directly by the Vite team for exactly this use case — no reason to add a third-party action's maintenance/trust risk. | The official 3-action workflow (see below). |
| vite-plugin-pwa / service-worker offline support | Not a stated requirement (no offline-use case, no "installable app" requirement in PROJECT.md). Adds complexity (cache invalidation, service worker lifecycle bugs) for no requested benefit. | Plain static build; revisit only if offline play becomes a requirement. |
| Client-side router library (e.g. a full SPA router) | The app has no deep-linkable routes — it's one page with an internal screen state (menu/letters/numbers/alphabet/stats/settings), and the only URL-sharing need is "copy current URL," which requires no router at all. | A simple in-memory `currentScreen` state variable driving conditional rendering. |

## Stack Patterns by Variant

**If the "share-link" feature later needs to restore a specific mode via URL (e.g. `?mode=letters`):**
- Read `URLSearchParams` on load to set initial screen/mode; update `history.replaceState` (not `pushState`, to avoid polluting back-button history) when mode changes.
- Because this still requires zero routing library — the entire "router" is a few lines against the native `URL`/`History` APIs.

**If celebration animation feels flat with CSS-only bursts during prototyping:**
- Add canvas-confetti (already recommended) rather than hand-tuning more elaborate CSS particle systems — its physics (gravity, drift, decay) are already tuned to look good and are configurable enough to mute the palette.

**If the child (or future toddler users) need larger celebration on Alphabet-mode Z completion:**
- Reuse the same canvas-confetti call with a higher `particleCount`/wider `spread`/longer `ticks` rather than introducing a second animation system — keeps the celebration vocabulary consistent (same particle look, just "bigger").

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| typescript@5.9.3 | typescript-eslint@8.67.0, eslint@10.8.1 | Verified via npm registry `peerDependencies` (`typescript: ">=4.8.4 <6.1.0"`). Do not upgrade TypeScript past 6.0.x until typescript-eslint publishes TS7 support (tracked against TS 7.1's restored Compiler API). |
| vite@8.2.1 | Node.js 20.19+ / 22.12+ | Confirmed via npm registry `engines` field context; older Node versions are not supported by current Vite. |
| canvas-confetti@1.9.4 | Any bundler (framework-agnostic, zero deps) | No version coupling concerns; pure browser Canvas API usage. |
| `actions/deploy-pages` v5, `actions/upload-pages-artifact` v5, `actions/configure-pages` v6 | GitHub Pages "Deploy from GitHub Actions" source mode | Repository Settings → Pages must be switched to "GitHub Actions" (not "Deploy from a branch") for this workflow to publish correctly. |

## GitHub Actions Deployment Workflow

Verified directly from Vite's official docs (`vite.dev/guide/static-deploy`), `.github/workflows/deploy.yml`:

```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Set up Node
        uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

**Critical config note:** set `base` in `vite.config.ts` to match the deploy target:
- `https://<username>.github.io/keyboard-quest/` (project page, most likely case) → `base: '/keyboard-quest/'`
- `https://<username>.github.io/` (root/user page or custom domain) → `base: '/'` (or omit — it's the default)

Getting this wrong is the single most common cause of a blank white page / broken asset 404s on first GitHub Pages deploy.

## Sources

- npm registry (`registry.npmjs.org`) direct queries — HIGH confidence, official package metadata: Vite 8.2.1, TypeScript 7.0.2 (`latest` tag) vs 5.9.3 (latest 5.x stable), canvas-confetti 1.9.4, eslint 10.8.1, prettier 3.9.6, typescript-eslint 8.67.0, and typescript-eslint's `peerDependencies` constraint on TypeScript version.
- `vite.dev/guide/static-deploy` (fetched directly) — HIGH confidence, official Vite documentation: GitHub Actions workflow YAML and base-path guidance.
- MDN Web Docs / caniuse.com (via web search) — MEDIUM confidence: Fullscreen API (`requestFullscreen`/`exitFullscreen`/`fullscreenchange`) and SpeechSynthesis browser support.
- Web search aggregation (multiple TS-ecosystem blogs, GitHub issues on `typescript-eslint` and `eslint` repos) — MEDIUM/HIGH confidence, cross-checked against npm registry ground truth: TypeScript 7.0 native-compiler rollout status and ecosystem incompatibility as of August 2026.
- Web search aggregation (package comparison sites, canvas-confetti GitHub) — MEDIUM confidence: canvas-confetti vs. tsparticles vs. CSS-only alternatives.

---
*Stack research for: small, animation-heavy, static browser game with no backend, GitHub Pages deployment*
*Researched: 2026-08-12*

# Pitfalls Research

**Domain:** Toddler-facing browser typing/matching game — static Vite site on GitHub Pages, physical keyboard input, fullscreen kiosk mode
**Researched:** 2026-08-12
**Confidence:** HIGH (web platform APIs — Fullscreen, KeyboardEvent, localStorage, autoplay — are stable, long-documented behaviors verified against MDN/web.dev/Chromium docs; GitHub Pages+Vite specifics verified against current community guides)

## Critical Pitfalls

### Pitfall 1: Auto-entering fullscreen on load instead of on the "Play" click

**What goes wrong:**
`element.requestFullscreen()` silently fails (rejected promise, `NotAllowedError`) if it isn't called synchronously inside a real user-initiated event handler (click/keydown/touchend). A common mistake is calling it in a `useEffect`/`DOMContentLoaded`/route-change handler, or after an `await` (e.g. after fetching stats) — by the time the async work resolves, the "user gesture" window has expired and the call is silently rejected in most browsers.

**Why it happens:**
Browsers gate the Fullscreen API behind a user gesture as an anti-hijacking security measure (same family of restriction as autoplay audio and clipboard write). Developers test manually by clicking Play and it "just works," then refactor to trigger fullscreen from a state-change effect and it breaks without an obvious error unless they check the promise rejection.

**How to avoid:**
- Call `requestFullscreen()` as the *first* synchronous statement inside the actual click/tap/keydown handler for the Play button — no `await` before it.
- Always `.catch()` the returned promise and fail gracefully (show the game un-fullscreened rather than a blank/broken screen) — some browsers/devices (notably iOS Safari on iPhone, pre-16.4/17.2) don't support element fullscreen at all.
- Do not attempt fullscreen on page load, only in response to the Play tap — matches tinyfingers.net's pattern of entering fullscreen from user action, not automatically.

**Warning signs:**
Fullscreen works when testing on desktop Chrome but silently does nothing on iPad/iPhone Safari or after adding a loading spinner before the Play transition.

**Phase to address:**
Fullscreen & input-handling phase (core gameplay loop).

---

### Pitfall 2: No handling for fullscreen exit via Escape/swipe, leaving broken UI state

**What goes wrong:**
User (or, more likely, the toddler mashing keys) presses Escape, swipes down (iPad), or the browser auto-exits fullscreen for another reason. The `fullscreenchange` event fires, but if it's not wired up, the app's internal "isFullscreen" state gets out of sync — buttons made for a fullscreen layout float in the wrong place, or the app assumes it's still in kiosk mode and doesn't restore the browser chrome/menu affordances the child now needs.

**Why it happens:**
`requestFullscreen()`/`exitFullscreen()` calls are easy to wire up; the *unrequested* exit (ESC key, gesture, OS-level) is the part developers skip because it isn't triggered by their own code — you must listen for `fullscreenchange` and treat `document.fullscreenElement === null` as the source of truth, not any internal flag.

**How to avoid:**
- Register a single `document.addEventListener('fullscreenchange', ...)` at app init (once, not per-screen) that syncs UI state to `!!document.fullscreenElement`, and also call `exitFullscreen()` from your own "Quit/Back to menu" action rather than tracking a separate boolean.
- Also register `webkitfullscreenchange` for older WebKit if supporting older Safari matters (modern Safari 16.4+/17.2+ on iPad/iPhone use the unprefixed API, so this is a defensive fallback, not the primary path).
- On exit (whatever the cause), route back to the menu screen rather than leaving the game screen visible un-fullscreened.

**Warning signs:**
QA finds that pressing Escape mid-game leaves a stretched/misaligned layout, or the "Play" button doesn't work a second time because internal fullscreen state thinks it's still active.

**Phase to address:**
Fullscreen & input-handling phase.

---

### Pitfall 3: Using `KeyboardEvent.key` instead of `.code` for letter/number matching (or vice versa, without thinking it through)

**What goes wrong:**
Two related mistakes, both plausible here:
1. Using `.key` naively means a toddler holding Shift, having Caps Lock on, or using a non-QWERTY/non-US keyboard layout changes what value comes through (`.key` is layout- and modifier-aware; pressing the physical "A" key on an AZERTY keyboard produces `"q"` for `.key` in some layouts, or `"A"` vs `"a"` depending on Shift/Caps Lock).
2. Using `.code` exclusively means physical position is matched regardless of layout — good for a QWERTY-labeled key-on-screen matching game (keycaps are physically printed, so `.code` correctly maps "the key that says A" regardless of software layout) but it will silently mismatch if the user's OS keyboard layout differs from the physical keycap labels (rare for a home toddler setup, but real for shared/borrowed devices).

**Why it happens:**
Most keyboard-handling tutorials use `.key` for text input and `.code` for game controls (WASD) without discussing the tradeoff for a "match the letter printed on the physical key" game — this project's specific use case (physical key ↔ printed letter) doesn't map cleanly onto either "typing text" or "WASD game controls" tutorials.

**How to avoid:**
- For this game's stated design ("hunt-and-peck the matching physical key"), the correct source is **`event.code`** (e.g. `KeyA`, `Digit5`), normalized by stripping the `Key`/`Digit` prefix — this matches the physical keycap regardless of Shift/Caps Lock/modifier state, which is exactly right for a toddler who doesn't understand Shift.
- Explicitly ignore `.key` for matching logic; only use it (if at all) for debug logging.
- Normalize case: since `.code` doesn't have a case, this sidesteps the "did they mean uppercase A or lowercase a" ambiguity entirely — treat `KeyA` as a match for the displayed "A" target regardless of physical Shift state.
- Do not attempt to distinguish or require Shift for the Alphabet/Letters modes — a toddler pressing Shift+A accidentally should still count as a correct "A" press, not a failure or a different keystroke.

**Warning signs:**
Testing only on one US-layout MacBook keyboard hides the bug entirely; it surfaces only when the app is used on a different physical keyboard/layout, or when a toddler presses Shift+letter and gets "punished" (or the match silently fails).

**Phase to address:**
Fullscreen & input-handling phase (core matching logic).

---

### Pitfall 4: Key-repeat flooding — one physical press registers dozens of "correct" events

**What goes wrong:**
Holding a key down (which toddlers do constantly — mashing and holding is developmentally normal) fires repeated `keydown` events at the OS repeat rate (often 20-30/sec after an initial delay) once the initial repeat delay elapses. If the match handler doesn't check `event.repeat`, a single held key can trigger many "correct match" celebrations/sound plays in rapid succession, or blow through several targets in a fraction of a second — breaking both the stats (letters-per-minute, reaction time) and the celebratory pacing (sound/animation overlap into a garbled mess).

**Why it happens:**
`keydown` naturally repeats while held; this is invisible in casual testing (a quick tap doesn't trigger repeat) and only appears when someone (a toddler, reliably) holds a key for more than ~500ms.

**How to avoid:**
- Ignore keydown events where `event.repeat === true` — only process the first, non-repeated `keydown` for match logic.
- Alternatively/additionally, debounce advancing to a new target: once a match is registered, ignore further keydown processing until the celebration animation completes and the next target renders (a short lockout window, e.g. 200-400ms) — this also prevents the *next* target from being skipped by keys still being released from the previous press.
- Feed reaction-time/LPM stats only from the first non-repeat keydown that matches, so held-key mashing doesn't inflate accuracy or corrupt the reaction-time histogram.

**Warning signs:**
Stats show implausible LPM (tens of matches per second) or the celebration sound/animation stutters and overlaps during testing with a held key.

**Phase to address:**
Fullscreen & input-handling phase (core matching logic) — flag stats phase to consume only non-repeat events.

---

### Pitfall 5: Vite `base` misconfigured for GitHub Pages, causing blank page / 404 assets

**What goes wrong:**
A project deployed to `https://username.github.io/repo-name/` needs Vite's `base` config set to `/repo-name/` — leaving it at the default `/` produces a page where `index.html` loads (GitHub Pages serves it) but every asset (`/assets/index-abc123.js`, CSS, images) 404s because the browser requests them from the domain root instead of the repo subpath. Result: blank white screen in production despite a successful build and a successful local `npm run preview`.

**Why it happens:**
`vite build` + `vite preview` both work fine locally at the root, so the misconfiguration is invisible until the actual GitHub Pages deploy, and the failure mode (blank page, console full of 404s) doesn't obviously point at "base path" to someone unfamiliar with the pattern.

**How to avoid:**
- Set `base: '/repo-name/'` explicitly in `vite.config.ts` (or derive it from `process.env.GITHUB_REPOSITORY` in CI to avoid hardcoding/typos), matching the exact repository name and casing.
- If using GitHub's official `actions/deploy-pages` + `actions/upload-pages-artifact` flow (recommended over manual `gh-pages` branch pushes), the repo settings must have Pages source set to "GitHub Actions," not "Deploy from a branch" — mixing the two causes confusing stale-content issues.
- Verify post-deploy by opening the live URL, not just `vite preview` — `vite preview` uses a different local server config and won't reproduce a GitHub Pages base-path bug reliably in all setups.

**Warning signs:**
`vite build && vite preview` looks perfect locally; the live GitHub Pages URL shows a blank page with a console full of `Failed to load resource: 404` for `/assets/*.js`.

**Phase to address:**
Deploy/CI phase (should be validated early — a minimal "hello world" Vite app deployed to Pages before real feature work, to de-risk the deploy pipeline itself).

---

### Pitfall 6: Deep-link / reload 404s from client-side routing on GitHub Pages

**What goes wrong:**
GitHub Pages is a static file host with no server-side rewrite rules. If the app ever adopts client-side routes (e.g. `/#/stats` is fine, but a path-based route like `/stats` is not) and a user reloads or shares a link to a non-root path, GitHub Pages returns its default 404 page instead of the SPA's `index.html`, breaking the app entirely on refresh.

**Why it happens:**
Frameworks with client-side routers "just work" in dev servers (which rewrite all paths to `index.html`), masking that GitHub Pages has no equivalent rewrite by default.

**How to avoid:**
- For this project's scope (single-page game with in-app screen state, not URL-based routes, plus a share-link that copies the *current* URL as-is), avoid introducing a path-based router entirely — keep all navigation as in-memory UI state, not distinct URLs. This sidesteps the problem completely and matches the "share-link copies current URL" requirement (there's only one URL to share).
- If any deep-linking is ever added later (e.g. `?mode=letters` query param is safe; a path segment is not), use the documented workaround of copying `index.html` to `404.html` at build time so GitHub Pages serves the SPA shell for any unmatched path, and let client-side JS parse `location.pathname`.

**Warning signs:**
Not applicable if routing is avoided (recommended); if a router is added later, symptom is "works when navigating in-app, breaks on refresh or shared link."

**Phase to address:**
Deploy/CI phase (decide up front to avoid path-based routing) and architecture decisions early in planning.

---

### Pitfall 7: localStorage stats silently fail or vanish (private/incognito windows, quota, iOS Safari eviction)

**What goes wrong:**
Several distinct failure modes for the "stats persist across sessions" requirement:
- In Safari private browsing, `localStorage.setItem()` throws `QuotaExceededError` immediately (quota is effectively 0) rather than just failing to persist — an unguarded write crashes that code path.
- iOS Safari enforces a relatively small per-origin quota (historically ~5MB) and, separately, can evict local storage for sites not visited in a while (Intelligent Tracking Prevention-adjacent storage eviction), so "stats persist forever" is not guaranteed on iOS even outside private mode.
- If the browser blocks or clears storage for any reason (corporate device restrictions, "clear on close" settings some parents set for kid-safety, tablet parental controls), the app should not crash — it should just start with empty stats.

**Why it happens:**
Developers test in a normal desktop browser tab which has generous, durable localStorage, and never exercise private-browsing or iOS Safari specifically before shipping.

**How to avoid:**
- Wrap every `localStorage.getItem`/`setItem` call in try/catch; on failure, fall back to an in-memory-only store for the session (stats work during the session but don't persist) rather than throwing and breaking gameplay.
- Feature-detect at startup: attempt a small test write/read/remove; if it fails, show no error to the toddler-facing UI, just silently degrade (maybe a small non-blocking note visible only in Settings/Statistics, e.g. "stats aren't saving on this device").
- Keep the stored payload small (this app's stats — counts, a reaction-time histogram, accuracy — are naturally tiny, well under any realistic quota) so quota itself is unlikely to be the limiting factor; the real risk is *availability* (private mode / eviction), not *size*.

**Warning signs:**
App works perfectly in normal testing; crashes or silently loses all stats when tested in a private/incognito window, or after not being opened for a few weeks on an iPad.

**Phase to address:**
Statistics/persistence phase.

---

### Pitfall 8: Stale localStorage schema breaks on app updates

**What goes wrong:**
This is a solo hobby project that will be iterated on and redeployed directly to production (no staging, per project constraints). If the stats data shape stored in localStorage changes between versions (e.g. adding a new field to the reaction-time histogram, renaming a key, changing the shape from an array to an object), old data already stored in a returning user's browser can be malformed relative to what the new code expects — causing `undefined` errors when rendering the Statistics screen, or corrupting the histogram silently.

**Why it happens:**
There's no migration path considered because there's no backend/database to model this problem explicitly — it's easy to forget that localStorage is itself a small persistent "database" with the same schema-evolution problems, just with no migration tooling by default.

**How to avoid:**
- Store a `schemaVersion` number alongside stats data from day one, even though there's only one version initially.
- On load, if `schemaVersion` doesn't match the current expected version (or is missing/malformed), don't attempt to "upgrade" — just reset stats to a fresh empty state (acceptable for this low-stakes, family-hobby context) rather than crashing the Statistics screen.
- Validate the loaded shape defensively (e.g. check it's the expected object with expected fields) before rendering, treating any mismatch as "no stats yet."

**Warning signs:**
Deploying a change to the stats data shape and then opening Statistics on a browser that already has old-format data throws a rendering error or shows garbage numbers instead of gracefully resetting.

**Phase to address:**
Statistics/persistence phase.

---

### Pitfall 9: Celebration animations that stutter or drop frames on lower-end tablets

**What goes wrong:**
A "delightful, immediate" celebration animation is the core value proposition of this app. If it's implemented with expensive-to-animate CSS properties (`width`, `height`, `top`/`left`, `box-shadow` blur radius, filters) instead of GPU-cheap ones (`transform`, `opacity`), or if it triggers layout thrash (reading `offsetWidth` etc. inside an animation loop), it will visibly stutter on an older iPad, a budget Android tablet, or a hand-me-down laptop — exactly the class of device likely to end up as a toddler's device. A choppy celebration undermines the entire "instant feedback loop" the project's Core Value depends on.

**Why it happens:**
Developers build and test on their own current-generation MacBook/desktop, where even inefficient animations run at 60fps and the problem never surfaces.

**How to avoid:**
- Restrict celebration animations to `transform` (scale/translate/rotate) and `opacity` only — both are compositor-only properties that don't trigger layout or paint.
- Use `requestAnimationFrame` (not `setInterval`/`setTimeout`) for any hand-rolled animation logic, or prefer CSS transitions/animations (browser-optimized) over JS-driven per-frame style writes wherever the effect allows it.
- Avoid `box-shadow`/`filter: blur()` for glow/pearlescent effects at large sizes if targeting lower-end hardware — consider pre-rendered gradient assets or cheaper approximations (a radial-gradient background, not a blurred filter) to achieve the "muted pearlescent" look without the GPU cost of live blur filters.
- Test on at least one genuinely modest device (an older iPad, a budget Android tablet, or Chrome DevTools' CPU throttling set to 4-6x slowdown) before considering an animation "done."
- Keep the DOM subtree for celebration effects small and avoid re-rendering the entire screen on every correct match (e.g. a full-page React-style re-render is unnecessary if only the target letter and celebration layer need to update).

**Warning signs:**
Animation feels buttery on the dev's own laptop but choppy/laggy when the same build is opened on an older iPad or with CPU throttling enabled in DevTools.

**Phase to address:**
Core gameplay/celebration-animation phase; explicitly re-verify during any visual-polish phase.

---

### Pitfall 10: No autoplay-safe handling for the "optional sound" celebration

**What goes wrong:**
Browsers (Chrome, Safari, Firefox) block audio autoplay — including `AudioContext`-based sound and `<audio>.play()` — until a user gesture has occurred on the page. If the very first correct key match happens to be the very first interaction with the page (i.e., the toddler's first physical keypress is *also* the first "gesture" the browser has seen), that's actually fine (a keydown counts as a gesture) — but if sound setup (e.g. creating and priming an `AudioContext`, preloading audio buffers) happens asynchronously and the `.play()` call races ahead of the gesture-unlock, or if the Settings screen tries to preview/toggle sound before any prior interaction, playback can silently fail with no visible error, and the toddler just gets silence — confusing for a feature meant to be a core reward signal.

**Why it happens:**
Autoplay restrictions are a "silent failure" class of bug — no console error in some cases, just a resolved-to-rejected promise from `.play()` that's easy to leave unhandled, and the exact rules differ slightly by browser (Chrome's Media Engagement Index heuristics vs Safari's stricter per-gesture model).

**How to avoid:**
- Only ever call `.play()` (or resume an `AudioContext`) from inside a direct event handler for a user gesture — the Play button tap is a natural, guaranteed-available gesture to use for initializing/priming audio (create the `AudioContext` and do a silent `resume()` there, even before the first celebration).
- Always attach a `.catch()` to `play()` promises; if it rejects, don't retry aggressively or throw — treat it the same as "sound is off" for that session, since visual celebration is the primary feedback channel per the project's design (sound is explicitly optional).
- Don't rely on autoplaying background music or ambient sound at any point — only short, gesture-adjacent SFX tied to actual keypress events, which are inherently gesture-adjacent and therefore reliably allowed.

**Warning signs:**
Sound works in manual click-testing but silently fails to play on the very first match after a fresh page load in certain browsers, or works on desktop Chrome but not Safari/iPad during QA.

**Phase to address:**
Core gameplay/celebration-animation phase (sound implementation).

---

### Pitfall 11: No safeguard against accidental navigation away (browser back/close, address bar, other keys)

**What goes wrong:**
A toddler mashing the keyboard can trigger far more than the intended letter keys: Alt+F4 / Cmd+Q-adjacent combos, Backspace (navigates back in some older browser configs when focus isn't in an input), F11, Tab (shifts focus out of the game to browser chrome), or simply closing the tab. On a shared family laptop (not a locked-down kiosk device), there's no OS-level app-pinning, so the app's only defense is in-browser. tinyfingers.net's approach (per project's own stated inspiration) uses a parent-gated hidden control panel specifically to prevent a toddler from casually exiting.

**Why it happens:**
Developers build and test with their own careful, deliberate keypresses and never simulate the "toddler slams the whole top row" scenario, so the app looks robust until real-world use.

**How to avoid:**
- Add a `beforeunload` handler while in active gameplay to prompt before an accidental tab close (note: modern browsers show a generic browser-controlled message, not custom text, but it still adds friction against instant accidental exit).
- Ensure keyboard focus stays locked to the document/game root (not on any button/link that Tab could reach and Enter could then activate) during gameplay, so Tab-mashing can't focus and "activate" a Quit or browser-level control.
- Since fullscreen is auto-entered on Play (per project requirements) and auto-exits on leaving, treat "auto-exited fullscreen" (Pitfall 2) as the *the* recovery path back to a safe menu state, rather than trying to fully prevent all forms of exit — accept that a toddler can always end the session, and make the recovery (return to menu) graceful rather than trying to trap them in.
- Given the "no on-screen keyboard hint, pure physical hunt-and-peck" design and single-family/trusted-device usage (not a public kiosk), a full parent-gate lock (like tinyfingers.net's hold-2s-or-type-"parent") is a reasonable stretch goal but not required for MVP — flag it as a candidate differentiator/settings feature rather than a hard requirement, matching this project's simpler single-family scope.

**Warning signs:**
Manual toddler-mashing QA (or a sibling/parent simulating one) causes the tab to navigate away, close, or land on an unintended browser surface.

**Phase to address:**
Fullscreen & input-handling phase for the core protections (focus lock, beforeunload); note as a possible Settings-phase enhancement if a parent-gate is added later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skipping `event.repeat` filtering on keydown | Slightly less code initially | Stats corruption, garbled celebration overlap under held keys | Never — toddlers hold keys constantly; must handle from the first input-handling implementation |
| Hardcoding Vite `base: '/repo-name/'` as a string literal | One less config line to think about | Silent breakage if repo is ever renamed/forked | Acceptable for this solo hobby project; document it clearly rather than deriving dynamically |
| No `schemaVersion` on stored stats | Saves a few lines on day one | Painful debugging later when a stats-shape change corrupts existing users' data | Never — add it from the very first localStorage write, it costs nothing |
| Testing only on the developer's own laptop/desktop | Faster iteration | Misses animation jank and Safari-specific fullscreen/audio/storage quirks entirely | Acceptable for early prototyping only; must test on an actual tablet/iPad before considering gameplay "done" |
| No `beforeunload`/focus-lock protections in MVP | Simpler initial build | Toddler can accidentally close/navigate away, frustrating the "playing working" experience | Acceptable to defer *if* explicitly flagged and revisited once real toddler-usage feedback comes in (this is the child's actual use case, so it should be tested for real quickly) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| GitHub Pages (Actions-based deploy) | Leaving repo Pages source set to "Deploy from a branch" while also running a GitHub Actions workflow, causing confusing stale/duplicate deployments | Set repo Settings → Pages → Source to "GitHub Actions" and use the official `actions/upload-pages-artifact` + `actions/deploy-pages` actions exclusively |
| Vite + GitHub Actions caching | Not caching `node_modules`/npm cache, making every push-to-deploy slow (full `npm install` each run) | Use `actions/setup-node@v4` with `cache: 'npm'` pointing at the lockfile, and `npm ci` (not `npm install`) for deterministic, faster installs |
| Fullscreen API + iOS Safari | Assuming `requestFullscreen()` works identically across all Safari versions/devices | Feature-detect (`document.fullscreenEnabled` / `element.requestFullscreen` existence) and gracefully degrade to a "fake fullscreen" (full-viewport fixed layout, no browser API) on unsupported devices rather than a broken Play button |
| Web Audio / `<audio>` autoplay | Assuming a sound will play immediately on app load or on programmatic (non-gesture) triggers like a timer-based hint | Prime/resume audio context inside the Play button's click handler; never attempt autoplay outside a direct gesture handler |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Animating layout-triggering CSS properties (`width`, `top`, `box-shadow` spread) | Smooth on dev machine, stutters on older tablets | Animate only `transform`/`opacity`; use `will-change` sparingly | Breaks first on older/budget tablets — exactly this app's likely real-world device class |
| Full-tree re-render on every keypress (if using a framework, or manual DOM churn) | Increasing input-to-celebration latency as the app grows features (stats tracking, settings) | Keep the hot path (target letter + celebration layer) isolated from less frequently updated UI (menu chrome) | Becomes noticeable once stats-recording logic runs synchronously in the same tick as the celebration render |
| Unbounded reaction-time histogram / stats array growth in localStorage | Slower JSON parse/stringify on load/save as sessions accumulate over months of use | Cap stored history (e.g. keep aggregated buckets/histogram counts, not a raw unbounded array of every keystroke ever) | Unlikely to be severe given tiny stat payloads, but worth designing the histogram as pre-aggregated buckets from day one rather than a raw event log |
| `requestAnimationFrame` loops that keep running when the tab/game is backgrounded or off fullscreen | Battery drain, unnecessary CPU on a shared family device | Pause any rAF loops on `visibilitychange`/`fullscreenchange` exit, resume on return | Matters most on battery-powered tablets left "on" in the background |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing anything sensitive in localStorage (not applicable here, but worth stating) | N/A — this app has no accounts/PII by design | Confirm stats data never includes anything beyond gameplay metrics (accuracy, LPM, reaction time) — no names, no identifying info, consistent with the "no accounts" constraint |
| Share-link feature echoing arbitrary query params into the DOM unsanitized (if ever added) | Reflected XSS if a future feature reads URL params into innerHTML | If any URL param is ever rendered, use `textContent`, never `innerHTML`, for anything derived from the URL |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Requiring exact case/Shift state to match | Toddler doesn't understand Shift; gets "wrong" feedback for a physically-correct key press | Match on `event.code` (physical key) only; ignore Shift/Caps Lock state entirely for correctness |
| Punitive feedback on incorrect key (flashing red, harsh sound, error text) | Directly contradicts the project's explicit "no penalty" requirement; can frustrate/discourage a toddler | Subtle neutral flicker only, exactly as specified — no color/sound signaling "failure" |
| Text-heavy UI (labels, instructions, error messages) | Unusable by a non-reading 2-3 year old | All feedback must be purely visual/audible — icons, color, motion, sound — never rely on text for gameplay-critical information |
| Small tap/click targets in the menu (assuming keyboard-only interaction) | Project explicitly supports a vertical menu list — if a parent or toddler also touches the screen (touch-capable laptop/tablet), small targets fail | Keep menu items large regardless of primary input being physical keyboard, since device mix (touchscreen laptops, tablets with external keyboards) is plausible |
| No visible browser chrome after auto-exiting fullscreen | Toddler or parent left in a disorienting mid-state (game UI visible but not fullscreen, browser tabs/bookmarks bar suddenly present) | On fullscreen exit (any cause), explicitly route to the menu/home screen so the UI context always makes sense post-exit |

## "Looks Done But Isn't" Checklist

- [ ] **Fullscreen entry:** Works on desktop Chrome — verify it also works (or gracefully degrades) on Safari/iPad and that the promise rejection path is handled, not just the happy path.
- [ ] **Fullscreen exit:** "Auto-exit on leaving" is implemented for explicit in-app navigation — verify it also correctly syncs UI state when the *browser* triggers the exit (Escape key, swipe gesture), not just when your own "Quit" button calls `exitFullscreen()`.
- [ ] **Key matching:** Works when typing normally — verify it still matches correctly when the toddler holds Shift, has Caps Lock on, or holds the key down (repeat events don't double-count or flood).
- [ ] **GitHub Pages deploy:** `npm run build` succeeds locally — verify the actual deployed `https://username.github.io/repo/` URL loads assets correctly (not just `vite preview`, which can mask base-path bugs).
- [ ] **Stats persistence:** Stats save and reload correctly in normal browsing — verify behavior in a private/incognito window (should degrade gracefully, not crash) and after simulating a stored-schema change (should reset cleanly, not throw).
- [ ] **Celebration animation:** Looks smooth on the dev's own machine — verify frame rate on an actual older tablet or with DevTools CPU throttling (4-6x) before calling animation work "done."
- [ ] **Sound:** Plays correctly when manually testing with deliberate clicks — verify it also plays (or fails silently, never with a console error visible to the user) on the very first interaction after a fresh page load, across browsers.
- [ ] **Accidental exit protections:** App works when used carefully — verify behavior under toddler-style "mash everything" testing (Tab, Escape, Alt/Cmd combos, Backspace) doesn't strand the app in a broken state.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Vite base-path 404 after deploy | LOW | Fix `base` in `vite.config.ts`, redeploy — no data loss, purely a config fix |
| localStorage schema corruption after a stats-shape change ships | LOW | Bump `schemaVersion`, ship a defensive reset-on-mismatch — affected users just lose historical stats (acceptable for this low-stakes app) |
| Animation jank discovered late on real hardware | MEDIUM | Swap animated properties to `transform`/`opacity`, replace expensive filters/blurs with pre-rendered assets or simpler gradients; may require re-touching celebration visuals |
| Fullscreen/audio broken on a specific browser discovered post-launch | LOW-MEDIUM | Add feature detection + graceful degradation branch for that browser; doesn't require redesign, just defensive branching |
| Toddler-mashing breaks navigation in real-world use (the child finds the exact combo) | LOW | Add targeted `beforeunload`/focus-lock/parent-gate protections reactively once the specific failure mode is observed — this is expected iterative hardening, not a design failure |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Auto-fullscreen-on-load instead of gesture-triggered | Fullscreen & input-handling phase | Manual test: Play button triggers fullscreen; reload/route-change does not attempt fullscreen independently |
| No `fullscreenchange` sync for unrequested exits | Fullscreen & input-handling phase | Manual test: press Escape mid-game, confirm UI returns cleanly to menu state |
| `.key` vs `.code` mismatch / Shift-Caps sensitivity | Fullscreen & input-handling phase (core matching logic) | Manual test: hold Shift and press a letter key, confirm it still matches; test on a non-US layout if available |
| Key-repeat flooding | Fullscreen & input-handling phase | Manual test: hold a key for 2+ seconds, confirm only one match/celebration fires and stats reflect one event |
| Vite `base` misconfiguration | Deploy/CI phase | Deploy a minimal build early and confirm assets load from the live GitHub Pages URL before building real features on top |
| SPA routing 404s on reload | Deploy/CI phase / architecture decision | Confirm the app never introduces path-based routes; all navigation stays in-memory UI state |
| localStorage private-mode / quota failures | Statistics/persistence phase | Manual test: open the app in a private/incognito window, confirm no crash and graceful "stats not saving" behavior |
| Stale localStorage schema on updates | Statistics/persistence phase | Code review: confirm `schemaVersion` exists from the first commit that writes stats |
| Animation jank on lower-end devices | Core gameplay/celebration-animation phase | Test on an actual older tablet/iPad or with DevTools CPU throttling before marking animation work complete |
| Audio autoplay failures | Core gameplay/celebration-animation phase | Manual test: fresh page load → Play → first correct match, confirm sound plays across Chrome and Safari |
| Accidental navigation away | Fullscreen & input-handling phase | Manual "toddler mash" test (rapid random keys including Tab/Escape/Backspace) doesn't strand the app in a broken state |

## Sources

- [MDN: Element.requestFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) — HIGH confidence, official spec docs
- [web.dev: Making Fullscreen Experiences](https://web.dev/articles/fullscreen) — HIGH confidence
- [MDN: Document/Element fullscreenchange event](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event) — HIGH confidence
- [MDN: KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) and [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) — HIGH confidence
- [MDN: KeyboardEvent.repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) — HIGH confidence
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — HIGH confidence
- Community reports on Safari private-browsing localStorage QuotaExceededError (GitHub issues: scottjehl/Device-Bugs#63, DemocracyOS#296; Apple Developer Forums thread 71593) — MEDIUM confidence (community-verified, consistent across multiple independent reports over years)
- [Chromium: Autoplay Policy Design Rationale](https://www.chromium.org/audio-video/autoplay/autoplay-policy-design-rationale/) and [Chrome for Developers: Autoplay policy](https://developer.chrome.com/blog/autoplay) — HIGH confidence
- Vite + GitHub Pages base-path/deploy guidance (GitHub community discussions #59575, #61478, #176242; sitek94/vite-deploy-demo) — MEDIUM-HIGH confidence (widely corroborated pattern, official Vite/GitHub Actions docs align)
- [GitHub actions/cache](https://github.com/actions/cache) and actions/setup-node built-in caching docs — HIGH confidence, official GitHub docs
- [MDN: CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) and [web.dev: Jank busting for better rendering performance](https://web.dev/articles/speed-rendering) — HIGH confidence
- tinyfingers.net (project's own stated design inspiration) — direct site inspection, MEDIUM confidence (inferred from live site content, not documented engineering writeup)

---
*Pitfalls research for: toddler browser typing game (Keyboard Quest)*
*Researched: 2026-08-12*

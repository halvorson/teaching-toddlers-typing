# Phase 2: Menu, Game Modes & Fullscreen - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 9 (5 new, 4 modified)
**Analogs found:** 9 / 9 (100% match rate — all new files have existing analogs in Phase 1 codebase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/router.ts` | utility | request-response | `src/main.ts` | exact |
| `src/menu.ts` | component | event-driven | `src/main.ts` | exact |
| `src/fullscreen.ts` | utility | request-response | `src/celebrate.ts` | exact |
| `src/clipboard.ts` | utility | request-response | `src/celebrate.ts` | exact |
| `src/panels.ts` | component | request-response | `src/game.ts` | exact |
| `src/main.ts` (modified) | orchestrator | event-driven | existing `src/main.ts` | self |
| `src/game.ts` (modified) | service | CRUD | existing `src/game.ts` | self |
| `src/celebrate.ts` (modified) | utility | request-response | existing `src/celebrate.ts` | self |
| `src/style.css` (modified) | config | n/a | existing `src/style.css` | self |

## Pattern Assignments

### `src/router.ts` (utility, request-response)

**Analog:** `src/main.ts` (lines 1-2, import pattern) + `02-RESEARCH.md` Pattern 1

**Purpose:** Read `URLSearchParams` on load to set initial screen; provide `navigateTo()` to update URL via `history.replaceState` without polluting back-button history.

**Imports pattern** (minimal, Type-first approach consistent with Phase 1 codebase):
```typescript
// src/router.ts
export type Screen = 'menu' | 'letters' | 'numbers' | 'alphabet' | 'stats' | 'settings'

const VALID_SCREENS: readonly Screen[] = ['menu', 'letters', 'numbers', 'alphabet', 'stats', 'settings']

export function readInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('screen')
  return (VALID_SCREENS as readonly string[]).includes(requested ?? '')
    ? (requested as Screen)
    : 'menu'
}

export function navigateTo(screen: Screen): void {
  const url = new URL(window.location.href)
  if (screen === 'menu') {
    url.searchParams.delete('screen')
  } else {
    url.searchParams.set('screen', screen)
  }
  history.replaceState(null, '', url)
}
```

**Key decisions from Phase 1 codebase:**
- No external router library (CLAUDE.md directive)
- Use native `URL`/`URLSearchParams`/`history` APIs (already in main.ts import context)
- Type the Screen union explicitly (similar to Phase 1's `string` pools being typed)
- Guard with `VALID_SCREENS` to prevent invalid screen values from routing

---

### `src/menu.ts` (component, event-driven)

**Analog:** `src/main.ts` (lines 14-31, event listener + animation pattern)

**Purpose:** Render 7-row menu list, handle Up/Down/Home/End/Enter keyboard navigation and click activation, manage focus state, integrate parallax background.

**Imports pattern** (follow main.ts style):
```typescript
// src/menu.ts
import { navigateTo, Screen } from './router'
import { enterFullscreen } from './fullscreen'
import { shareCurrentUrl } from './clipboard'

const app = document.querySelector<HTMLDivElement>('#app')!

const ROWS = ['letters', 'numbers', 'alphabet', 'stats', 'settings', 'share', 'quit'] as const
const LABELS: Record<typeof ROWS[number], string> = {
  letters: 'Letters',
  numbers: 'Numbers',
  alphabet: 'Alphabet',
  stats: 'Statistics',
  settings: 'Settings',
  share: 'Share',
  quit: 'Quit',
}
```

**Event listener + focus-move pattern** (analog to main.ts lines 14-31, adapted for menu navigation):
```typescript
let focusIndex = 0
const buttons: HTMLButtonElement[] = []

function focusRow(index: number): void {
  focusIndex = (index + ROWS.length) % ROWS.length
  buttons.forEach((b, i) => b.classList.toggle('focused', i === focusIndex))
  buttons[focusIndex].focus()
}

app.addEventListener('keydown', (e: KeyboardEvent) => {
  // Use event.key for navigation (not event.code — see RESEARCH.md Pitfall 4)
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusRow(focusIndex + 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusRow(focusIndex - 1)
      break
    case 'Home':
      e.preventDefault()
      focusRow(0)
      break
    case 'End':
      e.preventDefault()
      focusRow(ROWS.length - 1)
      break
  }
})

app.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('button')
  if (!button) return
  const index = buttons.indexOf(button)
  if (index === -1) return
  focusRow(index)
  handleRowActivation(ROWS[index])
})
```

**Row activation handler** (modal dispatch per row type):
```typescript
async function handleRowActivation(row: typeof ROWS[number]): Promise<void> {
  if (row === 'letters' || row === 'numbers' || row === 'alphabet') {
    // Gameplay modes: navigate + enter fullscreen (fire-and-forget, Pattern 4)
    navigateTo(row as Screen)
    enterFullscreen(app)
  } else if (row === 'stats' || row === 'settings') {
    // Windowed panels: navigate to panel screen (no fullscreen)
    navigateTo(row as Screen)
  } else if (row === 'share') {
    // Share: clipboard fallback chain (see clipboard.ts)
    const result = await shareCurrentUrl()
    // UI update based on result (see 02-UI-SPEC.md Share flow)
  } else if (row === 'quit') {
    // Close browser/app — parent-operated, no action needed from game
  }
}
```

**Parallax background layers** (CSS patterns — see style.css section below)

---

### `src/fullscreen.ts` (utility, request-response)

**Analog:** `src/celebrate.ts` (lines 12-37, async dynamic import with try-catch fallback)

**Purpose:** Provide fire-and-forget fullscreen entry/exit wrappers that never gate gameplay on promise resolution, handle iOS Safari silent failures gracefully.

**Import + dynamic request pattern** (exact analog to celebrate.ts):
```typescript
// src/fullscreen.ts
/**
 * Request fullscreen without gating gameplay on the promise — swallow rejections
 * because iOS Safari may silently fail (see RESEARCH.md Pitfall 1).
 */
export function enterFullscreen(el: HTMLElement): void {
  el.requestFullscreen?.().catch(() => {
    // Intentionally swallowed. iOS Safari (partial support through 26.3 release)
    // and any other non-supporting browser must never block gameplay.
  })
}

export function exitFullscreenIfActive(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {})
  }
}
```

**Key error-handling pattern from Phase 1:**
- Use optional chaining (`?.()`) to feature-detect the API (same pattern as `scrollTo?.()` if it existed in Phase 1)
- Swallow `.catch(() => {})` for both rejection and unavailability (parallel to celebrate.ts line 34-35)
- Never await fullscreen before rendering — fire-and-forget is the correct model here

---

### `src/clipboard.ts` (utility, request-response)

**Analog:** `src/celebrate.ts` (lines 12-37, async error handling + try-catch fallback chain)

**Purpose:** Share current URL via clipboard with three-tier fallback (navigator.clipboard → execCommand → manual copy input).

**Async error-handling + fallback pattern** (exact analog to celebrate.ts structure, extended):
```typescript
// src/clipboard.ts
export type ShareResult = 'copied' | 'fallback-executed' | 'manual-required'

export async function shareCurrentUrl(): Promise<ShareResult> {
  const url = window.location.href
  
  // Tier 1: Modern Clipboard API
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return 'copied'
    }
  } catch {
    // Fall through to Tier 2 (Pitfall 3: Safari user-activation stricter timing)
  }

  // Tier 2: Legacy execCommand
  try {
    const input = document.createElement('input')
    input.value = url
    input.style.position = 'fixed'
    input.style.top = '-1000px'
    input.style.left = '-1000px'
    document.body.appendChild(input)
    input.focus()
    input.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(input)
    if (ok) return 'fallback-executed'
  } catch {
    // Fall through to Tier 3
  }

  // Tier 3: Manual copy required (caller renders selectable input)
  return 'manual-required'
}
```

**Key error-handling from Phase 1:**
- Try-catch at each tier with no re-throw (celebrate.ts pattern, line 34)
- Return a typed result discriminator for caller to decide UI (similar to how celebrate.ts's swallowed catch means caller gets a silent "celebrate failed but game continues")
- Feature-detect with optional chaining (`navigator.clipboard?.writeText`)

---

### `src/panels.ts` (component, request-response)

**Analog:** `src/game.ts` (lines 33-41, textContent-only rendering + reflow-trick animation restart)

**Purpose:** Render windowed Statistics and Settings stub panels over the menu background.

**textContent-only rendering pattern** (exact from game.ts):
```typescript
// src/panels.ts
export function renderStatsPanel(container: HTMLElement): void {
  container.innerHTML = '' // Clear for re-render if needed
  
  const panel = document.createElement('div')
  panel.className = 'windowed-panel'
  
  const backBtn = document.createElement('button')
  backBtn.className = 'panel-back'
  backBtn.textContent = '← Back' // textContent, never innerHTML
  panel.appendChild(backBtn)
  
  const title = document.createElement('h2')
  title.textContent = 'Statistics' // textContent pattern
  panel.appendChild(title)
  
  const body = document.createElement('p')
  body.textContent = 'Stats tracking isn\'t turned on yet. Come back soon!'
  panel.appendChild(body)
  
  container.appendChild(panel)
}

export function renderSettingsPanel(container: HTMLElement): void {
  // Identical structure, different title/body text
  // (omitted for brevity — same pattern)
}
```

**Animation restart via class manipulation** (exact from game.ts lines 21-23 pattern, adapted):
```typescript
// Inside the panel show/hide transition:
panel.classList.remove('fade-in')
void panel.offsetWidth // Force reflow before re-adding class
panel.classList.add('fade-in')
```

---

### `src/main.ts` (modified, orchestrator, event-driven)

**Analog:** existing `src/main.ts` (lines 1-31)

**Current state:** Hardcoded Letters-mode game loop directly on page load (pickTarget → renderTarget → listen for keydown)

**Needed changes:**
1. Replace hardcoded game mount with router-driven screen mount (Pattern 1 from 02-RESEARCH.md)
2. Register exactly ONE `fullscreenchange` listener for the entire app lifecycle (not per-mode)
3. Implement `returnToMenu()` function callable from both `fullscreenchange` event AND Escape handler (Pitfall 1 mitigation)

**New structure pattern** (preserves existing keydown + animation-restart patterns):
```typescript
// src/main.ts (modified)
import './style.css'
import { readInitialScreen, navigateTo, type Screen } from './router'

const app = document.querySelector<HTMLDivElement>('#app')!

let currentScreen: Screen = readInitialScreen()

function returnToMenu(): void {
  if (currentScreen === 'menu') return // idempotent guard
  unmountCurrentScreen()
  currentScreen = 'menu'
  navigateTo('menu')
  showMenu()
}

// Register the ONE fullscreenchange listener at app boot (not per-mode)
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === null) {
    returnToMenu() // Pitfall 1: handle unexpected exits (iOS Safari, etc.)
  }
})

function mountScreen(screen: Screen): void {
  unmountCurrentScreen()
  currentScreen = screen
  
  switch (screen) {
    case 'menu':
      showMenu()
      break
    case 'letters':
    case 'numbers':
    case 'alphabet':
      showGameScreen(screen)
      break
    case 'stats':
      showStatsPanel()
      break
    case 'settings':
      showSettingsPanel()
      break
  }
}

// On initial load
mountScreen(currentScreen)

// Escape handler for in-game Escape (must call returnToMenu directly, not wait for fullscreenchange)
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && currentScreen !== 'menu') {
    exitFullscreenIfActive() // best-effort, may be no-op
    returnToMenu() // ALWAYS runs — this is the Pitfall 1 fix
  }
})
```

**Key pattern preservation from Phase 1:**
- Event listener with early `event.repeat` guard (becomes gamescreen-specific handler)
- Class manipulation for animation restart (stays in game/celebrate modules)
- textContent-only DOM creation (stays in all components)

---

### `src/game.ts` (modified, service, CRUD)

**Analog:** existing `src/game.ts` (lines 1-42, pool-based selection + no-repeat + physical-key mapping)

**Current state:** LETTERS pool, pickTarget(exclude), targetCode(letter) → "Key{letter}"

**Needed changes:**
1. Add DIGITS pool (0-9) and nextInSequence() for Alphabet mode
2. Generalize pickTarget → pickRandom(pool, exclude) to work for both LETTERS and DIGITS
3. Add digitCode() function returning BOTH Digit0-9 AND Numpad0-9 (Pitfall 2 mitigation)
4. Keep letterCode() for consistency (returns ["Key{letter}"])

**Generalized pool + selection pattern** (extends existing freeze/filter model):
```typescript
// src/game.ts (modified)
export const LETTERS: readonly string[] = Object.freeze([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
])
export const DIGITS: readonly string[] = Object.freeze(['0','1','2','3','4','5','6','7','8','9'])

/**
 * Random no-repeat selection — used by Letters and Numbers modes.
 * Exact same logic as Phase 1's pickTarget(), just renamed + pool-parameterized.
 */
export function pickRandom(pool: readonly string[], exclude?: string): string {
  const candidates = exclude === undefined ? pool : pool.filter((c) => c !== exclude)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Sequential wraparound selection — used by Alphabet mode.
 * Returns pool[0] on first call (current: null); wraps Z→A on loop.
 */
export function nextInSequence(pool: readonly string[], current: string | null): string {
  if (current === null) return pool[0]
  const index = pool.indexOf(current)
  return pool[(index + 1) % pool.length]
}

/**
 * Map uppercase letter to physical-key code. Returns array to match digitCode() signature.
 */
export function letterCode(letter: string): readonly string[] {
  return [`Key${letter}`]
}

/**
 * Map digit to physical-key codes. Returns BOTH top-row and numpad equivalents
 * so "the 5" (either row) counts as correct (Pitfall 2 mitigation).
 */
export function digitCode(digit: string): readonly string[] {
  return [`Digit${digit}`, `Numpad${digit}`]
}

/**
 * Render target via textContent + opacity-crossfade restart (unchanged from Phase 1).
 */
export function renderTarget(el: HTMLElement, target: string): void {
  el.style.opacity = '0'
  el.textContent = target
  void el.offsetWidth
  el.style.opacity = '1'
}

/**
 * Helper: get acceptable codes for current target based on mode.
 * Called from game screen's keydown handler.
 */
export function acceptableCodes(target: string, mode: 'letters' | 'numbers' | 'alphabet'): readonly string[] {
  if (mode === 'numbers') {
    return digitCode(target)
  } else {
    return letterCode(target)
  }
}
```

**Deprecated/renamed functions for migration clarity:**
```typescript
// Keep Phase 1's pickTarget as an alias to pickRandom(LETTERS, exclude) for backward compatibility
// during the transition, but mark it as deprecated in comments
/** @deprecated Use pickRandom(LETTERS, exclude) instead */
export function pickTarget(exclude?: string): string {
  return pickRandom(LETTERS, exclude)
}

/** @deprecated Use letterCode() instead */
export function targetCode(letter: string): string {
  return letterCode(letter)[0]
}
```

---

### `src/celebrate.ts` (modified, utility, request-response)

**Analog:** existing `src/celebrate.ts` (lines 12-37, async dynamic import with options)

**Current state:** celebrate(anchor) fires single burst with hardcoded particleCount/spread/startVelocity/ticks

**Needed changes:**
1. Parameterize celebrate() to accept an optional options override (instead of anchor-only)
2. Add celebrateAlphabetComplete() that calls celebrate() 3 times at 0ms/120ms/240ms from left/center/right (MODE-04 / 02-UI-SPEC)

**Parameterized options pattern** (extends Phase 1's async/try-catch):
```typescript
// src/celebrate.ts (modified)
export const CONFETTI_COLORS = ['#8B7FFF', '#4FD1C5', '#6E7FFF', '#B48CE0', '#3FAE8A']

interface BurstOptions {
  particleCount: number
  spread: number
  startVelocity: number
  ticks: number
  gravity: number
  scalar: number
  origin: { x: number; y: number }
}

async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({ ...opts, colors: CONFETTI_COLORS })
  } catch {
    // Decorative — swallow load failures (unchanged from Phase 1)
  }
}

/**
 * Original celebrate() — backward-compatible for Phase 1 game screen.
 * Fires a single burst anchored to the target.
 */
export async function celebrate(anchor: DOMRect): Promise<void> {
  await fireBurst({
    particleCount: 40,
    spread: 60,
    startVelocity: 25,
    ticks: 150,
    gravity: 1,
    scalar: 0.8,
    origin: {
      x: (anchor.left + anchor.width / 2) / window.innerWidth,
      y: (anchor.top + anchor.height / 2) / window.innerHeight,
    },
  })
}

/**
 * Alphabet Z-completion: three sequential bursts from left/center/right.
 * Exact parameters per 02-UI-SPEC.md (MODE-04).
 */
export async function celebrateAlphabetComplete(): Promise<void> {
  const positions = [0.2, 0.5, 0.8] // normalized x: left / center / right
  const delays = [0, 120, 240]

  for (let i = 0; i < positions.length; i++) {
    setTimeout(() => {
      fireBurst({
        particleCount: 120,
        spread: 100,
        startVelocity: 35,
        ticks: 200,
        gravity: 1,
        scalar: 1.1,
        origin: { x: positions[i], y: 0.5 },
      })
    }, delays[i])
  }
}
```

**Key pattern preservation from Phase 1:**
- Dynamic `import('canvas-confetti')` (line 20 pattern)
- `prefers-reduced-motion` guard at function entry (line 17 pattern)
- Try-catch with no re-throw (line 34 pattern)
- Parallel call structure for mode-specific celebration

---

### `src/style.css` (modified, config)

**Analog:** existing `src/style.css` (lines 1-81, custom properties + keyframe animations)

**Current state:** Color tokens, Display typography, correct-pulse/incorrect-flash keyframes for Phase 1 game screen

**Needed additions:**

**1. Menu styling** (extends existing custom-property model):
```css
/* Add to existing :root */
:root {
  /* Existing tokens from Phase 1 — unchanged */
  --color-bg: #0A0E1B;
  --color-surface: #1E2340;
  --color-accent: #8B7FFF;
  --color-fg: #F3F1FA;
  --color-destructive: #C4607A;
}

#app.menu-open {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.menu-container {
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  opacity: 1;
  transition: opacity 100ms ease-out;
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-group.secondary {
  margin-top: 24px;
}

.menu-group.quit {
  margin-top: 32px;
}

.menu-item {
  min-height: 56px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  font-size: clamp(20px, 4vh, 28px);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-fg);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
  transition: color 100ms ease-out;
}

.menu-item.focused {
  color: var(--color-accent);
}

.menu-item.focused::after {
  content: '';
  display: block;
  height: 2px;
  margin-top: 4px;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}

.share-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  stroke-width: 2;
  color: inherit; /* inherits from menu-item */
}
```

**2. Parallax background layers** (new full-screen decorative layers):
```css
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.bg-layer--base {
  background: var(--color-bg);
}

.bg-layer--blob-a {
  background:
    radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-surface) 10%, transparent), transparent 60%),
    radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--color-surface) 10%, transparent), transparent 60%);
  animation: drift-a 40s ease-in-out infinite alternate;
}

.bg-layer--blob-b {
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 55%);
  animation: drift-b 65s ease-in-out infinite alternate;
}

@keyframes drift-a {
  to { transform: translate(4%, -3%); }
}

@keyframes drift-b {
  to { transform: translate(-3%, 4%); }
}

@media (prefers-reduced-motion: reduce) {
  .bg-layer--blob-a, .bg-layer--blob-b {
    animation: none;
  }
}
```

**3. Windowed panel styling** (over the menu background):
```css
.windowed-panel {
  max-width: 480px;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 32px;
  margin: 0 auto;
  opacity: 1;
  transition: opacity 100ms ease-out;
}

.panel-back {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-fg);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  transition: color 100ms ease-out;
}

.panel-back:hover, .panel-back:focus {
  color: var(--color-accent);
}

.windowed-panel h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-fg);
  margin: 16px 0;
}

.windowed-panel p {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-fg);
  margin: 0;
}
```

**4. Game screen opacity-crossfade** (preserves Phase 1 pattern for mode screens):
```css
.game-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
  opacity: 1;
  transition: opacity 100ms ease-out;
}

.game-screen.hidden {
  opacity: 0;
  pointer-events: none;
}
```

**5. Preserve all Phase 1 game-screen keyframes** (unchanged):
```css
/* From Phase 1 — no changes */
#target {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  font-size: clamp(140px, min(45vh, 40vw), 560px);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-fg);
  transition: opacity 100ms ease-out;
}

#target.correct-pulse {
  animation: correct-pulse 450ms ease-out;
}

@keyframes correct-pulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  40% {
    transform: scale(1.15);
    filter: drop-shadow(0 0 24px var(--color-accent));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
}

/* ... (rest of Phase 1 styles unchanged) ... */
```

---

## Shared Patterns

### Animation Restart via Class Manipulation
**Source:** `src/game.ts` (lines 21-23) + `src/main.ts` (lines 27-29)
**Apply to:** All screen transitions, target renders, and animation restarts (menu focus changes, game target changes, celebration triggers)

```typescript
element.classList.remove('animation-class')
void element.offsetWidth // Force reflow — browser must register the removal
element.classList.add('animation-class')
```

**Why:** Removing and re-adding the class triggers the animation from its start state; the `offsetWidth` read forces the browser to flush pending style changes so the removal registers before the re-add. Without the reflow, the two operations coalesce and no animation plays.

---

### Event Listener with Early Guard
**Source:** `src/main.ts` (line 15, `event.repeat` guard)
**Apply to:** All keydown handlers (gameplay, menu navigation, panel navigation)

```typescript
document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.repeat) return // Ignore auto-repeated keydowns
  // ... rest of handler
})
```

**Why:** OS-level auto-repeat (holding a key down) fires many keydown events; for letter/digit matching, only the first press matters. For menu navigation (Arrow keys), repeat confuses focus state. This guard is defensive correctness, not just optimization.

---

### textContent-Only DOM Rendering
**Source:** `src/game.ts` (line 35)
**Apply to:** All dynamic text insertion (menu labels, panel content, share feedback, error messages)

```typescript
element.textContent = 'some string' // Safe — no HTML interpretation
// Never use:
// element.innerHTML = 'some string' // Potential XSS vector
```

**Why:** `textContent` treats all input as literal text; even if a future phase adds dynamic content (e.g. user-entered share message), `textContent` is the safe default. Phase 1 established this pattern; maintain it throughout Phase 2.

---

### Async Try-Catch with Swallowed Fallback
**Source:** `src/celebrate.ts` (lines 19-36)
**Apply to:** All async operations that are decorative/optional (celebrate, fullscreen entry/exit, clipboard operations)

```typescript
try {
  await someAsyncOperation()
  return 'success'
} catch {
  // Swallow the error — the core feature (gameplay) never depends on this
  return 'fallback-or-silent-fail'
}
```

**Why:** `canvas-confetti` is decorative; clipboard is a nice-to-have share feature; fullscreen makes play larger but isn't required. Each must fail silently without blocking gameplay. This pattern isolates the error handling in one place per operation, not scattered across callers.

---

### Event.key vs. Event.Code
**Source:** `02-RESEARCH.md` Pitfall 4 + Phase 1 CORE-02
**Two rules, not one:**

1. **Gameplay letter/digit matching** → `event.code` (physical key position, layout-independent)
   ```typescript
   if (event.code === 'KeyA') { /* correct match */ }
   if (event.code === 'Digit5') { /* correct match */ }
   ```

2. **UI navigation (menu Arrow/Home/End/Enter, in-game Escape)** → `event.key` (semantic key name, already layout-independent for action keys)
   ```typescript
   if (event.key === 'ArrowDown') { /* move focus down */ }
   if (event.key === 'Escape') { /* exit */ }
   ```

**Why:** The `.code` rule protects against layout shifts (French AZERTY keyboard, for example) — critical for gameplay. Menu navigation doesn't have this problem (ArrowDown is ArrowDown on any layout). Conflating them risks subtle bugs (Pitfall 4).

---

## No Analog Found

No new file types or patterns emerge in Phase 2 that lack Phase 1 precedents. Every file role (utility, component, orchestrator, service, config) and every data flow (event-driven, request-response, CRUD) has an existing model:

- Routers / utilities: `celebrate.ts` (async with fallback)
- Components: `game.ts` (textContent rendering + class manipulation)
- Event listeners: `main.ts` (keydown + animation restart)
- CSS animations: `style.css` (keyframes + reduced-motion guards)

This is a restructuring phase using established patterns, not a new-technology phase.

---

## Metadata

**Analog search scope:** `/Users/michael/Coding/teaching-toddlers-typing/src/` (4 files: main.ts, game.ts, celebrate.ts, style.css)
**Files scanned:** 4
**Pattern extraction date:** 2026-08-13
**Confidence:** HIGH — all analogs are from Phase 1 codebase, patterns are directly precedented


/**
 * Lazy-loaded confetti bursts. canvas-confetti is loaded via a dynamic
 * import() inside the shared fireBurst helper below, so it costs nothing on
 * the initial page load and is code-split into its own chunk. fireBurst is
 * also the module's single reduced-motion guard site and single
 * viewport-scaling site — every present and future caller inherits the
 * prefers-reduced-motion respect and the clamped viewport-scale factor
 * without having to remember either one, whether that caller is the
 * ordinary per-match celebration or the bigger Alphabet-mode Z-completion
 * celebration.
 */

/** Muted jewel-tone palette locked in 01-UI-SPEC.md, shared by every burst
 * this module fires — the ordinary per-match celebration and the bigger
 * Alphabet-mode Z-completion celebration alike. */
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

/**
 * Clamped viewport-scale factor for burst launch velocity (CELEB-01,
 * CELEB-02). Computed fresh on every call — no caching, no resize listener
 * — so a fullscreen transition is picked up on the very next burst with
 * zero lifecycle state to clean up. The geometric mean of the width and
 * height ratios against a 1280x800 baseline means a window that grows in
 * only one dimension scales more gently than one that grows in both. The
 * clamp keeps small windows at no less than 80% of Phase 1's shipped
 * tuning and large/fullscreen displays at no more than 250% of it.
 */
function viewportScaleFactor(): number {
  const widthRatio = window.innerWidth / 1280
  const heightRatio = window.innerHeight / 800
  const factor = Math.sqrt(widthRatio * heightRatio)
  return Math.min(2.5, Math.max(0.8, factor))
}

/**
 * Bumped by cancelPendingCelebration() so any fireBurst() call whose
 * dynamic-import await is still in flight can detect it was cancelled and
 * skip firing (WR-03) — the same "never fire on a screen the player has
 * already left" guarantee celebrateAlphabetComplete()'s timer-id tracking
 * gives that path, extended to the ordinary per-match burst's import race.
 */
let burstGeneration = 0

/**
 * Cancels any celebrate() burst whose dynamic-import await has not yet
 * resolved. Call this from a screen's unmount alongside clearing any
 * scheduled celebrateAlphabetComplete() timer ids, so neither path can fire
 * confetti after the screen that triggered it has already been torn down.
 */
export function cancelPendingCelebration(): void {
  burstGeneration++
}

/**
 * The module's single dynamic-import site, single reduced-motion guard
 * site, and single viewport-scaling site. Every caller — celebrate() and
 * celebrateAlphabetComplete() alike — goes through this function, so none
 * of them can forget any of these three concerns.
 */
async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const myGeneration = burstGeneration
  try {
    const { default: confetti } = await import('canvas-confetti')
    if (myGeneration !== burstGeneration) return // cancelled while the import was in flight
    confetti({
      ...opts,
      startVelocity: opts.startVelocity * viewportScaleFactor(),
      colors: CONFETTI_COLORS,
    })
  } catch {
    // Confetti is decorative — swallow load failures so the core game keeps working.
  }
}

/**
 * The ordinary per-match celebration (unchanged from Phase 1): one burst
 * anchored to the target element's bounding rect.
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
 * Alphabet-mode Z-completion celebration (MODE-04, D-12): three sequential
 * bursts from left/center/right screen positions at 0ms/120ms/240ms, each
 * noticeably bigger than the ordinary per-match burst. This is the exact
 * same confetti call as celebrate() above with larger numbers — no second
 * animation library, no second particle system, no new colour values. Fires
 * and returns immediately (does not await anything) so it never delays the
 * target swap that has already happened by the time the caller invokes this.
 * Returns the three scheduled timer ids so a caller that navigates away
 * before all three bursts have fired (e.g. Escape/auto-quit) can cancel the
 * ones still pending instead of letting them fire on a screen the player
 * has already left.
 */
export function celebrateAlphabetComplete(): number[] {
  const positions = [0.2, 0.5, 0.8] // normalized x fractions: left / center / right
  const delays = [0, 120, 240]

  return positions.map((x, i) =>
    window.setTimeout(() => {
      void fireBurst({
        particleCount: 120,
        spread: 100,
        startVelocity: 35,
        ticks: 200,
        gravity: 1,
        scalar: 1.1,
        origin: { x, y: 0.5 },
      })
    }, delays[i]),
  )
}

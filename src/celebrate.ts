/**
 * Lazy-loaded confetti bursts. canvas-confetti is loaded via a dynamic
 * import() inside the shared fireBurst helper below, so it costs nothing on
 * the initial page load and is code-split into its own chunk. fireBurst is
 * also the module's single reduced-motion guard site — every present and
 * future caller inherits the prefers-reduced-motion respect without having
 * to remember it, whether that caller is the ordinary per-match celebration
 * or the bigger Alphabet-mode Z-completion celebration.
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
 * The module's single dynamic-import site and single reduced-motion guard
 * site. Every caller — celebrate() and celebrateAlphabetComplete() alike —
 * goes through this function, so neither one can forget either concern.
 */
async function fireBurst(opts: BurstOptions): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({ ...opts, colors: CONFETTI_COLORS })
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
 */
export function celebrateAlphabetComplete(): void {
  const positions = [0.2, 0.5, 0.8] // normalized x fractions: left / center / right
  const delays = [0, 120, 240]

  positions.forEach((x, i) => {
    setTimeout(() => {
      void fireBurst({
        particleCount: 120,
        spread: 100,
        startVelocity: 35,
        ticks: 200,
        gravity: 1,
        scalar: 1.1,
        origin: { x, y: 0.5 },
      })
    }, delays[i])
  })
}

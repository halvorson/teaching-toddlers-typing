/**
 * Lazy-loaded confetti burst anchored to the target letter. canvas-confetti
 * is loaded via a dynamic import() inside celebrate() so it costs nothing on
 * the initial page load and is code-split into its own chunk.
 */

/** Muted jewel-tone palette locked in 01-UI-SPEC.md, shared with any future
 * Alphabet-completion burst (Phase 2) so the celebration vocabulary stays
 * consistent. */
export const CONFETTI_COLORS = ['#8B7FFF', '#4FD1C5', '#6E7FFF', '#B48CE0', '#3FAE8A']

export async function celebrate(anchor: DOMRect): Promise<void> {
  // Respect the OS-level reduced-motion preference for every caller — this is
  // the module's only exported entry point, so enforcing the guard here (not
  // at each call site) keeps it from being forgotten by future callers (e.g.
  // a planned Phase 2 Alphabet-mode Z-completion burst).
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      particleCount: 40,
      spread: 60,
      startVelocity: 25,
      ticks: 150,
      gravity: 1,
      scalar: 0.8,
      colors: CONFETTI_COLORS,
      origin: {
        x: (anchor.left + anchor.width / 2) / window.innerWidth,
        y: (anchor.top + anchor.height / 2) / window.innerHeight,
      },
    })
  } catch {
    // Confetti is decorative — swallow load failures so the core game keeps working.
  }
}

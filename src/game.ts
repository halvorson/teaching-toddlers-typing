/**
 * Generalized game-mode primitives: pool-parameterized random selection,
 * physical-key code mapping (letters vs. digits), and safe (textContent-only)
 * DOM rendering. Phase 1's Letters-only single-pool selection and code
 * mapping are replaced by pool-and-mode-aware equivalents so Letters, Numbers
 * and (later) Alphabet mode all go through the same code.
 */

import type { GameMode } from './game-screen'

export const LETTERS: readonly string[] = Object.freeze([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
])

/**
 * Selects a random member of `pool`. When `exclude` is supplied, the excluded
 * member is filtered out of the candidate pool before indexing, so it is
 * structurally impossible to return it (no retry loop).
 */
export function pickRandom(pool: readonly string[], exclude?: string): string {
  const candidates = exclude === undefined ? pool : pool.filter((member) => member !== exclude)
  const index = Math.floor(Math.random() * candidates.length)
  return candidates[index]
}

/** Maps an uppercase A-Z letter to its physical-key `KeyboardEvent.code`
 * identifier. Returns an array (a single element) so it shares a signature
 * with the digit code-mapping function Task 2 adds. */
export function letterCode(letter: string): readonly string[] {
  return [`Key${letter}`]
}

/**
 * The single function every mode's match check goes through. For this task
 * every mode matches against the alphabetic-row code; Task 2 adds the
 * digit-mode branch (and starts using `mode`).
 */
export function acceptableCodes(target: string, _mode: GameMode): readonly string[] {
  return letterCode(target)
}

/**
 * Renders the target character via textContent (never an HTML string) and
 * re-triggers the 100ms opacity crossfade declared in style.css by dipping
 * opacity to 0, swapping the text, then restoring opacity to 1 so the
 * element's own `transition: opacity 100ms ease-out` animates the change.
 */
export function renderTarget(el: HTMLElement, target: string): void {
  el.style.opacity = '0'
  el.textContent = target
  // Force a reflow so the browser registers the opacity: 0 state before it
  // is set back to 1 — otherwise the two assignments would coalesce and no
  // transition would play.
  void el.offsetWidth
  el.style.opacity = '1'
}

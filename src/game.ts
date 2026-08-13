/**
 * Core Letters-mode state: a fixed A-Z target pool, no-repeat random selection,
 * physical-key code mapping, and safe (textContent-only) DOM rendering.
 */

export const LETTERS: readonly string[] = Object.freeze([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
])

/**
 * Selects a random letter from LETTERS. When `exclude` is supplied, the
 * excluded letter is filtered out of the candidate pool before indexing, so
 * it is structurally impossible to return it (no retry loop).
 */
export function pickTarget(exclude?: string): string {
  const pool = exclude === undefined ? LETTERS : LETTERS.filter((letter) => letter !== exclude)
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

/** Maps an uppercase A-Z letter to its physical-key `KeyboardEvent.code` identifier. */
export function targetCode(letter: string): string {
  return `Key${letter}`
}

/**
 * Renders the target letter via textContent (never innerHTML) and
 * re-triggers the 100ms opacity crossfade declared in style.css by dipping
 * opacity to 0, swapping the text, then restoring opacity to 1 so the
 * element's own `transition: opacity 100ms ease-out` animates the change.
 */
export function renderTarget(el: HTMLElement, letter: string): void {
  el.style.opacity = '0'
  el.textContent = letter
  // Force a reflow so the browser registers the opacity: 0 state before it
  // is set back to 1 — otherwise the two assignments would coalesce and no
  // transition would play.
  void el.offsetWidth
  el.style.opacity = '1'
}

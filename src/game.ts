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

/** Single-digit pool 0-9 for Numbers mode. */
export const DIGITS = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

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

/**
 * Sequential wraparound selection — used by Alphabet mode. Passing
 * `current: null` (the mode's opening target) returns the pool's first
 * member, which is how Alphabet mode always opens on A. Every other call
 * locates the current member by index and returns the member one position
 * later, wrapping the last position back to the first with a modulo. The
 * wraparound is unconditional — after the last member it returns the first
 * with no special casing — so a caller that needs to detect "the sequence
 * just completed" must test the *current* target before calling this, not
 * the value this function returns.
 */
export function nextInSequence(pool: readonly string[], current: string | null): string {
  if (current === null) return pool[0]
  const index = pool.indexOf(current)
  return pool[(index + 1) % pool.length]
}

/** Maps an uppercase A-Z letter to its physical-key `KeyboardEvent.code`
 * identifier. Returns an array (a single element) so it shares a signature
 * with `digitCode`. */
export function letterCode(letter: string): readonly string[] {
  return [`Key${letter}`]
}

/**
 * Maps a digit to the physical-key codes that should count as a match: the
 * numeric row's `Digit${n}` identifier and the numeric keypad's `Numpad${n}`
 * identifier. The alphabetic row's `Key` prefix must never be applied to a
 * digit — that combination is a string no real keyboard emits (verified
 * against MDN's Keyboard_event_code_values, see 02-RESEARCH.md Pitfall 2).
 * Accepting the keypad alongside the numeric row is a deliberate forgiving
 * choice (02-RESEARCH.md Assumptions Log A1) — an unexpected keypad press
 * from a hunting toddler is harmless to accept.
 */
export function digitCode(digit: string): readonly string[] {
  return [`Digit${digit}`, `Numpad${digit}`]
}

/**
 * The single function every mode's match check goes through. Numbers mode
 * matches against the digit-row/keypad codes; every other mode matches
 * against the alphabetic-row code.
 */
export function acceptableCodes(target: string, mode: GameMode): readonly string[] {
  if (mode === 'numbers') {
    return digitCode(target)
  } else {
    return letterCode(target)
  }
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

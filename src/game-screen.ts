/**
 * Mode-parameterized gameplay screen: renders the target character, matches
 * the physical key press against it, fires the celebration/neutral-flicker
 * feedback, and hands control back to the caller on Escape.
 */

import { DIGITS, LETTERS, acceptableCodes, nextInSequence, pickRandom, renderTarget } from './game'
import { cancelPendingCelebration, celebrate, celebrateAlphabetComplete } from './celebrate'
import { addTrailStar, clearTrail, mountTrailLayer, unmountTrailLayer } from './trail'
import { readSettings } from './settings-store'

/** The three playable modes. Declared here (not in game.ts) because the
 * game screen is the module that owns "what a mode is" from the player's
 * perspective; game.ts imports this type for its own mode-aware functions. */
export type GameMode = 'letters' | 'numbers' | 'alphabet'

let keydownListener: ((event: KeyboardEvent) => void) | null = null
let mountedContainer: HTMLElement | null = null
let currentTarget: string | null = null
let pendingCelebrationTimers: number[] = []

/** Returns the character pool for `mode`: digits for Numbers, letters for
 * every other mode. Used for both the initial target and every subsequent
 * pick, so the no-immediate-repeat guarantee holds identically for every
 * pool through the same code (MODE-01, MODE-02). */
function poolFor(mode: GameMode): readonly string[] {
  return mode === 'numbers' ? DIGITS : LETTERS
}

/** Selects the next target for `mode` given the current target (`current` is
 * `null` on the mode's opening target). Alphabet mode always advances
 * sequentially through the same helper that produces its opening target, so
 * there is no separate first-render branch (MODE-03); every other mode
 * selects randomly with no immediate repeat, unchanged from Phase 1. This is
 * the single selection call site every mount and every advance goes through. */
function selectNext(mode: GameMode, current: string | null): string {
  if (mode === 'alphabet') {
    return nextInSequence(LETTERS, current)
  }
  return pickRandom(poolFor(mode), current ?? undefined)
}

/**
 * Mounts the gameplay screen into `container`: clears it, creates the
 * `#target` span, picks and renders the first target, and registers the
 * single keydown listener that drives matching, celebration and quitting.
 * Defensively unmounts any prior mount first (idempotent — a no-op if
 * nothing was mounted) so this module never depends solely on callers
 * remembering to unmount before mounting again; without this, a second
 * call would leak a duplicate document-level keydown listener and process
 * every keypress twice.
 */
export function mountGameScreen(container: HTMLElement, mode: GameMode, onQuit: () => void): void {
  unmountGameScreen()
  mountTrailLayer()
  container.replaceChildren()

  const target = document.createElement('span')
  target.id = 'target'
  container.appendChild(target)

  const openingTarget = selectNext(mode, currentTarget)
  currentTarget = openingTarget
  renderTarget(target, currentTarget)
  mountedContainer = container

  const handler = (event: KeyboardEvent): void => {
    if (event.repeat) return // CORE-04: ignore auto-repeated keydowns entirely

    if (event.key === 'Escape') {
      onQuit()
      return
    }

    if (currentTarget !== null && acceptableCodes(currentTarget, mode).includes(event.code)) {
      // The Z-completion test must run against the target being LEFT, before
      // selectNext advances it — nextInSequence wraps unconditionally, so by
      // the time selectNext has returned, currentTarget is already 'A' and
      // testing afterwards would either never fire or fire on the wrong
      // letter (MODE-04).
      if (mode === 'alphabet' && currentTarget === LETTERS[LETTERS.length - 1]) {
        pendingCelebrationTimers = celebrateAlphabetComplete()
      } else {
        void celebrate(target.getBoundingClientRect())
      }

      currentTarget = selectNext(mode, currentTarget)
      renderTarget(target, currentTarget)

      target.classList.remove('correct-pulse')
      void target.offsetWidth
      target.classList.add('correct-pulse')
      addTrailStar()
    } else {
      // Read fresh on every wrong key press (not cached at mount) so
      // flipping the toggle in Settings and returning to a mode takes
      // effect immediately.
      if (readSettings().resetTrailOnMistake) {
        clearTrail()
      }

      container.classList.remove('incorrect-flash')
      void container.offsetWidth
      container.classList.add('incorrect-flash')
    }
  }

  keydownListener = handler
  document.addEventListener('keydown', handler)
}

/** Removes the keydown listener registered by `mountGameScreen`, cancels any
 * still-pending Alphabet-completion celebration timers so a burst can never
 * fire on a screen the player has already left, empties the container, and
 * drops module state. */
export function unmountGameScreen(): void {
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener)
    keydownListener = null
  }
  pendingCelebrationTimers.forEach((id) => clearTimeout(id))
  pendingCelebrationTimers = []
  cancelPendingCelebration()
  if (mountedContainer) {
    mountedContainer.replaceChildren()
    mountedContainer = null
  }
  currentTarget = null
  unmountTrailLayer()
}

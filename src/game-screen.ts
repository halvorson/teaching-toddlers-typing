/**
 * Mode-parameterized gameplay screen: renders the target character, matches
 * the physical key press against it, fires the celebration/neutral-flicker
 * feedback, and hands control back to the caller on Escape.
 */

import { LETTERS, acceptableCodes, pickRandom, renderTarget } from './game'
import { celebrate } from './celebrate'

/** The three playable modes. Declared here (not in game.ts) because the
 * game screen is the module that owns "what a mode is" from the player's
 * perspective; game.ts imports this type for its own mode-aware functions. */
export type GameMode = 'letters' | 'numbers' | 'alphabet'

let keydownListener: ((event: KeyboardEvent) => void) | null = null
let mountedContainer: HTMLElement | null = null
let currentTarget: string | null = null

/**
 * Mounts the gameplay screen into `container`: clears it, creates the
 * `#target` span, picks and renders the first target, and registers the
 * single keydown listener that drives matching, celebration and quitting.
 */
export function mountGameScreen(container: HTMLElement, mode: GameMode, onQuit: () => void): void {
  container.replaceChildren()

  const target = document.createElement('span')
  target.id = 'target'
  container.appendChild(target)

  currentTarget = pickRandom(LETTERS)
  renderTarget(target, currentTarget)
  mountedContainer = container

  const handler = (event: KeyboardEvent): void => {
    if (event.repeat) return // CORE-04: ignore auto-repeated keydowns entirely

    if (event.key === 'Escape') {
      onQuit()
      return
    }

    if (currentTarget !== null && acceptableCodes(currentTarget, mode).includes(event.code)) {
      currentTarget = pickRandom(LETTERS, currentTarget)
      renderTarget(target, currentTarget)

      target.classList.remove('correct-pulse')
      void target.offsetWidth
      target.classList.add('correct-pulse')

      void celebrate(target.getBoundingClientRect())
    } else {
      container.classList.remove('incorrect-flash')
      void container.offsetWidth
      container.classList.add('incorrect-flash')
    }
  }

  keydownListener = handler
  document.addEventListener('keydown', handler)
}

/** Removes the keydown listener registered by `mountGameScreen`, empties the
 * container, and drops module state. */
export function unmountGameScreen(): void {
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener)
    keydownListener = null
  }
  if (mountedContainer) {
    mountedContainer.replaceChildren()
    mountedContainer = null
  }
  currentTarget = null
}

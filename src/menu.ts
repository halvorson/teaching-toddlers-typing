/**
 * Home menu: renders the seven-row list (Letters, Numbers, Alphabet,
 * Statistics, Settings, Share, Quit) as real `<button>` elements — grouping
 * gameplay rows, utility rows and Quit into their own gap-carrying groups —
 * and dispatches row activation to the caller's handlers. Adds roving-focus
 * keyboard navigation (Arrow/Home/End, wraparound) and a unified
 * hover-or-focus selection indicator, both driven through the single
 * `focusRow` function so the keyboard state, the mouse state and the visual
 * `focused` class can never disagree.
 */

import type { GameMode } from './game-screen'

export type MenuRow = 'letters' | 'numbers' | 'alphabet' | 'stats' | 'settings' | 'share' | 'quit'

export const MENU_ROWS: readonly MenuRow[] = Object.freeze([
  'letters',
  'numbers',
  'alphabet',
  'stats',
  'settings',
  'share',
  'quit',
])

export const MENU_LABELS: Readonly<Record<MenuRow, string>> = Object.freeze({
  letters: 'Letters',
  numbers: 'Numbers',
  alphabet: 'Alphabet',
  stats: 'Statistics',
  settings: 'Settings',
  share: 'Share',
  quit: 'Quit',
})

const GAMEPLAY_ROWS: readonly MenuRow[] = Object.freeze(['letters', 'numbers', 'alphabet'])

export interface MenuHandlers {
  onLaunchMode(mode: GameMode): void
  onQuit(): void
}

let clickListener: ((event: MouseEvent) => void) | null = null
let keydownListener: ((event: KeyboardEvent) => void) | null = null
let hoverListener: ((event: MouseEvent) => void) | null = null
let mountedNav: HTMLElement | null = null
let menuButtons: HTMLButtonElement[] = []
let focusIndex = 0

function isGameplayRow(row: MenuRow): row is GameMode {
  return (GAMEPLAY_ROWS as readonly string[]).includes(row)
}

/**
 * The only place the `focused` class is toggled and the only place native
 * focus is requested — every navigation path (keyboard, hover, mount-time
 * auto-focus) funnels through here so the keyboard-selected row and the
 * visually-highlighted row can never drift apart. Normalizes `index` with a
 * modulo that tolerates a negative input by adding the row count first, so
 * decrementing from row 0 wraps to the last row instead of landing on a
 * negative index.
 */
function focusRow(index: number): void {
  focusIndex = (index + menuButtons.length) % menuButtons.length
  menuButtons.forEach((button, i) => button.classList.toggle('focused', i === focusIndex))
  menuButtons[focusIndex].focus()
}

/**
 * Clears `container`, renders the nav + grouped button rows, registers the
 * delegated click/keydown/hover listeners, and auto-focuses the first row
 * so keyboard navigation works immediately with no initial Tab press.
 */
export function mountMenu(container: HTMLElement, handlers: MenuHandlers): void {
  container.replaceChildren()

  const nav = document.createElement('nav')
  nav.className = 'menu'

  const groupPrimary = document.createElement('div')
  groupPrimary.className = 'menu-group'

  const groupUtility = document.createElement('div')
  groupUtility.className = 'menu-group menu-group--utility'

  const groupQuit = document.createElement('div')
  groupQuit.className = 'menu-group menu-group--quit'

  menuButtons = []

  for (const row of MENU_ROWS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'menu-item'
    button.dataset.row = row
    button.textContent = MENU_LABELS[row]
    menuButtons.push(button)

    if (row === 'stats' || row === 'settings' || row === 'share') {
      groupUtility.appendChild(button)
    } else if (row === 'quit') {
      groupQuit.appendChild(button)
    } else {
      groupPrimary.appendChild(button)
    }
  }

  nav.appendChild(groupPrimary)
  nav.appendChild(groupUtility)
  nav.appendChild(groupQuit)
  container.appendChild(nav)

  const handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-row]')
    if (!button) return
    const row = button.dataset.row as MenuRow

    if (isGameplayRow(row)) {
      handlers.onLaunchMode(row)
    } else if (row === 'quit') {
      handlers.onQuit()
    }
    // stats, settings and share are left undispatched in this plan — 02-04
    // adds their handlers when it delivers those screens.
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.repeat) return // a held arrow key must not spin the selection

    // event.key is the correct choice for these action keys — the physical
    // key-code property is reserved for gameplay character matching only.
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusRow(focusIndex + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusRow(focusIndex - 1)
        break
      case 'Home':
        event.preventDefault()
        focusRow(0)
        break
      case 'End':
        event.preventDefault()
        focusRow(menuButtons.length - 1)
        break
      // The activation keys need no case at all — the focused row is
      // already a native button, which already fires a click for both.
    }
  }

  const handleHover = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-row]')
    if (!button) return
    const index = menuButtons.indexOf(button)
    if (index === -1) return
    focusRow(index)
  }

  clickListener = handleClick
  keydownListener = handleKeydown
  hoverListener = handleHover
  nav.addEventListener('click', handleClick)
  nav.addEventListener('keydown', handleKeydown)
  nav.addEventListener('mouseover', handleHover)
  mountedNav = nav

  focusRow(0)
}

/** Removes the delegated click/keydown/hover listeners and resets all
 * module-level menu state. */
export function unmountMenu(): void {
  if (mountedNav) {
    if (clickListener) mountedNav.removeEventListener('click', clickListener)
    if (keydownListener) mountedNav.removeEventListener('keydown', keydownListener)
    if (hoverListener) mountedNav.removeEventListener('mouseover', hoverListener)
  }
  clickListener = null
  keydownListener = null
  hoverListener = null
  if (mountedNav?.parentElement) {
    mountedNav.parentElement.replaceChildren()
  }
  mountedNav = null
  menuButtons = []
  focusIndex = 0
}

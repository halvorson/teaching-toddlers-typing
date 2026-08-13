/**
 * Home menu: renders the seven-row list (Letters, Numbers, Alphabet,
 * Statistics, Settings, Share, Quit) as real `<button>` elements — grouping
 * gameplay rows, utility rows and Quit into their own gap-carrying groups —
 * and dispatches row activation to the caller's handlers. Arrow-key
 * navigation and the focus indicator arrive in plan 02-02; this module only
 * needs the rows to render and the three gameplay rows to activate.
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
let mountedNav: HTMLElement | null = null

function isGameplayRow(row: MenuRow): row is GameMode {
  return (GAMEPLAY_ROWS as readonly string[]).includes(row)
}

/**
 * Clears `container`, renders the nav + grouped button rows, and registers a
 * single delegated click listener that dispatches row activation.
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

  for (const row of MENU_ROWS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'menu-item'
    button.dataset.row = row
    button.textContent = MENU_LABELS[row]

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

  const handler = (event: MouseEvent): void => {
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

  clickListener = handler
  nav.addEventListener('click', handler)
  mountedNav = nav
}

/** Removes the delegated click listener and empties the container. */
export function unmountMenu(): void {
  if (mountedNav && clickListener) {
    mountedNav.removeEventListener('click', clickListener)
  }
  clickListener = null
  if (mountedNav?.parentElement) {
    mountedNav.parentElement.replaceChildren()
  }
  mountedNav = null
}

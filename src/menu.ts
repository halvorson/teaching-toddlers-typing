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
import { currentShareUrl, shareCurrentUrl } from './clipboard'

export type MenuRow = 'letters' | 'numbers' | 'alphabet' | 'stats' | 'settings' | 'share' | 'quit'

export const MENU_ROWS: readonly MenuRow[] = Object.freeze(['letters', 'numbers', 'alphabet', 'stats', 'settings', 'share', 'quit'])

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
const UTILITY_ROWS: readonly MenuRow[] = Object.freeze(['stats', 'settings', 'share'])

const SVG_NS = 'http://www.w3.org/2000/svg'
const COPIED_FEEDBACK_MS = 1500

export interface MenuHandlers {
  onLaunchMode(mode: GameMode): void
  onQuit(): void
  onOpenSettings(): void
}

let clickListener: ((event: MouseEvent) => void) | null = null
let keydownListener: ((event: KeyboardEvent) => void) | null = null
let hoverListener: ((event: MouseEvent) => void) | null = null
let focusInListener: ((event: FocusEvent) => void) | null = null
let mountedNav: HTMLElement | null = null
let menuButtons: HTMLButtonElement[] = []
let focusIndex = 0
let shareLabelEl: HTMLSpanElement | null = null
let shareButtonEl: HTMLButtonElement | null = null
let copiedTimeoutId: number | null = null
let shareFallbackEl: HTMLDivElement | null = null

// Incremented on every mountMenu()/unmountMenu() call so an in-flight
// runShare() promise from a previous mount can detect it's stale (the menu
// was remounted or torn down while its shareCurrentUrl() await was
// pending) and bail out instead of mutating the new mount's Share row.
let mountGeneration = 0

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
  syncFocusedClass()
  menuButtons[focusIndex].focus()
}

/**
 * The class-only half of focusRow(): toggles `.focused` onto whichever
 * button matches the current focusIndex without touching real DOM focus.
 * Split out so the Share manual-fallback textbox (which isn't part of the
 * roving-focus button set) can resync the indicator when it loses focus
 * without calling .focus() itself — doing that inside a blur handler would
 * hijack the browser's native Tab-navigation target.
 */
function syncFocusedClass(): void {
  menuButtons.forEach((button, i) => button.classList.toggle('focused', i === focusIndex))
}

/**
 * Synchronous teardown run before every Share activation: cancels a
 * pending "Copied!" revert timer and restores the row's resting label.
 * Everything here is synchronous so it cannot itself consume the click's
 * user activation — the copy chain in runShare() needs every bit of it.
 */
function resetShareFeedback(): void {
  if (copiedTimeoutId !== null) {
    clearTimeout(copiedTimeoutId)
    copiedTimeoutId = null
  }
  if (shareLabelEl) {
    shareLabelEl.textContent = MENU_LABELS.share
  }
  if (shareFallbackEl) {
    shareFallbackEl.remove()
    shareFallbackEl = null
  }
}

/**
 * Swaps the Share row's label to "Copied!" and schedules the revert back to
 * the resting label, read from `MENU_LABELS` rather than repeated as a
 * second literal.
 */
function showCopiedFeedback(): void {
  if (!shareLabelEl || !shareButtonEl) return
  shareLabelEl.textContent = 'Copied!'
  copiedTimeoutId = window.setTimeout(() => {
    if (shareLabelEl) {
      shareLabelEl.textContent = MENU_LABELS.share
    }
    copiedTimeoutId = null
  }, COPIED_FEEDBACK_MS)
}

/**
 * The last-resort tier's UI: a short plain-language explanation plus a
 * read-only, pre-selected text box holding the link, inserted directly
 * after the Share row. The URL comes through currentShareUrl() — the same
 * single source every other tier reads — so the link a parent copies by
 * hand can never disagree with the link an automatic tier would have
 * copied.
 */
function renderManualFallback(): void {
  if (!shareButtonEl) return

  const panel = document.createElement('div')
  panel.className = 'share-manual'

  const hint = document.createElement('p')
  hint.className = 'share-manual__hint'
  hint.textContent = "Couldn't copy the link automatically — select and copy it here:"

  const urlBox = document.createElement('input')
  urlBox.className = 'share-manual__url'
  urlBox.type = 'text'
  urlBox.readOnly = true
  urlBox.value = currentShareUrl()

  panel.appendChild(hint)
  panel.appendChild(urlBox)

  shareButtonEl.after(panel)
  shareFallbackEl = panel

  // select() rather than a native focus call — this file's single
  // focus-method call already belongs to focusRow(); select() gives the
  // input focus as a side effect anyway, so the link is highlighted and
  // ready for a single Cmd/Ctrl-C.
  urlBox.select()

  // urlBox isn't a `button[data-row]` element, so the delegated
  // handleFocusIn listener ignores it and the `.focused` class stays on
  // the Share button even though real DOM focus just moved to this input —
  // the exact "focused class and real focus can never disagree" invariant
  // this module's header comment promises. Clear it explicitly here...
  menuButtons.forEach((button) => button.classList.remove('focused'))

  // ...and resync it (class only — no .focus() call, which would hijack
  // the browser's native Tab target) the moment focus leaves the fallback
  // box. Forward Tab lands on a `button[data-row]` and handleFocusIn
  // resyncs it anyway; this covers Shift+Tab back onto the Share button,
  // where handleFocusIn's `index === focusIndex` early-return would
  // otherwise leave `.focused` incorrectly cleared.
  urlBox.addEventListener('blur', () => syncFocusedClass(), { once: true })
}

/**
 * Runs the copy chain and renders the result. The call to the chain below
 * is the first asynchronous step in this function, for the same Safari
 * activation-window reason documented in clipboard.ts — resetShareFeedback()
 * runs synchronously ahead of this dispatcher so it cannot introduce a
 * microtask boundary before this line.
 */
async function runShare(): Promise<void> {
  const myGeneration = mountGeneration
  const result = await shareCurrentUrl()
  // Bail out if the menu was remounted (or unmounted) while the copy chain
  // was pending — shareLabelEl/shareButtonEl now point at a different
  // mount's elements, and this stale result must not touch them.
  if (myGeneration !== mountGeneration) return
  if (result !== 'manual-required') {
    showCopiedFeedback()
    return
  }
  renderManualFallback()
}

/**
 * Clears `container`, renders the nav + grouped button rows, registers the
 * delegated click/keydown/hover listeners, and auto-focuses the first row
 * so keyboard navigation works immediately with no initial Tab press.
 */
export function mountMenu(container: HTMLElement, handlers: MenuHandlers): void {
  mountGeneration++ // invalidate any in-flight runShare() from a prior mount
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

    if ((UTILITY_ROWS as readonly string[]).includes(row)) {
      groupUtility.appendChild(button)
    } else if (row === 'quit') {
      groupQuit.appendChild(button)
    } else {
      groupPrimary.appendChild(button)
    }
  }

  // Decorate the Share row after the loop above (not inside it) so the
  // seven-button creation loop stays untouched: swap its plain text for an
  // outlined "export" glyph plus a labelled span, built through the
  // namespaced element-creation API rather than by assigning markup.
  const shareButton = menuButtons.find((button) => button.dataset.row === 'share')
  if (shareButton) {
    shareButton.textContent = ''

    const icon = document.createElementNS(SVG_NS, 'svg')
    icon.setAttribute('viewBox', '0 0 24 24')
    icon.setAttribute('class', 'share-icon')
    icon.setAttribute('aria-hidden', 'true')
    icon.setAttribute('focusable', 'false')
    icon.setAttribute('stroke-linecap', 'round')
    icon.setAttribute('stroke-linejoin', 'round')

    const tray = document.createElementNS(SVG_NS, 'path')
    tray.setAttribute('d', 'M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5')
    const arrow = document.createElementNS(SVG_NS, 'path')
    arrow.setAttribute('d', 'M12 16V4M8 8l4-4 4 4')
    icon.appendChild(tray)
    icon.appendChild(arrow)

    const label = document.createElement('span')
    label.className = 'menu-label'
    label.textContent = MENU_LABELS.share

    shareButton.appendChild(icon)
    shareButton.appendChild(label)

    shareLabelEl = label
    shareButtonEl = shareButton
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
    } else if (row === 'share') {
      resetShareFeedback()
      void runShare()
    } else if (row === 'settings') {
      handlers.onOpenSettings()
    }
    // stats stays undispatched — its real content belongs to the phase that
    // owns that screen (Phase 4).
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

  // Native Tab/Shift+Tab moves document.activeElement directly and never
  // goes through handleKeydown (which only handles Arrow/Home/End), so
  // without this listener the .focused indicator can permanently desync
  // from real DOM focus. Delegated on the nav so it covers every button.
  const handleFocusIn = (event: FocusEvent): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-row]')
    if (!button) return
    const index = menuButtons.indexOf(button)
    if (index === -1 || index === focusIndex) return
    focusRow(index)
  }

  clickListener = handleClick
  keydownListener = handleKeydown
  hoverListener = handleHover
  focusInListener = handleFocusIn
  nav.addEventListener('click', handleClick)
  nav.addEventListener('keydown', handleKeydown)
  nav.addEventListener('mouseover', handleHover)
  nav.addEventListener('focusin', handleFocusIn)
  mountedNav = nav

  focusRow(0)
}

/** Removes the delegated click/keydown/hover listeners and resets all
 * module-level menu state. */
export function unmountMenu(): void {
  mountGeneration++ // invalidate any in-flight runShare() from this mount
  if (mountedNav) {
    if (clickListener) mountedNav.removeEventListener('click', clickListener)
    if (keydownListener) mountedNav.removeEventListener('keydown', keydownListener)
    if (hoverListener) mountedNav.removeEventListener('mouseover', hoverListener)
    if (focusInListener) mountedNav.removeEventListener('focusin', focusInListener)
  }
  clickListener = null
  keydownListener = null
  hoverListener = null
  focusInListener = null
  if (mountedNav?.parentElement) {
    mountedNav.parentElement.replaceChildren()
  }
  mountedNav = null
  menuButtons = []
  focusIndex = 0

  if (copiedTimeoutId !== null) {
    clearTimeout(copiedTimeoutId)
    copiedTimeoutId = null
  }
  shareLabelEl = null
  shareButtonEl = null
  if (shareFallbackEl) {
    shareFallbackEl.remove()
    shareFallbackEl = null
  }
}

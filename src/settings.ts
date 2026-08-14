/**
 * Settings screen (TRAIL-02, SET-01): a windowed panel over the same
 * drifting parallax background the home menu uses, with two controls —
 * "Reset trail on mistake" and "Sound". Mirrors game-screen.ts's idempotent
 * mount-calls-its-own-unmount lifecycle and menu.ts's
 * document.createElement + textContent construction idiom; no markup
 * assignment is used anywhere in this module (T-02.1-08). Both toggles share
 * one delegated click listener, distinguished by a `dataset.setting` value
 * on each switch button — the handler branches on it explicitly rather than
 * using it as a computed object key (T-03-03), and every write merges the
 * current persisted record first so flipping one toggle can never clobber
 * the other's value (T-03's merge-write fix).
 */

import { readSettings, writeSettings, type AppSettings } from './settings-store'

let mountedPanel: HTMLElement | null = null
let clickListener: ((event: MouseEvent) => void) | null = null
let keydownListener: ((event: KeyboardEvent) => void) | null = null

/**
 * Clears `container`, renders the panel (back row, title, toggle row), and
 * registers the delegated click listener plus the document-level Escape
 * listener. Defensively unmounts any prior mount first, matching
 * `mountGameScreen`'s idempotent "start clean" shape.
 */
export function mountSettingsScreen(container: HTMLElement, onBack: () => void): void {
  unmountSettingsScreen()
  container.replaceChildren()

  const panel = document.createElement('section')
  panel.className = 'settings-panel'

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'panel-back'
  back.textContent = '← Back'

  const title = document.createElement('h1')
  title.className = 'panel-title'
  title.textContent = 'Settings'

  const toggleRow = document.createElement('div')
  toggleRow.className = 'toggle-row'

  const toggleLabel = document.createElement('span')
  toggleLabel.className = 'toggle-row__label'
  toggleLabel.textContent = 'Reset trail on mistake'

  const toggleSwitch = document.createElement('button')
  toggleSwitch.type = 'button'
  toggleSwitch.className = 'toggle-switch'
  toggleSwitch.setAttribute('role', 'switch')
  toggleSwitch.setAttribute('aria-label', 'Reset trail on mistake')
  toggleSwitch.setAttribute('aria-checked', String(readSettings().resetTrailOnMistake))
  toggleSwitch.dataset.setting = 'resetTrailOnMistake'

  const thumb = document.createElement('span')
  thumb.className = 'toggle-switch__thumb'
  toggleSwitch.appendChild(thumb)

  toggleRow.appendChild(toggleLabel)
  toggleRow.appendChild(toggleSwitch)

  const soundRow = document.createElement('div')
  soundRow.className = 'toggle-row'

  const soundLabel = document.createElement('span')
  soundLabel.className = 'toggle-row__label'
  soundLabel.textContent = 'Sound'

  const soundSwitch = document.createElement('button')
  soundSwitch.type = 'button'
  soundSwitch.className = 'toggle-switch'
  soundSwitch.setAttribute('role', 'switch')
  soundSwitch.setAttribute('aria-label', 'Sound')
  soundSwitch.setAttribute('aria-checked', String(readSettings().soundEnabled))
  soundSwitch.dataset.setting = 'soundEnabled'

  const soundThumb = document.createElement('span')
  soundThumb.className = 'toggle-switch__thumb'
  soundSwitch.appendChild(soundThumb)

  soundRow.appendChild(soundLabel)
  soundRow.appendChild(soundSwitch)

  panel.appendChild(back)
  panel.appendChild(title)
  panel.appendChild(toggleRow)
  panel.appendChild(soundRow)
  container.appendChild(panel)

  const handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    const toggle = target.closest<HTMLButtonElement>('.toggle-switch')
    if (toggle) {
      const current = toggle.getAttribute('aria-checked') === 'true'
      const next = !current
      toggle.setAttribute('aria-checked', String(next))
      if (toggle.dataset.setting === 'soundEnabled') {
        writeSettings({ ...readSettings(), soundEnabled: next } satisfies AppSettings)
      } else {
        writeSettings({ ...readSettings(), resetTrailOnMistake: next } satisfies AppSettings)
      }
      return
    }

    const backButton = target.closest('.panel-back')
    if (backButton) {
      onBack()
    }
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.repeat) return
    if (event.key === 'Escape') {
      onBack()
    }
  }

  clickListener = handleClick
  keydownListener = handleKeydown
  panel.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeydown)
  mountedPanel = panel
}

/** Removes the delegated click and document-level keydown listeners, empties
 * the panel's parent, and resets all module-level refs to null, matching
 * `unmountGameScreen()`/`unmountMenu()`. */
export function unmountSettingsScreen(): void {
  if (mountedPanel && clickListener) {
    mountedPanel.removeEventListener('click', clickListener)
  }
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener)
  }
  clickListener = null
  keydownListener = null
  if (mountedPanel?.parentElement) {
    mountedPanel.parentElement.replaceChildren()
  }
  mountedPanel = null
}

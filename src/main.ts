import './style.css'
import { readInitialScreen, navigateTo, type Screen } from './router'
import { enterFullscreen, exitFullscreenIfActive } from './fullscreen'
import { mountMenu, unmountMenu, type MenuHandlers } from './menu'
import { mountGameScreen, unmountGameScreen, type GameMode } from './game-screen'

const app = document.querySelector<HTMLDivElement>('#app')!

let currentScreen: Screen = 'menu'

const menuHandlers: MenuHandlers = {
  onLaunchMode(mode: GameMode): void {
    launchMode(mode)
  },
  onQuit(): void {
    quitToMenu()
  },
}

/** Unmounts whatever is currently mounted, mounts `screen`, rewrites the URL,
 * and flags `document.body`'s chrome mode for the stylesheet. This does not
 * touch fullscreen state — callers that need fullscreen call `enterFullscreen`
 * themselves, after this function returns. */
function mountScreen(screen: Screen): void {
  switch (currentScreen) {
    case 'menu':
      unmountMenu()
      break
    case 'letters':
    case 'numbers':
    case 'alphabet':
      unmountGameScreen()
      break
  }

  currentScreen = screen
  navigateTo(screen)
  document.body.dataset.chrome = screen === 'menu' ? 'menu' : 'game'

  switch (screen) {
    case 'menu':
      mountMenu(app, menuHandlers)
      break
    case 'letters':
    case 'numbers':
    case 'alphabet':
      mountGameScreen(app, screen, quitToMenu)
      break
  }
}

/** Mounts the game screen for `mode` and only then requests fullscreen — the
 * game screen and its first target are already on screen regardless of what
 * the fullscreen request does (D-09, FULL-01). */
function launchMode(mode: GameMode): void {
  mountScreen(mode)
  enterFullscreen(document.documentElement)
}

/** The single resync function required by 02-RESEARCH.md Pitfall 1: exits
 * fullscreen unconditionally first (so MENU-03 holds even when the menu
 * itself was fullscreened), then idempotently returns to the menu. Called
 * from two trigger sites — the fullscreenchange listener and the in-game
 * Escape handler — which is why the idempotent guard matters: a double
 * trigger must be harmless. */
function quitToMenu(): void {
  exitFullscreenIfActive()
  if (currentScreen === 'menu') return
  mountScreen('menu')
}

// Registered exactly once at module top level for the whole app lifetime —
// registering it per mode entry would leak a listener on every transition.
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === null) {
    quitToMenu()
  }
})

// Boot. Fullscreen is never requested on the initial load — a page load is
// not a user activation and the request would be rejected; fullscreen is
// only entered from launchMode, which only runs from a real row activation.
mountScreen(readInitialScreen())

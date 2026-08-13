/**
 * Hand-rolled router: reads the initial screen from the URL's `screen` query
 * parameter (validated against a fixed allow-list) and rewrites the current
 * history entry in place on every transition. No router library, no history
 * stack growth — the history-append method appears nowhere in this app.
 */

export type Screen = 'menu' | 'letters' | 'numbers' | 'alphabet'

const VALID_SCREENS: readonly Screen[] = Object.freeze(['menu', 'letters', 'numbers', 'alphabet'])

/**
 * Reads the `screen` query parameter and returns it only if it appears in
 * the allow-list. Anything else — an unrecognised value, a hand-edited
 * value, or a missing key — resolves to `'menu'`. This allow-list check is
 * the plan's input-validation control (T-02-01); a value that fails it must
 * never reach the mount switch.
 */
export function readInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('screen')
  return (VALID_SCREENS as readonly string[]).includes(requested ?? '') ? (requested as Screen) : 'menu'
}

/**
 * Rewrites the current history entry to reflect `screen`. Deletes the
 * `screen` search param entirely when navigating to the menu (so the shared
 * root URL stays clean), otherwise sets it. Always uses `history.replaceState`
 * — never the history-append method — so the Back button never has to be
 * pressed once per menu transition to leave the app.
 */
export function navigateTo(screen: Screen): void {
  const url = new URL(window.location.href)
  if (screen === 'menu') {
    url.searchParams.delete('screen')
  } else {
    url.searchParams.set('screen', screen)
  }
  history.replaceState(null, '', url)
}

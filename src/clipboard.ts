/**
 * Share-link source and copy chain. `currentShareUrl()` is the single place
 * this app reads the current address — every consumer, including the later
 * manual-copy fallback box, reads the link through this function so the
 * string a parent copies can never drift from the string that was copied
 * automatically. `shareCurrentUrl()` runs the ordered three-tier
 * degradation chain locked by D-15: the modern Clipboard API, then the
 * legacy deprecated copy command, then a manual-copy result the caller
 * renders. Mirrors celebrate.ts's asynchronous try/catch-with-swallowed-
 * fallback shape.
 */

export type ShareResult = 'copied' | 'fallback-executed' | 'manual-required'

/**
 * The single source of the shared link — every copy tier and the manual-copy
 * fallback box read the URL through here rather than each reading
 * `window.location.href` independently.
 */
export function currentShareUrl(): string {
  return window.location.href
}

/**
 * Runs the ordered copy chain and returns which tier produced the result.
 * The clipboard write below must be the function's first asynchronous
 * operation — nothing may run through a promise before it, because Safari's
 * transient user-activation window is shorter than Chromium's and expires
 * at the first microtask boundary (02-RESEARCH.md Pitfall 3).
 */
export async function shareCurrentUrl(): Promise<ShareResult> {
  const url = currentShareUrl()

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return 'copied'
    }
  } catch {
    // Clipboard unavailable or the permission was denied — an expected
    // outcome here, not an error to surface. Fall through to the legacy
    // tier below.
  }

  // Legacy tier (D-15's second tier) — a deliberately deprecated API,
  // reached for only after the modern write above has already failed.
  // Capture the currently focused element before creating anything: the
  // legacy copy has to select an input to work, which steals focus from
  // the Share row, so restoring it afterward keeps the menu's arrow-key
  // navigation alive after a fallback copy.
  const previousActive = document.activeElement
  const input = document.createElement('input')
  try {
    input.value = url
    // Positioned offscreen rather than hidden — several engines refuse to
    // select an undisplayed element, which would fail here for a reason
    // that looks like a permissions problem rather than a display one.
    input.style.position = 'fixed'
    input.style.top = '-1000px'
    input.style.left = '-1000px'
    document.body.appendChild(input)
    input.select()
    const ok = document.execCommand('copy')
    if (ok) return 'fallback-executed'
  } catch {
    // Fall through to the manual tier below.
  } finally {
    // A finally clause (rather than a removal line on each path) guarantees
    // the offscreen input never survives a throw and lingers in the
    // document as a stray focusable field — calling remove() on an element
    // that was never appended is a harmless no-op, so the early-throw case
    // is safe too.
    input.remove()
    if (previousActive instanceof HTMLElement) {
      previousActive.focus()
    }
  }

  return 'manual-required'
}

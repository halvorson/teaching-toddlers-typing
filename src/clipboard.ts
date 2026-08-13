/**
 * Share-link source and copy chain. `currentShareUrl()` is the single place
 * this app reads the current address — every consumer, including the later
 * manual-copy fallback box, reads the link through this function so the
 * string a parent copies can never drift from the string that was copied
 * automatically. `shareCurrentUrl()` runs the ordered three-tier
 * degradation chain locked by D-15: the modern Clipboard API, then (Task 2)
 * the legacy execCommand tier, then a manual-copy result the caller renders.
 * Mirrors celebrate.ts's asynchronous try/catch-with-swallowed-fallback shape.
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
    // outcome here, not an error to surface. Task 2 inserts the legacy
    // execCommand tier here, between this catch and the terminal return.
  }

  return 'manual-required'
}

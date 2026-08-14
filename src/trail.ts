/**
 * Ambient star-trail layer (TRAIL-01). Purely decorative: every correct key
 * press during gameplay appends one small glowing dot to a fixed
 * full-viewport layer that sits below all interactive/text UI and above the
 * drifting menu background. This module surfaces no numeric state of any
 * kind — no counter, no score, no stats — and is deliberately uncapped per
 * the phase's locked decision (no engineered cap/cycling logic).
 */

let trailLayerEl: HTMLDivElement | null = null

/**
 * Creates the `#star-trail` layer and appends it to `document.body` (not
 * `#app`, whose children are wiped by `replaceChildren()` on every screen
 * transition). Defensively unmounts any prior layer first, matching
 * `mountGameScreen`'s own idempotent "start clean" shape. Because mount
 * always starts from a freshly-created empty element, "each mode entry
 * starts with an empty trail" falls out of the lifecycle with no extra
 * reset call.
 */
export function mountTrailLayer(): void {
  unmountTrailLayer()

  const layer = document.createElement('div')
  layer.id = 'star-trail'
  document.body.appendChild(layer)
  trailLayerEl = layer
}

/**
 * Appends one star at a uniform-random position (2%-98% margin per axis,
 * viewport-relative units so existing stars reposition naturally on
 * resize). No-op if the trail layer isn't mounted.
 */
export function addTrailStar(): void {
  if (!trailLayerEl) return

  const star = document.createElement('div')
  star.className = 'star-trail__star'
  star.style.left = `${2 + Math.random() * 96}vw`
  star.style.top = `${2 + Math.random() * 96}vh`
  trailLayerEl.appendChild(star)
}

/**
 * Removes every star from the layer, the codebase's established full-clear
 * idiom (`replaceChildren()`, matching `game-screen.ts`/`menu.ts`). Exported
 * now because plan 02.1-03 consumes it for the toggle-gated incorrect-key
 * wipe; it is not called from anywhere in this plan.
 */
export function clearTrail(): void {
  trailLayerEl?.replaceChildren()
}

/**
 * Removes the trail layer from the DOM (if present) and resets module
 * state, matching the reset-every-module-ref-to-null teardown shape of
 * `unmountGameScreen()`/`unmountMenu()`.
 */
export function unmountTrailLayer(): void {
  trailLayerEl?.remove()
  trailLayerEl = null
}

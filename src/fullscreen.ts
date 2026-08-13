/**
 * Fire-and-forget fullscreen entry and best-effort exit. Neither function is
 * ever awaited by a caller — fullscreen success is never a gate on starting
 * or leaving a game mode (D-09, D-10). iOS Safari's fullscreen support on
 * non-video elements is documented as unreliable (02-RESEARCH.md Pitfall 1);
 * an implementation that awaited the request promise would leave the game
 * screen blank on exactly that platform.
 */

/**
 * Requests fullscreen on `el` without gating anything on the promise
 * resolving. Feature-detects the request method and swallows any rejection —
 * no error UI, no retry prompt (CONTEXT.md explicit).
 */
export function enterFullscreen(el: Element): void {
  if (typeof el.requestFullscreen === 'function') {
    el.requestFullscreen().catch(() => {
      // Intentionally swallowed. iOS Safari (partial support through the
      // current release — see 02-RESEARCH.md Pitfall 1) and any other
      // non-supporting browser must never block gameplay.
    })
  }
}

/**
 * Exits fullscreen only if something is currently fullscreen. When nothing
 * is fullscreen this is correctly a no-op — the caller still navigates
 * regardless of whether this function actually changed anything.
 */
export function exitFullscreenIfActive(): void {
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    document.exitFullscreen().catch(() => {
      // Intentionally swallowed — the exit is best-effort; navigation must
      // proceed regardless.
    })
  }
}

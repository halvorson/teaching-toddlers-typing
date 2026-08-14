/**
 * Non-visual celebration audio (AUDIO-01, AUDIO-02): a short synthesized
 * chime and the spoken name of the character just matched. Three
 * conventions apply to every function in this module: one lazily created,
 * reused `AudioContext` (browsers cap how many live contexts a page may
 * hold, so a per-keypress context would exhaust that cap within a minute of
 * toddler play); `readSettings().soundEnabled` re-read at the top of every
 * exported function rather than cached, so flipping the Settings toggle
 * takes effect on the very next correct match with no reload; and every
 * browser-API call wrapped in a comment-only `catch`, because audio here is
 * decorative and the game must keep working without it, matching
 * clipboard.ts's and celebrate.ts's silent-degrade precedent. `audio.ts`
 * deliberately does not mirror celebrate.ts's dynamic `import()` (Web Audio
 * and Web Speech are browser globals, not bundled dependencies) or its
 * reduced-motion media-query guard (motion and audio are separate
 * accessibility axes — sound is gated solely by `soundEnabled`).
 */

import { readSettings } from './settings-store'

let audioCtx: AudioContext | null = null

/**
 * The module's only `AudioContext` construction site. Individual oscillator
 * and gain nodes are cheap, one-shot, and created per play — only the
 * context itself is a singleton, lazily created on first use and resumed
 * (never re-`new`'d) on every subsequent call.
 */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    // Fire-and-forget: this only ever runs inside a keydown handler, which
    // is already the qualifying user gesture, so no unlock UI is needed.
    void audioCtx.resume()
  }
  return audioCtx
}

/** A gentle accent under the muted celebration, not a loud alert. */
const PEAK_GAIN = 0.12

/**
 * Schedules one sine tone's envelope entirely through `AudioParam` scheduling
 * methods — never a direct `gain.value` assignment, which would produce an
 * audible click or pop at the jump and wreck the muted character the
 * celebration palette is built around.
 */
function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, startTime + 0.015)
  // exponentialRampToValueAtTime cannot target exactly 0 (asymptotic curve),
  // so the decay targets a very small value instead.
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

/**
 * Plays a short, soft, two-note ascending chime (E5 up to B5, ~285ms end to
 * end) through the single reused `AudioContext`, gated by the persisted
 * `soundEnabled` setting.
 */
export function playChime(): void {
  if (!readSettings().soundEnabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    playTone(ctx, 659.25, now, 0.14)
    playTone(ctx, 987.77, now + 0.085, 0.2)
  } catch {
    // Audio is decorative — swallow failures so the core game keeps working.
  }
}

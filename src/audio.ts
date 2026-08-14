/**
 * Non-visual celebration audio (AUDIO-01, AUDIO-02): a short synthesized
 * chime and the spoken name of the character just matched. Three
 * conventions apply to every function in this module: one lazily created,
 * reused `AudioContext` (browsers cap how many live contexts a page may
 * hold, so a per-keypress context would exhaust that cap within a minute of
 * toddler play); the persisted sound-enabled setting re-read fresh at the
 * top of every exported function rather than cached, so flipping the
 * Settings toggle takes effect on the very next correct match with no
 * reload; and every
 * browser-API call wrapped in a comment-only `catch`, because audio here is
 * decorative and the game must keep working without it, matching
 * clipboard.ts's and celebrate.ts's silent-degrade precedent. `audio.ts`
 * deliberately does not mirror celebrate.ts's dynamic `import()` (Web Audio
 * and Web Speech are browser globals, not bundled dependencies) or its
 * reduced-motion media-query guard (motion and audio are separate
 * accessibility axes — sound is gated solely by `soundEnabled`).
 *
 * Two independent entry points: `playChime()` and `speakTarget()`. They
 * share this file and nothing else — no shared queue, no shared state, no
 * sequencing, no awaiting each other — so a failure in one can never
 * suppress the other.
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

let cachedVoices: SpeechSynthesisVoice[] = []

/**
 * Primes `cachedVoices` from both the synchronous and event-driven paths,
 * since neither is sufficient alone: Chrome loads voices asynchronously and
 * returns an empty array from the synchronous call, while Firefox and
 * Safari load them synchronously and may never fire `voiceschanged` at all.
 * Called once at module scope — `audio.ts` is statically imported by
 * game-screen.ts, so this runs at page load with no extra bootstrap wiring.
 */
function primeVoices(): void {
  try {
    if (!window.speechSynthesis) return
    cachedVoices = window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        cachedVoices = window.speechSynthesis.getVoices()
      },
      { once: true },
    )
  } catch {
    // Speech is decorative — swallow failures so the core game keeps working.
  }
}

primeVoices()

/**
 * Digit → English word lookup, keyed on game.ts's DIGITS pool. A bare digit
 * glyph is not a pronunciation the Speech API guarantees across voices —
 * some read it as the number, some spell or inflect it oddly — so this
 * removes the ambiguity. Declared here, not in game.ts: game.ts owns
 * character pools, audio.ts owns how a matched character is pronounced.
 */
const DIGIT_WORDS: Readonly<Record<string, string>> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
}

/**
 * Letter → spelled-out English letter-name lookup, keyed on game.ts's
 * LETTERS pool (A-Z). A bare uppercase letter is not a pronunciation the
 * Speech API guarantees across voices/OS combinations — some prepend
 * "Capital" before the letter name — so this table removes the ambiguity
 * the same way DIGIT_WORDS does for digits. Declared here, not in game.ts:
 * game.ts owns character pools, audio.ts owns how a matched character is
 * pronounced.
 */
const LETTER_WORDS: Readonly<Record<string, string>> = {
  A: 'Ay',
  B: 'Bee',
  C: 'See',
  D: 'Dee',
  E: 'Ee',
  F: 'Eff',
  G: 'Jee',
  H: 'Aitch',
  I: 'Eye',
  J: 'Jay',
  K: 'Kay',
  L: 'El',
  M: 'Em',
  N: 'En',
  O: 'Oh',
  P: 'Pee',
  Q: 'Cue',
  R: 'Ar',
  S: 'Ess',
  T: 'Tee',
  U: 'You',
  V: 'Vee',
  W: 'Double-you',
  X: 'Ex',
  Y: 'Why',
  Z: 'Zee',
}

/**
 * Speaks `character` aloud — the letter name in Letters/Alphabet modes, the
 * digit's English word in Numbers mode — through a freshly constructed
 * utterance, gated by its own independent `soundEnabled` read (never a value
 * shared with `playChime()`).
 */
export function speakTarget(character: string): void {
  if (!readSettings().soundEnabled) return
  try {
    const spoken = DIGIT_WORDS[character] ?? LETTER_WORDS[character] ?? character
    if (!window.speechSynthesis) return

    // Cancel before every new utterance so a fast run of correct matches
    // never queues speech that falls behind the character on screen. Note:
    // on some browser/OS combinations, cancel() immediately followed by
    // speak() can silently drop the new utterance — a known, still-open
    // browser quirk already absorbed by this module's silent-degrade
    // contract. Not a bug to chase, and not a reason to add a delay here.
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = document.documentElement.lang || 'en-US'
    const langPrefix = utterance.lang.slice(0, 2).toLowerCase()
    const voice =
      cachedVoices.find((candidate) => candidate.lang.toLowerCase().startsWith(langPrefix)) ??
      cachedVoices.find((candidate) => candidate.default)
    if (voice) {
      utterance.voice = voice
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    // Speech is decorative — swallow failures so the core game keeps working.
  }
}

/**
 * Cancels any in-flight or queued `speechSynthesis` utterance. Callers unmount
 * a screen (e.g. `unmountGameScreen()`) so a spoken word from a match made
 * just before leaving can never bleed into the menu or the next mode — the
 * same "must never fire on a screen the player has already left" concern
 * `unmountGameScreen()` already applies to pending celebration timers.
 */
export function stopSpeech(): void {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // Speech is decorative — swallow failures so the core game keeps working.
  }
}

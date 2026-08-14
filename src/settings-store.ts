/**
 * Versioned, persisted app settings (TRAIL-02). A single shared record —
 * `keyboard-quest-settings` — not a per-feature key: Phase 3's sound toggle
 * and Phase 4's stats-reset preference extend this same interface and the
 * same storage key rather than introducing their own. Every read is
 * shape-checked before any field is trusted (ASVS V5, T-02.1-07) and every
 * write silently degrades to an in-memory-only value for the session on
 * failure, mirroring clipboard.ts's and celebrate.ts's established
 * "decorative and utility failures fail silently" precedent. Phase 3's sound
 * toggle (`soundEnabled`) is resolved with its own per-field `typeof` default
 * rather than folded into the all-or-nothing shape check, so a record
 * persisted before this field existed still loads cleanly.
 */

const STORAGE_KEY = 'keyboard-quest-settings'

export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
  soundEnabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false, soundEnabled: true }

/**
 * Reads and shape-checks the persisted settings record. A missing key, a
 * `JSON.parse` failure, a wrong version, or a non-boolean `resetTrailOnMistake`
 * field all resolve to `DEFAULT_SETTINGS` rather than throwing or coercing a
 * hand-edited or corrupted value into unexpected behaviour. `soundEnabled` is
 * resolved separately below on its own `typeof` check so a record persisted
 * before Phase 3 (with no `soundEnabled` field at all) still loads cleanly
 * instead of being invalidated wholesale.
 */
export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
    if (!isValid) {
      return { ...DEFAULT_SETTINGS }
    }

    const soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled
    return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean, soundEnabled }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Persists `settings`. Safari private browsing and quota exhaustion both
 * make `setItem` throw; the documented contract is a silent in-memory-only
 * value for the session with no error UI.
 */
export function writeSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable or full — the preference degrades to
    // session-only with no error UI, matching this codebase's established
    // silent-degrade precedent for non-critical persistence.
  }
}

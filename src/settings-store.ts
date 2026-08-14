/**
 * Versioned, persisted app settings (TRAIL-02). A single shared record —
 * `keyboard-quest-settings` — not a per-feature key: Phase 3's sound toggle
 * and Phase 4's stats-reset preference extend this same interface and the
 * same storage key rather than introducing their own. Every read is
 * shape-checked before any field is trusted (ASVS V5, T-02.1-07) and every
 * write silently degrades to an in-memory-only value for the session on
 * failure, mirroring clipboard.ts's and celebrate.ts's established
 * "decorative and utility failures fail silently" precedent.
 */

const STORAGE_KEY = 'keyboard-quest-settings'

export interface AppSettings {
  version: 1
  resetTrailOnMistake: boolean
}

const DEFAULT_SETTINGS: AppSettings = { version: 1, resetTrailOnMistake: false }

/**
 * Reads and shape-checks the persisted settings record. A missing key, a
 * `JSON.parse` failure, a wrong version, or a non-boolean field all resolve
 * to `DEFAULT_SETTINGS` rather than throwing or coercing a hand-edited or
 * corrupted value into unexpected behaviour.
 */
export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const isValid = parsed.version === 1 && typeof parsed.resetTrailOnMistake === 'boolean'
    if (!isValid) {
      return DEFAULT_SETTINGS
    }

    return { version: 1, resetTrailOnMistake: parsed.resetTrailOnMistake as boolean }
  } catch {
    return DEFAULT_SETTINGS
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

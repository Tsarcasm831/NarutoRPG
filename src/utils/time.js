// Shared time utilities for consistent formatting and timing across the app

// Time constants used by the game clock
export const SECONDS_PER_HOUR = 60 * 60;
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_DAY = HOURS_PER_DAY * SECONDS_PER_HOUR;
// One real-world hour equals one in-game day
export const REAL_SECONDS_PER_GAME_DAY = 60 * 60;
export const GAME_SECONDS_PER_REAL_SECOND = SECONDS_PER_DAY / REAL_SECONDS_PER_GAME_DAY; // 24 in-game seconds per real second

// Prefer high-resolution monotonic time for frame deltas
export function nowHighResMs() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

// Wall-clock time in milliseconds since epoch
export function nowMs() {
  return Date.now();
}

// Format a duration in milliseconds as mm:ss (e.g., 02:07)
export function formatCountdownMs(ms) {
  if (ms == null || !Number.isFinite(ms)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Format in-game time (total seconds in a 24h cycle) as HH:MM
export function formatGameClock(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '--:--';
  const SECONDS_PER_HOUR = 60 * 60;
  const HOURS_PER_DAY = 24;
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / SECONDS_PER_HOUR) % HOURS_PER_DAY;
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Read current global pause state, defaulting to false when not in browser
export function isGamePaused() {
  try {
    // eslint-disable-next-line no-underscore-dangle
    return !!(typeof window !== 'undefined' && window.__gamePaused);
  } catch (_) {
    return false;
  }
}

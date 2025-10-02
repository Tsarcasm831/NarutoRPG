import { useEffect, useMemo, useRef, useState } from 'react';
import { nowHighResMs, formatGameClock, isGamePaused } from '../utils/time.js';

const SECONDS_PER_HOUR = 60 * 60;
const HOURS_PER_DAY = 24;
const SECONDS_PER_DAY = HOURS_PER_DAY * SECONDS_PER_HOUR;
// One real-world hour should equal one in-game day (24h)
const REAL_SECONDS_PER_GAME_DAY = 60 * 60;
const GAME_SECONDS_PER_REAL_SECOND = SECONDS_PER_DAY / REAL_SECONDS_PER_GAME_DAY; // 24 in-game seconds per real second

const clampHour = (hour) => {
  if (Number.isFinite(hour)) {
    const normalized = ((hour % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
    return normalized;
  }
  return 0;
};

// formatting moved to utils/time.js (formatGameClock)

/**
 * Tracks the in-game time of day. A complete 24-hour cycle takes one real-world hour.
 */
export function useGameTime({ isRunning, initialHour = 8, tickIntervalMs = 250, resetKey = 0 } = {}) {
  const initialSeconds = useMemo(() => clampHour(initialHour) * SECONDS_PER_HOUR, [initialHour]);
  const [displaySeconds, setDisplaySeconds] = useState(initialSeconds);
  const timeRef = useRef(initialSeconds);

  useEffect(() => {
    const startSeconds = initialSeconds % SECONDS_PER_DAY;
    timeRef.current = startSeconds;
    setDisplaySeconds(startSeconds);
  }, [initialSeconds, resetKey]);

  useEffect(() => {
    if (!isRunning) return undefined;
    let frame = null;
    let last = nowHighResMs();
    let accumulator = 0;

    const tick = () => {
      const now = nowHighResMs();
      let deltaSeconds = Math.max(0, (now - last) / 1000);
      // If paused, freeze time progression but avoid time jumps
      if (isGamePaused()) {
        deltaSeconds = 0;
      }
      last = now;

      const nextValue = (timeRef.current + deltaSeconds * GAME_SECONDS_PER_REAL_SECOND) % SECONDS_PER_DAY;
      timeRef.current = nextValue;

      accumulator += deltaSeconds * 1000;
      // Always refresh periodically even if paused so UI stays in sync
      if (accumulator >= tickIntervalMs) {
        accumulator = accumulator % tickIntervalMs;
        setDisplaySeconds(timeRef.current);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    };
  }, [isRunning, tickIntervalMs, resetKey]);

  const timeOfDayHours = displaySeconds / SECONDS_PER_HOUR;
  const normalizedDayProgress = displaySeconds / SECONDS_PER_DAY;

  return {
    timeOfDayHours,
    normalizedDayProgress,
    totalSeconds: displaySeconds,
    formattedTime: formatGameClock(displaySeconds)
  };
}

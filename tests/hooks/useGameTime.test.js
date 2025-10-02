import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameTime } from '../../src/hooks/useGameTime.js';

const INITIAL_HOUR_SECONDS = 8 * 60 * 60;

describe('useGameTime', () => {
  let performanceNowSpy;
  let rafId = 0;
  let rafTimers;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    rafId = 0;
    let highResNow = Date.now();
    performanceNowSpy = vi.spyOn(performance, 'now').mockImplementation(() => highResNow);

    rafTimers = new Map();
    const requestFrame = (cb) => {
      const id = ++rafId;
      const handle = setTimeout(() => {
        highResNow = Date.now();
        cb(highResNow);
      }, 16);
      rafTimers.set(id, handle);
      return id;
    };
    globalThis.requestAnimationFrame = requestFrame;
    window.requestAnimationFrame = requestFrame;
    global.requestAnimationFrame = requestFrame;

    const cancelFrame = (id) => {
      const handle = rafTimers.get(id);
      if (handle != null) {
        clearTimeout(handle);
        rafTimers.delete(id);
      }
    };
    globalThis.cancelAnimationFrame = cancelFrame;
    window.cancelAnimationFrame = cancelFrame;
    global.cancelAnimationFrame = cancelFrame;
  });

  afterEach(() => {
    performanceNowSpy?.mockRestore();
    vi.clearAllMocks();
    rafTimers?.forEach((handle) => clearTimeout(handle));
    rafTimers?.clear();
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
    delete window.requestAnimationFrame;
    delete window.cancelAnimationFrame;
    // eslint-disable-next-line no-underscore-dangle
    delete window.__gamePaused;
    vi.useRealTimers();
  });

  it('advances game time after surpassing the tick interval', () => {
    const { result } = renderHook(() => useGameTime({ isRunning: true, tickIntervalMs: 200 }));

    expect(result.current.totalSeconds).toBe(INITIAL_HOUR_SECONDS);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Still under the tick interval, so no visual update yet
    expect(result.current.totalSeconds).toBe(INITIAL_HOUR_SECONDS);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.totalSeconds).toBeGreaterThan(INITIAL_HOUR_SECONDS);
    expect(result.current.formattedTime).toMatch(/08:\d{2}/);
  });

  it('halts progression while the game is paused and resumes afterwards', () => {
    const { result } = renderHook(() => useGameTime({ isRunning: true, tickIntervalMs: 200 }));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    const progressedSeconds = result.current.totalSeconds;
    expect(progressedSeconds).toBeGreaterThan(INITIAL_HOUR_SECONDS);

    // eslint-disable-next-line no-underscore-dangle
    window.__gamePaused = true;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(progressedSeconds);

    // eslint-disable-next-line no-underscore-dangle
    window.__gamePaused = false;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBeGreaterThan(progressedSeconds);
  });

  it('resets the clock when resetKey changes', async () => {
    const initialHour = 6;
    const { result, rerender } = renderHook(
      ({ isRunning, resetKey }) => useGameTime({ isRunning, initialHour, tickIntervalMs: 200, resetKey }),
      { initialProps: { isRunning: true, resetKey: 0 } }
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const advancedSeconds = result.current.totalSeconds;
    expect(advancedSeconds).toBeGreaterThan(initialHour * 3600);

    await act(async () => {
      rerender({ isRunning: true, resetKey: 1 });
    });

    expect(result.current.totalSeconds).toBe(initialHour * 3600);
    expect(result.current.timeOfDayHours).toBe(initialHour);
  });
});

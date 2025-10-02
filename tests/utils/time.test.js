import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { formatCountdownMs, formatGameClock, isGamePaused } from '../../src/utils/time.js';

const originalDescriptor = Object.getOwnPropertyDescriptor(window, '__gamePaused');

describe('time utils', () => {
  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window, '__gamePaused', originalDescriptor);
    } else {
      // eslint-disable-next-line no-underscore-dangle
      delete window.__gamePaused;
    }
  });

  describe('formatCountdownMs', () => {
    it('formats positive durations into minutes and seconds', () => {
      expect(formatCountdownMs(125000)).toBe('2:05');
      expect(formatCountdownMs(59999)).toBe('0:59');
    });

    it('clamps negative durations to zero', () => {
      expect(formatCountdownMs(-1000)).toBe('0:00');
    });

    it('returns placeholder for invalid values', () => {
      expect(formatCountdownMs()).toBe('--:--');
      expect(formatCountdownMs(Number.NaN)).toBe('--:--');
    });
  });

  describe('formatGameClock', () => {
    it('formats seconds into a 24h clock', () => {
      expect(formatGameClock(0)).toBe('00:00');
      expect(formatGameClock(60 * 60 * 12 + 60 * 34)).toBe('12:34');
      expect(formatGameClock(60 * 60 * 23 + 60 * 59)).toBe('23:59');
    });

    it('returns placeholder for invalid values', () => {
      expect(formatGameClock(Number.POSITIVE_INFINITY)).toBe('--:--');
    });
  });

  describe('isGamePaused', () => {
    beforeEach(() => {
      // eslint-disable-next-line no-underscore-dangle
      delete window.__gamePaused;
    });

    it('reads pause state from the window object', () => {
      expect(isGamePaused()).toBe(false);
      // eslint-disable-next-line no-underscore-dangle
      window.__gamePaused = true;
      expect(isGamePaused()).toBe(true);
      // eslint-disable-next-line no-underscore-dangle
      window.__gamePaused = false;
      expect(isGamePaused()).toBe(false);
    });
  });
});

import '@testing-library/jest-dom';

// Optional: robust fetch for Node < 18
// import 'whatwg-fetch';

// Mock HTMLMediaElement so music tests don't blow up in jsdom
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

// If your code uses Audio(...)
vi.stubGlobal('Audio', class {
  src = '';
  loop = false;
  volume = 1;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
});

// Handy: fake timers by default for time-driven hooks; opt-out per test when needed
// vi.useFakeTimers();  // uncomment if most tests are timer-based

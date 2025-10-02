import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

const createFetchStub = () =>
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => ''
    })
  );

const createAudioStub = () =>
  vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));

const createCachesStub = () => ({
  open: vi.fn(),
  match: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
  put: vi.fn()
});

const createMatchMediaStub = () =>
  vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));

let fetchStub = createFetchStub();
let AudioStub = createAudioStub();
let cachesStub = createCachesStub();
let matchMediaStub = createMatchMediaStub();

global.fetch = fetchStub;
globalThis.Audio = AudioStub;
window.caches = cachesStub;
window.matchMedia = matchMediaStub;

afterEach(() => {
  fetchStub = createFetchStub();
  AudioStub = createAudioStub();
  cachesStub = createCachesStub();
  matchMediaStub = createMatchMediaStub();

  global.fetch = fetchStub;
  globalThis.Audio = AudioStub;
  window.caches = cachesStub;
  window.matchMedia = matchMediaStub;
});

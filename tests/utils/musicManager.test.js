import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import playlist from '../../src/assets/songs/playlist.js';

function createAudioMocks() {
  const instances = [];
  const AudioMock = vi.fn(() => {
    const listeners = new Map();
    const audio = {
      readyState: 3,
      src: '',
      preload: '',
      crossOrigin: '',
      currentTime: 0,
      duration: 120,
      volume: 0,
      load: vi.fn(),
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        listeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        const stored = listeners.get(event);
        if (stored && (!handler || stored === handler)) {
          listeners.delete(event);
        }
      }),
      trigger(event) {
        const handler = listeners.get(event);
        if (handler) handler();
      }
    };
    instances.push(audio);
    return audio;
  });
  return { AudioMock, instances };
}

describe('musicManager', () => {
  let AudioMock;
  let audioInstances;
  let cacheAddMock;
  let openMock;
  let originalCaches;

  beforeEach(() => {
    vi.resetModules();
    cacheAddMock = vi.fn(() => Promise.resolve());
    ({ AudioMock, instances: audioInstances } = createAudioMocks());
    openMock = vi.fn(async () => ({ add: cacheAddMock }));
    vi.stubGlobal('Audio', AudioMock);
    originalCaches = globalThis.caches;
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      writable: true,
      value: { open: openMock }
    });
    localStorage.removeItem('musicVolume');
    // eslint-disable-next-line no-underscore-dangle
    delete window.__music;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    // eslint-disable-next-line no-underscore-dangle
    delete window.__music;
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      Object.defineProperty(globalThis, 'caches', {
        configurable: true,
        writable: true,
        value: originalCaches
      });
    }
  });

  it('preloads playlist entries into mocked audio instances', async () => {
    const { preloadMusic, musicState } = await import('../../src/utils/musicManager.js');
    const progressSpy = vi.fn();

    await preloadMusic(progressSpy);

    expect(AudioMock).toHaveBeenCalledTimes(playlist.length);
    expect(audioInstances.map((a) => a.src)).toEqual(playlist.map((t) => t.src));
    expect(audioInstances.every((a) => a.volume === 0.05)).toBe(true);
    expect(progressSpy).toHaveBeenCalled();
    expect(musicState()).toMatchObject({ ready: true, isPlaying: false, index: 0 });
  });

  it('plays, pauses, toggles music, and notifies subscribers', async () => {
    const {
      preloadMusic,
      musicToggle,
      musicPause,
      musicState,
      musicSubscribe
    } = await import('../../src/utils/musicManager.js');

    const listener = vi.fn();
    const unsubscribe = musicSubscribe(listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ ready: false, isPlaying: false }));
    listener.mockClear();

    await preloadMusic();
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ ready: true }));
    listener.mockClear();

    await musicToggle();
    await Promise.resolve();
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    expect(musicState().isPlaying).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: true }));

    musicPause();
    expect(audioInstances[0].pause).toHaveBeenCalledTimes(1);
    expect(musicState().isPlaying).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: false }));

    await musicToggle();
    await Promise.resolve();
    expect(audioInstances[0].play).toHaveBeenCalledTimes(2);
    expect(musicState().isPlaying).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: true }));

    unsubscribe();
  });

  it('clamps volume values and updates listeners and audio instances', async () => {
    const {
      preloadMusic,
      musicSetVolume,
      musicState,
      musicSubscribe
    } = await import('../../src/utils/musicManager.js');

    await preloadMusic();

    const listener = vi.fn();
    const unsubscribe = musicSubscribe(listener);
    listener.mockClear();

    musicSetVolume(2);
    expect(musicState().volume).toBe(1);
    expect(audioInstances.every((a) => a.volume === 1)).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 1 }));

    listener.mockClear();
    musicSetVolume(-0.4);
    expect(musicState().volume).toBe(0);
    expect(audioInstances.every((a) => a.volume === 0)).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 0 }));

    listener.mockClear();
    musicSetVolume('invalid');
    expect(listener).not.toHaveBeenCalled();
    expect(musicState().volume).toBe(0);

    unsubscribe();
  });

  it('uses cache storage gracefully across hits and misses', async () => {
    const originalRequest = globalThis.Request;
    class FakeRequest {
      constructor(input, init = {}) {
        this.url = typeof input === 'string' ? input : input?.url ?? '';
        this.init = init;
      }
    }
    Object.defineProperty(globalThis, 'Request', {
      configurable: true,
      writable: true,
      value: FakeRequest
    });

    cacheAddMock.mockImplementation((request) => {
      const url = request?.url ?? String(request);
      return url.includes('Town1') ? Promise.reject(new Error('cache miss')) : Promise.resolve();
    });

    try {
      const { preloadMusic } = await import('../../src/utils/musicManager.js');

      await expect(preloadMusic()).resolves.toBeUndefined();
      expect(openMock).toHaveBeenCalledWith('music-assets-v1');
      expect(cacheAddMock).toHaveBeenCalled();
    } finally {
      if (originalRequest === undefined) {
        delete globalThis.Request;
      } else {
        Object.defineProperty(globalThis, 'Request', {
          configurable: true,
          writable: true,
          value: originalRequest
        });
      }
    }
  });
});

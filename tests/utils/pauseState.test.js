import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exitPointerLockSafely, openPauseGate, closePauseGate } from '../../src/utils/pauseState.js';

describe('pauseState utilities', () => {
  let exitPointerLockMock;
  let pointerLockElementDescriptor;

  beforeEach(() => {
    vi.restoreAllMocks();
    exitPointerLockMock = vi.fn();
    Object.defineProperty(document, 'exitPointerLock', {
      configurable: true,
      writable: true,
      value: exitPointerLockMock
    });
    pointerLockElementDescriptor = Object.getOwnPropertyDescriptor(document, 'pointerLockElement');
    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      writable: true,
      value: null
    });
    // eslint-disable-next-line no-underscore-dangle
    delete window.__gamePaused;
    // eslint-disable-next-line no-underscore-dangle
    delete window.__pauseMenuActive;
    // eslint-disable-next-line no-underscore-dangle
    delete window.__pauseMenuWasPausedBefore;
  });

  afterEach(() => {
    // eslint-disable-next-line no-underscore-dangle
    delete window.__gamePaused;
    // eslint-disable-next-line no-underscore-dangle
    delete window.__pauseMenuActive;
    // eslint-disable-next-line no-underscore-dangle
    delete window.__pauseMenuWasPausedBefore;
    if (pointerLockElementDescriptor) {
      Object.defineProperty(document, 'pointerLockElement', pointerLockElementDescriptor);
    } else {
      delete document.pointerLockElement;
    }
    delete document.exitPointerLock;
  });

  it('exits pointer lock only when an element is locked and swallows exit errors', () => {
    document.pointerLockElement = {};
    exitPointerLockSafely();
    expect(exitPointerLockMock).toHaveBeenCalledTimes(1);

    exitPointerLockMock.mockImplementationOnce(() => { throw new Error('fail'); });
    document.pointerLockElement = {};
    expect(() => exitPointerLockSafely()).not.toThrow();
    expect(exitPointerLockMock).toHaveBeenCalledTimes(2);

    document.pointerLockElement = null;
    exitPointerLockSafely();
    expect(exitPointerLockMock).toHaveBeenCalledTimes(2);
  });

  it('opens the pause gate, tracks previous pause state, and unlocks pointer when requested', () => {
    document.pointerLockElement = { nodeName: 'CANVAS' };
    // eslint-disable-next-line no-underscore-dangle
    window.__gamePaused = false;

    const wasPaused = openPauseGate();
    expect(wasPaused).toBe(false);
    expect(exitPointerLockMock).toHaveBeenCalledTimes(1);
    expect(window.__pauseMenuActive).toBe(true);
    expect(window.__pauseMenuWasPausedBefore).toBe(false);
    expect(window.__gamePaused).toBe(true);

    exitPointerLockMock.mockClear();
    document.pointerLockElement = { nodeName: 'CANVAS' };
    // eslint-disable-next-line no-underscore-dangle
    window.__gamePaused = true;

    const wasPausedAlready = openPauseGate();
    expect(wasPausedAlready).toBe(true);
    expect(window.__pauseMenuWasPausedBefore).toBe(true);
    expect(exitPointerLockMock).toHaveBeenCalledTimes(1);

    exitPointerLockMock.mockClear();
    document.pointerLockElement = { nodeName: 'CANVAS' };
    openPauseGate({ forcePointerUnlock: false });
    expect(exitPointerLockMock).not.toHaveBeenCalled();
  });

  it('closes the pause gate and restores the previous pause state', () => {
    // Start unpaused -> open -> close should leave game unpaused
    const wasPaused = openPauseGate();
    expect(wasPaused).toBe(false);
    closePauseGate();
    expect(window.__gamePaused).toBe(false);
    expect(window.__pauseMenuActive).toBeUndefined();
    expect(window.__pauseMenuWasPausedBefore).toBeUndefined();

    // Start paused -> open -> close should keep pause flag
    // eslint-disable-next-line no-underscore-dangle
    window.__gamePaused = true;
    openPauseGate();
    closePauseGate();
    expect(window.__gamePaused).toBe(true);
  });
});

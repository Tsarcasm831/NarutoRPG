import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorldEvents } from '../../src/hooks/useWorldEvents.js';
import { WORLD_EVENT_SEQUENCE } from '../../src/game/worldEvents.js';
import * as pauseState from '../../src/utils/pauseState.js';

const {
  cacheAssetsMock,
  loadDistrictLayoutsMock,
  cloneDistrictLayoutMock
} = vi.hoisted(() => ({
  cacheAssetsMock: vi.fn(),
  loadDistrictLayoutsMock: vi.fn(),
  cloneDistrictLayoutMock: vi.fn()
}));

vi.mock('../../src/utils/assetLoader.js', () => ({
  cacheAssets: cacheAssetsMock
}));

vi.mock('../../src/utils/districtLayouts.js', () => ({
  loadDistrictLayouts: loadDistrictLayoutsMock,
  cloneDistrictLayout: cloneDistrictLayoutMock
}));

describe('useWorldEvents', () => {
  let openPauseGateSpy;
  let closePauseGateSpy;
  let layoutSetSpies;
  let layoutValueAccessors;
  let setTimeoutSpy;
  const nearBoundaryHour = 5.99;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    cacheAssetsMock.mockImplementation(async (urls = [], onProgress) => {
      if (typeof onProgress === 'function') {
        onProgress(0.5);
        onProgress(1);
      }
    });

    loadDistrictLayoutsMock.mockImplementation(async (ids = [], { target } = {}) => {
      if (!target) return {};
      ids.forEach((id) => {
        target[id] = { entries: [`override-${id}`], marker: `override-${id}` };
      });
      return target;
    });

    cloneDistrictLayoutMock.mockImplementation((layout) => {
      if (!layout) return null;
      return JSON.parse(JSON.stringify(layout));
    });

    layoutSetSpies = new Map();
    layoutValueAccessors = new Map();
    const layoutCache = {};
    const overrideIds = new Set();

    WORLD_EVENT_SEQUENCE.forEach((eventDef) => {
      (eventDef.districtOverrides || []).forEach(({ id }) => {
        overrideIds.add(id);
      });
    });

    overrideIds.forEach((id) => {
      const baseline = { entries: [`baseline-${id}`], marker: `baseline-${id}` };
      let current = baseline;
      layoutValueAccessors.set(id, () => current);
      const setterSpy = vi.fn((value) => {
        current = value;
      });
      layoutSetSpies.set(id, setterSpy);
      Object.defineProperty(layoutCache, id, {
        configurable: true,
        enumerable: true,
        get() {
          return current;
        },
        set(value) {
          setterSpy(value);
          current = value;
        }
      });
    });

    Object.defineProperty(window, '__districtLayouts', {
      configurable: true,
      writable: true,
      value: layoutCache
    });

    openPauseGateSpy = vi.spyOn(pauseState, 'openPauseGate');
    closePauseGateSpy = vi.spyOn(pauseState, 'closePauseGate');
    setTimeoutSpy = vi.spyOn(window, 'setTimeout');
  });

  afterEach(() => {
    openPauseGateSpy?.mockRestore();
    closePauseGateSpy?.mockRestore();
    setTimeoutSpy?.mockRestore();
    vi.clearAllMocks();
    // eslint-disable-next-line no-underscore-dangle
    delete window.__districtLayouts;
    vi.useRealTimers();
  });

  it('cycles through world events, applying overlays and reverting overrides', async () => {
    const boundaryHours = WORLD_EVENT_SEQUENCE.map((_, idx) => (idx * 6 + nearBoundaryHour) % 24);
    const { result, rerender } = renderHook((props) => useWorldEvents(props), {
      initialProps: { gameState: 'Playing', timeOfDayHours: boundaryHours[0] }
    });

    let loadCallIndex = 0;
    let setTimeoutSearchIndex = 0;

    for (let index = 0; index < WORLD_EVENT_SEQUENCE.length; index += 1) {
      const eventDef = WORLD_EVENT_SEQUENCE[index];

      await act(async () => {});
      expect(result.current.upcomingEvent?.event?.id).toBe(eventDef.id);

      expect(result.current.upcomingEvent.event.label).toBe(eventDef.label);
      expect(result.current.upcomingEvent.event.description).toBe(eventDef.description);

      const initialCountdown = result.current.nextEventCountdownMs;
      expect(initialCountdown).toBeGreaterThan(0);

      const partialAdvance = Math.min(1000, Math.max(1, initialCountdown - 200));
      act(() => {
        vi.advanceTimersByTime(partialAdvance);
      });

      if (result.current.nextEventCountdownMs != null) {
        expect(result.current.nextEventCountdownMs).toBeLessThan(initialCountdown);
      }

      const remaining = Math.max(0, initialCountdown - partialAdvance);
      act(() => {
        vi.advanceTimersByTime(remaining + 100);
      });

      expect(result.current.eventOverlay?.event?.id).toBe(eventDef.id);
      expect(result.current.eventOverlay.stage).toBe('intro');
      expect(result.current.eventOverlay.status).toBe('ready');
      expect(openPauseGateSpy).toHaveBeenCalledTimes(index + 1);

      await act(async () => {
        await result.current.acknowledgeEvent();
      });

      expect(cacheAssetsMock).toHaveBeenCalledTimes(index + 1);
      const [assetList, progressCb] = cacheAssetsMock.mock.calls[index];
      expect(assetList).toEqual(eventDef.assets || []);
      expect(typeof progressCb).toBe('function');

      if (eventDef.districtOverrides?.length) {
        expect(loadDistrictLayoutsMock).toHaveBeenCalledTimes(loadCallIndex + 1);
        const [ids, options] = loadDistrictLayoutsMock.mock.calls[loadCallIndex];
        expect(ids).toEqual(eventDef.districtOverrides.map(({ id }) => id));
        expect(options).toMatchObject({
          customSources: eventDef.districtOverrides,
          forceReload: true,
          target: window.__districtLayouts
        });
        loadCallIndex += 1;
      }

      expect(result.current.eventOverlay).toBeNull();
      expect(closePauseGateSpy).toHaveBeenCalledTimes(index + 1);
      expect(result.current.upcomingEvent).toBeNull();
      expect(result.current.nextEventCountdownMs).toBeNull();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
      const relativeEndIndex = setTimeoutSpy.mock.calls
        .slice(setTimeoutSearchIndex)
        .findIndex(([, delay]) => delay >= (eventDef.durationMs ?? 60000));
      expect(relativeEndIndex).toBeGreaterThanOrEqual(0);
      const actualEndIndex = setTimeoutSearchIndex + relativeEndIndex;
      const endTimerCall = setTimeoutSpy.mock.calls[actualEndIndex];
      setTimeoutSearchIndex = actualEndIndex + 1;

      expect(result.current.activeEvent).not.toBeNull();
      expect(result.current.activeEvent.id).toBe(eventDef.id);
      expect(result.current.activeEvent.label).toBe(eventDef.label);
      expect(result.current.activeEvent.description).toBe(eventDef.description);
      const expectedTags = Array.from(new Set([eventDef.type, ...(eventDef.tags || [])].filter(Boolean)));
      expect(result.current.activeEvent.tags).toEqual(expectedTags);
      expect(result.current.activeEvent.buffs).toEqual(eventDef.buffs || {});

      expect(result.current.worldState.activeEvent.id).toBe(eventDef.id);
      expect(result.current.worldState.buffs).toEqual(eventDef.buffs || {});
      expect(result.current.worldState.tags).toEqual(expectedTags);
      expect(result.current.worldState.metadata).toEqual(eventDef.worldStatePatch || {});

      (eventDef.districtOverrides || []).forEach(({ id }) => {
        const overrideSpy = layoutSetSpies.get(id);
        expect(overrideSpy).toBeDefined();
        const lastCall = overrideSpy.mock.calls.at(-1)?.[0];
        expect(lastCall).toBeDefined();
        expect(lastCall.marker).toBe(`override-${id}`);
      });

      await act(async () => {
        endTimerCall[0]?.();
      });
      await act(async () => {});

      expect(result.current.activeEvent).toBeNull();
      expect(result.current.worldState.activeEvent).toBeNull();
      expect(result.current.worldState.buffs).toEqual({});
      expect(result.current.worldState.tags).toEqual([]);
      expect(result.current.worldState.metadata).toEqual({});

      (eventDef.districtOverrides || []).forEach(({ id }) => {
        const overrideSpy = layoutSetSpies.get(id);
        const lastCall = overrideSpy.mock.calls.at(-1)?.[0];
        expect(lastCall).toBeDefined();
        expect(lastCall.marker).toBe(`baseline-${id}`);
        const getValue = layoutValueAccessors.get(id);
        expect(getValue()).toEqual({ entries: [`baseline-${id}`], marker: `baseline-${id}` });
      });

      if (index + 1 < boundaryHours.length) {
        await act(async () => {
          rerender({ gameState: 'Playing', timeOfDayHours: boundaryHours[index + 1] });
        });
      }
    }
  });

  it('dismisses overlays without activating events', async () => {
    const { result } = renderHook((props) => useWorldEvents(props), {
      initialProps: { gameState: 'Playing', timeOfDayHours: nearBoundaryHour }
    });

    await act(async () => {});
    expect(result.current.upcomingEvent?.event?.id).toBe(WORLD_EVENT_SEQUENCE[0].id);

    const initialCountdown = result.current.nextEventCountdownMs;
    act(() => {
      vi.advanceTimersByTime(initialCountdown + 50);
    });

    expect(result.current.eventOverlay?.event?.id).toBe(WORLD_EVENT_SEQUENCE[0].id);
    expect(openPauseGateSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.dismissEventOverlay();
    });

    expect(closePauseGateSpy).toHaveBeenCalledTimes(1);
    expect(result.current.eventOverlay).toBeNull();
    expect(result.current.activeEvent).toBeNull();
    expect(result.current.worldState.activeEvent).toBeNull();
    expect(result.current.worldState.buffs).toEqual({});
    expect(cacheAssetsMock).not.toHaveBeenCalled();
    expect(loadDistrictLayoutsMock).not.toHaveBeenCalled();

    await act(async () => {});
    expect(result.current.upcomingEvent?.event?.id).toBe(WORLD_EVENT_SEQUENCE[1].id);
  });
});

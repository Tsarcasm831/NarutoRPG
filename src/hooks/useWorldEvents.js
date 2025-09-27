import { useCallback, useEffect, useRef, useState } from 'react';
import { WORLD_EVENT_SEQUENCE, WORLD_EVENT_DEFAULTS } from '../game/worldEvents.js';
import { cacheAssets } from '../utils/assetLoader.js';
import { loadDistrictLayouts, cloneDistrictLayout } from '../utils/districtLayouts.js';
import { openPauseGate, closePauseGate } from '../utils/pauseState.js';
import { HOURS_PER_DAY, SECONDS_PER_HOUR, GAME_SECONDS_PER_REAL_SECOND } from '../utils/time.js';

const EMPTY_WORLD_STATE = {
    version: 0,
    activeEvent: null,
    buffs: {},
    tags: [],
    metadata: {},
    worldStatePatch: {}
};

const ensureLayoutCache = () => {
    if (typeof window === 'undefined') return {};
    window.__districtLayouts = window.__districtLayouts || {};
    return window.__districtLayouts;
};

export function useWorldEvents({ gameState, timeOfDayHours }) {
    const [worldState, setWorldState] = useState(EMPTY_WORLD_STATE);
    const [overlay, setOverlay] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null);
    const [upcoming, setUpcoming] = useState(null);
    const [nextCountdownMs, setNextCountdownMs] = useState(null);

    const pendingEventRef = useRef(null);
    const activeEventRef = useRef(null);
    const schedulesRef = useRef({ nextTimeout: null, endTimeout: null });
    const baselineLayoutsRef = useRef(new Map());
    const appliedOverridesRef = useRef([]);
    const nextIndexRef = useRef(0);

    const clearTimers = useCallback(() => {
        if (schedulesRef.current.nextTimeout) {
            clearTimeout(schedulesRef.current.nextTimeout);
            schedulesRef.current.nextTimeout = null;
        }
        if (schedulesRef.current.endTimeout) {
            clearTimeout(schedulesRef.current.endTimeout);
            schedulesRef.current.endTimeout = null;
        }
    }, []);

    const applyOverrides = useCallback(async (overrides = []) => {
        if (!Array.isArray(overrides) || overrides.length === 0) return;
        const cache = ensureLayoutCache();
        const toLoad = [];
        overrides.forEach(({ id, urls }) => {
            if (!id) return;
            if (!baselineLayoutsRef.current.has(id)) {
                baselineLayoutsRef.current.set(id, cloneDistrictLayout(cache[id]));
            }
            toLoad.push({ id, urls });
        });
        if (toLoad.length === 0) return;
        await loadDistrictLayouts(toLoad.map((entry) => entry.id), {
            customSources: toLoad,
            forceReload: true,
            target: cache
        });
    }, []);

    const revertOverrides = useCallback((overrides = []) => {
        if (!Array.isArray(overrides) || overrides.length === 0) return;
        const cache = ensureLayoutCache();
        overrides.forEach(({ id }) => {
            if (!id) return;
            const baseline = baselineLayoutsRef.current.get(id);
            if (baseline) {
                cache[id] = cloneDistrictLayout(baseline) || baseline;
            } else {
                delete cache[id];
            }
            baselineLayoutsRef.current.delete(id);
        });
    }, []);

    const concludeEvent = useCallback((eventDef) => {
        const current = activeEventRef.current;
        if (!current || current.def.id !== eventDef.id) {
            return;
        }
        revertOverrides(appliedOverridesRef.current);
        appliedOverridesRef.current = [];
        activeEventRef.current = null;
        setActiveEvent(null);
        setWorldState({
            ...EMPTY_WORLD_STATE,
            version: Date.now()
        });
    }, [revertOverrides]);

    const scheduleEventEnd = useCallback((eventDef, endsAtMs) => {
        if (!eventDef) return;
        if (schedulesRef.current.endTimeout) {
            clearTimeout(schedulesRef.current.endTimeout);
        }
        const delay = Math.max(0, (endsAtMs || 0) - Date.now());
        schedulesRef.current.endTimeout = window.setTimeout(() => {
            schedulesRef.current.endTimeout = null;
            concludeEvent(eventDef);
        }, delay);
    }, [concludeEvent]);

    const scheduleNext = useCallback((eventDef, baseDelay) => {
        if (!eventDef) {
            setUpcoming(null);
            setNextCountdownMs(null);
            return;
        }
        if (schedulesRef.current.nextTimeout) {
            clearTimeout(schedulesRef.current.nextTimeout);
            schedulesRef.current.nextTimeout = null;
        }
        const delay = Math.max(0, baseDelay ?? eventDef.startDelayMs ?? WORLD_EVENT_DEFAULTS.startDelayMs ?? 0);
        const eta = Date.now() + delay;
        schedulesRef.current.nextTimeout = window.setTimeout(() => {
            schedulesRef.current.nextTimeout = null;
            pendingEventRef.current = eventDef;
            setUpcoming(null);
            setNextCountdownMs(null);
            openPauseGate();
            setOverlay({
                stage: 'intro',
                status: 'ready',
                progress: 0,
                event: eventDef
            });
        }, delay);
        setUpcoming({ event: eventDef, eta });
    }, []);

    const acknowledgeEvent = useCallback(async () => {
        const eventDef = pendingEventRef.current;
        if (!eventDef) {
            setOverlay(null);
            closePauseGate({});
            return;
        }
        setOverlay((prev) => prev && prev.event.id === eventDef.id ? { ...prev, status: 'loading', progress: Math.max(prev.progress || 0, 5) } : prev);
        try {
            if (Array.isArray(eventDef.assets) && eventDef.assets.length) {
                await cacheAssets(eventDef.assets, (progress) => {
                    setOverlay((prev) => {
                        if (!prev || prev.event.id !== eventDef.id) return prev;
                        const mapped = Math.min(60, Math.round(progress * 0.6));
                        return { ...prev, progress: Math.max(prev.progress || 0, mapped) };
                    });
                });
            }

            setOverlay((prev) => prev && prev.event.id === eventDef.id ? { ...prev, progress: Math.max(prev.progress || 0, 70) } : prev);
            if (Array.isArray(eventDef.districtOverrides) && eventDef.districtOverrides.length) {
                await applyOverrides(eventDef.districtOverrides);
            }

            setOverlay((prev) => prev && prev.event.id === eventDef.id ? { ...prev, progress: 100 } : prev);

            const startedAt = Date.now();
            const duration = Math.max(1000, eventDef.durationMs ?? WORLD_EVENT_DEFAULTS.durationMs ?? 60000);
            const endsAt = startedAt + duration;

            const tags = Array.from(new Set([eventDef.type, ...(eventDef.tags || [])].filter(Boolean)));
            const active = {
                id: eventDef.id,
                label: eventDef.label,
                type: eventDef.type,
                description: eventDef.description,
                startedAt,
                endsAt,
                buffs: eventDef.buffs || {},
                tags,
                worldStatePatch: eventDef.worldStatePatch || {}
            };

            appliedOverridesRef.current = eventDef.districtOverrides || [];
            activeEventRef.current = { def: eventDef, info: active };
            pendingEventRef.current = null;
            setActiveEvent(active);
            setWorldState({
                version: startedAt,
                activeEvent: active,
                buffs: active.buffs,
                tags,
                metadata: active.worldStatePatch,
                worldStatePatch: active.worldStatePatch
            });
            setOverlay(null);
            closePauseGate({});

            scheduleEventEnd(eventDef, endsAt);
            nextIndexRef.current = (nextIndexRef.current + 1) % Math.max(1, WORLD_EVENT_SEQUENCE.length);
        } catch (error) {
            console.error('World event activation failed:', error);
            setOverlay((prev) => prev && prev.event.id === eventDef.id ? { ...prev, status: 'error', error } : prev);
        }
    }, [applyOverrides, scheduleEventEnd]);

    const dismissOverlay = useCallback(() => {
        const pending = pendingEventRef.current;
        pendingEventRef.current = null;
        setOverlay(null);
        closePauseGate({});
        if (pending) {
            nextIndexRef.current = (nextIndexRef.current + 1) % Math.max(1, WORLD_EVENT_SEQUENCE.length);
        }
    }, []);

    useEffect(() => {
        if (!upcoming) {
            setNextCountdownMs(null);
            return;
        }
        const update = () => {
            const remaining = Math.max(0, upcoming.eta - Date.now());
            setNextCountdownMs(remaining);
        };
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [upcoming]);

    useEffect(() => {
        if (gameState !== 'Playing') {
            clearTimers();
            if (overlay) {
                closePauseGate({});
            }
            if (activeEventRef.current) {
                concludeEvent(activeEventRef.current.def);
            } else {
                revertOverrides(appliedOverridesRef.current);
                appliedOverridesRef.current = [];
            }
            pendingEventRef.current = null;
            setOverlay(null);
            setUpcoming(null);
            setNextCountdownMs(null);
            nextIndexRef.current = 0;
            return;
        }
        return () => clearTimers();
    }, [gameState, clearTimers, overlay, concludeEvent, revertOverrides]);

    // Tie event scheduling to in-game time: every 6 in-game hours
    useEffect(() => {
        if (gameState !== 'Playing') return;
        if (typeof timeOfDayHours !== 'number') return;
        // If an event/overlay/pending action is active, do not schedule the next one yet
        if (pendingEventRef.current || activeEventRef.current || overlay) {
            setUpcoming(null);
            if (schedulesRef.current.nextTimeout) {
                clearTimeout(schedulesRef.current.nextTimeout);
                schedulesRef.current.nextTimeout = null;
            }
            return;
        }

        const hour = ((timeOfDayHours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
        const currentCycle = Math.floor(hour / 6); // 0..3
        const nextBoundaryIndex = (currentCycle + 1) % 4;
        const nextBoundaryHour = nextBoundaryIndex * 6;
        let diffHours = nextBoundaryHour - hour;
        if (diffHours <= 0) diffHours += 24;
        const realMs = Math.max(0, Math.round((diffHours * SECONDS_PER_HOUR) / GAME_SECONDS_PER_REAL_SECOND * 1000));

        const eventDef = WORLD_EVENT_SEQUENCE[nextIndexRef.current] || null;
        if (!eventDef) {
            setUpcoming(null);
            return;
        }

        // Always clear and reschedule to adapt to pause/resume and speed changes
        if (schedulesRef.current.nextTimeout) {
            clearTimeout(schedulesRef.current.nextTimeout);
            schedulesRef.current.nextTimeout = null;
        }
        scheduleNext(eventDef, realMs);
    }, [gameState, timeOfDayHours, overlay]);

    return {
        worldState,
        eventOverlay: overlay,
        acknowledgeEvent,
        dismissEventOverlay: dismissOverlay,
        activeEvent,
        upcomingEvent: upcoming,
        nextEventCountdownMs: nextCountdownMs
    };
}

import { useEffect, useState } from 'react';

const clampProgress = (value) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

let progress = 0;
let steps = [];

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (_) {
      // ignore listener errors so others still run
    }
  });
};

const cloneSteps = (list) => (Array.isArray(list) ? list.map((step) => ({ ...step })) : []);

const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return { progress, steps };
  },
  reset() {
    const changed = progress !== 0 || (Array.isArray(steps) && steps.length !== 0);
    progress = 0;
    steps = [];
    if (changed) notify();
  },
  setSteps(next) {
    const normalized = cloneSteps(next);
    const sameLength = Array.isArray(steps) && steps.length === normalized.length;
    let identical = sameLength;
    if (sameLength) {
      for (let i = 0; i < steps.length; i += 1) {
        const prev = steps[i];
        const curr = normalized[i];
        if (!prev || !curr) {
          identical = false;
          break;
        }
        const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
        for (const key of keys) {
          if (prev[key] !== curr[key]) {
            identical = false;
            break;
          }
        }
        if (!identical) break;
      }
    }
    if (identical) return;
    steps = normalized;
    notify();
  },
  updateStep(id, partial = {}) {
    if (!Array.isArray(steps) || steps.length === 0) return;
    let changed = false;
    const next = steps.map((step) => {
      if (!step || step.id !== id) return step;
      const merged = { ...step, ...partial };
      const keys = new Set([...Object.keys(step), ...Object.keys(merged)]);
      for (const key of keys) {
        if (step[key] !== merged[key]) {
          changed = true;
          break;
        }
      }
      return merged;
    });
    if (!changed) return;
    steps = next;
    notify();
  },
  setProgress(value) {
    const next = clampProgress(value);
    if (next === progress) return;
    progress = next;
    notify();
  },
  updateProgress(updater) {
    const next = typeof updater === 'function' ? updater(progress) : updater;
    store.setProgress(next);
  },
  getProgress() {
    return progress;
  },
  getSteps() {
    return steps;
  }
};

export const loadingStore = store;

export const useLoadingSnapshot = () =>
  {
    const [snapshot, setSnapshot] = useState(() => store.getSnapshot());
    useEffect(() => {
      const unsubscribe = store.subscribe(() => {
        setSnapshot(store.getSnapshot());
      });
      return unsubscribe;
    }, []);
    return snapshot;
  };

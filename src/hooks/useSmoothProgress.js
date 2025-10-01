import { useEffect, useRef, useState } from 'react';

const clamp = (value) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

export const useSmoothProgress = (target, options = {}) => {
  const immediate = !!options.immediate;
  const minStep = Number.isFinite(options.minStep) ? Math.max(0.01, options.minStep) : 1.2;
  const smoothingFactor = Number.isFinite(options.smoothingFactor) ? Math.max(0.01, options.smoothingFactor) : 0.25;
  const settleThreshold = Number.isFinite(options.settleThreshold) ? Math.max(0.01, options.settleThreshold) : 0.6;

  const [displayed, setDisplayed] = useState(() => clamp(target));
  const targetRef = useRef(clamp(target));
  const rafRef = useRef(null);
  const configRef = useRef({ immediate, minStep, smoothingFactor, settleThreshold });

  useEffect(() => {
    targetRef.current = clamp(target);
  }, [target]);

  useEffect(() => {
    configRef.current = { immediate, minStep, smoothingFactor, settleThreshold };
  }, [immediate, minStep, smoothingFactor, settleThreshold]);

  useEffect(() => {
    const config = configRef.current;
    if (config.immediate) {
      setDisplayed(targetRef.current);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return () => {};
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      let shouldContinue = false;
      setDisplayed((current) => {
        const dest = targetRef.current;
        const { minStep: stepMin, smoothingFactor: factor, settleThreshold: settle } = configRef.current;
        const diff = dest - current;
        if (Math.abs(diff) <= settle) {
          return dest;
        }
        shouldContinue = true;
        const magnitude = Math.max(Math.abs(diff) * factor, stepMin);
        const delta = diff > 0 ? magnitude : -magnitude;
        const next = current + delta;
        return diff > 0 ? Math.min(dest, next) : Math.max(dest, next);
      });
      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, immediate, minStep, smoothingFactor, settleThreshold]);

  return clamp(displayed);
};

import { useEffect, useMemo, useRef } from 'react';

// Custom hook for throttling a function
export function useThrottle(callback, delay) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);
  const lastRanRef = useRef(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useMemo(() => {
    const fun = (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const now = Date.now();
      const remaining = delay - (now - lastRanRef.current);
      
      if (remaining <= 0) {
        lastRanRef.current = now;
        callbackRef.current(...args);
      } else {
        timeoutRef.current = setTimeout(() => {
          lastRanRef.current = Date.now();
          timeoutRef.current = null;
          callbackRef.current(...args);
        }, remaining);
      }
    };

    fun.cancel = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = null;
    };

    return fun;
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}
// Simple linear congruential generator to allow reproducible variety
export function Lcg(seed = 123456789) {
  let s = seed >>> 0;
  return () => (s = (1664525 * s + 1013904223) >>> 0, (s >>> 0) / 4294967296);
}


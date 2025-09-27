// Small utilities used across district fill modules

// Deterministic 32-bit hash for variety selection
export function hash32(...parts) {
  let h = 2166136261 >>> 0; // FNV-1a style
  const mix = (n) => { h ^= (n >>> 0); h = Math.imul(h, 16777619); h ^= h >>> 13; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 16; h = Math.imul(h, 0xc2b2ae35); };
  for (const p of parts) {
    if (typeof p === 'number') { mix((p * 1000) | 0); }
    else if (typeof p === 'string') { for (let i = 0; i < p.length; i++) mix(p.charCodeAt(i)); }
    else if (Array.isArray(p)) { for (let i = 0; i < p.length; i++) mix(((p[i] || 0) * 1000) | 0); }
    else { mix(0x9e3779b9); }
  }
  return h >>> 0;
}

// Deterministic PRNG (mulberry32). Returns a function like Math.random.
export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

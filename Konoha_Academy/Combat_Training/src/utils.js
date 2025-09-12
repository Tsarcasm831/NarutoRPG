export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx*dx + dy*dy;
};
export const randRange = (a, b) => a + Math.random() * (b - a);
export const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
export const vecFromAngle = (ang, mag=1) => ({ x: Math.cos(ang)*mag, y: Math.sin(ang)*mag });
export const nowSec = () => performance.now() / 1000;
export const withLen = (x, y, len=1) => {
  const n = Math.hypot(x,y) || 1; return { x: x/n*len, y: y/n*len };
};
export const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const makeRNG = (seed=0x12345678) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5; let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};
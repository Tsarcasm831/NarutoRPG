import * as THREE from 'three';

export const GLOBAL_SCALE = 2;

export const DEFAULT_CONFIG = {
  includeGround: false,
  groundRadius: 240,
  groundColor: 0xE9D8A6,

  rotunda: {
    segments: 64,
    tiers: [
      { r: 46, h: 14, color: 0x8B0000 },
      { r: 36, h: 12, color: 0x8B0000 },
      { r: 26, h: 11, color: 0x8B0000 },
      { r: 18, h: 10, color: 0xF2F2F2 },
    ],
    trimHeight: 2.2,
    trimColor: 0x8a6a45,
    strut: { width: 2, depth: 2.2, inset: 2, everyDeg: 12, color: 0x5e1515, heightScale: 0.45 },
    crownFins: { count: 12, w: 3, t: 1.6, h: 10, tiltDeg: 15, color: 0xF2F2F2 },
    porch: { depth: 10, width: 22, roofOverhang: 2, height: 9 },
    emblem: { plateRadius: 9, plateColor: 0xB30000, symbolColor: 0x111111, offsetY: 8 }
  },

  podNormal: { r: 16, h: 10, capH: 4 },
  podLarge:  { r: 32, h: 20, capH: 8 },
  podPositions: [
    { x: -38, z:  4, large: true },
    { x:  38, z:  4, large: true },
    { x: -26, z: -36, large: false },
    { x:  26, z: -36, large: false },
  ],

  outerWall: {
    segments: 72,
    ellipse: { a: 105, b: 90 },
    thickness: 6,
    height: 6.5,
    postEveryDeg: 10,
    postSize: [1.6, 6.8, 3],
    railThickness: 1.2,
    color: 0x8a6a45,
    stepLip: 1.2,
    skipFrontSegments: 2 // remove two centered panels at +Z
  }
};

// Shallow-ish deep merge for plain objects (sufficient for our config)
export function deepMerge(base, overrides) {
  if (!overrides) return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(overrides)) {
    const v = overrides[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
// citySlice.basic.js
// A smaller, simpler subset of buildings that can be tinted across 12 roof palettes.
// Exports helpers to build a single basic set or 12 color variants.

// 12 named roof-color palettes (hex colors)
export const BASIC_ROOF_PALETTES = [
  { key: 'terracotta', color: 0xd24b30 },
  { key: 'orange',     color: 0xe0662f },
  { key: 'clay',       color: 0xb1492c },
  { key: 'teal',       color: 0x3a8f7b },
  { key: 'sea',        color: 0x3f844a },
  { key: 'blue',       color: 0x5b73b8 },
  { key: 'slate',      color: 0x2f3338 },
  { key: 'brickRed',   color: 0x9e2a2b },
  { key: 'gold',       color: 0xc59d29 },
  { key: 'jade',       color: 0x1f8a70 },
  { key: 'violet',     color: 0x6a4fb3 },
  { key: 'charcoal',   color: 0x444444 }
];

// Build a compact set of 5 brand-new buildings (original designs)
// roofColor: hex color used for primary roofs across the set.
export function buildBasicFive(THREE, kit, ex, { roofColor } = {}) {
  const P = kit.Palette;
  const RC = roofColor ?? P.roofTerracotta;
  const {
    spiralTower, lotusPavilion, fanRoofHall, skyBridgeTowers, tieredGardenHouse
  } = ex;

  return [
    spiralTower({ w: 60, d: 52, floors: 4, roofColor: RC, plaster: 'B' }),
    lotusPavilion({ r: 26, petals: 8, roofColor: RC, plaster: 'A' }),
    fanRoofHall({ w: 92, d: 44, roofColor: RC, plaster: 'C' }),
    skyBridgeTowers({ w: 40, d: 36, h: 22, gap: 64, roofColor: RC, plaster: 'B' }),
    tieredGardenHouse({ w: 92, d: 60, tiers: 3, roofColor: RC, plaster: 'A' })
  ];
}

// Legacy: a 12-piece compact set (kept for 'basic' variant compatibility)
export function buildBasic(THREE, kit, ex, { roofColor } = {}) {
  // reuse five unique buildings and augment with variations to reach 12
  const base = buildBasicFive(THREE, kit, ex, { roofColor });
  // Duplicate and slightly vary sizes for filler (kept simple)
  const varied = base.map((b, i) => {
    const g = b.clone(); g.scale.setScalar(0.95 + (i % 3) * 0.02); return g;
  });
  return base.concat(varied);
}

// Convenience: build a basic set using a palette index (0..11)
export function buildBasicWithPaletteIndex(THREE, kit, ex, { index = 0 } = {}) {
  const color = BASIC_ROOF_PALETTES[(index % BASIC_ROOF_PALETTES.length + BASIC_ROOF_PALETTES.length) % BASIC_ROOF_PALETTES.length].color;
  return buildBasicFive(THREE, kit, ex, { roofColor: color });
}

// Build all 12 variants: returns an array of { key, color, buildings }
export function buildBasicVariants(THREE, kit, ex) {
  return BASIC_ROOF_PALETTES.map(p => ({ key: p.key, color: p.color, buildings: buildBasicFive(THREE, kit, ex, { roofColor: p.color }) }));
}

// Build all 12 colors x 5 new buildings = 60 groups, ordered by rows=5 (designs), cols=12 (colors)
export function buildBasicFiveGrid(THREE, kit, ex) {
  const rows = 5, cols = BASIC_ROOF_PALETTES.length; // 5 x 12
  const result = [];
  // Row-major order: each row is one design across all 12 colors
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = BASIC_ROOF_PALETTES[c].color;
      const list = buildBasicFive(THREE, kit, ex, { roofColor: color });
      result.push(list[r]);
    }
  }
  return result;
}

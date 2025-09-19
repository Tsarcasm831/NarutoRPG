// Hyuuga builds: reuse the kitbash building factory but with Hyuuga palettes.
import { Lcg } from './kitbash/rng.js';
import { makeBuilding } from './kitbash/buildingFactory.js';
import { HYUUGA_PALETTES } from './hyuuga.palettes.js';
import { buildHyuugaOriginals } from './hyuuga.originals.js';

/**
 * Build a set of Hyuuga-style buildings.
 * - Uses the existing kitbash makeBuilding() shapes
 * - Applies Hyuuga color palettes (Japanese aesthetic)
 * - Upscales to match CitySlice proportions (like kitbash)
 */
export function buildHyuugaSet(THREE, { count = 30, paletteIndex = 0, seed } = {}) {
  const idx = (paletteIndex % HYUUGA_PALETTES.length + HYUUGA_PALETTES.length) % HYUUGA_PALETTES.length;
  const pal = HYUUGA_PALETTES[idx];
  const rng = Lcg(typeof seed === 'number' ? seed : (Math.random() * 1e9) | 0);
  const builds = [];
  // Seed some original Hyuuga-only shapes
  const originals = buildHyuugaOriginals(THREE, pal, rng).map((g, j) => {
    g.scale.setScalar(30);
    if (!g.name) g.name = `Hyuuga-Orig-${(j + 1).toString().padStart(2, '0')}`;
    return g;
  });
  builds.push(...originals);
  // Fill the rest with kitbash-derived buildings recolored in Hyuuga palette
  for (let i = builds.length; i < count; i++) {
    const b = makeBuilding(rng, pal);
    b.scale.setScalar(30);
    if (!b.name || typeof b.name !== 'string' || b.name.length === 0) b.name = `Hyuuga-${(i + 1).toString().padStart(2, '0')}`;
    builds.push(b);
  }
  return builds;
}

export { HYUUGA_PALETTES };

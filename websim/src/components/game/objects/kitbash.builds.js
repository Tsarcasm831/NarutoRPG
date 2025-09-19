// Public builder that produces an array of Kitbash-style building meshes
import { Lcg } from './kitbash/rng.js';
import { KITBASH_PALETTES } from './kitbash/palettes.js';
import { makeBuilding } from './kitbash/buildingFactory.js';

/**
 * Build a set of kitbash buildings.
 * @param {*} THREE three module (not used directly here, present for parity)
 * @param {Object} opts
 * @param {number} opts.count how many buildings to generate (default 30)
 * @param {number} opts.paletteIndex palette index to use
 * @param {number} opts.seed optional RNG seed for reproducibility
 */
export function buildKitbashSet(THREE, { count = 30, paletteIndex = 0, seed } = {}) {
  const idx = (paletteIndex % KITBASH_PALETTES.length + KITBASH_PALETTES.length) % KITBASH_PALETTES.length;
  const pal = KITBASH_PALETTES[idx];
  const rng = Lcg(typeof seed === 'number' ? seed : (Math.random() * 1e9) | 0);
  const builds = [];
  for (let i = 0; i < count; i++) {
    const b = makeBuilding(rng, pal);
    // Upscale to match citySlice proportions (pre-group scale)
    b.scale.setScalar(30);
    // Ensure a stable, recognizable name for selection/mapping
    if (!b.name || typeof b.name !== 'string' || b.name.length === 0) {
      b.name = `Kitbash-${(i + 1).toString().padStart(2, '0')}`;
    }
    builds.push(b);
  }
  return builds;
}

export { KITBASH_PALETTES };

// citySlice.builds.js
// Build selection helpers for City Slice variants.

import { createKit } from './citySlice.kit.js';
import { createExotics } from './citySlice.exotics.js';
import { buildOriginals } from './citySlice.originals.js';
import { buildMore } from './citySlice.more.js';
import { buildBasic, buildBasicFive, buildBasicFiveGrid, BASIC_ROOF_PALETTES } from './citySlice.basic.js';
import { buildKitbashSet } from './kitbash.builds.js';

export function getBuildsForVariant(THREE, { variant = 'default', basicPaletteIndex = 0 } = {}) {
  const kit = createKit(THREE);
  const ex = createExotics(THREE, kit);

  if (variant === 'basic') {
    const idx = (basicPaletteIndex % BASIC_ROOF_PALETTES.length + BASIC_ROOF_PALETTES.length) % BASIC_ROOF_PALETTES.length;
    const color = BASIC_ROOF_PALETTES[idx].color;
    const builds = buildBasicFive(THREE, kit, ex, { roofColor: color });
    return { builds, rows: 1, cols: builds.length };
  }
  if (variant === 'basic-grid' || variant === 'basicGrid') {
    const builds = buildBasicFiveGrid(THREE, kit, ex);
    return { builds, rows: 5, cols: BASIC_ROOF_PALETTES.length };
  }

  if (variant === 'kitbash') {
    // Generate a city-slice count by default (6x5)
    const builds = buildKitbashSet(THREE, { count: 30, paletteIndex: basicPaletteIndex });
    return { builds };
  }

  const originals = buildOriginals(THREE, kit, ex);
  const more = buildMore(THREE, kit, ex);
  const builds = originals.concat(more);
  // default layout is determined by caller (e.g., rows/cols 6x5)
  return { builds };
}

export { BASIC_ROOF_PALETTES };

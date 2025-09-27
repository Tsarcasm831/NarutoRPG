import { getBuildsForVariant } from '../../../../components/game/objects/citySlice.builds.js';
import { buildKitbashSet } from '../../../../components/game/objects/kitbash.builds.js';
import { DISTRICT_DEFAULT_VARIETY_RATIO } from './constants.js';
import { hash32 } from './utils.js';

export function makeTemplatePool(THREE, { source = 'mixed', paletteIndex = 0, seed } = {}) {
  const pool = [];
  if (source === 'slice' || source === 'mixed') {
    const { builds } = getBuildsForVariant(THREE, { variant: 'default', basicPaletteIndex: paletteIndex });
    pool.push(...builds);
  }
  if (source === 'kitbash' || source === 'mixed') {
    // Pass a deterministic seed so kitbash-derived templates are reproducible per district
    const kb = buildKitbashSet(THREE, { count: 28, paletteIndex, seed });
    pool.push(...kb);
  }
  return pool;
}

export function getTemplateBaseName(tpl) {
  return (tpl?.name || 'Building').replace(/\s*\[[^\]]+\]$/, '');
}

export function buildTemplateNameMap(templates) {
  const map = new Map();
  for (const tpl of templates) {
    const name = getTemplateBaseName(tpl);
    if (!map.has(name)) map.set(name, tpl);
  }
  return map;
}

export function choosePrimaryTemplate(templates, districtId) {
  if (!templates || templates.length === 0) return { tpl: null, name: 'Building' };
  const h = hash32(districtId || '', templates.length);
  const tpl = templates[h % templates.length];
  return { tpl, name: getTemplateBaseName(tpl) };
}

export function pickTemplateWithPrimary(templates, primaryName, varietyRatio = DISTRICT_DEFAULT_VARIETY_RATIO, rng = Math.random) {
  if (!templates || templates.length === 0) return null;
  const map = buildTemplateNameMap(templates);
  const primaryTpl = map.get(primaryName) || templates[0];
  const roll = rng();
  if (roll >= (varietyRatio || 0)) return primaryTpl; // majority primary
  // Pick a different template for variety
  const others = templates.filter(t => getTemplateBaseName(t) !== getTemplateBaseName(primaryTpl));
  if (others.length === 0) return primaryTpl;
  return others[(rng() * others.length) | 0];
}

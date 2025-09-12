import * as THREE from 'three';
import { parseGridLabel, posForCell } from '../../utils/gridLabel.js';
import { FOREST_BUILDERS } from './forest.js';
import { SPRING_BUILDERS } from './spring.js';
import { SNOW_BUILDERS } from './snow.js';
import { SWAMP_BUILDERS } from './swamp.js';

/* @tweakable default label for a demo tree placement */
const DEFAULT_TREE_LABEL = 'LI300';
/* @tweakable default biome if none provided */
const DEFAULT_BIOME = 'forest';
/* @tweakable collider radius fallback (used if builder doesn’t provide one) */
const DEFAULT_COLLIDER_RADIUS = 7.0;

const BIOME_BUILDERS = {
  forest: FOREST_BUILDERS,
  spring: SPRING_BUILDERS,
  snow: SNOW_BUILDERS,
  swamp: SWAMP_BUILDERS,
};

function pickVariantIndex(label, builders) {
  // Stable pseudo-random from label; avoids persistent RNG changes
  let h = 0;
  for (let k = 0; k < label.length; k++) h = ((h << 5) - h) + label.charCodeAt(k);
  const idx = Math.abs(h) % builders.length;
  return idx;
}

// Place a tree from a given biome and variant at a grid label.
// options: { biome?: 'forest'|'spring'|'snow'|'swamp', variant?: 0|1|2 }
export function placeTree(scene, objectGrid, worldSize, settings, label = DEFAULT_TREE_LABEL, options = {}) {
  const biome = String(options?.biome || DEFAULT_BIOME).toLowerCase();
  const builders = BIOME_BUILDERS[biome] || BIOME_BUILDERS[DEFAULT_BIOME];
  const variant = Number.isInteger(options?.variant) ? Math.max(0, Math.min(builders.length - 1, options.variant)) : pickVariantIndex(String(label), builders);

  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    // Build model
    const build = builders[variant] || builders[0];
    const { group, colorHex, height, colliderRadius } = build(settings);
    group.name = `Tree(${biome}#${variant})`;
    group.position.copy(pos);
    scene.add(group);

    // Collider/tooltip proxy
    const proxy = new THREE.Object3D();
    proxy.position.set(pos.x, 0, pos.z);
    proxy.userData = {
      label: `Tree (${biome})`,
      colorHex: colorHex || '2e7d32',
      instanceHeight: height || 10,
      collider: { type: 'sphere', radius: colliderRadius || DEFAULT_COLLIDER_RADIUS }
    };
    scene.add(proxy);
    objectGrid.add(proxy);

    return group;
  } catch (e) {
    console.warn(`Failed to place Tree at ${label}:`, e);
    return null;
  }
}

// Convenience helpers to place biome-specific trees
export function placeForestTree(scene, objectGrid, worldSize, settings, label, variant) {
  return placeTree(scene, objectGrid, worldSize, settings, label, { biome: 'forest', variant });
}
export function placeSpringTree(scene, objectGrid, worldSize, settings, label, variant) {
  return placeTree(scene, objectGrid, worldSize, settings, label, { biome: 'spring', variant });
}
export function placeSnowTree(scene, objectGrid, worldSize, settings, label, variant) {
  return placeTree(scene, objectGrid, worldSize, settings, label, { biome: 'snow', variant });
}
export function placeSwampTree(scene, objectGrid, worldSize, settings, label, variant) {
  return placeTree(scene, objectGrid, worldSize, settings, label, { biome: 'swamp', variant });
}


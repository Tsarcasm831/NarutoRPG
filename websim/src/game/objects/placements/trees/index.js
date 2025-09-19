import * as THREE from 'three';
import { parseGridLabel, posForCell } from '../../utils/gridLabel.js';
import { DECIDUOUS_BUILDERS } from './deciduous/index.js';
import { FOREST_BUILDERS } from './forest.js';
import { SPRING_BUILDERS } from './spring.js';
import { SNOW_BUILDERS } from './snow.js';
import { SWAMP_BUILDERS } from './swamp.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

/* @tweakable default label for a demo deciduous placement */
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

// Place a deciduous tree variant at a grid label.
// options: { variant?: number }
export function placeDeciduousTree(scene, objectGrid, worldSize, settings, label = DEFAULT_TREE_LABEL, options = {}) {
  const builders = DECIDUOUS_BUILDERS;
  const variant = Number.isInteger(options?.variant)
    ? Math.max(0, Math.min(builders.length - 1, options.variant))
    : pickVariantIndex(String(label), builders);

  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    // Build model
    const build = builders[variant] || builders[0];
    const { group, colorHex, height, colliderRadius } = build(settings);
    group.name = `Tree(Deciduous#${variant})`;
    group.position.copy(pos);
    scene.add(group);

    // Collider/tooltip proxy for player collision system
    const proxy = new THREE.Object3D();
    proxy.position.set(pos.x, 0, pos.z);
    proxy.userData = {
      label: 'Tree (deciduous)',
      colorHex: colorHex || '2e7d32',
      instanceHeight: height || 10,
      collider: { type: 'sphere', radius: colliderRadius || DEFAULT_COLLIDER_RADIUS }
    };
    scene.add(proxy);
    objectGrid.add(proxy);

    return group;
  } catch (e) {
    console.warn(`Failed to place Deciduous Tree at ${label}:`, e);
    return null;
  }
}

// Convenience alias using numeric variant parameter
export function placeDeciduousTreeVariant(scene, objectGrid, worldSize, settings, label, variant) {
  return placeDeciduousTree(scene, objectGrid, worldSize, settings, label, { variant });
}

/* ---------------------------- Generic tree placer ---------------------------- */

// Place a tree from a given biome and variant at a grid label.
// options: { biome?: 'forest'|'spring'|'snow'|'swamp', variant?: 0|1|2 }
export function placeTree(scene, objectGrid, worldSize, settings, label = DEFAULT_TREE_LABEL, options = {}) {
  const biome = String(options?.biome || DEFAULT_BIOME).toLowerCase();
  const builders = BIOME_BUILDERS[biome] || BIOME_BUILDERS[DEFAULT_BIOME];
  const variant = Number.isInteger(options?.variant)
    ? Math.max(0, Math.min(builders.length - 1, options.variant))
    : pickVariantIndex(String(label), builders);

  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    const build = builders[variant] || builders[0];
    const { group, colorHex, height, colliderRadius } = build(settings);
    group.name = `Tree(${biome}#${variant})`;
    group.position.copy(pos);
    scene.add(group);

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

/* --------------------------- Forest sector filling --------------------------- */

/* Prefer live in-page model from the map editor, fallback to defaults */
function loadForestPolygonsSync() {
  try {
    const live = (typeof window !== 'undefined') ? (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) : null;
    if (Array.isArray(live?.forest) && live.forest.length) return live.forest;
  } catch (_) { /* ignore */ }
  return Array.isArray(MAP_DEFAULT_MODEL?.forest) ? MAP_DEFAULT_MODEL.forest : [];
}

function pctToWorld([x, y], worldSize) {
  return { x: (x / 100) * worldSize - worldSize / 2, z: (y / 100) * worldSize - worldSize / 2 };
}

function centroid(points) {
  let cx = 0, cz = 0;
  for (let i = 0; i < points.length; i++) { cx += points[i].x; cz += points[i].z; }
  const n = Math.max(1, points.length);
  return { x: cx / n, z: cz / n };
}

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    const intersect = ((zi > p.z) !== (zj > p.z)) && (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function bounds(poly) {
  let minx = Infinity, minz = Infinity, maxx = -Infinity, maxz = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x;
    if (p.z < minz) minz = p.z; if (p.z > maxz) maxz = p.z;
  }
  return { minx, minz, maxx, maxz };
}

// Populate all forest polygons with a randomized mix of deciduous trees.
// opts: { spacing?: number, jitter?: number, scaleMin?: number, scaleMax?: number, seed?: number }
export function placeDeciduousTreesInForests(scene, objectGrid, worldSize, settings, opts = {}) {
  const forests = loadForestPolygonsSync();
  if (!Array.isArray(forests) || forests.length === 0) return null;

  const spacing = Math.max(10, Math.min(28, opts.spacing || 18));
  const jitter = Math.min(spacing * 0.45, opts.jitter ?? 6.5);
  const sMin = Math.max(0.7, opts.scaleMin ?? 0.9);
  const sMax = Math.min(1.6, opts.scaleMax ?? 1.3);

  // Simple seeded RNG for stability across runs if seed provided
  let rngState = (typeof opts.seed === 'number') ? (opts.seed >>> 0) : null;
  const rand = () => {
    if (rngState == null) return Math.random();
    // xorshift32
    let x = rngState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5; rngState = x >>> 0;
    return (rngState % 0xFFFFFFFF) / 0xFFFFFFFF;
  };

  const group = new THREE.Group();
  group.name = 'Forest(Deciduous)';

  const polys = forests.map(f => (f.points || []).map(pt => pctToWorld(pt, worldSize)));
  for (let idx = 0; idx < polys.length; idx++) {
    const poly = polys[idx];
    if (!poly || poly.length < 3) continue;
    const b = bounds(poly);

    // Add one proxy for the entire polygon to aid selection/tooltip
    try {
      const cx = centroid(poly);
      const forestProxy = new THREE.Object3D();
      forestProxy.position.set(cx.x, 0, cx.z);
      forestProxy.userData = {
        label: (forests[idx]?.name || forests[idx]?.id || 'Forest'),
        colorHex: '2e7d32',
        collider: { type: 'polygon', points: poly.map(p => ({ x: p.x, z: p.z })) }
      };
      scene.add(forestProxy);
      objectGrid.add(forestProxy);
    } catch (_) {}

    for (let x = b.minx; x <= b.maxx; x += spacing) {
      for (let z = b.minz; z <= b.maxz; z += spacing) {
        const jx = (rand() * 2 - 1) * jitter;
        const jz = (rand() * 2 - 1) * jitter;
        const p = { x: x + jx, z: z + jz };
        if (!pointInPoly(p, poly)) continue;

        // Randomly pick a deciduous variant and build it
        const variant = Math.floor(rand() * DECIDUOUS_BUILDERS.length);
        const build = DECIDUOUS_BUILDERS[variant];
        const { group: tree, colorHex, height, colliderRadius } = build(settings);

        // Random transform for variety
        const rotY = rand() * Math.PI * 2;
        const scale = sMin + rand() * (sMax - sMin);
        tree.position.set(p.x, 0, p.z);
        tree.rotation.y = rotY;
        tree.scale.set(scale, scale, scale);
        group.add(tree);

        // Individual trunk collider proxy for movement interaction
        const proxy = new THREE.Object3D();
        proxy.position.set(p.x, 0, p.z);
        proxy.userData = {
          label: 'Tree (deciduous)',
          colorHex: colorHex || '2e7d32',
          instanceHeight: height || 10,
          collider: { type: 'sphere', radius: (colliderRadius || 7.0) * scale }
        };
        scene.add(proxy);
        objectGrid.add(proxy);
      }
    }
  }

  scene.add(group);
  return group;
}

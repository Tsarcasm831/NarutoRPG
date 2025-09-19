// @tweakable base path anchor for terrain imports (change only if your host serves /src under a different root)
import { WORLD_SIZE as WORLD_SIZE_CONST } from '../../scene/terrain.js';
import { ObjectGrid } from './grid.js';
// @tweakable master switch to spawn legacy central wall geometry and colliders
const ENABLE_WALLS = false;
// @tweakable spawn Konoha Gates tied to the legacy wall opening
const ENABLE_WALL_GATES = false;
// @tweakable enable/disable the custom circular wall
const ENABLE_CUSTOM_RING_WALL = true;
/* @tweakable center grid label for the custom wall */
const CUSTOM_WALL_CENTER_LABEL = 'LE318';
/* @tweakable edge grid label used to compute wall radius (radius = distance(center, edge)) */
const CUSTOM_WALL_EDGE_LABEL = 'CN318';
/* @tweakable wall thickness in GRID CELLS (1 grid cell = 5 world units) */
const CUSTOM_WALL_WIDTH_GRIDS = 3;
/* @tweakable wall height (world units) */
const CUSTOM_WALL_HEIGHT = 30;
/* @tweakable wall circle segments (higher = smoother but more triangles) */
const CUSTOM_WALL_SEGMENTS = 140;
/* @tweakable collider spacing along circumference (world units between sphere proxies) */
const CUSTOM_WALL_COLLIDER_SPACING = 16;
/* @tweakable collider sphere radius (world units) */
const CUSTOM_WALL_COLLIDER_RADIUS = 10;
/* @tweakable wall color (hex integer) */
const CUSTOM_WALL_COLOR = 0xbfbfbf;
/* @tweakable enable targeted removal of specific Hokage Office instances by grid label */
const HOKAGE_OFFICE_CLEANUP_ENABLED = true;
/* @tweakable labels to remove Hokage Office from (e.g., duplicates/strays) */
const HOKAGE_OFFICE_BLOCKED_LABELS = ['KM300'];
/* @tweakable removal radius (world units) around the label center to match office parts/colliders */
const HOKAGE_OFFICE_CLEANUP_RADIUS = 280;
// @tweakable enable/disable spawning CitySlice buildings
const ENABLE_CITY_SLICE = false;
// @tweakable enable/disable spawning Kitbash buildings
const ENABLE_KITBASH = false;
import { createCentralWallWithGate } from './walls/centralWall.js';
import { placeHokagePalace } from './placements/hokagePalace.js';
import { placeHokageMonument } from './placements/hokageMonument.js';
import { placeIchiraku } from './placements/ichiraku.js';
import { placeHospital } from './placements/hospital.js';
import { placeKonohaGates } from './placements/konohaGates.js';
import { placeCitySlice } from './placements/citySlice.js';
import { placeKitbash } from './placements/kitbash.js';
// Forest placement (random deciduous assortment)
import { placeDeciduousTreesInForests } from './placements/trees/index.js';
import { fillDistrict, listDistrictIdsByPrefix } from './placements/districtFill.js';
import { WALL_RADIUS } from '../player/movement/constants.js';
import { parseGridLabel, posForCell } from './utils/gridLabel.js';
import * as THREE from 'three';

// Build all world objects and return { objects, grid }
export function updateObjects(scene, currentObjects, settings) {
  // Remove previously added objects
  currentObjects.forEach(obj => scene.remove(obj));

  const renderObjects = [];
  const worldSize = WORLD_SIZE_CONST;
  const objectGrid = new ObjectGrid(worldSize, 200);

  // Legacy central wall temporarily disabled (toggle ENABLE_WALLS to true to re-enable)
  if (ENABLE_WALLS) {
    const { group: wall, colliders } = createCentralWallWithGate({
      scene, worldSize, radius: WALL_RADIUS, height: 30, segments: 160,
      colliderSpacing: 18, colliderRadius: 12, color: 0xffffff, thickness: 5, openingAt: 'south'
    });
    renderObjects.push(wall);
    colliders.forEach(c => objectGrid.add(c));
  }

  // Gates depend on the wall opening; keep off while walls are disabled
  if (ENABLE_WALL_GATES && ENABLE_WALLS) {
    const gates = placeKonohaGates(scene, objectGrid, worldSize, settings, { openingAt: 'south', scale: 4 });
    if (gates) renderObjects.push(gates);
  }

  // NEW: Custom ring wall centered at a specific grid label, radius from another label
  if (ENABLE_CUSTOM_RING_WALL) {
    try {
      const { i: ci, j: cj } = parseGridLabel(CUSTOM_WALL_CENTER_LABEL);
      const { i: ei, j: ej } = parseGridLabel(CUSTOM_WALL_EDGE_LABEL);
      const center = posForCell(ci, cj, worldSize);
      const edge = posForCell(ei, ej, worldSize);
      const radius = Math.hypot(edge.x - center.x, edge.z - center.z);
      const thickness = Math.max(0.5, (CUSTOM_WALL_WIDTH_GRIDS || 1) * 5); // 1 grid cell = 5 world units

      const { group, colliders } = createCentralWallWithGate({
        scene,
        worldSize,
        radius,
        height: CUSTOM_WALL_HEIGHT,
        segments: CUSTOM_WALL_SEGMENTS,
        colliderSpacing: CUSTOM_WALL_COLLIDER_SPACING,
        colliderRadius: CUSTOM_WALL_COLLIDER_RADIUS,
        color: CUSTOM_WALL_COLOR,
        thickness,
        // Ensure no opening: choose labels that produce zero-length gap and set removeExactlyBetween=true
        gateFromLabel: CUSTOM_WALL_CENTER_LABEL,
        gateToLabel: CUSTOM_WALL_CENTER_LABEL,
        removeExactlyBetween: true,
        openingAt: null
      });

      // Offset the visual wall to the desired center
      group.position.set(center.x, 0, center.z);
      renderObjects.push(group);

      // Register world-space collider proxies into the spatial grid
      if (Array.isArray(colliders)) {
        colliders.forEach(localProxy => {
          const worldProxy = new THREE.Object3D();
          const wp = localProxy.position.clone().add(group.position);
          worldProxy.position.copy(wp);
          worldProxy.userData = {
            ...localProxy.userData,
            // ensure collider center reflects world position for AABB/OBB
            collider: localProxy.userData?.collider
              ? {
                  ...localProxy.userData.collider,
                  center: {
                    x: wp.x,
                    z: wp.z
                  }
                }
              : null
          };
          objectGrid.add(worldProxy);
          scene.add(worldProxy);
          renderObjects.push(worldProxy);
        });
      }
    } catch (e) {
      console.warn('Failed to create custom ring wall:', e);
    }
  }

  // Buildings
  const palace = placeHokagePalace(scene, objectGrid, worldSize, settings);
  if (palace) renderObjects.push(palace);

  const monument = placeHokageMonument(scene, objectGrid, worldSize, settings);
  if (monument) renderObjects.push(monument);

  // Hospital (GLB)
  const hospital = placeHospital(scene, objectGrid, worldSize, settings);
  if (hospital) renderObjects.push(hospital);

  const ichiraku = placeIchiraku(scene, objectGrid, worldSize, settings);
  if (ichiraku) renderObjects.push(ichiraku);

  // Populate forests from map polygons with a randomized mix of deciduous trees
  try {
    const forestGroup = placeDeciduousTreesInForests(scene, objectGrid, worldSize, settings, { spacing: 18 });
    if (forestGroup) renderObjects.push(forestGroup);
  } catch (e) {
    console.warn('Forest deciduous placement failed:', e);
  }

  if (ENABLE_CITY_SLICE) {
    const citySlice = placeCitySlice(scene, objectGrid, settings);
    if (citySlice) renderObjects.push(citySlice);
  }

  // Kitbash neighborhood: separate colliders + unique interactions; avoid CitySlice overlap
  if (ENABLE_KITBASH) {
    const kitbash = placeKitbash(scene, objectGrid, settings);
    if (kitbash) renderObjects.push(kitbash);
  }

  // District fill: populate all districts whose id starts with 'district' or 'residential'
  try {
    const ids = listDistrictIdsByPrefix(['district', 'residential']);
    for (const id of ids) {
      try {
        const group = fillDistrict(scene, objectGrid, {
          districtId: id,
          source: 'mixed',
          paletteIndex: settings?.citySlicePaletteIndex ?? 0,
          shadows: settings?.shadows,
        });
        if (group) renderObjects.push(group);
      } catch (e) {
        console.warn('District fill failed for', id, e);
      }
    }
  } catch (e) {
    console.warn('District fill enumeration failed:', e);
  }

  // KonohaTown buildings removed

  // NEW: remove only the Hokage Office instance/colliders near specific grid labels (e.g., KM300)
  if (HOKAGE_OFFICE_CLEANUP_ENABLED && Array.isArray(HOKAGE_OFFICE_BLOCKED_LABELS)) {
    for (const label of HOKAGE_OFFICE_BLOCKED_LABELS) {
      try {
        const { i, j } = parseGridLabel(label);
        const p = posForCell(i, j, worldSize);
        // Remove GLB group(s) named 'HokageOffice(GLB)' near target
        const children = [...scene.children];
        for (const c of children) {
          if (c?.name === 'HokageOffice(GLB)') {
            const dx = c.position.x - p.x, dz = c.position.z - p.z;
            if (dx*dx + dz*dz <= HOKAGE_OFFICE_CLEANUP_RADIUS * HOKAGE_OFFICE_CLEANUP_RADIUS) {
              scene.remove(c);
            }
          }
        }
        // Remove/disable colliders and proxies labelled as Hokage Office near target
        for (const key in objectGrid.grid) {
          const arr = objectGrid.grid[key];
          if (!Array.isArray(arr)) continue;
          objectGrid.grid[key] = arr.filter(obj => {
            const lbl = obj?.userData?.label || '';
            if (lbl.includes('Hokage Office')) {
              const dx = obj.position.x - p.x, dz = obj.position.z - p.z;
              if (dx*dx + dz*dz <= HOKAGE_OFFICE_CLEANUP_RADIUS * HOKAGE_OFFICE_CLEANUP_RADIUS) {
                // Also remove from scene and neutralize collider just in case
                obj.userData.collider = null;
                obj.visible = false;
                scene.remove(obj);
                return false; // drop from spatial grid
              }
            }
            return true;
          });
        }
      } catch (e) {
        console.warn('Hokage Office cleanup failed for', label, e);
      }
    }
  }

  return { objects: renderObjects, grid: objectGrid };
}

// citySlice.addBuildings.js
// Adds a city-slice into a parent group and registers colliders.

import * as THREE from 'three';
import { getBuildsForVariant } from './citySlice.builds.js';
import {
  CITY_SLICE_DEFAULT_SCALE,
  CITY_SLICE_COLLIDERS_ENABLED,
  CITY_SLICE_COLLIDER_PADDING,
  CITY_SLICE_COLLIDER_MIN_HALF,
  CITY_SLICE_COLLIDER_DEBUG,
  CITY_SLICE_REQUIRE_DISTRICTS,
  CITY_SLICE_LOCAL_CONSTRAINTS,
} from './citySlice.config.js';
import { WORLD_SIZE } from '/src/scene/terrain.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';
import {
  pointInPolyXZ,
  getBuildingOBB,
  fullyInsideAnyDistrict,
  insideAnyDistrictPoint,
  nudgeIntoDistrict,
  resolveBuildingCollisions,
  buildingToHullPoints,
  convexHullXZ,
} from './citySlice.helpers.js';

export function addCitySliceBuildings(
  town,
  {
    THREE,
    settings = {},
    objectGrid = null,
    rows = 6,
    cols = 5,
    spacingX = 300,
    spacingZ = 280,
    jitter = 0.14,
    origin = [300, 0, 300],
    scale = CITY_SLICE_DEFAULT_SCALE,
    collidersEnabled = CITY_SLICE_COLLIDERS_ENABLED,
    colliderPadding = CITY_SLICE_COLLIDER_PADDING,
    colliderMinHalf = CITY_SLICE_COLLIDER_MIN_HALF,
    colliderDebug = CITY_SLICE_COLLIDER_DEBUG,
  } = {}
) {
  const group = new THREE.Group();
  group.name = 'CitySliceBuildings';
  town.add(group);

  // Unique naming context for this slice instance
  const runTag = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : Date.now();
  let uniqueCounter = 0;
  group.userData = { ...(group.userData || {}), sliceRunTag: runTag, sliceCounter: 0 };

  const variant = settings?.citySliceVariant || 'default';
  const basicPaletteIndex = settings?.citySlicePaletteIndex ?? 0;
  const { builds, rows: rOverride, cols: cOverride } = getBuildsForVariant(THREE, { variant, basicPaletteIndex });

  // Calculate layout
  const [ox, , oz] = origin;
  const rowsLocal = rOverride ?? rows;
  const colsLocal = cOverride ?? cols;
  const X0 = ox - (colsLocal - 1) * spacingX / 2;
  const Z0 = oz - (rowsLocal - 1) * spacingZ / 2;

  // Districts from live map merged with defaults (live overrides edited keys)
  const liveModel = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || {};
  const defaultDistricts = MAP_DEFAULT_MODEL?.districts || {};
  const districts = { ...defaultDistricts, ...(liveModel?.districts || {}) };
  const districtPolys = [];
  const districtCentroids = [];
  for (const d of Object.values(districts)) {
    if (!Array.isArray(d.points) || d.points.length < 3) continue;
    const poly = d.points.map(([px, py]) => ({
      x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2,
      z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2,
    }));
    districtPolys.push(poly);
    const c = { x: 0, z: 0 };
    poly.forEach(p => { c.x += p.x; c.z += p.z; });
    districtCentroids.push({ x: c.x / poly.length, z: c.z / poly.length });
  }

  const fullyInside = (obb) => fullyInsideAnyDistrict(obb, districtPolys);
  const pointInside = (p) => insideAnyDistrictPoint(p, districtPolys);

  let idx = 0;
  if (!CITY_SLICE_LOCAL_CONSTRAINTS) {
    for (let r = 0; r < rowsLocal; r++) {
      for (let c = 0; c < colsLocal; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        // Assign unique name/identifier to each building
        const baseName = b.name || 'SliceBuilding';
        const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
        b.name = `${baseName} [${uid}]`;
        b.userData = { ...(b.userData || {}), uid, baseName };
        group.userData.sliceCounter = uniqueCounter;
        b.position.set(X0 + c * spacingX, 0, Z0 + r * spacingZ);
        b.rotation.y = (Math.random() - 0.5) * jitter;
        group.add(b);
      }
    }
  } else {
    const placedObbs = [];
    for (let r = 0; r < rowsLocal; r++) {
      for (let c = 0; c < colsLocal; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        // Assign unique name/identifier to each building
        const baseName = b.name || 'SliceBuilding';
        const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
        b.name = `${baseName} [${uid}]`;
        b.userData = { ...(b.userData || {}), uid, baseName };
        group.userData.sliceCounter = uniqueCounter;
        const pos = { x: X0 + c * spacingX, z: Z0 + r * spacingZ };
        b.position.set(pos.x, 0, pos.z);
        b.rotation.y = (Math.random() - 0.5) * jitter;
        if (!pointInside(pos)) { if (!nudgeIntoDistrict(b, districtCentroids, fullyInside)) { continue; } }
        let obb = (() => { b.updateWorldMatrix(true, false); return getBuildingOBB(b, { colliderPadding, colliderMinHalf }); })();
        if (!fullyInside(obb)) {
          if (!nudgeIntoDistrict(b, districtCentroids, fullyInside)) { continue; }
          obb = (() => { b.updateWorldMatrix(true, false); return getBuildingOBB(b, { colliderPadding, colliderMinHalf }); })();
          if (!fullyInside(obb)) { continue; }
        }
        const placed = resolveBuildingCollisions(b, placedObbs, fullyInside);
        if (!placed) { continue; }
        placedObbs.push(placed);
        group.add(b);
      }
    }
  }

  group.traverse(o => { if (o.isMesh) { o.castShadow = !!settings.shadows; o.receiveShadow = !!settings.shadows; } });
  group.scale.setScalar(scale);

  if (collidersEnabled && objectGrid) {
    group.children.forEach((building) => {
      const pts = buildingToHullPoints(building);
      const hull = convexHullXZ(pts);
      if (hull.length >= 3) {
        const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
        const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
        const proxy = new THREE.Object3D();
        proxy.position.set(cx, 0, cz);
        proxy.userData = { label: building.name || 'SliceBuilding', collider: { type: 'polygon', points: hull } };
        objectGrid.add(proxy);
        group.add(proxy);
        if (colliderDebug) {
          const dbg = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          dbg.position.copy(proxy.position);
          dbg.userData = { skipMinimap: true };
          group.add(dbg);
        }
      }
    });
  }

  return group;
}

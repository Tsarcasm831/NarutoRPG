// Kitbash helpers, extracted from kitbash.js
import * as THREE from 'three';
import { WORLD_SIZE } from '/src/scene/terrain.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';
import { pointInPolyXZ, getBuildingOBB } from '../../../../components/game/objects/citySlice.helpers.js';
import {
  KITBASH_SCALE,
  KITBASH_DISTRICT_NUDGE_STEP,
  KITBASH_MIN_LOCAL_SCALE,
} from './constants.js';

export function makeDistrictPolysAndCentroids() {
  try {
    const liveModel = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || {};
    const defaultDistricts = MAP_DEFAULT_MODEL?.districts || {};
    // Merge: defaults first, then live overrides (so edits win, missing keep defaults)
    const districts = { ...defaultDistricts, ...(liveModel?.districts || {}) };
    const polys = [];
    const cents = [];
    for (const d of Object.values(districts)) {
      if (!Array.isArray(d.points) || d.points.length < 3) continue;
      const poly = d.points.map(([px, py]) => ({
        x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2,
        z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2
      }));
      polys.push(poly);
      const c = { x: 0, z: 0 };
      for (const p of poly) { c.x += p.x; c.z += p.z; }
      c.x /= poly.length; c.z /= poly.length;
      cents.push(c);
    }
    return { polys, cents };
  } catch (_) {
    return { polys: [], cents: [] };
  }
}

export function nudgeTowardNearestDistrict(building, centroids, districtPolys, buildingFullyInsidePolys) {
  if (!centroids || centroids.length === 0) return true;
  try { building.updateWorldMatrix(true, true); } catch (_) {}
  const obb = getBuildingOBB(building);
  if (buildingFullyInsidePolys(building, districtPolys)) return true;
  // find nearest centroid
  let best = centroids[0], bestD2 = Infinity;
  for (const c of centroids) {
    const dx = c.x - obb.center.x, dz = c.z - obb.center.z, d2 = dx * dx + dz * dz;
    if (d2 < bestD2) { bestD2 = d2; best = c; }
  }
  const toBest = new THREE.Vector3(best.x - obb.center.x, 0, best.z - obb.center.z);
  const totalWorldDist = Math.max(0, toBest.length());
  const dir = totalWorldDist > 1e-6 ? toBest.clone().normalize() : new THREE.Vector3(1, 0, 0);
  // Primary pass: larger world steps towards centroid
  const stepWorldPrimary = Math.max(8, KITBASH_DISTRICT_NUDGE_STEP);
  const stepsPrimary = Math.ceil(totalWorldDist / stepWorldPrimary) + 10;
  const stepLocalPrimary = stepWorldPrimary / KITBASH_SCALE; // convert to local (pre-root-scale)
  for (let k = 0; k < stepsPrimary; k++) {
    building.position.addScaledVector(dir, stepLocalPrimary);
    if (buildingFullyInsidePolys(building, districtPolys)) return true;
  }
  // Secondary pass: fine steps to cross boundary if we overshot
  const stepWorldFine = Math.max(2, KITBASH_DISTRICT_NUDGE_STEP * 0.5);
  const stepLocalFine = stepWorldFine / KITBASH_SCALE;
  for (let k = 0; k < 120; k++) {
    building.position.addScaledVector(dir, stepLocalFine);
    if (buildingFullyInsidePolys(building, districtPolys)) return true;
  }
  return false;
}

export function approxPolyRadius(poly, cx, cz) {
  let r = 0;
  for (let i = 0; i < poly.length; i++) {
    const dx = poly[i].x - cx;
    const dz = poly[i].z - cz;
    r = Math.max(r, Math.hypot(dx, dz));
  }
  return r;
}

export function overlapsAnyCitySlice(objCenter, radius, objectGrid) {
  const nearby = objectGrid.getObjectsNear(objCenter, radius + 180) || [];
  for (let i = 0; i < nearby.length; i++) {
    const o = nearby[i];
    const lbl = o?.userData?.label || '';
    const col = o?.userData?.collider;
    if (!lbl || !col) continue;
    if (!/SliceBuilding/i.test(lbl)) continue; // we only avoid CitySlice buildings
    if (col.type === 'polygon' && Array.isArray(col.points)) {
      const cx = o.position?.x ?? 0, cz = o.position?.z ?? 0;
      const rr = approxPolyRadius(col.points, cx, cz);
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.95) return true;
    } else if (col.type === 'aabb' || col.type === 'obb') {
      const cx = col.center?.x ?? o.position?.x ?? 0;
      const cz = col.center?.z ?? o.position?.z ?? 0;
      const rr = Math.max(4, (col.halfExtents?.x || 6) + (col.halfExtents?.z || 6));
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.9) return true;
    } else if (col.type === 'sphere' && typeof col.radius === 'number') {
      const cx = o.position?.x ?? 0, cz = o.position?.z ?? 0;
      const rr = col.radius;
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.9) return true;
    }
  }
  return false;
}

export function countPolygonsInsidePoly(objectGrid, poly, centroid) {
  if (!objectGrid || !poly || poly.length < 3) return 0;
  const cx = centroid?.x ?? poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const cz = centroid?.z ?? poly.reduce((s, p) => s + p.z, 0) / poly.length;
  const R = approxPolyRadius(poly, cx, cz) + 40;
  const nearby = objectGrid.getObjectsNear({ x: cx, z: cz }, R) || [];
  let count = 0;
  for (const o of nearby) {
    const col = o?.userData?.collider;
    if (!col || col.type !== 'polygon') continue;
    if (pointInPolyXZ(o.position || { x: 0, z: 0 }, poly)) count++;
  }
  return count;
}

export function ensureMinLocalScale(object) {
  if (!object?.scale) return;
  const s = Math.max(KITBASH_MIN_LOCAL_SCALE, object.scale.x || 1);
  object.scale.setScalar(s);
}


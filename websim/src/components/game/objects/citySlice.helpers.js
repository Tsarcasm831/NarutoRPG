// citySlice.helpers.js
// Geometry helpers and placement utilities for City Slice.

import * as THREE from 'three';
import { CITY_SLICE_LOCAL_CONSTRAINTS, CITY_SLICE_REQUIRE_DISTRICTS } from './citySlice.config.js';

export function pointInPolyXZ(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
    const intersect = ((zi > p.z) !== (zj > p.z)) &&
      (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function obbCorners(obb) {
  const { center: c, hx, hz, rotY: a } = obb;
  const cos = Math.cos(a), sin = Math.sin(a);
  const pts = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]];
  return pts.map(([x, z]) => ({ x: c.x + x * cos - z * sin, z: c.z + x * sin + z * cos }));
}

export function fullyInsideAnyDistrict(obb, districtPolys) {
  if (!CITY_SLICE_LOCAL_CONSTRAINTS) return true;
  if (!districtPolys || districtPolys.length === 0) return !CITY_SLICE_REQUIRE_DISTRICTS;
  const pts = obbCorners(obb);
  return districtPolys.some(poly => pts.every(p => pointInPolyXZ(p, poly)));
}

export function insideAnyDistrictPoint(p, districtPolys) {
  if (!CITY_SLICE_LOCAL_CONSTRAINTS) return true;
  if (!districtPolys || districtPolys.length === 0) return !CITY_SLICE_REQUIRE_DISTRICTS;
  return districtPolys.some(poly => pointInPolyXZ(p, poly));
}

export function getBuildingOBB(building, { colliderPadding = 0.5, colliderMinHalf = 2 } = {}) {
  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const quat = new THREE.Quaternion();
  building.getWorldQuaternion(quat);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
  const hxRaw = Math.max(0.0001, size.x / 2);
  const hzRaw = Math.max(0.0001, size.z / 2);
  const hx = Math.max(colliderMinHalf, hxRaw + colliderPadding);
  const hz = Math.max(colliderMinHalf, hzRaw + colliderPadding);
  return { center: { x: center.x, z: center.z }, hx, hz, rotY: euler.y };
}

export function convexHullXZ(points) {
  const arr = points.slice().sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const p of arr) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export function buildingToHullPoints(building) {
  const pts = [];
  const corner = new THREE.Vector3();
  building.traverse((m) => {
    if (!m.isMesh || !m.geometry) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    for (let xi = 0; xi <= 1; xi++) {
      for (let yi = 0; yi <= 1; yi++) {
        for (let zi = 0; zi <= 1; zi++) {
          corner.set(
            xi ? bb.max.x : bb.min.x,
            yi ? bb.max.y : bb.min.y,
            zi ? bb.max.z : bb.min.z
          ).applyMatrix4(m.matrixWorld);
          pts.push({ x: corner.x, z: corner.z });
        }
      }
    }
  });
  return pts;
}

// Compute polygon area (XZ plane) using the shoelace formula.
// Expects an array of points with { x, z }. Returns absolute area in world units^2.
export function polygonArea(poly) {
  if (!Array.isArray(poly) || poly.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    area += (xj * zi - xi * zj);
  }
  return Math.abs(area) * 0.5;
}

// Get world scale along X and Z (and max) for radius/size-aware tests
export function getWorldScaleXZ(building) {
  const s = new THREE.Vector3(1, 1, 1);
  try { building.getWorldScale(s); } catch (_) {}
  return { sx: s.x, sz: s.z, sMax: Math.max(s.x, s.z) };
}

// Check full containment of a building (circle-aware via userData.round/roundRadius) inside any of the polygons
export function buildingFullyInsidePolys(building, polys, opts = {}) {
  if (!polys || polys.length === 0) return !CITY_SLICE_REQUIRE_DISTRICTS;
  // Circle-aware path
  if (building?.userData?.round && typeof building.userData.roundRadius === 'number') {
    const { sMax } = getWorldScaleXZ(building);
    const obb = getBuildingOBB(building, opts);
    const R = Math.max(0, building.userData.roundRadius * sMax);
    const samples = 12;
    for (let k = 0; k < polys.length; k++) {
      let ok = true;
      for (let i = 0; i < samples && ok; i++) {
        const a = (i / samples) * Math.PI * 2;
        const x = obb.center.x + Math.cos(a) * R;
        const z = obb.center.z + Math.sin(a) * R;
        ok = ok && pointInPolyXZ({ x, z }, polys[k]);
      }
      if (ok) return true;
    }
    return false;
  }
  // OBB corner path
  const obb = getBuildingOBB(building, opts);
  return fullyInsideAnyDistrict(obb, polys);
}

// Check full containment inside a single polygon (delegates to buildingFullyInsidePolys)
export function buildingFullyInsidePoly(building, poly, opts = {}) {
  if (!poly || poly.length < 3) return !CITY_SLICE_REQUIRE_DISTRICTS;
  return buildingFullyInsidePolys(building, [poly], opts);
}

// Basic OBB overlap test via SAT in XZ plane
export function obbOverlaps(a, b) {
  const A = obbCorners(a), B = obbCorners(b);
  const axes = [];
  const edge = (C, i) => ({ x: C[(i + 1) % 4].x - C[i].x, z: C[(i + 1) % 4].z - C[i].z });
  const norm = (v) => { const m = Math.hypot(v.x, v.z) || 1; return { x: -v.z / m, z: v.x / m }; };
  axes.push(norm(edge(A, 0)), norm(edge(A, 1)), norm(edge(B, 0)), norm(edge(B, 1)));
  const proj = (pts, ax) => {
    let lo = Infinity, hi = -Infinity;
    for (const p of pts) { const d = p.x * ax.x + p.z * ax.z; if (d < lo) lo = d; if (d > hi) hi = d; }
    return { lo, hi };
  };
  for (const ax of axes) {
    const pA = proj(A, ax), pB = proj(B, ax);
    if (pA.hi < pB.lo || pB.hi < pA.lo) return false;
  }
  return true;
}

export function nudgeIntoDistrict(building, districtCentroids, fullyInside, { step = 6, max = 40 } = {}) {
  if ((districtCentroids?.length || 0) === 0) return false;
  const obb0 = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
  if (fullyInside(obb0)) return true;
  const c0 = obb0.center;
  let best = districtCentroids[0], bestD2 = Infinity;
  for (const c of districtCentroids) { const dx = c.x - c0.x, dz = c.z - c0.z, d2 = dx * dx + dz * dz; if (d2 < bestD2) { bestD2 = d2; best = c; } }
  const dir = new THREE.Vector3(best.x - c0.x, 0, best.z - c0.z).normalize();
  const orig = building.position.clone();
  for (let k = 0; k < max; k++) {
    building.position.addScaledVector(dir, step);
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    if (fullyInside(obb)) return true;
  }
  building.position.copy(orig);
  return false;
}

export function resolveBuildingCollisions(building, placedObbs, fullyInside, { step = 5, max = 48 } = {}) {
  const orig = building.position.clone();
  const tryCheck = () => {
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    for (const o of placedObbs) if (obbOverlaps(obb, o)) return { ok: false, obb: null };
    return { ok: true, obb };
  };
  let res = tryCheck(); if (res.ok) return res.obb;
  for (let iter = 1; iter <= max; iter++) {
    let dir = new THREE.Vector3(0, 0, 0);
    const cur = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    for (const o of placedObbs) {
      if (obbOverlaps(cur, o)) { const vx = cur.center.x - o.center.x; const vz = cur.center.z - o.center.z; const m = Math.hypot(vx, vz) || 1; dir.x += vx / m; dir.z += vz / m; }
    }
    if (dir.lengthSq() < 1e-6) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      const d = dirs[(iter - 1) % dirs.length]; dir.set(d[0], 0, d[1]);
    }
    dir.normalize();
    building.position.addScaledVector(dir, step);
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    if (!fullyInside(obb)) { building.position.copy(orig); return null; }
    res = tryCheck(); if (res.ok) return res.obb;
  }
  building.position.copy(orig);
  return null;
}

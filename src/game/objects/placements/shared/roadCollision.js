import { WORLD_SIZE } from '/src/scene/terrain.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';
import { getBuildingOBB } from '../../../../components/game/objects/citySlice.helpers.js';

// Tunables for road avoidance
const ROAD_AVOID_SIZE_FACTOR = 0.25; // inflate OBB half-extents when testing road overlap
const ROAD_AVOID_STEP = 5;           // world units per nudge step
const ROAD_AVOID_MAX_ATTEMPTS = 24;  // max spiral steps

// Convert a map `width` (3..5) to a half-width in world units for collision envelope
function mapWidthToHalfWorld(width = 3) {
  // Calibrated to be conservative so building OBBs keep clear of roads
  // width 3 -> 10.5, width 4 -> 14, width 5 -> 17.5
  return (Math.max(1, width) * 3.5);
}

// Build world-space road segments with half-thickness for collision checks
export function buildRoadSegments() {
  const live = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || {};
  const roads = Array.isArray(live?.roads) && live.roads.length ? live.roads : (MAP_DEFAULT_MODEL?.roads || []);
  const segs = [];
  for (const r of roads) {
    const pts = Array.isArray(r?.points) ? r.points : null;
    if (!pts || pts.length < 2) continue;
    const half = mapWidthToHalfWorld(r.width || 3);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const a = { x: (x0 / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (y0 / 100) * WORLD_SIZE - WORLD_SIZE / 2 };
      const b = { x: (x1 / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (y1 / 100) * WORLD_SIZE - WORLD_SIZE / 2 };
      segs.push({ a, b, half });
    }
  }
  return segs;
}

function segSegIntersect2D(p1, p2, q1, q2) {
  const o = (a, b, c) => Math.sign((b.z - a.z) * (c.x - b.x) - (b.x - a.x) * (c.z - b.z));
  const o1 = o(p1, p2, q1), o2 = o(p1, p2, q2), o3 = o(q1, q2, p1), o4 = o(q1, q2, p2);
  return (o1 !== o2) && (o3 !== o4);
}
function distanceSegAABB_Local(p0, p1, hx, hz) {
  const inside = (p) => Math.abs(p.x) <= hx && Math.abs(p.z) <= hz;
  if (inside(p0) || inside(p1)) return 0;
  // Quick reject: segment intersects any AABB edge
  const v = [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }];
  for (let i = 0; i < 4; i++) if (segSegIntersect2D(p0, p1, v[i], v[(i + 1) % 4])) return 0;
  const dPAABB = (p) => Math.hypot(Math.max(0, Math.abs(p.x) - hx), Math.max(0, Math.abs(p.z) - hz));
  let best = Math.min(dPAABB(p0), dPAABB(p1));
  const verts = [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }];
  const vx = p1.x - p0.x, vz = p1.z - p0.z, len2 = Math.max(1e-8, vx * vx + vz * vz);
  for (const vtx of verts) {
    const t = Math.max(0, Math.min(1, ((vtx.x - p0.x) * vx + (vtx.z - p0.z) * vz) / len2));
    const cx = p0.x + vx * t, cz = p0.z + vz * t;
    best = Math.min(best, Math.hypot(vtx.x - cx, vtx.z - cz));
  }
  return best;
}
function distanceSegOBB2D(seg, obb) {
  const c = obb.center, a = -obb.rotY, cos = Math.cos(a), sin = Math.sin(a);
  const toLocal = ({ x, z }) => ({ x: (x - c.x) * cos - (z - c.z) * sin, z: (x - c.x) * sin + (z - c.z) * cos });
  return distanceSegAABB_Local(toLocal(seg.a), toLocal(seg.b), obb.hx, obb.hz);
}

export function obbOverlapsAnyRoad(obb, roadSegments) {
  const hx = obb.hx * (1 + ROAD_AVOID_SIZE_FACTOR);
  const hz = obb.hz * (1 + ROAD_AVOID_SIZE_FACTOR);
  const inflated = { center: obb.center, hx, hz, rotY: obb.rotY };
  for (let i = 0; i < roadSegments.length; i++) {
    if (distanceSegOBB2D(roadSegments[i], inflated) <= roadSegments[i].half) return true;
  }
  return false;
}

// Try to nudge building away from roads. Returns true if succeeded or already clear; false if failed.
export function ensureNotOnRoad(building, roadSegments, { step = ROAD_AVOID_STEP, max = ROAD_AVOID_MAX_ATTEMPTS } = {}) {
  const obb0 = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
  if (!obbOverlapsAnyRoad(obb0, roadSegments)) return true;
  const orig = building.position.clone();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (let k = 1; k <= max; k++) {
    for (let d = 0; d < dirs.length; d++) {
      building.position.set(orig.x + dirs[d][0] * step * k, orig.y, orig.z + dirs[d][1] * step * k);
      const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
      if (!obbOverlapsAnyRoad(obb, roadSegments)) return true;
    }
  }
  building.position.copy(orig);
  return false;
}


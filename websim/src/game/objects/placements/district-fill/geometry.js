import { pointInPolyXZ } from '../../../../components/game/objects/citySlice.helpers.js';

export function bboxOfPoly(poly) {
  return poly.reduce((b, p) => ({
    minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
    minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z),
  }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
}

export function randomPointInPoly(poly, centroid) {
  const bbox = bboxOfPoly(poly);
  for (let t = 0; t < 140; t++) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const z = bbox.minZ + Math.random() * (bbox.maxZ - bbox.minZ);
    if (pointInPolyXZ({ x, z }, poly)) return { x, z };
  }
  return { x: centroid.x, z: centroid.z };
}

export function signedArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    a += (xj * zi - xi * zj);
  }
  return 0.5 * a; // can be negative
}

export function distPointSeg(p, a, b) {
  const vx = b.x - a.x, vz = b.z - a.z;
  const wx = p.x - a.x, wz = p.z - a.z;
  const len2 = Math.max(1e-8, vx * vx + vz * vz);
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / len2));
  const cx = a.x + t * vx, cz = a.z + t * vz;
  return Math.hypot(p.x - cx, p.z - cz);
}

export function distanceToEdges(p, poly) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    d = Math.min(d, distPointSeg(p, a, b));
  }
  return d;
}

export function obbWithClearance(obb, clearance) {
  return { center: obb.center, hx: obb.hx + clearance, hz: obb.hz + clearance, rotY: obb.rotY };
}

// Compute half-extent of OBB along a given normal (nx, nz)
export function supportExtentAlong(obb, nx, nz) {
  const a = obb.rotY || 0;
  const ux = Math.cos(a), uz = Math.sin(a); // OBB local X axis in XZ
  const vx = -Math.sin(a), vz = Math.cos(a); // OBB local Z axis in XZ
  const dotU = Math.abs(ux * nx + uz * nz);
  const dotV = Math.abs(vx * nx + vz * nz);
  return obb.hx * dotU + obb.hz * dotV;
}

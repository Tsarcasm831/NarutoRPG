import * as THREE from 'three';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

/* @tweakable when true, pull forest data from live map editor model if present on window */
const USE_WINDOW_LIVE_MODEL = true;

function loadForestPolygonsSync() {
  // Prefer live in-page model set by the map editor, if available
  try {
    if (USE_WINDOW_LIVE_MODEL && typeof window !== 'undefined') {
      const live = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel);
      if (Array.isArray(live?.forest) && live.forest.length) return live.forest;
    }
  } catch (_) { /* ignore */ }
  // Fallback to defaults bundled with the app
  return Array.isArray(MAP_DEFAULT_MODEL?.forest) ? MAP_DEFAULT_MODEL.forest : [];
}

function pctToWorld([x, y], worldSize) {
  return {
    x: (x / 100) * worldSize - worldSize / 2,
    z: (y / 100) * worldSize - worldSize / 2,
  };
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

// Build shared geometries/materials for instanced trees
function makeAssets() {
  // Trunks
  const trunkGeomA = new THREE.CylinderGeometry(0.9, 1.4, 12, 10); // oak-like
  const trunkGeomB = new THREE.CylinderGeometry(0.7, 1.0, 10, 8);  // pine-like
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f4a2e, roughness: 0.9, metalness: 0.05 });

  // Canopy
  const canopySphere = new THREE.SphereGeometry(6.2, 12, 10);
  const canopyCone = new THREE.ConeGeometry(6.0, 12.0, 10);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85, metalness: 0.02 });

  return { trunkGeomA, trunkGeomB, trunkMat, canopySphere, canopyCone, canopyMat };
}

// Create instanced meshes sized for a maximum number of instances; later set count
function createInstancedMeshes(maxInstances) {
  const { trunkGeomA, trunkGeomB, trunkMat, canopySphere, canopyCone, canopyMat } = makeAssets();
  const trunksA = new THREE.InstancedMesh(trunkGeomA, trunkMat, maxInstances);
  const trunksB = new THREE.InstancedMesh(trunkGeomB, trunkMat, maxInstances);
  const canopiesSphere = new THREE.InstancedMesh(canopySphere, canopyMat, maxInstances);
  const canopiesCone = new THREE.InstancedMesh(canopyCone, canopyMat, maxInstances);
  trunksA.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  trunksB.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  canopiesSphere.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  canopiesCone.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  [trunksA, trunksB, canopiesSphere, canopiesCone].forEach(m => { m.castShadow = m.receiveShadow = true; });
  return { trunksA, trunksB, canopiesSphere, canopiesCone };
}

function matFrom(pos, rotY, scale, yOffset = 0) {
  const m = new THREE.Matrix4();
  const t = new THREE.Matrix4().makeTranslation(pos.x, yOffset, pos.z);
  const r = new THREE.Matrix4().makeRotationY(rotY);
  const s = new THREE.Matrix4().makeScale(scale, scale, scale);
  m.multiply(t).multiply(r).multiply(s);
  return m;
}

/**
 * Populate forest zones with instanced trees.
 * Uses two variants (oak-like sphere canopy and pine-like cone canopy) to keep draw calls low.
 */
export function placeForestTrees(scene, objectGrid, worldSize, settings, opts = {}) {
  const forests = loadForestPolygonsSync();
  if (!Array.isArray(forests) || forests.length === 0) return null;

  // Sampling parameters (semi-thick but performance friendly)
  const spacing = Math.max(10, Math.min(28, opts.spacing || 18)); // world units
  const jitter = Math.min(spacing * 0.45, 6.5);
  const oakRatio = 0.45; // oak vs pine distribution

  // Estimate upper bound on instances: coarse grid over union of bounds
  let bboxArea = 0;
  const polys = forests.map(f => (f.points || []).map(pt => pctToWorld(pt, worldSize)));
  for (const poly of polys) {
    if (!poly || poly.length < 3) continue;
    const b = bounds(poly);
    bboxArea += Math.max(0, (b.maxx - b.minx) * (b.maxz - b.minz));
  }
  const estimate = Math.min(30000, Math.ceil(bboxArea / (spacing * spacing)));
  const { trunksA, trunksB, canopiesSphere, canopiesCone } = createInstancedMeshes(estimate);
  const tmpMatrix = new THREE.Matrix4();

  let iA = 0, iB = 0, iS = 0, iC = 0;

  // For each polygon, sample a jittered grid inside its bounding box
  for (let idx = 0; idx < polys.length; idx++) {
    const poly = polys[idx];
    if (!poly || poly.length < 3) continue;
    const b = bounds(poly);

    const cx = centroid(poly);
    // Add a single polygon collider proxy for interactions/tooltips
    try {
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
        const jx = (Math.random() * 2 - 1) * jitter;
        const jz = (Math.random() * 2 - 1) * jitter;
        const p = { x: x + jx, z: z + jz };
        if (!pointInPoly(p, poly)) continue;

        const rotY = Math.random() * Math.PI * 2;
        const scale = 0.85 + Math.random() * 0.5; // 0.85..1.35

        if (Math.random() < oakRatio) {
          // Oak variant: trunkA + sphere canopy
          const trunkH = 12 * scale;
          tmpMatrix.copy(matFrom(p, rotY, scale, trunkH * 0.5));
          trunksA.setMatrixAt(iA++, tmpMatrix);
          // canopy center slightly above trunk top
          const canopyCenterY = trunkH + 3.2 * scale; // sphere r ~6.2
          tmpMatrix.copy(matFrom(p, rotY, scale, canopyCenterY));
          canopiesSphere.setMatrixAt(iS++, tmpMatrix);
        } else {
          // Pine variant: trunkB + cone canopy
          const trunkH = 10 * scale;
          tmpMatrix.copy(matFrom(p, rotY, scale, trunkH * 0.5));
          trunksB.setMatrixAt(iB++, tmpMatrix);
          const canopyCenterY = trunkH + 6.0 * scale; // cone h 12 -> center ~ h/2 above top
          tmpMatrix.copy(matFrom(p, rotY, scale, canopyCenterY));
          canopiesCone.setMatrixAt(iC++, tmpMatrix);
        }
      }
    }
  }

  trunksA.count = iA; trunksB.count = iB; canopiesSphere.count = iS; canopiesCone.count = iC;
  trunksA.instanceMatrix.needsUpdate = true;
  trunksB.instanceMatrix.needsUpdate = true;
  canopiesSphere.instanceMatrix.needsUpdate = true;
  canopiesCone.instanceMatrix.needsUpdate = true;

  const group = new THREE.Group();
  group.name = 'Forest(Instanced)';
  group.add(trunksA, trunksB, canopiesSphere, canopiesCone);
  scene.add(group);
  return group;
}

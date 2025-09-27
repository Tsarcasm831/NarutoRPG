import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { convexHullXZ } from '../../../components/game/objects/citySlice.helpers.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

/* @tweakable grid label where the Arena is placed */
const ARENA_LABEL = 'IA183';
/* @tweakable path(s) to the Arena GLB model (served from site root)
   Prefer module-relative URL and the canonical /src/assets filename. */
const ARENA_GLB_PATHS = [
  // Prefer local fallback explicitly
  (() => { try { return new URL('../../../assets/Arena.glb', import.meta.url).href; } catch(_) { return null; } })(),
  '/src/assets/Arena.glb'
].filter(Boolean);

/* @tweakable base scale multiplier applied to the loaded model */
const ARENA_GLB_SCALE = 1.4;
/* @tweakable Y-axis rotation (radians) applied to the loaded model */
// Model yaw offset relative to the road heading (radians)
// 0 means align the model exactly along the road direction.
const ARENA_GLB_ROTATE_Y = Math.PI / 2; // previously 11 * Math.PI / 45
/* @tweakable final vertical offset for Arena GLB */
const ARENA_GLB_OFFSET_Y = -0.4;
/* @tweakable enable shadows for the loaded model meshes */
const ARENA_GLB_SHADOWS = true;
/* @tweakable enable simple collider/tooltip around the arena */
const ARENA_ENABLE_COLLIDER = true;
/* @tweakable sphere collider radius (world units) for tooltip/interaction; replaced by polygon after load */
const ARENA_COLLIDER_RADIUS = 320;

// Load and place the Arena model at a grid label.
// Returns the created THREE.Group or null on failure.
export function placeArena(scene, objectGrid, worldSize, settings, label = ARENA_LABEL) {
  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    const group = new THREE.Group();
    group.name = 'Arena(GLB)';
    group.position.copy(pos);
    scene.add(group);

    // Compute alignment to Road 5: snap/align rotation and slide along the road while preserving lateral offset
    const ROAD_ID = 'road-5';
    const road5 = (MAP_DEFAULT_MODEL?.roads || []).find(r => String(r.id).toLowerCase() === ROAD_ID);
    let targetHeading = 0;
    if (road5 && Array.isArray(road5.points) && road5.points.length >= 2) {
      // Convert polyline points (0..100) => world space (xz)
      const toWorld = ([x, y]) => ({ x: (x / 100) * worldSize - worldSize / 2, z: (y / 100) * worldSize - worldSize / 2 });
      const pts = road5.points.map(toWorld);
      // Find nearest segment to current group position
      let best = { d2: Infinity, p: { x: group.position.x, z: group.position.z }, a: null, b: null, t: 0 };
      for (let s = 0; s < pts.length - 1; s++) {
        const a = pts[s], b = pts[s + 1];
        const abx = b.x - a.x, abz = b.z - a.z;
        const apx = group.position.x - a.x, apz = group.position.z - a.z;
        const ab2 = Math.max(1e-6, abx * abx + abz * abz);
        const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / ab2));
        const px = a.x + abx * t, pz = a.z + abz * t;
        const dx = group.position.x - px, dz = group.position.z - pz;
        const d2 = dx * dx + dz * dz;
        if (d2 < best.d2) best = { d2, p: { x: px, z: pz }, a, b, t };
      }
      if (best.a && best.b) {
        // Heading of the road at the closest segment
        const vx = best.b.x - best.a.x, vz = best.b.z - best.a.z;
        targetHeading = Math.atan2(vz, vx);
        // Preserve perpendicular offset to the road, but slide to the closest point along the segment
        const nx = -Math.sin(targetHeading), nz = Math.cos(targetHeading); // unit normal to the road (left-hand)
        const off = (group.position.x - best.p.x) * nx + (group.position.z - best.p.z) * nz; // signed lateral offset
        group.position.set(best.p.x + nx * off, 0, best.p.z + nz * off);
      }
    }

    // Optional: temporary proxy for tooltip/interaction until polygon collider is ready
    let proxy = null;
    if (ARENA_ENABLE_COLLIDER) {
      proxy = new THREE.Object3D();
      proxy.position.set(group.position.x, 0, group.position.z);
      proxy.userData = {
        label: 'Chuunin Arena',
        collider: { type: 'sphere', radius: ARENA_COLLIDER_RADIUS }
      };
      scene.add(proxy);
      objectGrid.add(proxy);
    }

    const loader = new GLTFLoader();
    const tryLoad = (idx = 0) => {
      const path = ARENA_GLB_PATHS[idx];
      loader.load(
        path,
        (gltf) => {
          try {
            const model = gltf.scene || gltf.scenes?.[0];
            if (!model) return;

            // Apply rotation deterministically (no accumulation across reloads)
            model.rotation.y = (targetHeading + ARENA_GLB_ROTATE_Y);
            model.traverse((n) => {
              if (n.isMesh) {
                n.castShadow = !!(ARENA_GLB_SHADOWS && settings?.shadows);
                n.receiveShadow = !!settings?.shadows;
                // Large arenas can be culled incorrectly; disable to be safe
                n.frustumCulled = false;
                // Ensure the arena renders fully solid (no translucency)
                const solidify = (m) => {
                  if (!m) return;
                  m.transparent = false;
                  m.opacity = 1.0;
                  m.depthWrite = true;
                  m.depthTest = true;
                  m.alphaTest = 0.0;
                  m.blending = THREE.NormalBlending;
                  if ('side' in m) m.side = THREE.DoubleSide;
                  m.needsUpdate = true;
                };
                if (Array.isArray(n.material)) n.material.forEach(solidify); else solidify(n.material);
              }
            });

            // Compute bounds pre-scale, then scale uniformly
            model.updateWorldMatrix(true, true);
            let box = new THREE.Box3().setFromObject(model);
            let baseScale = ARENA_GLB_SCALE;
            model.scale.setScalar(Math.max(1e-4, baseScale));

            // Recompute bounds after scaling, then center to origin and rest on ground
            model.updateWorldMatrix(true, true);
            box = new THREE.Box3().setFromObject(model);
            if (!box.isEmpty()) {
              const center = new THREE.Vector3();
              box.getCenter(center);
              const yBase = box.min.y;
              model.position.x += -center.x;
              model.position.z += -center.z;
              model.position.y += -yBase + ARENA_GLB_OFFSET_Y;
            } else {
              model.position.y += ARENA_GLB_OFFSET_Y;
            }

            group.add(model);
            try {
              // Build an exact-ish polygon collider from the GLB world-space footprint using a concave hull
              model.updateWorldMatrix(true, true);
              const pts = collectWorldXZVertices(model, { quantize: 1.0, maxPoints: 12000 });
              const hull = concaveHullXZ(pts, Math.min(20, Math.max(8, Math.floor(Math.sqrt(pts.length)))));
              const simplified = simplifyPolygon(hull, 0.8);
              if (Array.isArray(simplified) && simplified.length >= 3) {
                const cx = simplified.reduce((s, p) => s + p.x, 0) / simplified.length;
                const cz = simplified.reduce((s, p) => s + p.z, 0) / simplified.length;
                const poly = new THREE.Object3D();
                poly.position.set(cx, 0, cz);
                poly.userData = {
                  label: 'Chuunin Arena',
                  collider: { type: 'polygon', points: simplified }
                };
                scene.add(poly);
                objectGrid.add(poly);
                // Remove temporary spherical proxy, if any
                if (proxy) {
                  try { proxy.userData.collider = null; scene.remove(proxy); } catch (_) {}
                }
              } else {
                console.warn('Arena: concave hull generation failed; falling back to convex hull.');
                const ch = convexHullXZ(pts);
                if (Array.isArray(ch) && ch.length >= 3) {
                  const cx = ch.reduce((s, p) => s + p.x, 0) / ch.length;
                  const cz = ch.reduce((s, p) => s + p.z, 0) / ch.length;
                  const poly = new THREE.Object3D();
                  poly.position.set(cx, 0, cz);
                  poly.userData = { label: 'Chuunin Arena', collider: { type: 'polygon', points: ch } };
                  scene.add(poly);
                  objectGrid.add(poly);
                  if (proxy) { try { proxy.userData.collider = null; scene.remove(proxy); } catch (_) {} }
                }
              }
            } catch (e) {
              console.warn('Failed to build Arena polygon collider:', e);
            }
            try { console.info('Arena GLB loaded from:', path); } catch (_) {}
          } catch (e) {
            console.warn('Arena GLB post-process failed:', e);
          }
        },
        undefined,
        (err) => {
          if (idx + 1 < ARENA_GLB_PATHS.length) {
            // Try the next candidate path
            tryLoad(idx + 1);
            return;
          }
          console.warn('Failed to load Arena GLB from any path:', ARENA_GLB_PATHS, err);
          // Fallback: visible placeholder so location is obvious if asset is missing
          try {
            const placeholder = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x876a38, roughness: 0.9, metalness: 0.02 });
            const disk = new THREE.Mesh(new THREE.CylinderGeometry(180, 180, 8, 72), mat);
            disk.position.y = 2;
            disk.castShadow = disk.receiveShadow = true;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(220, 5, 16, 96), new THREE.MeshStandardMaterial({ color: 0xd6b36a }));
            ring.rotation.x = Math.PI/2;
            placeholder.add(disk, ring);
            group.add(placeholder);
          } catch (_) { /* non-fatal */ }
        }
      );
    };

    tryLoad(0);

    return group;
  } catch (e) {
    console.warn(`Failed to place Arena at ${label}:`, e);
    return null;
  }
}

// Collect world-space XZ vertices from the mesh hierarchy, with optional quantization and cap
function collectWorldXZVertices(root, { quantize = 1.0, maxPoints = 15000 } = {}) {
  const pts = [];
  const v = new THREE.Vector3();
  const push = (x, z) => {
    if (quantize > 0) { x = Math.round(x / quantize) * quantize; z = Math.round(z / quantize) * quantize; }
    pts.push({ x, z });
  };
  let count = 0;
  root.traverse((m) => {
    if (count >= maxPoints) return;
    if (!m.isMesh || !m.geometry) return;
    const g = m.geometry;
    const pos = g.attributes && g.attributes.position;
    if (!pos) return;
    const mat = m.matrixWorld;
    for (let i = 0; i < pos.count && count < maxPoints; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat);
      push(v.x, v.z);
      count++;
    }
  });
  // Deduplicate nearby points
  const key = (p) => `${Math.round(p.x / quantize)}|${Math.round(p.z / quantize)}`;
  const map = new Map();
  for (const p of pts) map.set(key(p), p);
  return Array.from(map.values());
}

// Basic line segment intersection on XZ plane
function segIntersect(a, b, c, d) {
  const orient = (p, q, r) => Math.sign((q.z - p.z) * (r.x - q.x) - (q.x - p.x) * (r.z - q.z));
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if (o1 === 0 && o2 === 0 && o3 === 0 && o4 === 0) return false; // colinear overlap ignored for hull building
  return (o1 !== o2) && (o3 !== o4);
}

// k-NN Concave Hull (Moreira & Santos, 2007) in XZ plane
function concaveHullXZ(points, kInit = 8) {
  const pts = points.slice();
  if (pts.length < 4) return convexHullXZ(pts);
  const dist2 = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z; return dx * dx + dz * dz; };
  const start = pts.reduce((min, p) => (p.z < min.z || (p.z === min.z && p.x < min.x)) ? p : min, pts[0]);
  let k = Math.max(3, Math.min(kInit, pts.length - 1));
  const used = new Set();
  const key = (p) => `${p.x},${p.z}`;
  let hull = [];
  while (true) {
    hull = [start];
    used.clear();
    used.add(key(start));
    let current = start;
    // Initial previous angle: due east
    let prevAngle = 0;
    let safety = 0;
    while (safety++ < pts.length * 4) {
      // k nearest neighbors not yet in hull
      const neighbors = pts
        .filter(p => key(p) !== key(current))
        .sort((a, b) => dist2(a, current) - dist2(b, current))
        .slice(0, k);
      let next = null;
      let bestAngle = Infinity;
      for (const cand of neighbors) {
        // Turn angle from prev direction to current->cand, prefer smallest right-turn (wrap [0, 2pi))
        const ang = Math.atan2(cand.z - current.z, cand.x - current.x);
        let turn = ang - prevAngle;
        while (turn <= -Math.PI) turn += Math.PI * 2;
        while (turn > Math.PI) turn -= Math.PI * 2;
        const rightTurn = (turn >= 0) ? turn : (turn + Math.PI * 2);
        // Prevent self-intersections
        const segA = current, segB = cand;
        let intersects = false;
        for (let i = 0; i < hull.length - 1 && !intersects; i++) {
          const ha = hull[i], hb = hull[i + 1];
          if (segIntersect(segA, segB, ha, hb)) intersects = true;
        }
        if (!intersects && rightTurn < bestAngle) { bestAngle = rightTurn; next = cand; }
      }
      if (!next) break;
      // Close if we reached start and have sufficient vertices
      if (hull.length > 2 && dist2(next, start) <= 1e-6) { hull.push(start); break; }
      hull.push(next);
      used.add(key(next));
      prevAngle = Math.atan2(next.z - current.z, next.x - current.x);
      current = next;
    }
    // If we failed to close properly or hull too small, increase k and retry
    if (hull.length >= 4 && dist2(hull[hull.length - 1], start) <= 1e-6) {
      hull.pop(); // remove duplicated start
      break;
    }
    k += 2;
    if (k >= pts.length) { hull = convexHullXZ(pts); break; }
  }
  return hull;
}

// Simplify polygon via Ramer–Douglas–Peucker in XZ
function simplifyPolygon(points, epsilon = 1.0) {
  if (!Array.isArray(points) || points.length < 3) return points || [];
  const sq = (x) => x * x;
  const distPointSeg2 = (p, a, b) => {
    const vx = b.x - a.x, vz = b.z - a.z;
    const wx = p.x - a.x, wz = p.z - a.z;
    const c1 = vx * wx + vz * wz;
    const c2 = vx * vx + vz * vz || 1e-6;
    const t = Math.max(0, Math.min(1, c1 / c2));
    const cx = a.x + t * vx, cz = a.z + t * vz;
    return sq(p.x - cx) + sq(p.z - cz);
  };
  const rdp = (pts, s, e, eps2, out) => {
    if (e <= s + 1) { out.push(pts[s]); return; }
    let idx = -1, best = -1;
    for (let i = s + 1; i < e; i++) {
      const d2 = distPointSeg2(pts[i], pts[s], pts[e]);
      if (d2 > best) { best = d2; idx = i; }
    }
    if (best > eps2) {
      rdp(pts, s, idx, eps2, out);
      rdp(pts, idx, e, eps2, out);
    } else {
      out.push(pts[s]);
    }
  };
  const out = [];
  rdp(points, 0, points.length - 1, epsilon * epsilon, out);
  out.push(points[points.length - 1]);
  return out;
}

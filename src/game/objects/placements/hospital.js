import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildingToHullPoints, convexHullXZ } from '../../../components/game/objects/citySlice.helpers.js';

/* @tweakable grid label where the Hospital is placed */
const HOSPITAL_LABEL = 'JQ150';
/* @tweakable path(s) to the Hospital GLB model (served from site root)
   Prefer module-relative URL and the canonical /src/assets filename. */
const HOSPITAL_GLB_PATHS = [
  (() => { try { return new URL('../../../assets/Hospital.glb', import.meta.url).href; } catch(_) { return null; } })(),
  '/src/assets/Hospital.glb',
  'https://www.lordtsarcasm.com/assets/NarutoGame/Buildings/Hospital.glb'
].filter(Boolean);
/* @tweakable base scale multiplier (30% larger overall on top of fit) */
const HOSPITAL_GLB_SCALE = 2.5;
/* @tweakable Y-axis rotation (radians) applied to the loaded model */
// 45° counterclockwise (matching placeholder orientation comment)
const HOSPITAL_GLB_ROTATE_Y = Math.PI / 4;
/* @tweakable final vertical offset for Hospital GLB */
const HOSPITAL_GLB_OFFSET_Y = -0.4;
/* @tweakable enable shadows for the loaded model meshes */
const HOSPITAL_GLB_SHADOWS = true;
/* @tweakable fit the GLB footprint to the placeholder size */
const HOSPITAL_FIT_TO_PLACEHOLDER = true;
/* @tweakable placeholder footprint to match (width X, depth Z) in world units */
const HOSPITAL_PLACEHOLDER_SIZE = { width: 80, depth: 50 };
/* @tweakable enable simple collider/tooltip around the hospital */
const HOSPITAL_ENABLE_COLLIDER = true;
/* @tweakable sphere collider radius (world units) for tooltip/interaction */
const HOSPITAL_COLLIDER_RADIUS = 80;

// Load and place the Hospital model at a grid label.
// Returns the created THREE.Group or null on failure.
export function placeHospital(scene, objectGrid, worldSize, settings, label = HOSPITAL_LABEL) {
  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    const group = new THREE.Group();
    group.name = 'Hospital(GLB)';
    group.position.copy(pos);
    scene.add(group);

    // Optional: simple temporary proxy for tooltip/interaction until polygon collider is ready
    let proxy = null;
    if (HOSPITAL_ENABLE_COLLIDER) {
      proxy = new THREE.Object3D();
      proxy.position.set(pos.x, 0, pos.z);
      proxy.userData = {
        label: 'Hospital',
        collider: { type: 'sphere', radius: HOSPITAL_COLLIDER_RADIUS }
      };
      scene.add(proxy);
      objectGrid.add(proxy);
    }

    const loader = new GLTFLoader();
    const tryLoad = (idx = 0) => {
      const path = HOSPITAL_GLB_PATHS[idx];
      loader.load(
        path,
        (gltf) => {
          try {
            const model = gltf.scene || gltf.scenes?.[0];
            if (!model) return;

            // Apply rotation first so footprint is measured in final orientation
            model.rotation.y += HOSPITAL_GLB_ROTATE_Y;
            model.traverse((n) => {
              if (n.isMesh) {
                n.castShadow = !!(HOSPITAL_GLB_SHADOWS && settings?.shadows);
                n.receiveShadow = !!settings?.shadows;
                // Hospital GLB can have extreme transforms; disable frustum culling to avoid false negatives
                n.frustumCulled = false;
                try { if (n.material && 'side' in n.material) n.material.side = THREE.DoubleSide; } catch(_) {}
              }
            });

            // Compute footprint before scaling and fit to placeholder size (uniform scale)
            model.updateWorldMatrix(true, true);
            let box = new THREE.Box3().setFromObject(model);
            let fitScale = 1;
            if (!box.isEmpty() && HOSPITAL_FIT_TO_PLACEHOLDER) {
              const size = new THREE.Vector3(); box.getSize(size);
              const sx = size.x > 0 ? (HOSPITAL_PLACEHOLDER_SIZE.width / size.x) : 1;
              const sz = size.z > 0 ? (HOSPITAL_PLACEHOLDER_SIZE.depth / size.z) : 1;
              fitScale = Math.max(1e-4, Math.min(sx, sz));
            }
            model.scale.setScalar(HOSPITAL_GLB_SCALE * fitScale);

            // Recompute bounds after scaling, then recentre to origin and rest on ground
            model.updateWorldMatrix(true, true);
            box = new THREE.Box3().setFromObject(model);
            if (!box.isEmpty()) {
              const center = new THREE.Vector3();
              box.getCenter(center);
              const yBase = box.min.y;
              model.position.x += -center.x;
              model.position.z += -center.z;
              model.position.y += -yBase + HOSPITAL_GLB_OFFSET_Y;
            } else {
              model.position.y += HOSPITAL_GLB_OFFSET_Y;
            }

            group.add(model);
            try {
              // Build a precise polygon collider from the GLB world-space footprint
              model.updateWorldMatrix(true, true);
              const pts = buildingToHullPoints(model);
              const hull = convexHullXZ(pts);
              if (Array.isArray(hull) && hull.length >= 3) {
                const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
                const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
                const poly = new THREE.Object3D();
                poly.position.set(cx, 0, cz);
                poly.userData = {
                  label: 'Hospital',
                  collider: { type: 'polygon', points: hull }
                };
                scene.add(poly);
                objectGrid.add(poly);
                // Remove temporary spherical proxy, if any
                if (proxy) {
                  try { proxy.userData.collider = null; scene.remove(proxy); } catch (_) {}
                }
              } else {
                console.warn('Hospital: hull generation failed; polygon collider skipped.');
              }
            } catch (e) {
              console.warn('Failed to build Hospital polygon collider:', e);
            }
            try { console.info('Hospital GLB loaded from:', path); } catch (_) {}
          } catch (e) {
            console.warn('Hospital GLB post-process failed:', e);
          }
        },
        undefined,
        (err) => {
          if (idx + 1 < HOSPITAL_GLB_PATHS.length) {
            // Try the next candidate path
            tryLoad(idx + 1);
            return;
          }
          console.warn('Failed to load Hospital GLB from any path:', HOSPITAL_GLB_PATHS, err);
          // Fallback: visible placeholder so location is obvious if asset is missing
          try {
            const placeholder = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x2f7d43, roughness: 0.8, metalness: 0.05 });
            const base = new THREE.Mesh(new THREE.BoxGeometry(80, 12, 50), mat);
            base.position.y = 6;
            base.castShadow = base.receiveShadow = true;
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 30, 20), new THREE.MeshStandardMaterial({ color: 0x244566 }));
            pole.position.set(-35, 15, 0);
            const sign = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 1), new THREE.MeshStandardMaterial({ color: 0xc43a2f }));
            sign.position.set(-35, 28, 0);
            placeholder.add(base, pole, sign);
            // Rotate placeholder 45 degrees counterclockwise around Y
            placeholder.rotation.y = Math.PI / 4;
            group.add(placeholder);
          } catch (_) { /* non-fatal */ }
        }
      );
    };

    tryLoad(0);

    return group;
  } catch (e) {
    console.warn(`Failed to place Hospital at ${label}:`, e);
    return null;
  }
}

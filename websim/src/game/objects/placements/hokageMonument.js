import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

/* @tweakable grid label where the Hokage Monument is placed */
const HOKAGE_MONUMENT_LABEL = 'LE90';
/* @tweakable maximum OBBs to extract from model (performance cap) */
const HOKAGE_MAX_OBBS = 24;
/* @tweakable minimum half-extent size in world units for an OBB to be included */
const HOKAGE_MIN_HALF_EXTENT = 6;
/* @tweakable additional padding applied to each OBB half-extent (world units) */
const HOKAGE_OBB_PADDING = 2;
/* @tweakable use per-mesh OBBs (true) or a single overall OBB (false) */
const HOKAGE_COLLIDER_PER_MESH = true;

// Hard grid row bounds for Hokage Monument collision (north/south limits)
// Grid labels use 1-based rows; convert to zero-based for calculations
const HOKAGE_NORTH_ROW = 68; // do not extend north past this row
const HOKAGE_SOUTH_ROW = 105; // do not extend south past this row

// Load and place the Hokage monument model.
// Adds OBB colliders derived from the GLB's dimensions into the object grid.
export function placeHokageMonument(scene, objectGrid, worldSize, settings, label = HOKAGE_MONUMENT_LABEL) {
  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    const monumentGroup = new THREE.Group();
    monumentGroup.name = 'HokageMonument';
    monumentGroup.position.copy(pos);
    scene.add(monumentGroup);

    // Precompute world Z bounds for rows [HOKAGE_NORTH_ROW, HOKAGE_SOUTH_ROW]
    // Note: posForCell returns the center of a cell; we use that as the limiting "grid line" reference.
    const northRowJ = Math.max(0, (HOKAGE_NORTH_ROW|0) - 1);
    const southRowJ = Math.max(0, (HOKAGE_SOUTH_ROW|0) - 1);
    const zNorthBound = posForCell(0, northRowJ, worldSize).z;
    const zSouthBound = posForCell(0, southRowJ, worldSize).z;
    const zMinAllowed = Math.min(zNorthBound, zSouthBound);
    const zMaxAllowed = Math.max(zNorthBound, zSouthBound);

    // Temporary proxy collider while GLB loads — keep within row bounds on Z
    const proxy = new THREE.Object3D();
    proxy.position.set(pos.x, pos.y, pos.z);
    const maxSphereRadiusZ = Math.max(0, Math.min((proxy.position.z - zMinAllowed), (zMaxAllowed - proxy.position.z)));
    const tempSphereRadius = Math.max(1, Math.min(180, maxSphereRadiusZ));
    proxy.userData = {
      label: 'Hokage Monument',
      collider: { type: 'sphere', radius: tempSphereRadius }
    };
    objectGrid.add(proxy);
    scene.add(proxy);

    const loader = new GLTFLoader();
    loader.load(
      '/src/assets/Hokage_Monument.glb',
      gltf => {
        const model = gltf.scene || gltf.scenes?.[0];
        if (!model) return;
        model.scale.set(54, 54, 54);
        model.traverse(n => {
          if (n.isMesh) {
            n.castShadow = !!settings.shadows;
            n.receiveShadow = !!settings.shadows;
          }
        });
        model.position.y = 0;
        monumentGroup.add(model);

        // Compute and add precise OBB colliders from the loaded model
        try {
          model.updateWorldMatrix(true, true);

          const proxies = [];
          const addObb = (center, halfExtents, rotY, label) => {
            // Clamp OBB against north/south grid row bounds along world Z.
            // We only robustly clamp when rotation is ~0 (axis-aligned on XZ), which applies to this model.
            let c = { x: center.x, z: center.z };
            let he = { x: halfExtents.x, z: halfExtents.z };

            const approxAxisAligned = Math.abs(rotY % (Math.PI * 2)) < 1e-3 || Math.abs(Math.abs(rotY) - Math.PI) < 1e-3;
            if (approxAxisAligned) {
              const zLow = c.z - he.z;
              const zHigh = c.z + he.z;
              const clampedLow = Math.max(zLow, zMinAllowed);
              const clampedHigh = Math.min(zHigh, zMaxAllowed);
              if (clampedLow > clampedHigh) return; // entire OBB outside permitted band; drop it
              c.z = (clampedLow + clampedHigh) * 0.5;
              he.z = Math.max(0, (clampedHigh - clampedLow) * 0.5);
            }

            if (Math.min(he.x, he.z) < HOKAGE_MIN_HALF_EXTENT) return;
            const p = new THREE.Object3D();
            p.position.set(c.x, 0, c.z);
            p.userData = {
              label,
              collider: {
                type: 'obb',
                center: { x: c.x, z: c.z },
                halfExtents: {
                  x: he.x + HOKAGE_OBB_PADDING,
                  z: he.z + HOKAGE_OBB_PADDING
                },
                rotationY: rotY
              }
            };
            proxies.push(p);
          };

          // Determine rotationY (if the group is rotated in Y)
          const worldQuat = new THREE.Quaternion();
          monumentGroup.getWorldQuaternion(worldQuat);
          const rotY = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ').y;

          if (HOKAGE_COLLIDER_PER_MESH) {
            // Per-mesh OBBs (capped by HOKAGE_MAX_OBBS)
            const boxes = [];
            model.traverse(n => {
              if (boxes.length >= HOKAGE_MAX_OBBS) return;
              if (n?.isMesh) {
                const box = new THREE.Box3().setFromObject(n);
                if (!box.isEmpty()) {
                  boxes.push(box.clone());
                }
              }
            });

            // Convert each Box3 to an OBB proxy (XZ half-extents from box size)
            for (let k = 0; k < boxes.length && k < HOKAGE_MAX_OBBS; k++) {
              const box = boxes[k];
              const center = new THREE.Vector3();
              const size = new THREE.Vector3();
              box.getCenter(center);
              box.getSize(size);

              addObb(
                new THREE.Vector3(center.x, 0, center.z),
                new THREE.Vector3(size.x / 2, 0, size.z / 2),
                rotY,
                'Hokage Monument (part)'
              );
            }
          } else {
            // Single overall OBB from the whole model
            const wholeBox = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            wholeBox.getCenter(center);
            wholeBox.getSize(size);
            addObb(
              new THREE.Vector3(center.x, 0, center.z),
              new THREE.Vector3(size.x / 2, 0, size.z / 2),
              rotY,
              'Hokage Monument'
            );
          }

          // Register new OBB proxies to scene + object grid
          proxies.forEach(p => {
            scene.add(p);
            objectGrid.add(p);
          });

          // Disable the temporary spherical collider
          if (proxy?.userData) {
            proxy.userData.collider = null;
          }
        } catch (e) {
          console.warn('Failed to build precise Hokage Monument colliders:', e);
        }
      },
      undefined,
      err => console.error('Failed to load Hokage Monument GLB:', err)
    );

    return monumentGroup;
  } catch (e) {
    console.warn(`Failed to place Hokage Monument at ${label}:`, e);
    return null;
  }
}

import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHokagePalace } from '../houses/HokagePalace.js';

/* @tweakable grid label where the Hokage Palace is placed */
const HOKAGE_PALACE_LABEL = 'LB117';

/* @tweakable toggle: when true, place only a reconstruction marker instead of the full palace */
const HOKAGE_PLACE_MARKER_ONLY = false;
/* @tweakable label text shown in tooltips and interaction prompt */
const HOKAGE_MARKER_LABEL = 'Hokage Palace — Reconstruction Site';
/* @tweakable marker color (hex) */
const HOKAGE_MARKER_COLOR = 0xeab308; // amber-500
/* @tweakable marker size (world units): { radius, height } */
const HOKAGE_MARKER_SIZE = { radius: 4, height: 10 };
/* @tweakable additional world offset applied to the palace position (fine tune placement) */
const HOKAGE_OFFSET = { x: 0, y: 0, z: 0 };
/* @tweakable Y-axis rotation (radians) applied to the palace root */
const HOKAGE_ROTATE_Y = 0;

/* @tweakable when true, use the GLB office model instead of the procedural palace */
const HOKAGE_USE_GLB = true;
/* @tweakable path to the Hokage Office GLB model
   Note: Use a URL relative to the site root so it resolves correctly at runtime. */
const HOKAGE_GLB_PATH = '/src/assets/hokage_office.glb';
/* @tweakable model uniform scale applied after loading */
const HOKAGE_GLB_SCALE = 24;
/* @tweakable additional Y-axis rotation (radians) applied to the loaded model */
/** @tweakable rotate GLB +Y by -90° (clockwise when viewed from above) */
const HOKAGE_GLB_ROTATE_Y = -Math.PI / 2;
/* @tweakable enable shadows for the loaded model meshes */
const HOKAGE_GLB_SHADOWS = true;
/** @tweakable final vertical offset for Hokage Office GLB (lowered by an additional 0.1) */
const HOKAGE_GLB_OFFSET_Y = -0.4;
/* @tweakable per-mesh OBB collider extraction: max meshes to include (performance cap) */
const HOKAGE_GLB_MAX_OBBS = 40;
/* @tweakable minimum half-extent (world units) to keep an OBB collider */
const HOKAGE_GLB_MIN_HALF = 2.5;
/* @tweakable padding (world units) added to OBB half-extents */
const HOKAGE_GLB_OBB_PADDING = 1.0;

/* @tweakable when true, snap Hokage Office placement to the grid center */
const HOKAGE_SNAP_TO_GRID = true;
/* @tweakable size of one grid cell in world units */
const GRID_CELL_SIZE_UNITS = 5;
/* @tweakable how many grid cells to move the office south (+Z) after snapping */
const HOKAGE_MOVE_SOUTH_GRIDS = 20;

// @tweakable: disable all Hokage Office GLB colliders (removes any blocking around the office)
const HOKAGE_GLB_ENABLE_COLLIDERS = false;

// Place the Hokage Palace at a grid label.
// Returns the created THREE.Group or null on failure.
export function placeHokagePalace(scene, objectGrid, worldSize, settings, label = HOKAGE_PALACE_LABEL) {
  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;
    // @tweakable apply grid snapping and southward offset
    if (HOKAGE_SNAP_TO_GRID) {
      // posForCell already returns the grid-center; keep explicit rounding for safety
      pos.x = Math.round(pos.x / GRID_CELL_SIZE_UNITS) * GRID_CELL_SIZE_UNITS;
      pos.z = Math.round(pos.z / GRID_CELL_SIZE_UNITS) * GRID_CELL_SIZE_UNITS;
    }
    pos.z += HOKAGE_MOVE_SOUTH_GRIDS * GRID_CELL_SIZE_UNITS;

    // Prefer GLB model if enabled
    if (HOKAGE_USE_GLB) {
      const group = new THREE.Group(); group.name = 'HokageOffice(GLB)'; group.position.copy(pos);
      scene.add(group);
      // Temporary broad collider until GLB loads
      const temp = new THREE.Object3D(); temp.position.set(pos.x, 0, pos.z);
      temp.userData = { label: 'Hokage Office', collider: HOKAGE_GLB_ENABLE_COLLIDERS ? { type: 'sphere', radius: 120 } : null };
      if (HOKAGE_GLB_ENABLE_COLLIDERS) { scene.add(temp); objectGrid.add(temp); }
      const loader = new GLTFLoader();
      loader.load(HOKAGE_GLB_PATH, (gltf) => {
        const model = gltf.scene || gltf.scenes?.[0]; if (!model) return;
        model.scale.setScalar(HOKAGE_GLB_SCALE); model.rotation.y += HOKAGE_GLB_ROTATE_Y;
        // Apply requested vertical offset to sit the asset slightly lower
        model.position.y += HOKAGE_GLB_OFFSET_Y;
        model.traverse(n => { if (n.isMesh) { n.castShadow = !!(HOKAGE_GLB_SHADOWS && settings.shadows); n.receiveShadow = !!settings.shadows; }});
        group.add(model); // Precise OBB colliders from meshes
        try {
          if (HOKAGE_GLB_ENABLE_COLLIDERS) {
            const proxies = []; let count = 0;
            const worldQuat = new THREE.Quaternion(); group.getWorldQuaternion(worldQuat);
            const rotY = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ').y;
            model.traverse(n => {
              if (count >= HOKAGE_GLB_MAX_OBBS || !n?.isMesh) return;
              const box = new THREE.Box3().setFromObject(n); if (box.isEmpty()) return;
              const c = new THREE.Vector3(), s = new THREE.Vector3(); box.getCenter(c); box.getSize(s);
              const hx = s.x/2, hz = s.z/2; if (Math.min(hx, hz) < HOKAGE_GLB_MIN_HALF) return;
              const p = new THREE.Object3D(); p.position.set(c.x, 0, c.z);
              p.userData = { label: 'Hokage Office (part)', collider: { type:'obb', center:{x:c.x,z:c.z}, halfExtents:{ x: hx + HOKAGE_GLB_OBB_PADDING, z: hz + HOKAGE_GLB_OBB_PADDING }, rotationY: rotY } };
              proxies.push(p); count++;
            });
            proxies.forEach(p => { scene.add(p); objectGrid.add(p); });
            // Remove temp collider after precise OBBs added
            temp.userData.collider = null;
          }
        } catch (e) { /* non-fatal */ }
      }, undefined, (err) => { console.warn('Failed to load Hokage Office GLB:', HOKAGE_GLB_PATH, err); /* keep temp collider */ });

      // Add tooltip proxies at LB122 and LC122 so the label shows when the player is at those grid cells
      try {
        const labels = ['LB122', 'LC122'];
        labels.forEach((lab) => {
          const { i, j } = parseGridLabel(lab);
          const p = posForCell(i, j, worldSize);
          const proxy = new THREE.Object3D();
          proxy.position.set(p.x, 0, p.z);
          proxy.userData = {
            label: 'Hokage Office',
            collider: { type: 'sphere', radius: 5 },
            onInteract: () => {
              try {
                window.dispatchEvent(new CustomEvent('open-hokage-office'));
              } catch (_) {}
            }
          };
          scene.add(proxy);
          objectGrid.add(proxy);
        });
      } catch (_) {}

      return group;
    }

    // Place only a reconstruction marker (no palace geometry)
    if (HOKAGE_PLACE_MARKER_ONLY) {
      const markerGroup = new THREE.Group();
      markerGroup.name = 'HokagePalaceMarker';
      markerGroup.position.copy(pos);
      // Simple pillar + ring cap to stand out
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(HOKAGE_MARKER_SIZE.radius * 0.6, HOKAGE_MARKER_SIZE.radius * 0.6, HOKAGE_MARKER_SIZE.height, 24),
        new THREE.MeshStandardMaterial({ color: HOKAGE_MARKER_COLOR, roughness: 0.75 })
      );
      pillar.position.y = HOKAGE_MARKER_SIZE.height / 2;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(HOKAGE_MARKER_SIZE.radius, 0.5, 12, 36),
        new THREE.MeshStandardMaterial({ color: HOKAGE_MARKER_COLOR, roughness: 0.85 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = HOKAGE_MARKER_SIZE.height + 0.75;
      markerGroup.add(pillar, ring);
      // Add a small proxy so tooltips/interaction work
      const proxy = new THREE.Object3D();
      proxy.position.set(pos.x, 0, pos.z);
      proxy.userData = {
        label: HOKAGE_MARKER_LABEL,
        collider: { type: 'sphere', radius: Math.max(6, HOKAGE_MARKER_SIZE.radius + 2) }
      };
      scene.add(markerGroup, proxy);
      objectGrid.add(proxy);
      return markerGroup;
    }

    // Place the full Hokage Palace using the dedicated builder
    const { group, colliderProxy, colliderProxies } = createHokagePalace({
      position: new THREE.Vector3(pos.x + HOKAGE_OFFSET.x, pos.y + HOKAGE_OFFSET.y, pos.z + HOKAGE_OFFSET.z),
      settings
    });
    if (HOKAGE_ROTATE_Y) group.rotation.y = HOKAGE_ROTATE_Y;
    scene.add(group);
    // Register colliders
    if (colliderProxy) { scene.add(colliderProxy); objectGrid.add(colliderProxy); }
    (colliderProxies || []).forEach(p => { scene.add(p); objectGrid.add(p); });
    return group;

  } catch (e) {
    console.warn(`Failed to place Hokage Palace at ${label}:`, e);
    return null;
  }
}

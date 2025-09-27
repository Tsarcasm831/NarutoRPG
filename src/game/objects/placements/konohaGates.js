import * as THREE from 'three';
import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import { buildKonohaGatesGroup } from '../gates/builder.js';

/**
 * Place the Konoha Gates at the perimeter opening between two grid labels.
 * The gate faces outward along the radial direction from the village centre.
 *
 * @param {THREE.Scene} scene
 * @param {ObjectGrid} objectGrid
 * @param {number} worldSize
 * @param {object} settings
 * @param {object} opts { gateFromLabel, gateToLabel, scale, openingAt }
 */
export function placeKonohaGates(scene, objectGrid, worldSize, settings, opts = {}) {
  const {
    gateFromLabel = 'KX491',
    gateToLabel = 'KD491',
    scale = 4,
    openingAt = null // 'north'|'south'|'east'|'west'
  } = opts;

  // Determine opening midpoint angle
  const { i: i1, j: j1 } = parseGridLabel(gateFromLabel);
  const { i: i2, j: j2 } = parseGridLabel(gateToLabel);
  const p1 = posForCell(i1, j1, worldSize);
  const p2 = posForCell(i2, j2, worldSize);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

  let theta;
  if (openingAt) {
    const centers = { north: 3*Math.PI/2, south: Math.PI/2, east: 0, west: Math.PI };
    theta = centers[openingAt] ?? Math.PI/2;
  } else {
    theta = Math.atan2(mid.z, mid.x);
  }

  // World position on wall radius
  const derivedRadius = mid.length();
  const radius = derivedRadius > 0 ? derivedRadius : worldSize * 0.3561;
  const pos = new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);

  // Build gates group
  const { group } = buildKonohaGatesGroup({ scale, settings });

  // Position at wall and orient so +Z faces outward (radial)
  group.position.copy(pos);
  // Make -Z face center so +Z points outward
  group.lookAt(0, group.position.y, 0);

  // Add to scene
  scene.add(group);

  // Build and register OBB colliders for both towers with world transform applied
  const worldQuat = new THREE.Quaternion();
  group.getWorldQuaternion(worldQuat);
  const eulerY = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ').y;

  (group.userData._obbLocals || []).forEach(({ pos: localPos, hx, hz, label }) => {
    const worldPos = localPos.clone().applyQuaternion(worldQuat).add(group.position);
    const proxy = new THREE.Object3D();
    proxy.position.set(worldPos.x, 0, worldPos.z);
    proxy.userData.collider = {
      type: 'obb',
      center: { x: worldPos.x, z: worldPos.z },
      halfExtents: { x: hx, z: hz },
      rotationY: eulerY
    };
    proxy.userData.label = label;
    objectGrid.add(proxy);
    scene.add(proxy);
  });

  group.name = 'KonohaGates';
  return group;
}

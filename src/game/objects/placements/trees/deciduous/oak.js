import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from '../common.js';

// Broad oak: sturdy trunk with rounded dense canopy
export function buildOakTree(settings) {
  const trunkH = 12.0;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.5, trunkH, 14),
    trunkMaterial(0x7a4b2a)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.8, 20, 16), leafMaterial(0x2e7d32));
  canopy.position.y = trunkH + 5.2;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '2e7d32', height, colliderRadius: 7.6 };
}

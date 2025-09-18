import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from '../common.js';

// Birch: pale trunk, lighter airy canopy
export function buildBirchTree(settings) {
  const trunkH = 10.0;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.9, trunkH, 12),
    trunkMaterial(0xccc6bf)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(5.6, 18, 14), leafMaterial(0x7cb342));
  canopy.position.y = trunkH + 4.2;
  canopy.scale.set(1.1, 0.9, 1.1);
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '7cb342', height, colliderRadius: 6.6 };
}
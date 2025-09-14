import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from '../common.js';

// Beech: smooth trunk, broad ellipsoid canopy
export function buildBeechTree(settings) {
  const trunkH = 12.0;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.4, trunkH, 14),
    trunkMaterial(0x6b4a31)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.2, 20, 16), leafMaterial(0x43a047));
  canopy.scale.set(1.35, 0.95, 1.35);
  canopy.position.y = trunkH + 4.6;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '43a047', height, colliderRadius: 7.4 };
}

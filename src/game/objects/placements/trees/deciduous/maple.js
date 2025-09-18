import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from '../common.js';

// Maple: slightly flared trunk base, full canopy (warmer green)
export function buildMapleTree(settings) {
  const trunkH = 11.0;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.3, trunkH, 12),
    trunkMaterial(0x6d4c41)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.4, 20, 16), leafMaterial(0x4caf50));
  canopy.position.y = trunkH + 4.8;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '4caf50', height, colliderRadius: 7.2 };
}
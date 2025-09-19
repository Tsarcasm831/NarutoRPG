import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from '../common.js';

// Elm: layered canopy with slight offsets
export function buildElmTree(settings) {
  const trunkH = 11.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, trunkH, 12),
    trunkMaterial(0x81502e)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const mat = leafMaterial(0x388e3c);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(5.6, 18, 14), mat);
  c1.position.y = trunkH + 4.2;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.6, 18, 14), mat);
  c2.position.set(0.9, trunkH + 6.4, -0.5);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(3.8, 18, 14), mat);
  c3.position.set(-0.8, trunkH + 5.6, 0.7);
  [c1, c2, c3].forEach(m => applyShadow(m, settings));

  const group = makeGroup(trunk, c1, c2, c3);
  const height = computeApproxHeight(group);
  return { group, colorHex: '388e3c', height, colliderRadius: 6.8 };
}
import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from './common.js';

// Swamp biome: darker greens, buttressed base

// Variant 1: Broad, drooping canopy (ellipsoid)
export function buildSwampTree1(settings) {
  const trunkH = 10.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.6, trunkH, 12),
    trunkMaterial(0x5d3a24)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const ell = new THREE.Mesh(new THREE.SphereGeometry(6.4, 18, 14), leafMaterial(0x2d4739));
  ell.scale.set(1.3, 0.8, 1.3);
  ell.position.y = trunkH + 4.0;
  applyShadow(ell, settings);

  const group = makeGroup(trunk, ell);
  const height = computeApproxHeight(group);
  return { group, colorHex: '2d4739', height, colliderRadius: 7.2 };
}

// Variant 2: Cypress-like with buttress base and layered canopy
export function buildSwampTree2(settings) {
  const trunkH = 11.0;
  // Buttress-like base using a short wide cylinder below
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 2.2, 10), trunkMaterial(0x5b3a29));
  base.position.y = 1.1;
  applyShadow(base, settings);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, trunkH, 12), trunkMaterial(0x5b3a29));
  trunk.position.y = trunkH / 2 + 2.2;
  applyShadow(trunk, settings);

  const mat = leafMaterial(0x305e4a);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(5.2, 16, 12), mat);
  c1.position.y = 2.2 + trunkH + 3.8;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.0, 16, 12), mat);
  c2.position.set(0.8, 2.2 + trunkH + 5.8, -0.6);
  [c1, c2].forEach(m => applyShadow(m, settings));

  const group = makeGroup(base, trunk, c1, c2);
  const height = computeApproxHeight(group);
  return { group, colorHex: '305e4a', height, colliderRadius: 6.8 };
}

// Variant 3: Tall with narrow, drooping canopy
export function buildSwampTree3(settings) {
  const trunkH = 12.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.4, trunkH, 12),
    trunkMaterial(0x63412e)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const top = new THREE.Mesh(new THREE.SphereGeometry(5.2, 18, 14), leafMaterial(0x274a3a));
  top.scale.set(0.9, 1.1, 0.9);
  top.position.y = trunkH + 5.8;
  applyShadow(top, settings);

  const group = makeGroup(trunk, top);
  const height = computeApproxHeight(group);
  return { group, colorHex: '274a3a', height, colliderRadius: 6.0 };
}

export const SWAMP_BUILDERS = [buildSwampTree1, buildSwampTree2, buildSwampTree3];


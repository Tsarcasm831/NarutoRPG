import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from './common.js';

// Forest biome: deeper greens

// Variant 1: Broad oak (round canopy)
export function buildForestTree1(settings) {
  const trunkH = 12;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.4, trunkH, 14),
    trunkMaterial(0x7a4b2a)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.5, 20, 16), leafMaterial(0x2e7d32));
  canopy.position.y = trunkH + 5.0;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '2e7d32', height, colliderRadius: 7.5 };
}

// Variant 2: Tall pine (conical canopy)
export function buildForestTree2(settings) {
  const trunkH = 10;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.0, trunkH, 10),
    trunkMaterial(0x6b4226)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 12, 16), leafMaterial(0x1b5e20));
  cone.position.y = trunkH + 6;
  applyShadow(cone, settings);

  const group = makeGroup(trunk, cone);
  const height = computeApproxHeight(group);
  return { group, colorHex: '1b5e20', height, colliderRadius: 7.0 };
}

// Variant 3: Layered canopy (three spheres)
export function buildForestTree3(settings) {
  const trunkH = 11;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, trunkH, 12),
    trunkMaterial(0x81502e)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const mat = leafMaterial(0x33691e);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(5.8, 18, 14), mat);
  c1.position.y = trunkH + 4.5;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.6, 18, 14), mat);
  c2.position.set(1.0, trunkH + 7.2, 0.6);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(4.0, 18, 14), mat);
  c3.position.set(-0.8, trunkH + 6.2, -0.9);
  [c1, c2, c3].forEach(m => applyShadow(m, settings));

  const group = makeGroup(trunk, c1, c2, c3);
  const height = computeApproxHeight(group);
  return { group, colorHex: '33691e', height, colliderRadius: 6.8 };
}

export const FOREST_BUILDERS = [buildForestTree1, buildForestTree2, buildForestTree3];


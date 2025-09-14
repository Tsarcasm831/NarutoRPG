import * as THREE from 'three';
import { applyShadow, trunkMaterial, leafMaterial, makeGroup, computeApproxHeight } from './common.js';

// Spring biome: blossoms and fresh greens

// Variant 1: Cherry blossom (pink sphere canopy)
export function buildSpringTree1(settings) {
  const trunkH = 9.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.9, trunkH, 12),
    trunkMaterial(0x6d4c41)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.2, 20, 16), leafMaterial(0xffb7c5));
  canopy.position.y = trunkH + 4.8;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: 'ffb7c5', height, colliderRadius: 7.0 };
}

// Variant 2: Light blossom with two overlapping spheres
export function buildSpringTree2(settings) {
  const trunkH = 10.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 1.0, trunkH, 12),
    trunkMaterial(0x6d4c41)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const mat = leafMaterial(0xffc6d9);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(5.8, 18, 14), mat);
  c1.position.y = trunkH + 4.5;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.4, 18, 14), mat);
  c2.position.set(0.8, trunkH + 6.2, -0.6);
  [c1, c2].forEach(m => applyShadow(m, settings));

  const group = makeGroup(trunk, c1, c2);
  const height = computeApproxHeight(group);
  return { group, colorHex: 'ffc6d9', height, colliderRadius: 6.6 };
}

// Variant 3: Fresh spring green, rounded canopy
export function buildSpringTree3(settings) {
  const trunkH = 9;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.9, trunkH, 12),
    trunkMaterial(0x795548)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.0, 20, 16), leafMaterial(0x9edc76));
  canopy.position.y = trunkH + 4.6;
  applyShadow(canopy, settings);

  const group = makeGroup(trunk, canopy);
  const height = computeApproxHeight(group);
  return { group, colorHex: '9edc76', height, colliderRadius: 6.8 };
}

export const SPRING_BUILDERS = [buildSpringTree1, buildSpringTree2, buildSpringTree3];


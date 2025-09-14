import * as THREE from 'three';
import { applyShadow, trunkMaterial, snowMaterial, makeGroup, computeApproxHeight } from './common.js';

// Snow biome: pale trunk and snow-covered canopy

// Variant 1: Snowy fir (cone with snow cap)
export function buildSnowTree1(settings) {
  const trunkH = 8.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.9, trunkH, 10),
    trunkMaterial(0x8d6e63)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const fir = new THREE.Mesh(new THREE.ConeGeometry(6, 12, 14), snowMaterial(0xe8f0f5));
  fir.position.y = trunkH + 6;
  applyShadow(fir, settings);

  const group = makeGroup(trunk, fir);
  const height = computeApproxHeight(group);
  return { group, colorHex: 'e8f0f5', height, colliderRadius: 6.6 };
}

// Variant 2: Snow dome on rounded canopy
export function buildSnowTree2(settings) {
  const trunkH = 9.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.1, trunkH, 12),
    trunkMaterial(0x9e8579)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(6.2, 18, 14), snowMaterial(0xf0f4f8));
  dome.position.y = trunkH + 4.8;
  applyShadow(dome, settings);

  const group = makeGroup(trunk, dome);
  const height = computeApproxHeight(group);
  return { group, colorHex: 'f0f4f8', height, colliderRadius: 7.0 };
}

// Variant 3: Layered snowy lumps
export function buildSnowTree3(settings) {
  const trunkH = 9;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 1.0, trunkH, 12),
    trunkMaterial(0x8d6e63)
  );
  trunk.position.y = trunkH / 2;
  applyShadow(trunk, settings);

  const m = snowMaterial(0xe3edf5);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(5.4, 16, 12), m);
  c1.position.y = trunkH + 4.2;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 12), m);
  c2.position.set(0.7, trunkH + 6.0, -0.5);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 12), m);
  c3.position.set(-0.6, trunkH + 5.5, 0.8);
  [c1, c2, c3].forEach(s => applyShadow(s, settings));

  const group = makeGroup(trunk, c1, c2, c3);
  const height = computeApproxHeight(group);
  return { group, colorHex: 'e3edf5', height, colliderRadius: 6.4 };
}

export const SNOW_BUILDERS = [buildSnowTree1, buildSnowTree2, buildSnowTree3];


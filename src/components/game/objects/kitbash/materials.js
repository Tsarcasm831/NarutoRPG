import * as THREE from 'three';
import { pick } from './palettes.js';

export function makeMats(pal) {
  const mk = (col, em = 0) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, metalness: 0.05, emissiveIntensity: 0.55, emissive: em ? new THREE.Color(em) : 0 });
  return {
    wall: mk(pick(pal.wall)),
    trim: mk(pick(pal.trim)),
    roof: mk(pick(pal.roof)),
    roofAlt: mk(pick(pal.roof)),
    window: new THREE.MeshStandardMaterial({
      color: pal.win, emissive: pal.win, emissiveIntensity: 0.7,
      roughness: 0.15, metalness: 0.05,
      transparent: false, depthWrite: true, depthTest: true,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    }),
    dark: mk('#2a2f36'),
  };
}

export const tagRole = (mesh, role) => (mesh.userData.role = role, mesh);


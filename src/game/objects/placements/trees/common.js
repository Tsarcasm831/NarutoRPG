import * as THREE from 'three';

export function applyShadow(mesh, settings) {
  mesh.castShadow = !!settings?.shadows;
  mesh.receiveShadow = !!settings?.shadows;
}

export function trunkMaterial(color = 0x7a4b2a) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05 });
}

export function leafMaterial(color = 0x2e7d32) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02 });
}

export function snowMaterial(color = 0xe8f0f5) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 });
}

export function makeGroup(...meshes) {
  const g = new THREE.Group();
  meshes.forEach(m => g.add(m));
  return g;
}

export function computeApproxHeight(group) {
  const box = new THREE.Box3().setFromObject(group);
  if (box.isEmpty()) return 6;
  return Math.max(0.5, box.max.y - box.min.y);
}

export function computeTrunkRadius(parts, extra = 0.2) {
  const items = Array.isArray(parts) ? parts : [parts];
  const overall = new THREE.Box3();
  const temp = new THREE.Box3();

  let hasBounds = false;
  for (const obj of items) {
    if (!obj) continue;
    temp.setFromObject(obj);
    if (temp.isEmpty()) continue;
    if (!hasBounds) {
      overall.copy(temp);
      hasBounds = true;
    } else {
      overall.union(temp);
    }
  }

  if (!hasBounds) return 0.5;

  const width = overall.max.x - overall.min.x;
  const depth = overall.max.z - overall.min.z;
  const radius = Math.max(width, depth) * 0.5;
  return Math.max(0.35, radius + extra);
}

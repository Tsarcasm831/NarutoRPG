// HokagePalace.impl.js
// NOTE: This file has been refactored for maintainability.
// Large inline functions were moved into dedicated modules under ./palace/.
// Tombstones below indicate what was removed from this file.

import * as THREE from 'three';
import { GLOBAL_SCALE, DEFAULT_CONFIG, deepMerge } from './palace/config.js';
import { createMats } from './palace/materials.js';
import { buildRotunda } from './palace/builders/rotunda.js';
import { buildPods } from './palace/builders/pods.js';
import { buildOuterWall } from './palace/builders/outerWall.js';
import { buildEmblem } from './palace/builders/emblem.js';
import { buildColliders } from './palace/colliders.js';

export function createHokagePalace({ position = new THREE.Vector3(0, 0, 0), settings = {} } = {}) {
  // Config composed here so all builders receive the same structure
  const CFG = deepMerge(DEFAULT_CONFIG, settings?.hokagePalace || {});
  const mats = createMats(CFG);

  const root = new THREE.Group();
  root.position.copy(position);
  root.scale.set(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE);

  if (CFG.includeGround) {
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(CFG.groundRadius, CFG.groundRadius, 2, 96),
      new THREE.MeshStandardMaterial({ color: CFG.groundColor, roughness: 0.95 })
    );
    ground.receiveShadow = !!settings.shadows;
    ground.position.y = -1; // top at y=0
    root.add(ground);
  }

  // Assemble
  root.add(buildRotunda(CFG, mats));
  root.add(buildPods(CFG, mats));
  root.add(buildOuterWall(CFG, mats));
  root.add(buildEmblem(CFG, mats));

  // Apply shadow settings
  if (settings && typeof settings.shadows === 'boolean') {
    root.traverse(n => {
      if (n.isMesh) {
        n.castShadow = settings.shadows;
        n.receiveShadow = settings.shadows;
      }
    });
  }

  // Colliders
  const colliderProxies = buildColliders(CFG, position, GLOBAL_SCALE);

  // Legacy single AABB collider (kept for backward compatibility)
  const colliderProxy = new THREE.Object3D();
  colliderProxy.position.set(position.x, 0, position.z);
  const baseHalfExt = 120;
  colliderProxy.userData.collider = {
    type: 'aabb',
    center: { x: position.x, z: position.z },
    halfExtents: { x: baseHalfExt * GLOBAL_SCALE, z: baseHalfExt * GLOBAL_SCALE }
  };
  colliderProxy.userData.label = 'Hokage Palace (legacy)';

  return { group: root, colliderProxy, colliderProxies };
}
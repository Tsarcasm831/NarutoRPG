// citySlice.addSlice.js
// Simple entry to create the city slice group and place buildings in a grid.

import * as THREE from 'three';
import { getBuildsForVariant } from './citySlice.builds.js';

export function addKonohaCitySlice(target, opts = {}) {
  const {
    rows = 6,
    cols = 5,
    spacingX = 300,
    spacingZ = 280,
    jitter = 0.14,
    withGround = false,
    groundColor = 0x74ad66,
    center = [0, 0, 0],
    variant = 'default',
    basicPaletteIndex = 0
  } = opts;

  const slice = new THREE.Group();
  slice.name = 'KonohaCitySlice';
  target.add(slice);

  if (withGround) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols * spacingX + 800, rows * spacingZ + 800),
      new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    slice.add(ground);
  }

  const { builds, rows: rOverride, cols: cOverride } = getBuildsForVariant(THREE, { variant, basicPaletteIndex });

  const [cx, , cz] = center;
  const rowsLocal = rOverride ?? rows;
  const colsLocal = cOverride ?? cols;
  const X0 = cx - (colsLocal - 1) * spacingX / 2;
  const Z0 = cz - (rowsLocal - 1) * spacingZ / 2;

  let idx = 0;
  for (let r = 0; r < rowsLocal; r++) {
    for (let c = 0; c < colsLocal; c++) {
      if (idx >= builds.length) break;
      const b = builds[idx++];
      b.position.set(X0 + c * spacingX, 0, Z0 + r * spacingZ);
      b.rotation.y = (Math.random() - 0.5) * jitter;
      slice.add(b);
    }
  }

  slice.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { slice };
}


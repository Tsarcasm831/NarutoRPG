import * as THREE from 'three';

export function createMats(CFG) {
  return {
    woodMat: new THREE.MeshStandardMaterial({ color: CFG.outerWall.color, roughness: 0.85 }),
    redWallMat: new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.8 }),
    whiteMat: new THREE.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.6, metalness: 0.05 }),
    wallMat: new THREE.MeshStandardMaterial({ color: CFG.outerWall.color, roughness: 0.9 }),
    trimMat: new THREE.MeshStandardMaterial({ color: CFG.rotunda.trimColor, roughness: 0.85 }),
    postMat: new THREE.MeshStandardMaterial({ color: 0x6f5437, roughness: 0.85 }),
  };
}


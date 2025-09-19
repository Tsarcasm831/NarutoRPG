import * as THREE from 'three';

export const geometries = [
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.ConeGeometry(3, 8, 8),
    new THREE.SphereGeometry(3, 8, 8)
];

export const materials = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57].map(
    color => new THREE.MeshLambertMaterial({ color })
);

// Low detail variants for LOD
export const simpleGeometries = [
    new THREE.BoxGeometry(5, 5, 5, 1, 1, 1),
    new THREE.ConeGeometry(3, 8, 4),
    new THREE.SphereGeometry(3, 4, 3)
];


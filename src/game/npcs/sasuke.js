import * as THREE from 'three';
import { createNpcRig } from './common.js';

export function createSasuke(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Sasuke',
    manifestPath: './src/components/json/sasukeAnimations.json',
    position,
    scale: 4,
  });
}


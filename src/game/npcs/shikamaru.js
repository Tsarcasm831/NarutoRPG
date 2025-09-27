import * as THREE from 'three';
import { createNpcRig } from './common.js';

export function createShikamaru(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Shikamaru',
    manifestPath: './src/components/json/shikamaruAnimations.json',
    position,
    scale: 4,
  });
}


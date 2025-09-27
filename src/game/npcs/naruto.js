import * as THREE from 'three';
import { createNpcRig } from './common.js';

export function createNaruto(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Naruto',
    manifestPath: './src/components/json/narutoAnimations.json',
    position,
    scale: 4,
  });
}


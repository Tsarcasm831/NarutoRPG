import * as THREE from 'three';
import { createNpcRig } from './common.js';

export function createSakura(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Sakura',
    manifestPath: './src/components/json/sakuraAnimations.json',
    position,
    scale: 4,
  });
}


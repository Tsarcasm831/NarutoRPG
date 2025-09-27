import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';

export function createShikamaru(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Shikamaru',
    manifestPath: './src/components/json/shikamaruAnimations.json',
    position,
    scale: 4,
  }).then((group) => {
    try {
      group.userData.label = 'Shikamaru';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Shikamaru',
              npcImage: '/src/assets/images/mugshots/shikamaru.png',
              player: 'Kakashi',
              playerImage: '/src/assets/images/mugshots/kakashi.png',
              lines: [
                { speaker: 'npc', text: 'What a drag... but I\'ll help.' },
                { speaker: 'player', text: 'I knew I could count on you.' },
                { speaker: 'npc', text: 'Let\'s keep it simple and effective.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    // Wander freely across the map with collision
    try { attachWanderFree(group, { speed: 8 }); } catch (_) {}
    return group;
  });
}

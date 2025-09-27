import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';

export function createSasuke(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Sasuke',
    manifestPath: './src/components/json/sasukeAnimations.json',
    position,
    // 30% smaller overall
    scale: 2.8,
  }).then((group) => {
    try {
      group.userData.label = 'Sasuke';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Sasuke',
              npcImage: '/src/assets/images/mugshots/sasuke.png',
              player: 'Kakashi',
              playerImage: '/src/assets/images/mugshots/kakashi.png',
              lines: [
                { speaker: 'npc', text: '...Hn. What do you want?' },
                { speaker: 'player', text: 'Just checking in. Training going well?' },
                { speaker: 'npc', text: "I won't fall behind. Not again." },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    // Give Sasuke free-wander behavior
    try { attachWanderFree(group, { speed: 10 }); } catch (_) {}
    return group;
  });
}

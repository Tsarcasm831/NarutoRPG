import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';

export function createNaruto(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Naruto',
    manifestPath: './src/components/json/narutoAnimations.json',
    position,
    // 30% smaller overall
    scale: 2.8,
  }).then((group) => {
    try {
      group.userData.label = 'Naruto';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Naruto',
              npcImage: '/src/assets/images/mugshots/naruto.png',
              player: 'Kakashi',
              playerImage: '/src/assets/images/mugshots/kakashi.png',
              lines: [
                { speaker: 'npc', text: 'Believe it! I\'m going to be Hokage!' },
                { speaker: 'player', text: 'Then keep training and don\'t skip ramen time.' },
                { speaker: 'npc', text: 'Heh! Ramen fuels strength!' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    // Give Naruto free-wander behavior
    try { attachWanderFree(group, { speed: 8 }); } catch (_) {}
    return group;
  });
}

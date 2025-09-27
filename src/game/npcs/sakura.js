import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';

export function createSakura(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Sakura',
    manifestPath: './src/components/json/sakuraAnimations.json',
    position,
    scale: 4,
  }).then((group) => {
    try {
      group.userData.label = 'Sakura';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Sakura',
              npcImage: '/src/assets/images/mugshots/sakura.png',
              player: 'Kakashi',
              playerImage: '/src/assets/images/mugshots/kakashi.png',
              lines: [
                { speaker: 'npc', text: 'Need medical supplies? I\'ve got some ready.' },
                { speaker: 'player', text: 'Always prepared. Good work, Sakura.' },
                { speaker: 'npc', text: 'Let\'s keep everyone safe out there.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    // Give Sakura free-wander behavior
    try { attachWanderFree(group, { speed: 7.5 }); } catch (_) {}
    return group;
  });
}

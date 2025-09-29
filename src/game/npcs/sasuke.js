import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';
import { getPlayerIdentity } from '../player/identity.js';

export function createSasuke(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Sasuke',
    manifestPath: './src/components/json/sasukeAnimations.json',
    position,
    // 30% smaller overall
    scale: 2.8,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Sasuke';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          const identity = getPlayerIdentity();
          const playerName = identity?.name || 'Kakashi Hatake';
          const playerImage = identity?.mugshot || '/src/assets/images/mugshots/kakashi.png';

          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Sasuke',
              npcImage: '/src/assets/images/mugshots/sasuke.png',
              player: playerName,
              playerImage,
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

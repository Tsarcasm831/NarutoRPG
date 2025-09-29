import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';
import { getPlayerIdentity } from '../player/identity.js';

export function createOrochimaru(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Orochimaru',
    manifestPath: './src/components/json/orochimaruAnimations.json',
    position,
    scale: 3.1,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Orochimaru';
      group.userData.onInteract = (self) => {
        try {
          const npc = self || group;
          npc.userData.interacting = true;
          try { window.__npcInteracting = npc; } catch (_) {}
          const identity = getPlayerIdentity();
          const playerName = identity?.name || 'Kakashi Hatake';
          const playerImage = identity?.mugshot || '/src/assets/images/mugshots/kakashi.png';
          const shortName = typeof playerName === 'string' ? (playerName.split(' ')[0] || playerName) : 'Kakashi';

          window.dispatchEvent(new CustomEvent('open-npc-dialog', {
            detail: {
              npc: 'Orochimaru',
              npcImage: '/src/assets/images/mugshots/orochimaru.png',
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: `Curiosity can be a dangerous thing, ${shortName}.` },
                { speaker: 'player', text: 'As long as you keep it pointed away from my squad.' },
                { speaker: 'npc', text: 'Oh? Let us see where ambition leads next.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try { attachWanderFree(group, { speed: 6.5 }); } catch (_) {}
    return group;
  });
}

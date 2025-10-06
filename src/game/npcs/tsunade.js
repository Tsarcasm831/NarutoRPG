import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachTsunadeRoutine } from './behaviors/tsunadeRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

const TSUNADE_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="#c62828"/><text x="50%" y="60%" font-size="68" text-anchor="middle" fill="#ffebee" font-family="Segoe UI, Arial, sans-serif">T</text></svg>'
)}`;

export function createTsunade(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Tsunade',
    manifestPath: './src/components/json/tsunadeAnimations.json',
    position,
    scale: 3.05,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Tsunade';
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
              npc: 'Tsunade',
              npcImage: TSUNADE_BADGE,
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'Paperwork, patients, politics... being Hokage never slows down.' },
                { speaker: 'player', text: 'We\'ll keep the village steady for you, Lady Tsunade.' },
                { speaker: 'npc', text: 'Good. Then maybe I can sneak in a moment of sake later.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try {
      attachTsunadeRoutine(group, { spawnPosition: group.position.clone() });
    } catch (_) {}
    return group;
  });
}

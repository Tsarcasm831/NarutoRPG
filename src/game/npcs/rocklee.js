import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachRockLeeRoutine } from './behaviors/rockLeeRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

const ROCK_LEE_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="#1b5e20"/><text x="50%" y="60%" font-size="68" text-anchor="middle" fill="#e8f5e9" font-family="Segoe UI, Arial, sans-serif">L</text></svg>'
)}`;

export function createRockLee(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'RockLee',
    manifestPath: './src/components/json/nejiAnimations.json',
    position,
    scale: 3.0,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Rock Lee';
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
              npc: 'Rock Lee',
              npcImage: ROCK_LEE_BADGE,
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'Hard work is my nindo! Have you trained today?' },
                { speaker: 'player', text: 'Not as much as you, Lee. Teach me a new drill later.' },
                { speaker: 'npc', text: 'With the power of youth, we will surpass every limit!' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try {
      attachRockLeeRoutine(group, { spawnPosition: group.position.clone() });
    } catch (_) {}
    return group;
  });
}

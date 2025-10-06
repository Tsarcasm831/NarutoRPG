import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachKillerBeeRoutine } from './behaviors/killerBeeRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

const KILLER_BEE_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="#ff6f00"/><text x="50%" y="60%" font-size="68" text-anchor="middle" fill="#fff3e0" font-family="Segoe UI, Arial, sans-serif">B</text></svg>'
)}`;

export function createKillerBee(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'KillerBee',
    manifestPath: './src/components/json/killerBeeAnimations.json',
    position,
    scale: 3.15,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Killer Bee';
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
              npc: 'Killer Bee',
              npcImage: KILLER_BEE_BADGE,
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'Yo! Eight-Tails jinchuriki in the zone, spitting rhythm and keeping the peace!' },
                { speaker: 'player', text: 'Just don\'t outpace the rest of us with that energy, Bee.' },
                { speaker: 'npc', text: 'Relax, bro! We\'ll move together and groove together.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try {
      attachKillerBeeRoutine(group, { spawnPosition: group.position.clone() });
    } catch (_) {}
    return group;
  });
}

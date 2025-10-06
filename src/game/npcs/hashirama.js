import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachHashiramaRoutine } from './behaviors/hashiramaRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

const HASHIRAMA_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="#2e7d32"/><text x="50%" y="58%" font-size="72" text-anchor="middle" fill="#f5f5f5" font-family="Segoe UI, Arial, sans-serif">H</text></svg>'
)}`;

export function createHashirama(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Hashirama',
    manifestPath: './src/components/json/hashiramaAnimations.json',
    position,
    scale: 3.1,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Hashirama';
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
              npc: 'Hashirama',
              npcImage: HASHIRAMA_BADGE,
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'The village still feels alive. Protecting it was worth every sacrifice.' },
                { speaker: 'player', text: 'The Will of Fire burns brighter with you watching over us, First Hokage.' },
                { speaker: 'npc', text: 'Then let\'s keep nurturing these roots together.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try {
      attachHashiramaRoutine(group, { spawnPosition: group.position.clone() });
    } catch (_) {}
    return group;
  });
}

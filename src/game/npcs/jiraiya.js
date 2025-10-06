import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachJiraiyaRoutine } from './behaviors/jiraiyaRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

const JIRAIYA_BADGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="#512da8"/><text x="50%" y="60%" font-size="70" text-anchor="middle" fill="#ede7f6" font-family="Segoe UI, Arial, sans-serif">J</text></svg>'
)}`;

export function createJiraiya(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Jiraiya',
    manifestPath: './src/components/json/narutoAnimations.json',
    position,
    scale: 3.2,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Jiraiya';
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
              npc: 'Jiraiya',
              npcImage: JIRAIYA_BADGE,
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'Research never ends, even for a legendary writer like me.' },
                { speaker: 'player', text: 'Just make sure your notes help the next generation, Ero-sennin.' },
                { speaker: 'npc', text: 'Ha! Wisdom and inspiration, that\'s the Jiraiya way.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try {
      attachJiraiyaRoutine(group, { spawnPosition: group.position.clone() });
    } catch (_) {}
    return group;
  });
}

import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachNejiRoutine } from './behaviors/nejiRoutine.js';
import { getPlayerIdentity } from '../player/identity.js';

export function createNeji(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Neji',
    manifestPath: './src/components/json/nejiAnimations.json',
    position,
    scale: 2.8,
    autoAdd: false,
  }).then((group) => {
    try {
      const model = group?.userData?.model;
      if (model) {
        // Force Neji's materials to participate in depth testing so the ground doesn't render through him
        model.traverse((child) => {
          if (!child?.isMesh) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const material of materials) {
            if (!material) continue;
            material.depthWrite = true;
            material.depthTest = true;
            if (material.transparent && material.opacity >= 0.99) {
              material.transparent = false;
              material.opacity = 1;
              material.needsUpdate = true;
            }
          }
        });
      }
      group.userData.label = 'Neji';
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
              npc: 'Neji',
              npcImage: '/src/assets/images/mugshots/neji.png',
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'Destiny may bind us, but I will carve a better path.' },
                { speaker: 'player', text: 'Your insight keeps the team sharp, Neji.' },
                { speaker: 'npc', text: 'Then we will not falter.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    try { attachNejiRoutine(group, { spawnPosition: group.position.clone() }); } catch (_) {}
    return group;
  });
}

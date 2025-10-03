import * as THREE from 'three';
import { createNpcRig } from './common.js';
import { attachWanderFree } from './behaviors/wanderFree.js';
import { getPlayerIdentity } from '../player/identity.js';
import { loadKonohaRoads } from '/src/components/game/objects/konoha_roads.js';
import { WORLD_SIZE } from '/src/scene/terrain.js';

const WORLD_HALF = WORLD_SIZE / 2;

function districtPolygonToWorld(points) {
  if (!Array.isArray(points)) return null;
  const poly = points
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const x = (Number(point[0]) / 100) * WORLD_SIZE - WORLD_HALF;
      const z = (Number(point[1]) / 100) * WORLD_SIZE - WORLD_HALF;
      if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
      return { x, z };
    })
    .filter(Boolean);
  return poly.length >= 3 ? poly : null;
}

export function createShikamaru(scene, settings, position = new THREE.Vector3()) {
  return createNpcRig({
    scene,
    settings,
    name: 'Shikamaru',
    manifestPath: './src/components/json/shikamaruAnimations.json',
    position,
    // 30% smaller overall
    scale: 2.8,
    autoAdd: false,
  }).then((group) => {
    try {
      group.userData.label = 'Shikamaru';
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
              npc: 'Shikamaru',
              npcImage: '/src/assets/images/mugshots/shikamaru.png',
              player: playerName,
              playerImage,
              lines: [
                { speaker: 'npc', text: 'What a drag... but I\'ll help.' },
                { speaker: 'player', text: 'I knew I could count on you.' },
                { speaker: 'npc', text: 'Let\'s keep it simple and effective.' },
              ]
            }
          }));
        } catch (_) {}
      };
    } catch (_) {}
    const applyWander = (polygon) => {
      const options = { speed: 8 };
      if (polygon) {
        options.keepWithinPolygon = polygon;
      }
      try { attachWanderFree(group, options); } catch (_) {}
    };

    loadKonohaRoads()
      .then(({ districts }) => {
        const district = districts?.Nara || districts?.nara;
        const polygon = districtPolygonToWorld(district?.points);
        applyWander(polygon);
      })
      .catch(() => {
        applyWander(null);
      });
    return group;
  });
}

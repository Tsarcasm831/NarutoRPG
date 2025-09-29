import { initScene } from '../scene/initScene.js';
import { createPlayer } from '../game/player/index.js';
import * as THREE from 'three';
import { createNaruto } from '../game/npcs/naruto.js';
import { createSasuke } from '../game/npcs/sasuke.js';
import { createSakura } from '../game/npcs/sakura.js';
import { createShikamaru } from '../game/npcs/shikamaru.js';
import { createNeji } from '../game/npcs/neji.js';
import { createOrochimaru } from '../game/npcs/orochimaru.js';

export function initThreeScene({
  mountRef,
  settings,
  onReadyRef,
  sceneRef,
  rendererRef,
  cameraRef,
  lightRef,
  ambientLightRef,
  groundContainerRef,
  gridHelperRef,
  gridLabelsGroupRef,
  gridLabelsUpdateRef,
  playerRef,
  objectTooltipsGroupRef,
  objectTooltipsUpdateRef,
  interactPromptRef,
  reportBootStatus
}) {
  if (!mountRef.current) return;

  const {
    scene,
    renderer,
    camera,
    light,
    ambientLight,
    groundContainer,
    gridHelper,
    gridLabelsGroup,
    gridLabelsUpdate,
    player,
    objectTooltipsGroup,
    updateObjectTooltips
  } = initScene({
    mountEl: mountRef.current,
    settings: {
      antialiasing: settings.antialiasing,
      shadows: settings.shadows,
      shadowQuality: settings.shadowQuality,
      grid: settings.grid
    },
    createPlayer,
    onReady: () => {
      const finishBoot = async () => {
        try { console.log('[NPC] Spawning party near player...'); } catch (_) {}
        let npcs = [];
        try {
          reportBootStatus?.('squad', 'active');
          const p = player?.position || new THREE.Vector3();
          const base = new THREE.Vector3(p.x, p.y, p.z);
          const offsets = [
            new THREE.Vector3(6, 0, 0),     // Naruto to the +X
            new THREE.Vector3(-6, 0, 0),    // Sasuke to the -X
            new THREE.Vector3(0, 0, 6),     // Sakura to the +Z
            new THREE.Vector3(0, 0, -6),    // Shikamaru to the -Z
            new THREE.Vector3(8, 0, 8),     // Neji near the +X/+Z quadrant
            new THREE.Vector3(-8, 0, 8),    // Orochimaru near the -X/+Z quadrant
          ];

          const spawnPromises = [
            createNaruto(scene, { shadows: settings.shadows }, base.clone().add(offsets[0])),
            createSasuke(scene, { shadows: settings.shadows }, base.clone().add(offsets[1])),
            createSakura(scene, { shadows: settings.shadows }, base.clone().add(offsets[2])),
            createShikamaru(scene, { shadows: settings.shadows }, base.clone().add(offsets[3])),
            createNeji(scene, { shadows: settings.shadows }, base.clone().add(offsets[4])),
            createOrochimaru(scene, { shadows: settings.shadows }, base.clone().add(offsets[5])),
          ];

          const results = await Promise.allSettled(spawnPromises);
          const fulfilled = [];
          const rejected = [];

          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              fulfilled.push(result.value);
            } else {
              rejected.push({ index, reason: result.reason });
            }
          });

          fulfilled.forEach((npc) => {
            try { scene.add(npc); } catch (_) {}
          });

          if (fulfilled.length) {
            npcs = fulfilled;
            try { scene.userData.npcs = fulfilled; } catch (_) {}
          }

          if (rejected.length) {
            reportBootStatus?.('squad', 'error', { rejected });
            rejected.forEach(({ index, reason }) => {
              const name = ['Naruto', 'Sasuke', 'Sakura', 'Shikamaru', 'Neji', 'Orochimaru'][index] || 'Unknown';
              console.error(`[NPC] Failed to spawn ${name}:`, reason);
            });
          } else {
            reportBootStatus?.('squad', 'done');
          }
        } catch (err) {
          reportBootStatus?.('squad', 'error', { err });
          console.error('[NPC] Failed during squad spawn:', err);
        } finally {
          try {
            onReadyRef.current && onReadyRef.current(npcs);
          } catch (_) {}
        }
      };

      finishBoot();
    }
  });

  sceneRef.current = scene;
  rendererRef.current = renderer;
  cameraRef.current = camera;
  lightRef.current = light;
  ambientLightRef.current = ambientLight;
  groundContainerRef.current = groundContainer;
  gridHelperRef.current = gridHelper;
  gridLabelsGroupRef.current = gridLabelsGroup;
  gridLabelsUpdateRef.current = gridLabelsUpdate;
  playerRef.current = player;
  objectTooltipsGroupRef.current = objectTooltipsGroup;
  objectTooltipsUpdateRef.current = updateObjectTooltips;

  const prompt = document.createElement('div');
  prompt.style.position = 'absolute';
  prompt.style.left = '50%';
  prompt.style.bottom = '8%';
  prompt.style.transform = 'translateX(-50%)';
  prompt.style.padding = '8px 12px';
  prompt.style.background = 'rgba(0,0,0,0.7)';
  prompt.style.border = '2px solid rgba(234, 179, 8, 0.9)';
  prompt.style.color = '#fff';
  prompt.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
  prompt.style.borderRadius = '8px';
  prompt.style.pointerEvents = 'none';
  prompt.style.display = 'none';
  prompt.style.zIndex = '25';
  prompt.id = 'interaction-prompt';
  mountRef.current.appendChild(prompt);
  interactPromptRef.current = prompt;
}

export function cleanupThreeScene({
  mountRef,
  rendererRef,
  sceneRef,
  animationStopRef,
  interactPromptRef,
  ambientLightRef,
  groundContainerRef,
  gridLabelsGroupRef,
  gridLabelsArrayRef,
  visibleLabelsRef,
  randomObjectsRef,
  objectGridRef
}) {
  if (animationStopRef.current) {
    animationStopRef.current();
    animationStopRef.current = null;
  }
  if (
    interactPromptRef.current &&
    mountRef.current &&
    mountRef.current.contains(interactPromptRef.current)
  ) {
    mountRef.current.removeChild(interactPromptRef.current);
  }
  interactPromptRef.current = null;

  if (ambientLightRef) {
    ambientLightRef.current = null;
  }

  if (rendererRef.current) {
    rendererRef.current.dispose();
    if (
      mountRef.current &&
      rendererRef.current.domElement &&
      mountRef.current.contains(rendererRef.current.domElement)
    ) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    rendererRef.current = null;
  }
  if (sceneRef.current) {
    while (sceneRef.current.children.length > 0) {
      sceneRef.current.remove(sceneRef.current.children[0]);
    }
    sceneRef.current = null;
  }
  groundContainerRef.current = null;
  gridLabelsGroupRef.current = null;
  gridLabelsArrayRef.current = null;
  if (visibleLabelsRef.current) visibleLabelsRef.current.clear();
  randomObjectsRef.current = [];
  if (objectGridRef.current) objectGridRef.current.clear();
}

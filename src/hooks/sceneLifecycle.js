import { initScene } from '../scene/initScene.js';
import { createPlayer } from '../game/player/index.js';
import * as THREE from 'three';
import { createNaruto } from '../game/npcs/naruto.js';
import { createSasuke } from '../game/npcs/sasuke.js';
import { createSakura } from '../game/npcs/sakura.js';
import { createShikamaru } from '../game/npcs/shikamaru.js';
import { createNeji } from '../game/npcs/neji.js';
import { createOrochimaru } from '../game/npcs/orochimaru.js';
import { getPlayerIdentity } from '../game/player/identity.js';

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
          const p = player?.position || new THREE.Vector3();
          const base = new THREE.Vector3(p.x, p.y, p.z);
          let identityKey = '';
          try {
            const identity = getPlayerIdentity?.();
            const raw = identity?.key || identity?.name || '';
            identityKey = String(raw).toLowerCase().split(/\s+/)[0] || '';
          } catch (_) {
            identityKey = '';
          }

          const spawnEntries = [
            { key: 'naruto', label: 'Naruto', offset: new THREE.Vector3(6, 0, 0), create: createNaruto },
            { key: 'sasuke', label: 'Sasuke', offset: new THREE.Vector3(-6, 0, 0), create: createSasuke },
            { key: 'sakura', label: 'Sakura', offset: new THREE.Vector3(0, 0, 6), create: createSakura },
            { key: 'shikamaru', label: 'Shikamaru', offset: new THREE.Vector3(0, 0, -6), create: createShikamaru },
            { key: 'neji', label: 'Neji', offset: new THREE.Vector3(8, 0, 8), create: createNeji },
            { key: 'orochimaru', label: 'Orochimaru', offset: new THREE.Vector3(-8, 0, 8), create: createOrochimaru }
          ];

          const activeEntries = spawnEntries.filter((entry) => entry.key !== identityKey);
          const roster = activeEntries.map((entry) => entry.label);

          if (roster.length) {
            reportBootStatus?.('squad', 'active', { roster });
          } else {
            reportBootStatus?.('squad', 'active', { roster: [] });
          }

          const spawnPromises = activeEntries.map((entry) => {
            const targetPosition = base.clone().add(entry.offset.clone());
            return entry.create(scene, { shadows: settings.shadows }, targetPosition);
          });

          if (!spawnPromises.length) {
            reportBootStatus?.('squad', 'done', { roster: [] });
            npcs = [];
            return;
          }

          const results = await Promise.allSettled(spawnPromises);
          const fulfilled = [];
          const rejected = [];

          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              fulfilled.push(result.value);
            } else {
              rejected.push({ index, reason: result.reason, label: roster[index] });
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
            reportBootStatus?.('squad', 'error', { rejected, roster });
            rejected.forEach(({ index, reason, label }) => {
              const name = label || roster[index] || `NPC ${index + 1}`;
              console.error(`[NPC] Failed to spawn ${name}:`, reason);
            });
          } else {
            reportBootStatus?.('squad', 'done', { roster });
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

import { initScene } from '../scene/initScene.js';
import { createPlayer } from '../game/player/index.js';
import * as THREE from 'three';
import { createNaruto } from '../game/npcs/naruto.js';
import { createSasuke } from '../game/npcs/sasuke.js';
import { createSakura } from '../game/npcs/sakura.js';
import { createShikamaru } from '../game/npcs/shikamaru.js';

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
  interactPromptRef
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
      try { console.log('[NPC] Spawning party near player...'); } catch (_) {}
      // Spawn party near the player once the player is ready
      try {
        const p = player?.position || new THREE.Vector3();
        const base = new THREE.Vector3(p.x, p.y, p.z);
        const offsets = [
          new THREE.Vector3(6, 0, 0),   // Naruto to the +X
          new THREE.Vector3(-6, 0, 0),  // Sasuke to the -X
          new THREE.Vector3(0, 0, 6),   // Sakura to the +Z
          new THREE.Vector3(0, 0, -6),  // Shikamaru to the -Z
        ];
        // Create NPCs (no movement controllers attached)
        Promise.all([
          createNaruto(scene, { shadows: settings.shadows }, base.clone().add(offsets[0])),
          createSasuke(scene, { shadows: settings.shadows }, base.clone().add(offsets[1])),
          createSakura(scene, { shadows: settings.shadows }, base.clone().add(offsets[2])),
          createShikamaru(scene, { shadows: settings.shadows }, base.clone().add(offsets[3])),
        ]).then((npcs) => {
          try { scene.userData.npcs = npcs; } catch (_) {}
        }).catch(() => {});
      } catch (_) {}
      try {
        onReadyRef.current && onReadyRef.current();
      } catch (_) {}
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

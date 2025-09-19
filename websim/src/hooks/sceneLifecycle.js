import { initScene } from '../scene/initScene.js';
import { createPlayer } from '../game/player/index.js';

export function initThreeScene({
  mountRef,
  settings,
  onReadyRef,
  sceneRef,
  rendererRef,
  cameraRef,
  lightRef,
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
      try {
        onReadyRef.current && onReadyRef.current();
      } catch (_) {}
    }
  });

  sceneRef.current = scene;
  rendererRef.current = renderer;
  cameraRef.current = camera;
  lightRef.current = light;
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

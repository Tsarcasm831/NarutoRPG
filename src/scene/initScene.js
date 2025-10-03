import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { setupGridLabels } from './gridLabels.js';
import { setupObjectTooltips } from './objectTooltips.js';
import { createSkyEnvironment } from './skyEnvironment.js';
import { INTERACTION_DISTANCE } from '../game/constants.js';

/**
 * Initializes the full scene graph, renderer, lights, terrain, grid, and player.
 * Returns references needed by the rest of the system.
 */
export function initScene({ mountEl, settings, createPlayer, onReady }) {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 50, 50);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: settings.antialiasing });
    // Cap pixel ratio to improve performance on hi-dpi screens
    const maxRatio = (typeof settings.maxPixelRatio === 'number' ? settings.maxPixelRatio : 1.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = settings.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mountEl.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    const defaultSunOffset = new THREE.Vector3(30, 80, 40);
    directionalLight.position.copy(defaultSunOffset);
    directionalLight.castShadow = settings.shadows;

    const shadowMapSize = { low: 512, medium: 1024, high: 2048 }[settings.shadowQuality] || 1024;
    directionalLight.shadow.mapSize.width = shadowMapSize;
    directionalLight.shadow.mapSize.height = shadowMapSize;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 400;
    const frustumSize = 160;
    directionalLight.shadow.camera.left = -frustumSize;
    directionalLight.shadow.camera.right = frustumSize;
    directionalLight.shadow.camera.top = frustumSize;
    directionalLight.shadow.camera.bottom = -frustumSize;

    directionalLight.userData.defaultOffset = defaultSunOffset.clone();
    directionalLight.userData.sunOffset = defaultSunOffset.clone();
    directionalLight.userData.horizontalRadius = Math.hypot(defaultSunOffset.x, defaultSunOffset.z);

    scene.add(directionalLight);
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight.target);

    const sky = createSkyEnvironment();
    scene.add(sky.skyDome);
    scene.add(sky.sun);
    scene.add(sky.moon);
    scene.userData.sky = sky;
    directionalLight.userData.sky = sky;

    // Terrain
    const { groundContainer, worldSize } = createTerrain(scene, settings);

    // Grid labels (virtualized) - pass groundContainer so labels bind to terrain height
    const { gridLabelsGroup, updateVisibility: updateGridLabelsVisibility } = setupGridLabels(scene, worldSize, settings, groundContainer);

    // Grid helper
    // LOCKED GRID CELL SIZE: 5 world units. Divisions computed to preserve 5u cells even if world size changes.
    const divisions = Math.max(1, Math.round(worldSize / 5));
    const gridHelper = new THREE.GridHelper(worldSize, divisions, 0x888888, 0x888888);
    // Keep the helper near ground; with future heightmaps, helper remains at baseline while labels stick to actual ground
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    // Reduce overdraw and z-buffer work for the semi-transparent helper
    gridHelper.material.depthWrite = false;
    gridHelper.visible = settings.grid;
    scene.add(gridHelper);

    // Player
    const player = createPlayer(scene, settings, onReady);

    // Object tooltips
    // - General objects (exclude NPCs)
    const { group: objectTooltipsGroup, update: updateGeneralTooltips } = setupObjectTooltips(
        scene,
        { maxVisible: 20, distance: 45, filter: (o) => (o?.userData?.type !== 'npc') }
    );

    // - NPC nameplates (match interaction distance)
    const { update: updateNpcNameplates } = setupObjectTooltips(
        scene,
        { maxVisible: 10, distance: INTERACTION_DISTANCE, filter: (o) => (o?.userData?.type === 'npc') }
    );

    // Combined updater so the animation loop can call one function
    const updateObjectTooltips = (playerPosition, objectGrid, allObjects) => {
        updateGeneralTooltips(playerPosition, objectGrid, allObjects);
        updateNpcNameplates(playerPosition, objectGrid, allObjects);
    };

    return {
        scene,
        renderer,
        camera,
        light: directionalLight,
        ambientLight,
        groundContainer,
        gridHelper,
        gridLabelsGroup,
        // Provide the update function so the loop can call it each frame
        gridLabelsUpdate: updateGridLabelsVisibility,
        // Object tooltips update function/group
        objectTooltipsGroup,
        updateObjectTooltips,
        player
    };
}

import * as THREE from 'three';
import { loadPlayerAssets, playAnimation, DEFAULT_ANIMATION } from './animations.js';
import { updatePlayerMovement } from './movement/index.js';
// @tweakable base path anchor for terrain imports (change only if your host serves /src under a different root)
import { WORLD_SIZE } from '/src/scene/terrain.js';

let lastLightUpdatePosition = new THREE.Vector3();
let shadowCastingObjects = new Set();

/**
 * Resets the internal state of the player module, like shadow casting lists.
 * Should be called when the scene's objects are regenerated.
 */
export function resetPlayerState() {
    lastLightUpdatePosition.set(0, 0, 0);
    shadowCastingObjects.clear();
}

function gridLabelToWorld(label, worldSize, cellSize = 5) {
    const [, letters, numStr] = label.match(/^([A-Z]+)(\d+)$/i) || [];
    const L = letters.toUpperCase(); let idx = 0;
    for (let k = 0; k < L.length; k++) idx = idx * 26 + (L.charCodeAt(k) - 64);
    const i = idx - 1, j = parseInt(numStr, 10) - 1, n = Math.floor(worldSize / cellSize);
    return { x: (i - n / 2) * cellSize + cellSize / 2, z: (j - n / 2) * cellSize + cellSize / 2 };
}

/**
 * Creates the player object, loads its assets, and adds it to the scene.
 * @param {THREE.Scene} scene - The main scene.
 * @param {object} settings - The current game settings.
 * @param {function} onReady - Callback when player is ready.
 * @returns {THREE.Group} The player group object.
 */
export function createPlayer(scene, settings, onReady) {
    const player = new THREE.Group();
    // Spawn the player at grid LF315 (center of that cell)
    const { x, z } = gridLabelToWorld('LF315', WORLD_SIZE, 5);
    player.position.set(x, 0, z);

    // Add custom properties for physics and state
    player.userData.velocity = new THREE.Vector3(0, 0, 0);
    player.userData.onGround = true;
    player.userData.model = null;
    player.userData.mixer = null;
    player.userData.animations = {};
    player.userData.currentAnimation = null;
    player.userData.jumpListener = null;
    // New: lock flag to prevent animation changes during one-shot actions (e.g., attack)
    player.userData.actionLocked = false;

    loadPlayerAssets().then(({ model, animations }) => {
        model.scale.set(4, 4, 4);
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = settings.shadows;
                child.receiveShadow = true;
            }
        });
        player.add(model);
        player.userData.model = model;
        scene.add(player);

        const mixer = new THREE.AnimationMixer(model);
        player.userData.mixer = mixer;

        // Create ClipActions from the loaded clips
        for (const name in animations) {
            const clip = animations[name];
            player.userData.animations[name] = mixer.clipAction(clip);
        }
        
        playAnimation(player, DEFAULT_ANIMATION);

        // Notify scene/game that the player (critical asset) is ready
        try { onReady && onReady(); } catch (_) {}
    }).catch(error => {
        console.error('Error creating player:', error);
        // Fallback to a cylinder if model fails to load
        const playerGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const fallbackPlayer = new THREE.Mesh(playerGeometry, playerMaterial);
        fallbackPlayer.position.y = 4;
        player.add(fallbackPlayer);
        scene.add(player);

        // Even on fallback, signal readiness so the game can proceed
        try { onReady && onReady(); } catch (_) {}
    });
    
    return player;
}


/**
 * Updates the player's state every frame.
 * This includes movement, animation, camera, and lighting updates.
 */
export function updatePlayer(player, keys, camera, light, throttledSetPlayerPosition, objectGrid, delta, joystick, zoom, cameraOrbitRef, cameraPitchRef, firstPersonRef) {
    if (!player.userData.model) {
        // Model not loaded yet, do nothing.
        return;
    }

    // Ensure model visibility matches camera mode (hide body in first-person)
    if (player.userData.model) {
        const fpv = !!(firstPersonRef && firstPersonRef.current);
        player.userData.model.visible = !fpv;
    }

    // First, determine camera yaw/pitch for movement controls
    const yaw = (cameraOrbitRef && typeof cameraOrbitRef.current === 'number') ? cameraOrbitRef.current : 0;
    const pitchRaw = (cameraPitchRef && typeof cameraPitchRef.current === 'number') ? cameraPitchRef.current : 0;
    const isFirstPerson = !!(firstPersonRef && firstPersonRef.current);

    // Pass objectGrid and camera orientation to movement for camera-relative controls
    updatePlayerMovement(player, keys, joystick, delta, objectGrid, yaw, pitchRaw, isFirstPerson);
    
    // Update animation mixer
    if (player.userData.mixer) {
        player.userData.mixer.update(delta);
    }

    // Auto-align camera yaw to motion after sustained movement (3rd person only)
    try {
        if (!isFirstPerson && cameraOrbitRef && typeof cameraOrbitRef.current === 'number') {
            const auto = (player.userData.__autoCam || (player.userData.__autoCam = {
                movingTime: 0,
                lastDir: null,
                aligning: false,
                targetYaw: null
            }));

            const moved = !!player.userData.movedLastFrame;
            const moveAngle = (typeof player.userData.lastWorldMoveAngle === 'number')
                ? player.userData.lastWorldMoveAngle
                : null;

            const normalizeAngle = (a) => {
                const twoPI = Math.PI * 2;
                a = ((a % twoPI) + twoPI) % twoPI;
                if (a > Math.PI) a -= twoPI;
                return a;
            };
            const angleDiff = (a, b) => normalizeAngle(b - a);

            const HOLD_TIME = 0.7;            // seconds to hold movement
            const DIR_TOL = 0.35;             // ~20 deg tolerance for "same direction"
            const CANCEL_TOL = 0.8;           // ~45 deg change cancels current alignment
            const TURN_SPEED = 3.0;           // radians/sec smoothing toward target

            // If player is manually rotating camera (Q/E), cancel auto-align immediately
            if (keys && (keys['KeyQ'] || keys['KeyE'])) {
                auto.movingTime = 0;
                auto.aligning = false;
                auto.targetYaw = null;
                auto.lastDir = null;
            }

            // Track sustained movement in roughly same world direction
            if (moved && moveAngle != null) {
                if (auto.lastDir == null || Math.abs(angleDiff(auto.lastDir, moveAngle)) > DIR_TOL) {
                    auto.lastDir = moveAngle;
                    auto.movingTime = 0;
                    // If direction shifts a lot mid-align, cancel and wait for hold again
                    if (auto.aligning && Math.abs(angleDiff(auto.targetYaw ?? 0, moveAngle + Math.PI)) > CANCEL_TOL) {
                        auto.aligning = false;
                        auto.targetYaw = null;
                    }
                } else {
                    auto.movingTime += delta;
                }
            } else {
                auto.movingTime = 0;
                auto.aligning = false;
                auto.lastDir = null;
                auto.targetYaw = null;
            }

            // Start alignment once the hold time is satisfied, lock target to avoid chasing
            if (!auto.aligning && auto.movingTime >= HOLD_TIME && moveAngle != null) {
                auto.aligning = true;
                // Place camera behind the player (player faces moveAngle)
                auto.targetYaw = normalizeAngle(moveAngle + Math.PI);
            }

            // Progress alignment smoothly each frame
            if (auto.aligning && auto.targetYaw != null) {
                const curYaw = cameraOrbitRef.current || 0;
                const t = 1 - Math.exp(-TURN_SPEED * Math.max(0, delta));
                const d = angleDiff(curYaw, auto.targetYaw);
                const next = normalizeAngle(curYaw + d * t);
                cameraOrbitRef.current = next;
                // Finish when within small epsilon
                if (Math.abs(angleDiff(next, auto.targetYaw)) < 0.02) {
                    cameraOrbitRef.current = auto.targetYaw;
                    auto.aligning = false;
                    auto.targetYaw = null;
                }
            }
        }
    } catch (_) {}

    // Constrain player to world bounds
    const worldBounds = WORLD_SIZE / 2 - 10;
    player.position.x = Math.max(-worldBounds, Math.min(worldBounds, player.position.x));
    player.position.z = Math.max(-worldBounds, Math.min(worldBounds, player.position.z));

    const playerPosition = player.position;

    // Camera follow with yaw and pitch
    const baseY = 50;
    const baseR = 50;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    // pitchRaw computed above
    const pitch = clamp(pitchRaw, -0.9, 0.9);

    if (isFirstPerson) {
        // First-person: place camera at player's head and look forward based on yaw/pitch
        const headHeight = 7.5; // approximate eye height for our scaled model
        const eyePos = new THREE.Vector3(playerPosition.x, playerPosition.y + headHeight, playerPosition.z);

        // Forward vector from yaw/pitch
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);
        const sx = Math.sin(yaw);
        const cx = Math.cos(yaw);

        const dir = new THREE.Vector3(sx * cp, sp, cx * cp);
        const lookTarget = new THREE.Vector3().copy(eyePos).add(dir.multiplyScalar(10));

        camera.position.copy(eyePos);
        camera.lookAt(lookTarget);
    } else {
        // Third-person (existing behavior)
        const r = baseR * zoom;
        const elev = 0.4 + pitch;
        const cosE = Math.cos(elev);
        const sinE = Math.sin(elev);

        const offX = Math.sin(yaw) * r * cosE;
        const offZ = Math.cos(yaw) * r * cosE;
        const offY = baseY * zoom + r * sinE;

        const cameraOffset = new THREE.Vector3(offX, offY, offZ);
        camera.position.copy(playerPosition).add(cameraOffset);
        camera.lookAt(playerPosition);
    }
    
    // Update light and shadows
    if (light) {
        // The light's shadow camera should follow the player's position
        // to ensure shadows are always rendered around the player.
        light.position.copy(playerPosition).add(new THREE.Vector3(30, 80, 40));
        light.target.position.copy(playerPosition);
        light.target.updateMatrixWorld();

        // Dynamically enable/disable shadow casting for objects based on distance.
        if (playerPosition.distanceTo(lastLightUpdatePosition) > 15) {
            const shadowCastDistance = 300;
            const maxShadowCasters = 20;
            
            const nearbyObjects = objectGrid.getObjectsNear(playerPosition, shadowCastDistance);

            nearbyObjects.sort((a, b) => a.position.distanceToSquared(playerPosition) - b.position.distanceToSquared(playerPosition));

            const newShadowCasters = new Set();
            for (let i = 0; i < Math.min(nearbyObjects.length, maxShadowCasters); i++) {
                newShadowCasters.add(nearbyObjects[i]);
            }

            // Turn off shadows for objects that are no longer in the new set.
            shadowCastingObjects.forEach(obj => {
                if (!newShadowCasters.has(obj) && obj.isLOD && obj.children[0]) {
                    // Support both Mesh and Group as LOD level-0
                    const target = obj.children[0];
                    const setCastShadowRecursive = (node, value) => {
                        if (node.isMesh) node.castShadow = value;
                        if (node.children) node.children.forEach(c => setCastShadowRecursive(c, value));
                    };
                    setCastShadowRecursive(target, false);
                }
            });

            // Turn on shadows for new objects in the set.
            newShadowCasters.forEach(obj => {
                if (obj.isLOD && obj.children[0]) {
                    const target = obj.children[0];
                    const setCastShadowRecursive = (node, value) => {
                        if (node.isMesh) node.castShadow = value;
                        if (node.children) node.children.forEach(c => setCastShadowRecursive(c, value));
                    };
                    // Only flip on if at least one child mesh is not casting yet (cheap check)
                    setCastShadowRecursive(target, true);
                }
            });
            
            shadowCastingObjects = newShadowCasters;
            lastLightUpdatePosition.copy(playerPosition);
        }
    }

    if (player.userData.movedLastFrame) {
        // Use throttled function to update React state, reducing re-renders
        throttledSetPlayerPosition({
            x: Math.round(playerPosition.x),
            z: Math.round(playerPosition.z)
        });
    }
}

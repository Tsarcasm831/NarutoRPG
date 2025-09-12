import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useThrottle } from './useThrottle.js';
import { resetPlayerState } from '../game/player/index.js';
import { updateObjects } from '../game/objects.js';
import { startAnimationLoop } from '../scene/animationLoop.js';
import { initThreeScene, cleanupThreeScene } from './sceneLifecycle.js';

export const useThreeScene = ({ mountRef, keysRef, joystickRef, setPlayerPosition, settings, setWorldObjects, isPlaying, onReady }) => {
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const playerRef = useRef(null);
    const animationStopRef = useRef(null);
    const lightRef = useRef(null);
    const randomObjectsRef = useRef([]);
    const objectGridRef = useRef(null);
    const gridHelperRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const groundContainerRef = useRef(null);
    const gridLabelsGroupRef = useRef(null);
    const gridLabelsArrayRef = useRef(null); // legacy (unused with virtualization)
    const visibleLabelsRef = useRef(new Set()); // legacy (unused with virtualization)
    const gridLabelsUpdateRef = useRef(null); // new: function to update labels each frame
    const zoomRef = useRef(0.2);
    // New: object tooltips
    const objectTooltipsGroupRef = useRef(null);
    const objectTooltipsUpdateRef = useRef(null);
    // New: interaction prompt overlay
    const interactPromptRef = useRef(null);
    // New: camera orbit yaw ref (in radians). 0 means camera is at +Z from player.
    const cameraOrbitRef = useRef(0);
    // NEW: camera pitch ref (in radians, clamped in update)
    const cameraPitchRef = useRef(0);
    // NEW: first-person view toggle ref
    const firstPersonRef = useRef(false);

    // Keep a stable ref to onReady to avoid re-initializing the scene on every render
    const onReadyRef = useRef(onReady);
    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    const throttledSetPlayerPosition = useThrottle(setPlayerPosition, 250);

    const cleanupScene = useCallback(() => {
        cleanupThreeScene({
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
        });
    }, [mountRef]);

    // Initialize should only change (and thus cause a re-init) when absolutely necessary.
    // Antialiasing requires a fresh renderer, so we keep it as a dependency.
    // Other settings (grid visibility, shadows, shadow quality, etc.) are applied live below.
    const initialize = useCallback(() => {
        initThreeScene({
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
        });
    }, [mountRef, settings.antialiasing]); // NOTE: intentionally excludes onReady to prevent re-init on movement-driven re-renders

    useEffect(() => {
        if (!isPlaying) {
            cleanupScene();
            return;
        }
        initialize();

        // start main loop
        animationStopRef.current = startAnimationLoop({
            sceneRef,
            cameraRef,
            rendererRef,
            lightRef,
            playerRef,
            objectGridRef,
            randomObjectsRef,
            keysRef,
            throttledSetPlayerPosition,
            joystickRef,
            zoomRef,
            cameraOrbitRef,
            // NEW: pass pitch ref
            cameraPitchRef,
            fpsLimit: settings.fpsLimit,
            // Grid labels (virtualized)
            gridLabelsGroupRef,
            gridLabelsArrayRef,
            visibleLabelsRef,
            gridLabelsUpdateRef,
            clockRef,
            // Object tooltips
            objectTooltipsUpdateRef,
            // Interaction prompt
            interactPromptRef,
            // NEW: first-person ref
            firstPersonRef
        });

        return cleanupScene;
    }, [isPlaying, initialize, cleanupScene, settings.fpsLimit, keysRef, joystickRef, throttledSetPlayerPosition]);

    // Settings updates (no full reinit)
    useEffect(() => {
        if (!rendererRef.current || !lightRef.current || !playerRef.current || !gridHelperRef.current || !groundContainerRef.current) return;
        rendererRef.current.shadowMap.enabled = settings.shadows;
        lightRef.current.castShadow = settings.shadows;

        // NEW: apply pixel ratio changes live
        if (typeof settings.maxPixelRatio === 'number') {
            const target = Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio);
            if (rendererRef.current.getPixelRatio?.() !== target) {
                rendererRef.current.setPixelRatio(target);
                rendererRef.current.setSize(window.innerWidth, window.innerHeight, false);
            }
        }

        groundContainerRef.current.children.forEach(tile => {
            tile.receiveShadow = settings.shadows;
        });
        playerRef.current.castShadow = settings.shadows;

        const shadowMapSize = { low: 512, medium: 1024, high: 2048 }[settings.shadowQuality] || 1024;
        if (lightRef.current.shadow.mapSize.width !== shadowMapSize) {
            lightRef.current.shadow.mapSize.width = shadowMapSize;
            lightRef.current.shadow.mapSize.height = shadowMapSize;
            lightRef.current.shadow.map = null;
        }
        rendererRef.current.shadowMap.needsUpdate = true;

        if (gridHelperRef.current) gridHelperRef.current.visible = settings.grid;
        if (gridLabelsGroupRef.current) gridLabelsGroupRef.current.visible = settings.grid;
    }, [settings.shadows, settings.grid, settings.shadowQuality, settings.maxPixelRatio]);

    // Object density updates
    useEffect(() => {
        if (!sceneRef.current || !isPlaying) return;
        resetPlayerState();
        const { objects, grid } = updateObjects(sceneRef.current, randomObjectsRef.current, settings);
        randomObjectsRef.current = objects;
        objectGridRef.current = grid;
        if (setWorldObjects) {
            // Build world map dots from the spatial grid so instanced proxies are included.
            const items = [];
            if (objectGridRef.current && objectGridRef.current.grid) {
                const seen = new Set();
                const pickColorHex = (obj) => {
                    // Prefer explicit color for proxies
                    try {
                        if (obj?.userData?.colorHex) return obj.userData.colorHex;
                    } catch (e) {
                        // ignore
                    }

                    // Safely search the object and all descendants for a mesh material color
                    const visited = new Set();
                    const stack = [obj];
                    while (stack.length) {
                        const n = stack.pop();
                        if (!n || visited.has(n)) continue;
                        visited.add(n);

                        try {
                            if (n.isMesh && n.material && n.material.color && typeof n.material.color.getHexString === 'function') {
                                return n.material.color.getHexString();
                            }
                        } catch (e) {
                            // ignore and continue
                        }

                        if (n.children && n.children.length) {
                            for (let i = 0; i < n.children.length; i++) {
                                stack.push(n.children[i]);
                            }
                        }
                    }

                    return 'ffffff';
                };

                // Iterate over all grid cells
                for (const key in objectGridRef.current.grid) {
                    if (!Object.prototype.hasOwnProperty.call(objectGridRef.current.grid, key)) continue;
                    const arr = objectGridRef.current.grid[key];
                    if (!arr) continue;
                    for (let i = 0; i < arr.length; i++) {
                        const obj = arr[i];
                        if (!obj || !obj.position) continue;
                        if (seen.has(obj)) continue;
                        seen.add(obj);

                        const color = pickColorHex(obj);
                        // Clone position to avoid mutation
                        items.push({
                            position: obj.position.clone ? obj.position.clone() : { x: obj.position.x, y: obj.position.y, z: obj.position.z },
                            color
                        });
                    }
                }
            }
            setWorldObjects(items);
        }
    }, [settings.objectDensity, isPlaying, setWorldObjects]);

    // Resize
    useEffect(() => {
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mouse wheel zoom
    useEffect(() => {
        const handleWheel = (event) => {
            const zoomSpeed = 0.1;
            zoomRef.current += event.deltaY * 0.001 * zoomSpeed * 5;
            zoomRef.current = Math.max(0.2, Math.min(MAX_CAMERA_ZOOM, zoomRef.current));
        };
        const mountElement = mountRef.current;
        if (mountElement) {
            mountElement.addEventListener('wheel', handleWheel);
        }
        return () => {
            if (mountElement) mountElement.removeEventListener('wheel', handleWheel);
        };
    }, [isPlaying, mountRef]);

    // Mobile: Pinch-to-zoom
    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        let pinchStartDist = null;
        let pinchStartZoom = null;

        const getDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.hypot(dx, dy);
        };

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                // Prevent page zoom/scroll during pinch
                if (e.cancelable) e.preventDefault();
                pinchStartDist = getDistance(e.touches);
                pinchStartZoom = zoomRef.current ?? 0.2;
            }
        };

        const onTouchMove = (e) => {
            if (e.touches.length === 2 && pinchStartDist && pinchStartZoom != null) {
                // Prevent default to avoid page scrolling
                if (e.cancelable) e.preventDefault();
                const currentDist = getDistance(e.touches);
                const scale = currentDist / pinchStartDist;
                // Gentle sensitivity
                const newZoom = pinchStartZoom * scale;
                zoomRef.current = Math.max(0.2, Math.min(MAX_CAMERA_ZOOM, newZoom));
            }
        };

        const onTouchEnd = () => {
            // Reset when gesture ends or fingers lifted
            pinchStartDist = null;
            pinchStartZoom = null;
        };

        // Use non-passive to allow preventDefault
        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: false });
        el.addEventListener('touchcancel', onTouchEnd, { passive: false });

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [mountRef, zoomRef, isPlaying]);

    // Desktop: Right-click-and-drag to rotate camera (yaw + pitch)
    useEffect(() => {
        const el = mountRef.current;
        if (!el || !isPlaying) return;

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        const clampPitch = (v) => Math.max(-0.9, Math.min(0.9, v));
        const normalizeAngle = (a) => {
            const twoPI = Math.PI * 2;
            a = ((a % twoPI) + twoPI) % twoPI;
            if (a > Math.PI) a -= twoPI;
            return a;
        };

        // Base sensitivities; adapt by zoom to keep feel consistent
        const BASE_SENS_X = 0.008; // radians per px (yaw)
        const BASE_SENS_Y = 0.010; // radians per px (pitch)

        const onContextMenu = (e) => {
            // Disable context menu anywhere over the game mount for uninterrupted camera look
            e.preventDefault();
        };

        const onMouseDown = (e) => {
            if (e.button !== 2) return; // right button
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            // Prevent text selection/drag side-effects
            e.preventDefault();
            document.body.style.cursor = 'grabbing';
        };

        const onMouseMove = (e) => {
            if (!dragging) return;

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            const zoom = (zoomRef?.current ?? 0.2);
            const zoomScale = 0.2 / Math.max(0.12, Math.min(MAX_CAMERA_ZOOM, zoom));
            const sensX = BASE_SENS_X * zoomScale;
            const sensY = BASE_SENS_Y * zoomScale;

            if (cameraOrbitRef) {
                // Invert dx so dragging right rotates camera to the right
                const next = (cameraOrbitRef.current || 0) - dx * sensX;
                cameraOrbitRef.current = normalizeAngle(next);
            }
            if (cameraPitchRef) {
                const proposed = (cameraPitchRef.current || 0) - dy * sensY; // dragging up tilts down
                cameraPitchRef.current = clampPitch(proposed);
            }

            e.preventDefault();
        };

        const onMouseUp = (e) => {
            if (e.button === 2) {
                dragging = false;
                document.body.style.cursor = '';
            }
        };

        el.addEventListener('contextmenu', onContextMenu);
        el.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            el.removeEventListener('contextmenu', onContextMenu);
            el.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
        };
    }, [mountRef, isPlaying, zoomRef, cameraOrbitRef, cameraPitchRef]);

    // @tweakable maximum camera zoom multiplier (applies to wheel, pinch, and sensitivity calcs)
    const MAX_CAMERA_ZOOM = 50;

    return { playerRef, zoomRef, cameraOrbitRef, cameraPitchRef };
};
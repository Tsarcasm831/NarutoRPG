import * as TWEEN from '@tweenjs/tween.js';
import { updatePlayer } from '../game/player/index.js';

/**
 * Starts the main animation loop and returns a stop() function.
 */
export function startAnimationLoop({
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
    // NEW: camera pitch ref
    cameraPitchRef,
    fpsLimit,
    // Grid labels (virtualized)
    gridLabelsGroupRef,
    gridLabelsArrayRef,     // kept for backward compatibility; unused with virtualization
    visibleLabelsRef,       // kept for backward compatibility; unused with virtualization
    gridLabelsUpdateRef,    // new: function ref to call per-frame
    clockRef,
    // New: object tooltips
    objectTooltipsUpdateRef,
    // New: interaction prompt
    interactPromptRef,
    // NEW: first-person toggle ref
    firstPersonRef
}) {
    let animationId = null;
    const fpsIntervals = {
        'Unlimited': 0,
        '60 FPS': 1000 / 60,
        '30 FPS': 1000 / 30,
    };
    const fpsInterval = fpsIntervals[fpsLimit] || 0;
    let lastFrameTime = 0;

    const interactionDistance = 10; // world units to interact
    let lastInteractObj = null;
    let promptHideTimeout = null;

    const clampPitch = (v) => Math.max(-0.9, Math.min(0.9, v));
    const normalizeAngle = (a) => {
        const twoPI = Math.PI * 2;
        a = ((a % twoPI) + twoPI) % twoPI;
        if (a > Math.PI) a -= twoPI;
        return a;
    };

    // @tweakable keyboard zoom-in multiplicative factor (applied per key press)
    const KEY_ZOOM_IN_FACTOR = 0.9;
    // @tweakable keyboard zoom-out multiplicative factor (applied per key press)
    const KEY_ZOOM_OUT_FACTOR = 1.1;
    // @tweakable minimum camera zoom multiplier
    const KEY_ZOOM_MIN = 0.2;
    /* @tweakable maximum camera zoom multiplier for keyboard zoom controls */
    const KEY_ZOOM_MAX = 50;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* @tweakable when true, only objects that currently have a collider are eligible for interaction/tooltip */
    const INTERACT_REQUIRE_COLLIDER = true;

    const onPointerMove = (e) => {
        if (!firstPersonRef.current) return;
        if (document.pointerLockElement !== rendererRef.current?.domElement) return;
        const sens = 0.002;
        if (cameraOrbitRef) {
            // Desktop FPV: moving mouse right rotates camera to the right (invert sign vs. add)
            const next = (cameraOrbitRef.current || 0) - e.movementX * sens;
            cameraOrbitRef.current = normalizeAngle(next);
        }
        if (cameraPitchRef) {
            const nextP = (cameraPitchRef.current || 0) - e.movementY * sens;
            cameraPitchRef.current = clampPitch(nextP);
        }
    };
    document.addEventListener('mousemove', onPointerMove);

    const onPointerLockChange = () => {
        const el = rendererRef.current?.domElement;
        const isLocked = (document.pointerLockElement === el);
        // Sync FPV state purely from actual pointer-lock status
        firstPersonRef.current = !!isLocked;

        // Keep orientation consistent when entering/leaving FPV
        try {
            const model = playerRef.current?.userData?.model;
            if (isLocked && model && cameraOrbitRef) {
                // Entering FPV: mirror model yaw into camera orbit
                cameraOrbitRef.current = model.rotation.y || 0;
            } else if (!isLocked && model && cameraOrbitRef) {
                // Leaving FPV: mirror camera orbit back into model yaw
                model.rotation.y = cameraOrbitRef.current || 0;
            }
        } catch (_) {}
    };
    const onPointerLockError = () => {
        // If lock fails, ensure FPV is off
        firstPersonRef.current = false;
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    function setPrompt(text, visible) {
        const el = interactPromptRef?.current;
        if (!el) return;
        if (visible) {
            el.textContent = text;
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }

    function findNearestInteractable(playerPosition) {
        if (!objectGridRef.current) return null;
        // Use an expanded radius so objects with far centers but nearby collider edges are included
        const nearby = objectGridRef.current.getObjectsNear(playerPosition, interactionDistance + 80) || [];

        // Geometry helpers for collider-distance checks
        const pointInPolyXZ = (p, poly) => {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[i], b = poly[j];
                const intersect = ((a.z > p.z) !== (b.z > p.z)) &&
                    (p.x < ((b.x - a.x) * (p.z - a.z)) / ((b.z - a.z) || 1e-9) + a.x);
                if (intersect) inside = !inside;
            }
            return inside;
        };
        const distPointSeg2 = (px, pz, ax, az, bx, bz) => {
            const vx = bx - ax, vz = bz - az;
            const wx = px - ax, wz = pz - az;
            const len2 = Math.max(1e-8, vx * vx + vz * vz);
            const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / len2));
            const cx = ax + vx * t, cz = az + vz * t;
            const dx = px - cx, dz = pz - cz;
            return dx * dx + dz * dz;
        };
        const distToPolygonBorder = (p, poly) => {
            if (!Array.isArray(poly) || poly.length < 3) return Infinity;
            if (pointInPolyXZ(p, poly)) return 0;
            let bestD2 = Infinity;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[j], b = poly[i];
                const d2 = distPointSeg2(p.x, p.z, a.x, a.z, b.x, b.z);
                if (d2 < bestD2) bestD2 = d2;
            }
            return Math.sqrt(bestD2);
        };
        const distToAABB = (p, cx, cz, hx, hz) => {
            const dx = Math.max(0, Math.abs(p.x - cx) - Math.max(0.0001, hx));
            const dz = Math.max(0, Math.abs(p.z - cz) - Math.max(0.0001, hz));
            return Math.hypot(dx, dz);
        };
        const distToOBB = (p, cx, cz, hx, hz, rotY) => {
            const cos = Math.cos(-rotY || 0), sin = Math.sin(-rotY || 0);
            const lx = (p.x - cx) * cos - (p.z - cz) * sin;
            const lz = (p.x - cx) * sin + (p.z - cz) * cos;
            return distToAABB({ x: lx, z: lz }, 0, 0, hx, hz);
        };
        const distToSphereBorder = (p, cx, cz, r) => {
            const dx = p.x - cx, dz = p.z - cz;
            return Math.max(0, Math.hypot(dx, dz) - Math.max(0, r));
        };

        let best = null;
        let bestDist = Infinity;
        for (let i = 0; i < nearby.length; i++) {
            const o = nearby[i];
            if (!o || !o.position) continue;
            const col = o.userData?.collider;
            if (INTERACT_REQUIRE_COLLIDER && !col) continue;

            let d = Infinity;
            if (col) {
                if (col.type === 'polygon' && Array.isArray(col.points)) {
                    d = distToPolygonBorder(playerPosition, col.points);
                } else if (col.type === 'obb' || col.type === 'orientedBox') {
                    const cx = col.center?.x ?? o.position.x;
                    const cz = col.center?.z ?? o.position.z;
                    const hx = col.halfExtents?.x ?? 1;
                    const hz = col.halfExtents?.z ?? 1;
                    const a = col.rotationY ?? 0;
                    d = distToOBB(playerPosition, cx, cz, hx, hz, a);
                } else if (col.type === 'aabb') {
                    const cx = col.center?.x ?? o.position.x;
                    const cz = col.center?.z ?? o.position.z;
                    const hx = col.halfExtents?.x ?? 8;
                    const hz = col.halfExtents?.z ?? 6;
                    d = distToAABB(playerPosition, cx, cz, hx, hz);
                } else if (col.type === 'sphere') {
                    const cx = o.position.x, cz = o.position.z;
                    d = distToSphereBorder(playerPosition, cx, cz, col.radius || 0);
                } else {
                    // Unknown collider: fall back to center distance
                    const dx = o.position.x - playerPosition.x;
                    const dz = o.position.z - playerPosition.z;
                    d = Math.hypot(dx, dz);
                }
            } else {
                // No collider: use center distance (legacy)
                const dx = o.position.x - playerPosition.x;
                const dz = o.position.z - playerPosition.z;
                d = Math.hypot(dx, dz);
            }

            if (d <= interactionDistance && d < bestDist) {
                best = o;
                bestDist = d;
            }
        }
        return best;
    }

    function animate(timestamp) {
        animationId = requestAnimationFrame(animate);

        const elapsed = timestamp - lastFrameTime;
        if (fpsInterval > 0 && elapsed < fpsInterval) {
            return;
        }
        lastFrameTime = fpsInterval > 0 ? timestamp - (elapsed % fpsInterval) : timestamp;

        TWEEN.update(timestamp);

        /* @tweakable hard maximum camera zoom multiplier (frame-enforced cap) */
        const HARD_ZOOM_MAX = KEY_ZOOM_MAX;
        if (zoomRef && typeof zoomRef.current === 'number') {
            zoomRef.current = clamp(zoomRef.current, KEY_ZOOM_MIN, HARD_ZOOM_MAX);
        }

        if (!playerRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current || !objectGridRef.current) return;

        // Early pause: freeze updates when a modal requests a pause
        if (window.__gamePaused) {
            setPrompt('', false);
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            return;
        }

        // Handle first-person toggle fallback ONLY when Pointer Lock is unavailable
        if (keysRef.current['ToggleFirstPerson']) {
            keysRef.current['ToggleFirstPerson'] = false;
            const supportsPointerLock = !!(rendererRef.current?.domElement?.requestPointerLock);
            if (!supportsPointerLock) {
                const entering = !firstPersonRef.current;
                firstPersonRef.current = !firstPersonRef.current;
                try {
                    const model = playerRef.current?.userData?.model;
                    if (entering && model && cameraOrbitRef) {
                        cameraOrbitRef.current = model.rotation.y || 0;
                    } else if (!entering && model && cameraOrbitRef) {
                        model.rotation.y = cameraOrbitRef.current || 0;
                    }
                } catch (_) {}
            }
        }

        // Handle keyboard zoom clicks ('=' to zoom in, '-' to zoom out)
        if (keysRef.current['ZoomInClicked']) {
            keysRef.current['ZoomInClicked'] = false;
            const current = zoomRef.current ?? 0.2;
            zoomRef.current = clamp(current * KEY_ZOOM_IN_FACTOR, KEY_ZOOM_MIN, KEY_ZOOM_MAX);
        }
        if (keysRef.current['ZoomOutClicked']) {
            keysRef.current['ZoomOutClicked'] = false;
            const current = zoomRef.current ?? 0.2;
            zoomRef.current = clamp(current * KEY_ZOOM_OUT_FACTOR, KEY_ZOOM_MIN, KEY_ZOOM_MAX);
        }

        const delta = clockRef.current.getDelta();

        // Grid label visibility (virtualized: delegate to update function)
        if (gridLabelsGroupRef.current && gridLabelsGroupRef.current.visible && gridLabelsUpdateRef?.current) {
            gridLabelsUpdateRef.current(playerRef.current.position);
        } else if (gridLabelsGroupRef.current && !gridLabelsGroupRef.current.visible && visibleLabelsRef?.current?.size > 0) {
            // Legacy cleanup path if visibleLabelsRef is used elsewhere
            visibleLabelsRef.current.forEach(label => (label.visible = false));
            visibleLabelsRef.current.clear();
        }

        // Object tooltips update
        if (objectTooltipsUpdateRef?.current) {
            objectTooltipsUpdateRef.current(
                playerRef.current.position,
                objectGridRef.current,
                randomObjectsRef.current
            );
        }

        // Interaction prompt handling
        const playerPos = playerRef.current.position;
        const focusObj = findNearestInteractable(playerPos);
        if (focusObj) {
            const name = focusObj.userData?.label || focusObj.name || 'Object';
            setPrompt(`Press F to interact (${name})`, true);
        } else {
            setPrompt('', false);
        }

        // Handle Interact key (edge-triggered)
        if (keysRef.current['KeyFClicked']) {
            keysRef.current['KeyFClicked'] = false;
            const target = focusObj;
            if (target) {
                const name = target.userData?.label || target.name || 'Object';
                setPrompt(`Interacted with ${name}`, true);
                if (promptHideTimeout) clearTimeout(promptHideTimeout);
                promptHideTimeout = setTimeout(() => setPrompt('', false), 1200);
                // Call custom interaction if provided
                if (typeof target.userData?.onInteract === 'function') {
                    try {
                        target.userData.onInteract(target, playerRef.current);
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn('Interaction handler error:', e);
                    }
                }
            }
        }

        // Player update
        updatePlayer(
            playerRef.current,
            keysRef.current,
            cameraRef.current,
            lightRef.current,
            throttledSetPlayerPosition,
            objectGridRef.current,
            delta,
            joystickRef.current,
            zoomRef.current,
            cameraOrbitRef,
            // NEW: pass pitch ref
            cameraPitchRef,
            // NEW: pass first-person ref
            firstPersonRef
        );

        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    animate(0);

    return function stop() {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        throttledSetPlayerPosition.cancel?.();
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('pointerlockchange', onPointerLockChange);
        document.removeEventListener('pointerlockerror', onPointerLockError);
        if (document.pointerLockElement) document.exitPointerLock();
    };
}

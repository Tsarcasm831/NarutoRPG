import * as THREE from 'three';
import { createTextLabel, attachSetText } from './textLabel.js';

/* @tweakable when true, only show tooltips for objects that currently have a collider */
const TOOLTIP_REQUIRE_COLLIDER = true;

/**
 * Object tooltips manager.
 * - Uses a small sprite pool to show labels for nearest objects to the player.
 * - Updates only when needed and reuses sprites to avoid allocations.
 */
export function setupObjectTooltips(scene, { maxVisible = 20, distance = 45 } = {}) {
    const group = new THREE.Group();
    group.renderOrder = 9998;
    scene.add(group);

    // Sprite pool
    const pool = [];
    for (let i = 0; i < maxVisible; i++) {
        const s = createTextLabel('', {
            fontsize: 64,
            fontface: 'monospace',
            textColor: 'rgba(255,255,200,1)',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            scale: 6
        });
        // Ensure each sprite has a setText method so we can update labels on the fly
        attachSetText(s, {
            fontsize: 64,
            fontface: 'monospace',
            textColor: 'rgba(255,255,200,1)',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            scale: 6
        });
        // Set a subtle placeholder so empty sprites aren't confusing
        s.userData.setText('…');

        s.visible = false;
        group.add(s);
        pool.push(s);
    }

    const active = new Map(); // object -> sprite
    const free = [...pool];

    function releaseAll() {
        active.forEach((sprite) => {
            sprite.visible = false;
            free.push(sprite);
        });
        active.clear();
    }

    function getApproxObjectHeight(obj) {
        // Instance proxies can provide a light-weight height hint
        if (obj?.userData?.instanceHeight) {
            return obj.userData.instanceHeight;
        }

        // Estimate height using bounding box of first LOD level or the object itself
        let target = obj;
        if (obj.isLOD && obj.children && obj.children.length > 0) {
            target = obj.children[0];
        }
        const bbox = new THREE.Box3().setFromObject(target);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        // Fallback height if invalid
        return isFinite(size.y) && size.y > 0 ? size.y : 4;
    }

    function getWorldPosition(obj) {
        // Instance proxies are not added to the scene; use their position directly
        if (obj?.userData?.isInstanceProxy) {
            return obj.position.clone ? obj.position.clone() : new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
        }
        const pos = new THREE.Vector3();
        obj.getWorldPosition(pos);
        return pos;
    }

    /**
     * Update tooltips based on player position and nearby objects.
     */
    function update(playerPosition, objectGrid, allObjects) {
        if (!playerPosition || !objectGrid) return;

        // Gather candidates near player
        const nearby = objectGrid.getObjectsNear(playerPosition, distance + 10) || [];

        // Score and sort by distance
        const scored = [];
        for (let i = 0; i < nearby.length; i++) {
            const o = nearby[i];
            if (!o || !o.position) continue;
            // Skip objects without an active collider if required (prevents choosing placeholder proxies)
            if (TOOLTIP_REQUIRE_COLLIDER && !o.userData?.collider) continue;
            const dx = o.position.x - playerPosition.x;
            const dz = o.position.z - playerPosition.z;
            const distSq = dx * dx + dz * dz;
            if (distSq <= distance * distance) {
                scored.push({ obj: o, distSq });
            }
        }
        scored.sort((a, b) => a.distSq - b.distSq);

        // Determine desired set
        const desired = new Set();
        for (let i = 0; i < Math.min(scored.length, pool.length); i++) {
            desired.add(scored[i].obj);
        }

        // Release sprites for objects no longer desired
        active.forEach((sprite, obj) => {
            if (!desired.has(obj)) {
                active.delete(obj);
                sprite.visible = false;
                free.push(sprite);
            }
        });

        // Assign sprites to desired objects
        for (const { obj } of scored) {
            if (!desired.has(obj)) continue;
            let sprite = active.get(obj);
            if (!sprite) {
                sprite = free.pop();
                if (!sprite) break; // pool exhausted
                active.set(obj, sprite);

                // Set text using label or a generic one
                const text = obj.userData?.label || (obj.userData?.isHouse ? 'House' : (obj.name || 'Object'));
                sprite.userData.setText(String(text));
            }

            // Position sprite above object
            const worldPos = getWorldPosition(obj);
            const h = getApproxObjectHeight(obj);
            sprite.position.set(worldPos.x, Math.max(0.5, h + 1.5), worldPos.z);
            sprite.visible = true;
        }
    }

    return { group, update, releaseAll };
}
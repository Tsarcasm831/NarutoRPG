import * as THREE from 'three';
import { createTextLabel, attachSetText } from './textLabel.js';

/* @tweakable when true, only show tooltips for objects that currently have a collider */
const TOOLTIP_REQUIRE_COLLIDER = true;

/**
 * Object tooltips manager.
 * - Uses a small sprite pool to show labels for nearest objects to the player.
 * - Updates only when needed and reuses sprites to avoid allocations.
 */
export function setupObjectTooltips(scene, { maxVisible = 20, distance = 45, filter = null } = {}) {
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

        // Gather candidates near player (expanded radius to account for collider borders)
        const nearby = objectGrid.getObjectsNear(playerPosition, distance + 80) || [];

        // Geometry helpers for collider-distance checks (match interaction logic)
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

        // Score and sort by border distance
        const scored = [];
        for (let i = 0; i < nearby.length; i++) {
            const o = nearby[i];
            if (!o || !o.position) continue;
            if (typeof filter === 'function' && !filter(o)) continue;
            // Skip objects without an active collider if required (prevents choosing placeholder proxies)
            if (TOOLTIP_REQUIRE_COLLIDER && !o.userData?.collider) continue;

            const col = o.userData?.collider;
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

            if (d <= distance) {
                scored.push({ obj: o, dist: d });
            }
        }
        scored.sort((a, b) => a.dist - b.dist);

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

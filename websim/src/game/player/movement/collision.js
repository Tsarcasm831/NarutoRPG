/**
 * Resolves collisions between the player and nearby objects in the world.
 * @param {{x:number, z:number}} newPos - Proposed new XZ position.
 * @param {number} playerRadius - Collision radius of the player.
 * @param {object} objectGrid - Spatial grid of world objects.
 * @returns {{x:number, z:number}} Adjusted position after resolving collisions.
 */
export function resolveCollisions(newPos, playerRadius, objectGrid) {
    if (!objectGrid) return newPos;

    // Query nearby objects within a reasonable radius
    const searchRadius = 50;
    const nearby = objectGrid.getObjectsNear(newPos, searchRadius);
    if (!nearby || nearby.length === 0) return newPos;

    // Helper: resolve collision against an oriented (rotated) rectangle in XZ plane (OBB).
    // obb = { center: {x,z}, halfExtents: {x: hx, z: hz}, rotationY: radians }
    function resolveOBB(localNewPos, obb) {
        // Translate into OBB local space
        const dx = localNewPos.x - obb.center.x;
        const dz = localNewPos.z - obb.center.z;

        const cos = Math.cos(-obb.rotationY);
        const sin = Math.sin(-obb.rotationY);

        // Rotate by -rotation to align OBB with axes
        const lx = dx * cos - dz * sin;
        const lz = dx * sin + dz * cos;

        const hx = Math.max(0.0001, obb.halfExtents.x);
        const hz = Math.max(0.0001, obb.halfExtents.z);

        // Expand by player radius (Minkowski sum)
        const ex = hx + playerRadius;
        const ez = hz + playerRadius;

        // Check overlap in local space
        const ox = ex - Math.abs(lx);
        const oz = ez - Math.abs(lz);

        if (ox > 0 && oz > 0) {
            // Penetrating; push out along the axis of least penetration
            if (ox < oz) {
                // Push along X
                const sx = lx < 0 ? -1 : 1;
                const newLx = sx * ex;
                const dLx = newLx - lx;
                const dW_x = dLx * Math.cos(obb.rotationY) - 0 * Math.sin(obb.rotationY);
                const dW_z = dLx * Math.sin(obb.rotationY) + 0 * Math.cos(obb.rotationY);
                localNewPos.x += dW_x;
                localNewPos.z += dW_z;
                return true;
            } else {
                // Push along Z
                const sz = lz < 0 ? -1 : 1;
                const newLz = sz * ez;
                const dLz = newLz - lz;
                const dW_x = 0 * Math.cos(obb.rotationY) - dLz * Math.sin(obb.rotationY);
                const dW_z = 0 * Math.sin(obb.rotationY) + dLz * Math.cos(obb.rotationY);
                localNewPos.x += dW_x;
                localNewPos.z += dW_z;
                return true;
            }
        }
        return false;
    }

    // NEW: resolve circle (player) vs polygon (XZ) using SAT-like pushout
    function resolveCirclePolygon(center, radius, polygon) {
        if (!polygon || polygon.length < 3) return false;
        // point-in-polygon test (ray cast on XZ)
        const pointInPoly = (p, poly) => {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[i], b = poly[j];
                const intersect = ((a.z > p.z) !== (b.z > p.z)) &&
                    (p.x < ((b.x - a.x) * (p.z - a.z)) / ((b.z - a.z) || 1e-9) + a.x);
                if (intersect) inside = !inside;
            }
            return inside;
        };
        const inside = pointInPoly(center, polygon);
        // Find closest point on polygon (edge-wise) to the circle center
        let bestD2 = Infinity;
        let bestPx = 0, bestPz = 0;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const ax = polygon[j].x, az = polygon[j].z;
            const bx = polygon[i].x, bz = polygon[i].z;
            const vx = bx - ax, vz = bz - az;
            const wx = center.x - ax, wz = center.z - az;
            const len2 = Math.max(1e-8, vx*vx + vz*vz);
            const t = Math.max(0, Math.min(1, (wx*vx + wz*vz) / len2));
            const px = ax + vx * t, pz = az + vz * t;
            const dx = center.x - px, dz = center.z - pz;
            const d2 = dx*dx + dz*dz;
            if (d2 < bestD2) { bestD2 = d2; bestPx = px; bestPz = pz; }
        }
        if (!inside && bestD2 >= radius * radius) return false; // no overlap when fully outside

        const dist = Math.max(1e-6, Math.sqrt(bestD2));
        const nx = (center.x - bestPx) / dist;
        const nz = (center.z - bestPz) / dist;
        const push = inside ? (radius + 1e-3) + dist : (radius - dist);
        center.x += nx * push;
        center.z += nz * push;
        return true;
    }

    // Iteratively resolve to avoid deep penetration
    for (let iter = 0; iter < 3; iter++) {
        let adjusted = false;

        for (let i = 0; i < nearby.length; i++) {
            const obj = nearby[i];
            const col = obj.userData && obj.userData.collider;
            if (!col) continue;

            if (col.type === 'sphere') {
                const cx = obj.position.x;
                const cz = obj.position.z;
                const r = (col.radius || 0) + playerRadius;

                const dx = newPos.x - cx;
                const dz = newPos.z - cz;
                const distSq = dx * dx + dz * dz;
                if (distSq < r * r) {
                    const dist = Math.sqrt(Math.max(distSq, 1e-8));
                    const nx = dist > 1e-6 ? dx / dist : 1;
                    const nz = dist > 1e-6 ? dz / dist : 0;
                    const overlap = r - dist;
                    newPos.x += nx * overlap;
                    newPos.z += nz * overlap;
                    adjusted = true;
                }
            } else if (col.type === 'aabb') {
                const cx = col.center?.x ?? obj.position.x;
                const cz = col.center?.z ?? obj.position.z;
                const hx = Math.max(0.1, col.halfExtents?.x ?? 8);
                const hz = Math.max(0.1, col.halfExtents?.z ?? 6);

                const closestX = Math.max(cx - hx, Math.min(newPos.x, cx + hx));
                const closestZ = Math.max(cz - hz, Math.min(newPos.z, cz + hz));

                let dx = newPos.x - closestX;
                let dz = newPos.z - closestZ;
                const distSq = dx * dx + dz * dz;

                if (distSq < playerRadius * playerRadius) {
                    if (distSq > 1e-8) {
                        const dist = Math.sqrt(distSq);
                        const nx = dx / dist;
                        const nz = dz / dist;
                        const overlap = playerRadius - dist;
                        newPos.x += nx * overlap;
                        newPos.z += nz * overlap;
                    } else {
                        const dx1 = (cx + hx) - newPos.x; // right
                        const dx2 = newPos.x - (cx - hx); // left
                        const dz1 = (cz + hz) - newPos.z; // front
                        const dz2 = newPos.z - (cz - hz); // back

                        const minX = Math.min(dx1, dx2);
                        const minZ = Math.min(dz1, dz2);
                        if (minX < minZ) {
                            if (dx1 < dx2) newPos.x = (cx + hx) + playerRadius;
                            else newPos.x = (cx - hx) - playerRadius;
                        } else {
                            if (dz1 < dz2) newPos.z = (cz + hz) + playerRadius;
                            else newPos.z = (cz - hz) - playerRadius;
                        }
                    }
                    adjusted = true;
                }
            } else if (col.type === 'obb' || col.type === 'orientedBox') {
                // Expect: center {x,z}, halfExtents {x,z}, rotationY
                const obb = {
                    center: { x: col.center?.x ?? obj.position.x, z: col.center?.z ?? obj.position.z },
                    halfExtents: { x: Math.max(0.0001, col.halfExtents?.x ?? 1), z: Math.max(0.0001, col.halfExtents?.z ?? 1) },
                    rotationY: col.rotationY ?? 0
                };
                if (resolveOBB(newPos, obb)) {
                    adjusted = true;
                }
            } else if (col.type === 'polygon' && Array.isArray(col.points)) {
                if (resolveCirclePolygon(newPos, playerRadius, col.points)) {
                    adjusted = true;
                }
            }
        }

        if (!adjusted) break;
    }

    return newPos;
}
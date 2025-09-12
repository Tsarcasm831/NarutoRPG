import { useEffect, useRef } from 'react';
import { WORLD_SIZE, getBiomeAt } from '/src/scene/terrain.js';
import {
    MINIMAP_SHOW_DISTRICT,
    MINIMAP_SHOW_ROAD,
    MINIMAP_ROAD_MAX_DISTANCE
} from './minimapConstants.js';

export const useMinimapRenderer = ({
    playerRef,
    worldObjects,
    minimapState,
    minimapCanvasRef,
    worldMinimapCanvasRef,
    posXRef,
    posZRef,
    zoomRef,
    zoomLevelRef,
    biomeRef,
    districtRef,
    roadRef,
    liveModelRef,
    options = {}
}) => {
    const animationFrameId = useRef();

    useEffect(() => {
        const updateHudElements = () => {
            const now = performance.now();
            const desiredFps = 12; // throttle minimap + HUD text to ~12fps to reduce load
            const frameInterval = 1000 / desiredFps;
            if (!updateHudElements.last) updateHudElements.last = 0;
            if (now - updateHudElements.last < frameInterval) {
                animationFrameId.current = requestAnimationFrame(updateHudElements);
                return;
            }
            updateHudElements.last = now;

            if (playerRef.current) {
                const { x, z } = playerRef.current.position;

                if (posXRef.current) {
                    posXRef.current.textContent = `X: ${Math.round(x)}`;
                }
                if (posZRef.current) {
                    posZRef.current.textContent = `Z: ${Math.round(z)}`;
                }
                if (zoomRef?.current && zoomLevelRef.current) {
                    const defaultZoom = 0.2;
                    const multiplier = zoomRef.current / defaultZoom;
                    const zoomLevel = Math.round(multiplier);
                    zoomLevelRef.current.textContent = `Zoom Level: ${zoomLevel}`;
                }
                // NEW: Update biome text
                if (biomeRef.current) {
                    const biomeRaw = getBiomeAt(x, z);
                    const biome = biomeRaw ? biomeRaw.charAt(0).toUpperCase() + biomeRaw.slice(1) : 'Unknown';
                    biomeRef.current.textContent = `Biome: ${biome}`;
                }
                // NEW: Update district and road lines
                if (districtRef.current && MINIMAP_SHOW_DISTRICT) {
                    const pctX = ((x + WORLD_SIZE / 2) / WORLD_SIZE) * 100;
                    const pctY = ((z + WORLD_SIZE / 2) / WORLD_SIZE) * 100;
                    const pointInPoly = (px, py, pts) => {
                        let inside = false;
                        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
                            const xi = pts[i][0], yi = pts[i][1];
                            const xj = pts[j][0], yj = pts[j][1];
                            const intersect = ((yi > py) !== (yj > py)) &&
                              (px < (xj - xi) * (py - yi) / ((yj - yi) || 1e-9) + xi);
                            if (intersect) inside = !inside;
                        }
                        return inside;
                    };
                    let districtName = 'Unknown';
                    try {
                        const entries = Object.values(liveModelRef.current?.districts || {});
                        for (let k = 0; k < entries.length; k++) {
                            const d = entries[k];
                            if (Array.isArray(d.points) && d.points.length >= 3 && pointInPoly(pctX, pctY, d.points)) {
                                districtName = d.name || d.id || 'District';
                                break;
                            }
                        }
                    } catch (_) {}
                    districtRef.current.textContent = `District: ${districtName}`;
                }
                if (roadRef.current && MINIMAP_SHOW_ROAD) {
                    // nearest road (convert percent polyline to world space)
                    const toWorld = (px, py) => ({
                        x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2,
                        z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2
                    });
                    const distPointSeg = (px, pz, ax, az, bx, bz) => {
                        const vx = bx - ax, vz = bz - az;
                        const wx = px - ax, wz = pz - az;
                        const c1 = vx * wx + vz * wz;
                        const c2 = vx * vx + vz * vz || 1e-9;
                        const t = Math.max(0, Math.min(1, c1 / c2));
                        const cx = ax + vx * t, cz = az + vz * t;
                        const dx = px - cx, dz = pz - cz;
                        return Math.hypot(dx, dz);
                    };
                    let best = { name: null, d: Infinity };
                    try {
                        for (const r of (liveModelRef.current?.roads || [])) {
                            const pts = r.points || [];
                            for (let i = 0; i < pts.length - 1; i++) {
                                const a = toWorld(pts[i][0], pts[i][1]);
                                const b = toWorld(pts[i + 1][0], pts[i + 1][1]);
                                const d = distPointSeg(x, z, a.x, a.z, b.x, b.z);
                                if (d < best.d) best = { name: r.name || r.id || 'Road', d };
                            }
                        }
                    } catch (_) {}
                    roadRef.current.textContent = best.d <= MINIMAP_ROAD_MAX_DISTANCE
                        ? `Road: ${best.name}`
                        : 'Road: –';
                }

                const canvas = minimapCanvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (ctx && canvas) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const minimapViewSize = 120;
                    const viewScale = canvas.width / minimapViewSize;

                    const worldMinimapCanvas = worldMinimapCanvasRef.current;
                    if (worldMinimapCanvas) {
                        const worldSize = WORLD_SIZE;
                        const sourceSize = minimapViewSize;
                        const sourceX = (x + worldSize / 2) - (sourceSize / 2);
                        const sourceY = (z + worldSize / 2) - (sourceSize / 2);

                        ctx.drawImage(
                            worldMinimapCanvas,
                            sourceX, sourceY,
                            sourceSize, sourceSize,
                            0, 0,
                            canvas.width, canvas.height
                        );
                    } else {
                         // Quick fallback before the world canvas is ready
                         const biome = getBiomeAt(x, z);
                         const fallback = {
                            grass: '#2d6a4f',
                            sand: '#e9d8a6',
                            dirt: '#6b4f4f',
                            rocky: '#6d6875',
                            snow: '#e6e6e6',
                            forest: '#1b4332'
                         };
                         ctx.fillStyle = fallback[biome] || '#166534';
                         ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    // Grid overlay (toggleable)
                    if (options.showGrid) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 0.5;
                        for(let i = 0; i < 8; i++) {
                            ctx.beginPath();
                            ctx.moveTo(i * canvas.width/8, 0);
                            ctx.lineTo(i * canvas.width/8, canvas.height);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(0, i * canvas.height/8);
                            ctx.lineTo(canvas.width, i * canvas.height/8);
                            ctx.stroke();
                        }
                    }

                    const halfCanvas = canvas.width / 2;

                    // World objects dots
                    worldObjects.forEach(obj => {
                        const dx = obj.position.x - x;
                        const dz = obj.position.z - z;
                        const distSq = dx * dx + dz * dz;

                        if (distSq < (minimapViewSize / 2) * (minimapViewSize / 2)) {
                            const mapX = halfCanvas + dx * viewScale;
                            const mapZ = halfCanvas + dz * viewScale;

                            ctx.fillStyle = `#${obj.color}`;
                            ctx.beginPath();
                            ctx.arc(mapX, mapZ, 2, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    });

                    // Player marker
                    ctx.fillStyle = 'red';
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(halfCanvas, halfCanvas, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            animationFrameId.current = requestAnimationFrame(updateHudElements);
        };

        updateHudElements.last = 0;
        animationFrameId.current = requestAnimationFrame(updateHudElements);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [playerRef, worldObjects, minimapState.width, minimapState.height, zoomRef, options.size, liveModelRef]);
};

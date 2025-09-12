import { useEffect, useRef } from 'react';
import { WORLD_SIZE, TILE_SIZE, TEXTURE_WORLD_UNITS, getBiomeAt, getTerrainTextureForBiome } from '/src/scene/terrain.js';
import { drawRiver, drawRoads, drawDistricts } from '../components/game/objects/konoha_roads.js';
import {
    MINIMAP_DRAW_ROADS,
    MINIMAP_DRAW_RIVER,
    MINIMAP_DRAW_DISTRICTS,
    MINIMAP_ROAD_ALPHA,
    MINIMAP_W_PRIMARY,
    MINIMAP_W_SECONDARY,
    MINIMAP_W_TERTIARY,
    MINIMAP_DRAW_WALLS,
    MINIMAP_WALL_ALPHA,
    MINIMAP_WALL_STROKE_SCALE,
    MINIMAP_WALL_COLOR
} from './minimapConstants.js';

// NEW: live map model (null fallback when /map is absent)
/** @tweakable enable live map HUD info (district/road) from /map when available */
const MINIMAP_USE_LIVE_MODEL = true;
/** @tweakable path to the live map model module (relative to site root) */
const MINIMAP_MAP_MODEL_PATH = '/map/model.js';

export const useWorldMinimapCanvas = () => {
    const worldMinimapCanvasRef = useRef(null);
    const liveModelRef = useRef(null);

    // Build a world-sized canvas where each pixel maps to 1 world unit,
    // using the same biome partitioning and textures as the 3D terrain.
    useEffect(() => {
        const worldSize = WORLD_SIZE;
        const tileSize = TILE_SIZE;
        const textureWorldSize = TEXTURE_WORLD_UNITS; // one texture tile == 20 world units
        const numTiles = worldSize / tileSize;

        const canvas = document.createElement('canvas');
        canvas.width = worldSize;
        canvas.height = worldSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Preload all terrain images used by biomes
        const biomes = ['grass', 'sand', 'dirt', 'rocky', 'snow', 'forest'];
        const uniqueSrcs = new Set(biomes.map(b => getTerrainTextureForBiome(b)));
        const imageMap = new Map();

        const loadImage = (src) =>
            new Promise((resolve) => {
                const img = new Image();
                img.src = `/${src}`;
                img.onload = () => resolve({ src, img });
                img.onerror = () => resolve({ src, img: null });
            });

        (async () => {
            const loaded = await Promise.all([...uniqueSrcs].map(loadImage));
            loaded.forEach(({ src, img }) => {
                if (img) imageMap.set(src, img);
            });

            // Draw per tile with a repeating pattern matching in-game repeats
            for (let i = 0; i < numTiles; i++) {
                for (let j = 0; j < numTiles; j++) {
                    const x = (i - numTiles / 2) * tileSize + tileSize / 2;
                    const z = (j - numTiles / 2) * tileSize + tileSize / 2;

                    // Minimap canvas uses +X to the right, +Z downward; convert world coords to canvas space
                    const canvasX = x + worldSize / 2 - tileSize / 2;
                    const canvasY = z + worldSize / 2 - tileSize / 2;

                    const biome = getBiomeAt(x, z);
                    const texFile = getTerrainTextureForBiome(biome);
                    const img = imageMap.get(texFile);

                    if (!img) {
                        // Fallback fill color per biome if image missing
                        const fallback = {
                            grass: '#2d6a4f',
                            sand: '#e9d8a6',
                            dirt: '#6b4f4f',
                            rocky: '#6d6875',
                            snow: '#e6e6e6',
                            forest: '#1b4332'
                        };
                        ctx.fillStyle = fallback[biome] || '#166534';
                        ctx.fillRect(canvasX, canvasY, tileSize, tileSize);
                        continue;
                    }

                    // Build a small pattern tile: scale the source texture to 20x20 world pixels
                    const patternCanvas = document.createElement('canvas');
                    patternCanvas.width = textureWorldSize;
                    patternCanvas.height = textureWorldSize;
                    const pctx = patternCanvas.getContext('2d');
                    pctx.drawImage(img, 0, 0, patternCanvas.width, patternCanvas.height);

                    const pattern = ctx.createPattern(patternCanvas, 'repeat');
                    if (pattern) {
                        ctx.save();
                        ctx.fillStyle = pattern;
                        ctx.translate(canvasX, canvasY);
                        ctx.fillRect(0, 0, tileSize, tileSize);
                        ctx.restore();
                    } else {
                        // As a last resort, stretch the image to cover the tile
                        ctx.drawImage(img, canvasX, canvasY, tileSize, tileSize);
                    }
                }
            }

            // Draw roads and river on top of terrain for global reuse by minimap and world map
            const scale = 1; // 1 pixel = 1 world unit on this canvas
            const cx = worldSize / 2;
            const cy = worldSize / 2;
            if (MINIMAP_DRAW_DISTRICTS) {
                await drawDistricts(ctx, scale, cx, cy, {
                    alpha: 0.15,
                    stroke: '#ffffff',
                    lineWidth: 1,
                    fill: '#ffffff'
                });
            }
            // NEW: draw walls
            if (MINIMAP_DRAW_WALLS) {
                const { drawWalls } = await import('../components/game/objects/konoha_roads.js');
                await drawWalls(ctx, scale, cx, cy, {
                    alpha: MINIMAP_WALL_ALPHA,
                    strokeScale: MINIMAP_WALL_STROKE_SCALE,
                    color: MINIMAP_WALL_COLOR
                });
            }
            if (MINIMAP_DRAW_ROADS) {
                await drawRoads(ctx, scale, cx, cy, {
                    alpha: MINIMAP_ROAD_ALPHA,
                    wPrimary: MINIMAP_W_PRIMARY,
                    wSecondary: MINIMAP_W_SECONDARY,
                    wTertiary: MINIMAP_W_TERTIARY
                });
            }
            if (MINIMAP_DRAW_RIVER) {
                drawRiver(ctx, scale, cx, cy);
            }
            worldMinimapCanvasRef.current = canvas;
        })();
    }, []);

    // Attempt to load /map model once (optional)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!MINIMAP_USE_LIVE_MODEL) return;
            try {
                const mod = await import(MINIMAP_MAP_MODEL_PATH);
                if (!cancelled) liveModelRef.current = mod?.MODEL ?? null;
            } catch (_) {
                // keep liveModelRef.current = null if missing
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return { worldMinimapCanvasRef, liveModelRef };
};

import * as THREE from 'three';

export const terrainFiles = {
    grass: 'grass_texture.png',
    sand: 'sand_texture.png',
    dirt: 'dirt_path_texture.png',
    rocky: 'rocky_ground_texture.png',
    snow: 'snow_texture.png',
    forest: 'forest_floor_texture.png',
};

// Biome list (ensure we use every available terrain)
const BIOMES = ['grass', 'sand', 'dirt', 'rocky', 'snow', 'forest'];

// Expose world dimensions to other modules (e.g., minimap)
export const WORLD_SIZE = 3000;
export const TILE_SIZE = 200;
// In scene, textures repeat tileSize/20 times, so one texture image covers 20 world units.
export const TEXTURE_WORLD_UNITS = 20;

// Module-scoped seeds to be populated on scene init so other systems (minimap) can query the same layout
let biomeSeedsRef = null;
// NEW: exact per-tile biome map for precise queries
let biomeTileMapRef = null;
let numTilesRef = null;

// Helper to generate biome seeds that partition the world into organic regions.
// We guarantee at least one seed per biome, then add more random seeds with weighted choices.
function generateBiomeSeeds(worldSize, extraSeeds = 18) {
    const half = worldSize / 2;

    // Create one seed per biome
    const seeds = BIOMES.map((biome, i) => ({
        x: (Math.random() * worldSize) - half,
        z: (Math.random() * worldSize) - half,
        biome
    }));

    // Distribution to keep variety: grass and forest a bit more common, others balanced
    const weightedBiomes = [
        'grass','grass','grass',
        'forest','forest',
        'sand','sand',
        'rocky','rocky',
        'dirt',
        'snow'
    ];

    for (let i = 0; i < extraSeeds; i++) {
        seeds.push({
            x: (Math.random() * worldSize) - half,
            z: (Math.random() * worldSize) - half,
            biome: weightedBiomes[Math.floor(Math.random() * weightedBiomes.length)]
        });
    }

    return seeds;
}

function nearestBiomeAt(x, z, seeds) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < seeds.length; i++) {
        const dx = x - seeds[i].x;
        const dz = z - seeds[i].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bestDist) {
            bestDist = d2;
            best = seeds[i].biome;
        }
    }
    return best || 'grass';
}

// @tweakable enable or disable drawing the overworld road/river overlay
const ROAD_OVERLAY_ENABLED = true;
// @tweakable opacity of the overworld road/river overlay (0..1)
const ROAD_OVERLAY_OPACITY = 0.75;
// @tweakable vertical offset of the overlay above ground to avoid z-fighting
const ROAD_OVERLAY_ZOFFSET = 0.015;

// Public: query biome under a world position using the same layout as the 3D terrain
export function getBiomeAt(x, z) {
    // For now, force the entire world to be grass
    return 'grass';
}

// Public: get the terrain texture filename for a biome
export function getTerrainTextureForBiome(biome) {
    return terrainFiles[biome] || terrainFiles.grass;
}

import { drawRoads, drawRiver, drawDistricts } from '../components/game/objects/konoha_roads.js';

export function createTerrain(scene, settings) {
    const textureLoader = new THREE.TextureLoader();
    const worldSize = WORLD_SIZE;
    const tileSize = TILE_SIZE;
    const numTiles = worldSize / tileSize;
    const textureRepeat = tileSize / TEXTURE_WORLD_UNITS;

    // Preload only grass material (all ground is grass for now)
    const grassTexture = textureLoader.load(terrainFiles.grass);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(textureRepeat, textureRepeat);
    const grassMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });

    // Since we're locking to grass, we don't need biome seeds
    biomeSeedsRef = null;

    // Build exact per-tile biome map as 'grass' for all tiles
    biomeTileMapRef = Array.from({ length: numTiles }, () => new Array(numTiles).fill('grass'));
    numTilesRef = numTiles;

    const groundContainer = new THREE.Group();
    scene.add(groundContainer);

    const groundGeometry = new THREE.PlaneGeometry(tileSize, tileSize);

    for (let i = 0; i < numTiles; i++) {
        for (let j = 0; j < numTiles; j++) {
            const x = (i - numTiles / 2) * tileSize + tileSize / 2;
            const z = (j - numTiles / 2) * tileSize + tileSize / 2;

            const groundTile = new THREE.Mesh(groundGeometry, grassMaterial);
            groundTile.position.set(x, 0, z);
            groundTile.rotation.x = -Math.PI / 2;
            groundTile.receiveShadow = settings.shadows;
            groundContainer.add(groundTile);
        }
    }

    // NEW: world road/river overlay (single transparent canvas laid over terrain)
    if (ROAD_OVERLAY_ENABLED) {
        (async () => {
            try {
                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.width = worldSize;
                overlayCanvas.height = worldSize;
                const octx = overlayCanvas.getContext('2d');
                if (!octx) return;
                // Draw terrain-sized roads/river centered at (worldSize/2, worldSize/2), 1px == 1 world unit
                const scale = 1, cx = worldSize / 2, cy = worldSize / 2;
                // Districts then walls then roads
                await drawDistricts(octx, scale, cx, cy, {
                    alpha: 0.15,
                    stroke: '#ffffff',
                    lineWidth: 1,
                    fill: '#ffffff'
                });
                // NEW: walls on terrain overlay
                const { drawWalls } = await import('../components/game/objects/konoha_roads.js');
                await drawWalls(octx, scale, cx, cy, {
                    /* @tweakable terrain overlay wall opacity (0..1) */
                    alpha: 0.85,
                    /* @tweakable terrain overlay wall thickness scale */
                    strokeScale: 2.0,
                    /* @tweakable terrain overlay wall color */
                    color: '#bfc0c2'
                });
                await drawRoads(octx, scale, cx, cy, {
                    /* @tweakable overwrite primary road width on overworld (pixels) */
                    wPrimary: 14,
                    /* @tweakable overwrite secondary road width on overworld (pixels) */
                    wSecondary: 10,
                    /* @tweakable overwrite tertiary road width on overworld (pixels) */
                    wTertiary: 6,
                    /* @tweakable global road opacity multiplier on overworld (0..1) */
                    alpha: 1.0
                });
                // River on top
                drawRiver(octx, scale, cx, cy);
                const tex = new THREE.CanvasTexture(overlayCanvas);
                tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
                const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: ROAD_OVERLAY_OPACITY });
                // Slight polygon offset and depthWrite off to reduce artifacts
                mat.depthWrite = false; mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1;
                const overlay = new THREE.Mesh(new THREE.PlaneGeometry(worldSize, worldSize), mat);
                overlay.rotation.x = -Math.PI / 2; overlay.position.y = ROAD_OVERLAY_ZOFFSET; overlay.renderOrder = 1; // draw after ground
                scene.add(overlay);
            } catch (e) {
                console.warn('Road overlay creation failed:', e);
            }
        })();
    }

    return { groundContainer, worldSize };
}
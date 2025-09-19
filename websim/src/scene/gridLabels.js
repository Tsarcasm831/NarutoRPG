import * as THREE from 'three';

// Utility: convert column number to spreadsheet-like letters (A, B, ..., Z, AA, AB, ...)
function getColumnName(n) {
    let s = '';
    while (n >= 0) {
        s = String.fromCharCode(n % 26 + 65) + s;
        n = Math.floor(n / 26) - 1;
    }
    return s;
}

// Create a sprite with a canvas-based texture for a given text.
// We keep the canvas so we can update the text later without recreating the sprite/material.
function createLabelSprite(initialText, {
    fontsize = 64,
    fontface = 'monospace',
    textColor = 'rgba(255,255,255,1)',
    backgroundColor = 'rgba(0,0,0,0.4)',
    scale = 3
} = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function draw(text) {
        ctx.font = `bold ${fontsize}px ${fontface}`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const padding = 16;

        canvas.width = textWidth + padding * 2;
        canvas.height = Math.ceil(fontsize * 1.4);

        // Background pill
        ctx.fillStyle = backgroundColor;
        const radius = 16;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(canvas.width - radius, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
        ctx.lineTo(canvas.width, canvas.height - radius);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
        ctx.lineTo(radius, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.font = `bold ${fontsize}px ${fontface}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    draw(initialText);

    const texture = new THREE.CanvasTexture(canvas);
    // Slightly cheaper sampling and tone mapping off for UI-like sprites
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,    // allow to be correctly occluded by terrain
        depthWrite: false,
        toneMapped: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1);
    sprite.renderOrder = 9999;
    sprite.frustumCulled = false; // tiny, always-on-top UI markers

    // Attach helpers to update text efficiently
    sprite.userData._labelCanvas = canvas;
    sprite.userData._labelContext = ctx;
    sprite.userData._fontsize = fontsize;
    sprite.userData._fontface = fontface;
    sprite.userData._textColor = textColor;
    sprite.userData._backgroundColor = backgroundColor;
    sprite.userData._scaleBase = scale;

    sprite.userData.setText = (newText) => {
        const { _labelCanvas, _labelContext, _fontsize, _fontface, _textColor, _backgroundColor, _scaleBase } = sprite.userData;
        const ctx2 = _labelContext;
        const canvas2 = _labelCanvas;

        ctx2.font = `bold ${_fontsize}px ${_fontface}`;
        const metrics = ctx2.measureText(newText);
        const textWidth = Math.ceil(metrics.width);
        const padding = 16;

        canvas2.width = textWidth + padding * 2;
        canvas2.height = Math.ceil(_fontsize * 1.4);

        // Background pill
        ctx2.fillStyle = _backgroundColor;
        const radius = 16;
        ctx2.beginPath();
        ctx2.moveTo(radius, 0);
        ctx2.lineTo(canvas2.width - radius, 0);
        ctx2.quadraticCurveTo(canvas2.width, 0, canvas2.width, radius);
        ctx2.lineTo(canvas2.width, canvas2.height - radius);
        ctx2.quadraticCurveTo(canvas2.width, canvas2.height, canvas2.width - radius, canvas2.height);
        ctx2.lineTo(radius, canvas2.height);
        ctx2.quadraticCurveTo(0, canvas2.height, 0, canvas2.height - radius);
        ctx2.lineTo(0, radius);
        ctx2.quadraticCurveTo(0, 0, radius, 0);
        ctx2.closePath();
        ctx2.fill();

        // Text
        ctx2.font = `bold ${_fontsize}px ${_fontface}`;
        ctx2.fillStyle = _textColor;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(newText, canvas2.width / 2, canvas2.height / 2);

        // Update texture and sprite scale
        sprite.material.map.needsUpdate = true;
        sprite.scale.set(_scaleBase, _scaleBase * (canvas2.height / canvas2.width), 1);
    };

    return sprite;
}

/**
 * High-performance grid labels with virtualization and cell-based throttling:
 * - Creates a small, reusable pool equal to the max visible at once.
 * - Only recomputes visibility when the player crosses into a new grid cell.
 * - Avoids O(n^2) re-indexing and Array.indexOf by tracking sprites directly.
 * - NEW: Labels bind to the terrain height via raycasting so they sit on the ground even with future heightmaps.
 * - NEW: Grid cell size is locked to 5 world units regardless of world size.
 */
export function setupGridLabels(scene, worldSize, settings, groundContainer) {
    // LOCKED GRID CELL SIZE (in world units)
    const lockedCellSize = 5;
    const numLabelCells = Math.floor(worldSize / lockedCellSize);
    const labelCellSize = lockedCellSize;

    const visibilityRadius = 4; // 9x9 = 81 maximum
    const maxVisible = (visibilityRadius * 2 + 1) * (visibilityRadius * 2 + 1);

    const gridLabelsGroup = new THREE.Group();
    gridLabelsGroup.visible = settings.grid;
    scene.add(gridLabelsGroup);

    // Sprite pool
    const spritePool = [];
    for (let i = 0; i < maxVisible; i++) {
        const s = createLabelSprite('');
        s.visible = false;
        gridLabelsGroup.add(s);
        spritePool.push(s);
    }

    // Active mapping and a free-list for sprites
    let activeMap = new Map(); // key "i,j" -> sprite
    let freeSprites = [...spritePool];

    // Track the last grid cell the player center occupied
    let lastCenterI = undefined;
    let lastCenterJ = undefined;

    // Raycaster to bind labels to ground height
    const raycaster = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    const terrainTargets = groundContainer ? groundContainer.children : [];

    function cellKey(i, j) {
        return `${i},${j}`;
    }

    function labelForCell(i, j) {
        const letter = getColumnName(i);
        const number = j + 1;
        return `${letter}${number}`;
    }

    function posForCell(i, j) {
        const x = (i - numLabelCells / 2) * labelCellSize + labelCellSize / 2;
        const z = (j - numLabelCells / 2) * labelCellSize + labelCellSize / 2;
        return { x, z };
    }

    function groundHeightAt(x, z) {
        // Cast from far above downwards to hit ground tiles (or future heightmap)
        const origin = new THREE.Vector3(x, 10000, z);
        raycaster.set(origin, down);
        const intersects = raycaster.intersectObjects(terrainTargets, true);
        if (intersects && intersects.length > 0) {
            return intersects[0].point.y;
        }
        // Fallback to flat ground plane
        return 0;
    }

    function hideAllAndReset() {
        activeMap.forEach(sprite => {
            sprite.visible = false;
            freeSprites.push(sprite);
        });
        activeMap.clear();
    }

    function updateVisibility(playerPosition) {
        // If labels turned off, hide and reset once
        if (!gridLabelsGroup.visible) {
            if (activeMap.size > 0) {
                hideAllAndReset();
            }
            return;
        }

        const halfWorldSize = worldSize / 2;
        const centerI = Math.floor((playerPosition.x + halfWorldSize) / labelCellSize);
        const centerJ = Math.floor((playerPosition.z + halfWorldSize) / labelCellSize);

        // Throttle: only update when the player enters a new label cell
        if (centerI === lastCenterI && centerJ === lastCenterJ) {
            return;
        }
        lastCenterI = centerI;
        lastCenterJ = centerJ;

        // Build desired set of keys
        const desiredKeys = new Set();
        const minI = Math.max(0, centerI - visibilityRadius);
        const maxI = Math.min(numLabelCells - 1, centerI + visibilityRadius);
        const minJ = Math.max(0, centerJ - visibilityRadius);
        const maxJ = Math.min(numLabelCells - 1, centerJ + visibilityRadius);

        for (let i = minI; i <= maxI; i++) {
            for (let j = minJ; j <= maxJ; j++) {
                desiredKeys.add(cellKey(i, j));
            }
        }

        // Hide sprites that are no longer desired
        activeMap.forEach((sprite, key) => {
            if (!desiredKeys.has(key)) {
                sprite.visible = false;
                freeSprites.push(sprite);
                activeMap.delete(key);
            }
        });

        // Add or update desired sprites
        for (let i = minI; i <= maxI; i++) {
            for (let j = minJ; j <= maxJ; j++) {
                const key = cellKey(i, j);
                let sprite = activeMap.get(key);
                if (!sprite) {
                    // Take from pool
                    sprite = freeSprites.pop();
                    if (!sprite) {
                        // Pool exhausted (shouldn't happen with exact sizing), skip gracefully
                        continue;
                    }
                    // Assign label text once for this cell
                    sprite.userData.setText(labelForCell(i, j));
                    activeMap.set(key, sprite);
                }
                const { x, z } = posForCell(i, j);
                const y = groundHeightAt(x, z) + 0.5; // sit slightly above ground to avoid z-fighting
                sprite.position.set(x, y, z);
                sprite.visible = true;
            }
        }
    }

    return {
        gridLabelsGroup,
        updateVisibility
    };
}
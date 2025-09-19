import * as THREE from 'three';

export function createTextLabel(text, {
    fontsize = 96,
    fontface = 'monospace',
    textColor = 'rgba(255, 255, 255, 1)',
    backgroundColor = 'rgba(0, 0, 0, 0.5)',
    scale = 40
} = {}) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    context.font = `bold ${fontsize}px ${fontface}`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;

    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontsize * 1.4;

    context.fillStyle = backgroundColor;
    const radius = 20;
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(canvas.width - radius, 0);
    context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    context.lineTo(canvas.width, canvas.height - radius);
    context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    context.lineTo(radius, canvas.height);
    context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    context.fill();

    context.font = `bold ${fontsize}px ${fontface}`;
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1.0);
    sprite.renderOrder = 9999;
    return sprite;
}

// Extend: attach lightweight in-place text updater for reuse by tooltip/grid systems
// This keeps compatibility with existing createTextLabel usage.
THREE.Sprite.prototype.userData = THREE.Sprite.prototype.userData || {};
// Note: For sprites created via createTextLabel above, we already have a canvas/ctx in closure;
// for reuse in pools elsewhere we expose a setText helper on the created sprite.
export function attachSetText(sprite, {
    fontsize = 96,
    fontface = 'monospace',
    textColor = 'rgba(255, 255, 255, 1)',
    backgroundColor = 'rgba(0, 0, 0, 0.5)',
    scale = 40
} = {}) {
    // Build a new canvas for this sprite and hook it up
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    function draw(text) {
        context.font = `bold ${fontsize}px ${fontface}`;
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        const padding = 20;
        canvas.width = textWidth + padding * 2;
        canvas.height = fontsize * 1.4;

        // Background
        context.fillStyle = backgroundColor;
        const radius = 20;
        context.beginPath();
        context.moveTo(radius, 0);
        context.lineTo(canvas.width - radius, 0);
        context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
        context.lineTo(canvas.width, canvas.height - radius);
        context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
        context.lineTo(radius, canvas.height);
        context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
        context.lineTo(0, radius);
        context.quadraticCurveTo(0, 0, radius, 0);
        context.closePath();
        context.fill();

        // Text
        context.font = `bold ${fontsize}px ${fontface}`;
        context.fillStyle = textColor;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Update texture and scale
        if (sprite.material && sprite.material.map) {
            sprite.material.map.dispose?.();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        sprite.material.map = texture;
        sprite.material.needsUpdate = true;
        sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1.0);
    }

    sprite.userData.setText = draw;
}
import * as THREE from 'three';

// Palettes
const wallPalette = [0xE0D6C6, 0xCFC4B4, 0xD9D1C7, 0xBFD6B0];
const roofPalette = [0x7B3F00, 0x8B3A3A, 0x6B2E2E, 0x5A2D0C];
const woodPalette = [0x8B6F47, 0x6B4F2A, 0x5A3E2B];

// Materials/helpers
export function stdMat(color, { roughness = 0.9, metalness = 0.05, emissive = 0x000000 } = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive });
}

export function setShadows(node) {
    node.traverse?.((n) => {
        if (n.isMesh) {
            n.receiveShadow = true;
            n.castShadow = false;
        }
    });
    if (node.isMesh) {
        node.receiveShadow = true;
        node.castShadow = false;
    }
}

// Reusable sub-parts
export function createWindow(width = 1.6, height = 1.6, frame = 0.15, colorFrame = 0x3a2a1a, colorGlass = 0x87CEFA) {
    const group = new THREE.Group();
    const frameMat = stdMat(colorFrame, { roughness: 0.7 });
    const glassMat = stdMat(colorGlass, { roughness: 0.1, metalness: 0.1, emissive: 0x0a0a0a });

    const outer = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.18), frameMat);
    outer.position.z = 0.09;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(width - frame * 2, height - frame * 2, 0.1), glassMat);
    glass.position.z = 0.1;

    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, height - frame * 2, 0.12), frameMat);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(width - frame * 2, 0.08, 0.12), frameMat);
    mullionV.position.z = 0.11;
    mullionH.position.z = 0.11;

    group.add(outer, glass, mullionV, mullionH);
    setShadows(group);
    return group;
}

export function createDoor(width = 2.2, height = 4.2, colorDoor = 0x5A3E2B, colorFrame = 0x3D2F2F) {
    const group = new THREE.Group();
    const doorMat = stdMat(colorDoor, { roughness: 0.85 });
    const frameMat = stdMat(colorFrame, { roughness: 0.8 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.3), frameMat);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.25), doorMat);
    panel.position.z = 0.05;

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12), stdMat(0xCCCCCC, { metalness: 0.6, roughness: 0.4 }));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(width * 0.35, 0, 0.25);

    group.add(frame, panel, handle);
    setShadows(group);
    return group;
}

export function createGableRoof(width = 18, length = 14, height = 6, color = 0x8B3A3A) {
    const group = new THREE.Group();
    const roofMat = stdMat(color, { roughness: 0.8 });

    const slopeGeo = new THREE.BoxGeometry(width, 0.6, length);
    const leftSlope = new THREE.Mesh(slopeGeo, roofMat);
    const rightSlope = new THREE.Mesh(slopeGeo, roofMat);

    const tilt = Math.atan2(height, width / 2);
    leftSlope.rotation.z = tilt;
    rightSlope.rotation.z = -tilt;

    leftSlope.position.set(-width / 4, height / 2 + 3, 0);
    rightSlope.position.set(width / 4, height / 2 + 3, 0);

    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, length + 1, 12), stdMat(0x4A2E2E, { roughness: 0.7 }));
    ridge.rotation.x = Math.PI / 2;
    ridge.position.set(0, height / 2 + 3 + 0.3, 0);

    group.add(leftSlope, rightSlope, ridge);

    const eaveMat = stdMat(0x2f241a, { roughness: 0.85 });
    const eaveThickness = 0.25;
    const eaveLeft = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, eaveThickness, length + 0.5), eaveMat);
    const eaveRight = eaveLeft.clone();
    eaveLeft.position.set(-width / 4, 3.2, 0);
    eaveRight.position.set(width / 4, 3.2, 0);

    group.add(eaveLeft, eaveRight);
    setShadows(group);
    return group;
}

export function createDoorStep(width = 3, depth = 1.2, height = 0.5, color = 0x9e9a93) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), stdMat(color, { roughness: 0.95, metalness: 0.02 }));
    step.position.y = height / 2;
    setShadows(step);
    return step;
}

export function addCornerTrim(group, baseWidth, baseHeight, baseDepth, color = 0x6B4F2A) {
    const trimMat = stdMat(color, { roughness: 0.8 });
    const trimGeo = new THREE.BoxGeometry(0.4, baseHeight + 0.2, 0.4);
    const corners = [
        [ baseWidth / 2 + 0.2, (baseHeight) / 2,  baseDepth / 2 + 0.2],
        [-baseWidth / 2 - 0.2, (baseHeight) / 2,  baseDepth / 2 + 0.2],
        [ baseWidth / 2 + 0.2, (baseHeight) / 2, -baseDepth / 2 - 0.2],
        [-baseWidth / 2 - 0.2, (baseHeight) / 2, -baseDepth / 2 - 0.2],
    ];
    corners.forEach(([x, y, z]) => {
        const t = new THREE.Mesh(trimGeo, trimMat);
        t.position.set(x, y, z);
        t.receiveShadow = true;
        group.add(t);
    });
}

// House Type A
export function createHouseTypeA() {
    const group = new THREE.Group();

    const wallColor = wallPalette[Math.floor(Math.random() * wallPalette.length)];
    const roofColor = roofPalette[Math.floor(Math.random() * roofPalette.length)];
    const woodColor = woodPalette[Math.floor(Math.random() * woodPalette.length)];

    const baseW = 16, baseH = 8, baseD = 12;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), stdMat(wallColor));
    base.position.y = baseH / 2;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.5, 1, baseD + 0.5), stdMat(0x8d8a83, { roughness: 0.95 }));
    plinth.position.y = 0.5;

    const roof = createGableRoof(baseW + 2, baseD + 1, 6, roofColor);
    roof.position.y = baseH;

    const door = createDoor(2.2, 4.2);
    door.position.set(0, 2.25, baseD / 2 + 0.25);
    const step = createDoorStep(3, 1.2, 0.5);
    step.position.set(0, 0.25, baseD / 2 + 0.8);

    const winL = createWindow();
    const winR = createWindow();
    winL.position.set(-5, 4, baseD / 2 + 0.18);
    winR.position.set(5, 4, baseD / 2 + 0.18);

    const beamMat = stdMat(woodColor, { roughness: 0.85 });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.4, 0.3, 0.6), beamMat);
    beam.position.set(0, baseH - 0.2, baseD / 2 + 0.3);

    addCornerTrim(group, baseW, baseH, baseD, woodColor);

    [base, plinth, roof, door, step, winL, winR, beam].forEach(m => setShadows(m));
    group.add(base, plinth, roof, door, step, winL, winR, beam);
    return group;
}

// House Type B
export function createHouseTypeB() {
    const group = new THREE.Group();

    const wallColor = wallPalette[Math.floor(Math.random() * wallPalette.length)];
    const roofColor = roofPalette[Math.floor(Math.random() * roofPalette.length)];
    const woodColor = woodPalette[Math.floor(Math.random() * woodPalette.length)];

    const baseW = 14, baseH = 10, baseD = 14;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), stdMat(wallColor));
    base.position.y = baseH / 2;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.6, 1, baseD + 0.6), stdMat(0x8b8880, { roughness: 0.95 }));
    plinth.position.y = 0.5;

    const roof = createGableRoof(baseW + 2, baseD + 2, 5.5, roofColor);
    roof.position.y = baseH;

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), stdMat(0x555555, { roughness: 0.9 }));
    chimney.position.set(-4, baseH + 2.5, -3);

    const door = createDoor(2.4, 4.6, 0x4B3621, 0x2E241B);
    door.position.set(0, 2.5, baseD / 2 + 0.3);
    const step = createDoorStep(3.2, 1.3, 0.5);
    step.position.set(0, 0.25, baseD / 2 + 0.9);

    const winL = createWindow(1.8, 1.8);
    const winR = createWindow(1.8, 1.8);
    winL.position.set(-5, 5, baseD / 2 + 0.21);
    winR.position.set(5, 5, baseD / 2 + 0.21);

    const winL2 = createWindow(1.6, 1.6);
    const winR2 = createWindow(1.6, 1.6);
    winL2.position.set(-5, 7.5, -baseD / 2 - 0.21);
    winL2.rotation.y = Math.PI;
    winR2.position.set(5, 7.5, -baseD / 2 - 0.21);
    winR2.rotation.y = Math.PI;

    addCornerTrim(group, baseW, baseH, baseD, woodColor);

    [base, plinth, roof, chimney, door, step, winL, winR, winL2, winR2].forEach(m => setShadows(m));
    group.add(base, plinth, roof, chimney, door, step, winL, winR, winL2, winR2);
    return group;
}

// House Type C
export function createHouseTypeC() {
    const group = new THREE.Group();

    const wallColor = wallPalette[Math.floor(Math.random() * wallPalette.length)];
    const roofColor = roofPalette[Math.floor(Math.random() * roofPalette.length)];
    const woodColor = woodPalette[Math.floor(Math.random() * woodPalette.length)];

    const baseW = 20, baseH = 7, baseD = 10;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), stdMat(wallColor));
    base.position.y = baseH / 2;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseW + 0.6, 1, baseD + 0.6), stdMat(0x9a968e));
    plinth.position.y = 0.5;

    const roofGroup = new THREE.Group();
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, baseD + 0.8), stdMat(roofColor));
    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, baseD + 0.8), stdMat(roofColor));
    roofLeft.rotation.z = Math.PI / 8;
    roofRight.rotation.z = -Math.PI / 10;
    roofLeft.position.set(-4, baseH + 3, 0);
    roofRight.position.set(5, baseH + 2.7, 0);
    roofGroup.add(roofLeft, roofRight);

    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, baseD + 1.2, 12), stdMat(0x4A2E2E, { roughness: 0.7 }));
    ridge.rotation.x = Math.PI / 2;
    ridge.position.set(0.5, baseH + 3.2, 0);
    roofGroup.add(ridge);

    const porch = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 4), stdMat(woodColor, { roughness: 0.85 }));
    porch.position.set(-5, 0.26, baseD / 2 + 1.8);

    const postMat = stdMat(woodColor, { roughness: 0.9 });
    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 3.2, 10);
    const p1 = new THREE.Mesh(postGeo, postMat);
    const p2 = p1.clone();
    p1.position.set(-8, 1.6, baseD / 2 + 2.8);
    p2.position.set(-2, 1.6, baseD / 2 + 2.8);

    const door = createDoor(2.1, 4, 0x4B3826, 0x2E241B);
    door.position.set(-5, 2.1, baseD / 2 + 0.3);

    const win1 = createWindow(1.6, 1.6);
    const win2 = createWindow(1.6, 1.6);
    win1.position.set(3.5, 4, baseD / 2 + 0.21);
    win2.position.set(7, 4, baseD / 2 + 0.21);

    addCornerTrim(group, baseW, baseH, baseD, woodColor);

    [base, plinth, roofGroup, porch, p1, p2, door, win1, win2, ridge].forEach(m => setShadows(m));
    group.add(base, plinth, roofGroup, porch, p1, p2, door, win1, win2);
    return group;
}

// Low detail proxy
export function createLowDetailHouseProxy(color = 0x8B3A3A) {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 12), mat);
    mesh.position.y = 5;
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    return mesh;
}
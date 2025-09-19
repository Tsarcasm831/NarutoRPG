import * as THREE from 'three';
import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import { WALL_RADIUS } from '../../player/movement/constants.js';

// Helper to create a central circular wall:
// - Visual: open ring with inner+outer cylinders for sides
// - Top: solid ring cap so the player can stand on it
// - Physics: lightweight invisible colliders arrayed around the ring
export function createCentralWall({
  scene,
  radius = WALL_RADIUS,
  height = 30,
  segments = 128,
  colliderSpacing = 12,
  colliderRadius = 10,
  color = 0xffffff, // white walls
  thickness = 5 // "grids" thick (1 grid == 1 world unit)
}) {
  const group = new THREE.Group();
  group.name = 'CentralWall';

  // Visual ring sides made by two concentric open-ended cylinders
  const halfT = thickness / 2;
  const innerR = Math.max(0.1, radius - halfT);
  const outerR = radius + halfT;

  const wallMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });

  // Sides
  const outerGeo = new THREE.CylinderGeometry(outerR, outerR, height, segments, 1, true);
  const innerGeo = new THREE.CylinderGeometry(innerR, innerR, height, segments, 1, true);

  const outerWall = new THREE.Mesh(outerGeo, wallMat);
  const innerWall = new THREE.Mesh(innerGeo, wallMat);
  outerWall.castShadow = false; outerWall.receiveShadow = false;
  innerWall.castShadow = false; innerWall.receiveShadow = false;
  outerWall.position.y = height / 2;
  innerWall.position.y = height / 2;

  // Top cap: a flat ring so the wall is "solid" and walkable
  const topRingGeo = new THREE.RingGeometry(innerR, outerR, Math.max(segments, 32));
  const topRingMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  const topRing = new THREE.Mesh(topRingGeo, topRingMat);
  topRing.rotation.x = -Math.PI / 2;
  topRing.position.y = height + 0.01; // slight offset to avoid z-fighting with side edges

  // Optional: bottom ring for visual solidity at ground level
  const bottomRing = new THREE.Mesh(topRingGeo.clone(), topRingMat);
  bottomRing.rotation.x = -Math.PI / 2;
  bottomRing.position.y = 0.0;

  group.add(outerWall, innerWall, topRing, bottomRing);

  // Physics proxies: invisible points with sphere colliders around the ring
  const circumference = 2 * Math.PI * radius;
  const count = Math.max(24, Math.floor(circumference / colliderSpacing));
  const colliders = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const proxy = new THREE.Object3D();
    proxy.position.set(x, height / 2, z);
    proxy.userData.collider = {
      type: 'sphere',
      radius: colliderRadius
    };
    proxy.userData.label = 'Wall';
    proxy.userData.onInteract = null;

    group.add(proxy);
    colliders.push(proxy);
  }

  scene.add(group);
  return { wallMesh: outerWall, colliders, group };
}

// Create a circular wall with a gate opening cut out at a target angle.
// Optimized: uses InstancedMesh for merlons and buttresses to reduce draw calls.
export function createCentralWallWithGate({
  scene,
  worldSize,
  radius = WALL_RADIUS,
  height = 30,
  segments = 140,           // slightly reduced for performance
  colliderSpacing = 16,
  colliderRadius = 11,
  color = 0xbfbfbf,         // light stone color
  thickness = 5,
  gateFromLabel = 'KD493',
  gateToLabel = 'LD493',
  removeExactlyBetween = false,
  openingAt = null // 'north'|'south'|'east'|'west' overrides labels
}) {
  const group = new THREE.Group();
  group.name = 'CentralWall';

  const halfT = thickness / 2;
  const innerR = Math.max(0.1, radius - halfT);
  const outerR = radius + halfT;

  // Compute angles from the two provided labels
  const { i: i1, j: j1 } = parseGridLabel(gateFromLabel);
  const { i: i2, j: j2 } = parseGridLabel(gateToLabel);
  const p1 = posForCell(i1, j1, worldSize);
  const p2 = posForCell(i2, j2, worldSize);
  const theta1 = Math.atan2(p1.z, p1.x);
  const theta2 = Math.atan2(p2.z, p2.x);

  const full = Math.PI * 2;
  const norm = (v) => (v % full + full) % full;

  // Determine the initial cut range (nStart, nEnd)
  let nStart, nEnd;
  if (openingAt) {
    // Cardinal opening centers
    const centers = { north: 3*Math.PI/2, south: Math.PI/2, east: 0, west: Math.PI };
    const midTheta = norm(centers[openingAt] ?? Math.PI/2);
    const desiredChord = 48;
    let thetaWidth = desiredChord / Math.max(1, radius);
    const padding = (8 / Math.max(1, radius));
    thetaWidth += padding * 2;
    nStart = norm(midTheta - thetaWidth / 2);
    nEnd = norm(midTheta + thetaWidth / 2);
  } else if (!removeExactlyBetween) {
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const midTheta = norm(Math.atan2(mid.z, mid.x));
    const desiredChord = 48;
    let thetaWidth = desiredChord / Math.max(1, radius);
    const padding = (8 / Math.max(1, radius));
    thetaWidth += padding * 2;
    nStart = norm(midTheta - thetaWidth / 2);
    nEnd = norm(midTheta + thetaWidth / 2);
  } else {
    let a = norm(theta1);
    let b = norm(theta2);
    const direct = norm(b - a);
    if (full - direct < direct) {
      const tmp = a; a = b; b = tmp;
    }
    // Widen the cut a bit more to guarantee no sliver remains
    const padAngle = 42 / Math.max(1, radius);
    nStart = norm(a - padAngle);
    nEnd = norm(b + padAngle);
  }

  // Materials
  const stoneMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  const darkerStone = new THREE.MeshLambertMaterial({ color: 0xa8a8a8, side: THREE.DoubleSide });
  const accentStone = new THREE.MeshLambertMaterial({ color: 0x9e9e9e, side: THREE.DoubleSide });

  // Helper to add a curved wall segment (sides + top/bottom ring segments)
  function addWallSegment(thetaStart, thetaLength) {
    if (thetaLength <= 0.001) return;

    const outerGeo = new THREE.CylinderGeometry(outerR, outerR, height, segments, 1, true, thetaStart, thetaLength);
    const innerGeo = new THREE.CylinderGeometry(innerR, innerR, height, segments, 1, true, thetaStart, thetaLength);
    const outerWall = new THREE.Mesh(outerGeo, stoneMat);
    const innerWall = new THREE.Mesh(innerGeo, stoneMat);
    outerWall.position.y = height / 2;
    innerWall.position.y = height / 2;
    group.add(outerWall, innerWall);

    const ringSegs = Math.max(segments, 32);
    const topRingGeo = new THREE.RingGeometry(innerR, outerR, ringSegs, 1, thetaStart, thetaLength);
    const topRing = new THREE.Mesh(topRingGeo, darkerStone);
    topRing.rotation.x = -Math.PI / 2;
    topRing.position.y = height + 0.01;

    const bottomRing = new THREE.Mesh(topRingGeo.clone(), darkerStone);
    bottomRing.rotation.x = -Math.PI / 2;
    bottomRing.position.y = 0.0;

    group.add(topRing, bottomRing);
  }

  // Determine segments left after cutting out initial gap [nStart, nEnd]
  const epsilon = 0.001;
  function addSegmentsOutsideGap(gStart, gEnd) {
    if (gStart <= gEnd) {
      const leftLen = Math.max(0, gStart - epsilon);
      const rightStart = gEnd + epsilon;
      const rightLen = Math.max(0, full - rightStart);

      if (leftLen > 0.001) addWallSegment(0, leftLen);
      if (rightLen > 0.001) addWallSegment(norm(rightStart), rightLen);
    } else {
      const start = gEnd + epsilon;
      const len = (gStart - epsilon) - start;
      if (len > 0.001) addWallSegment(norm(start), len);
    }
  }

  // Build the wall (with a broad opening)
  addSegmentsOutsideGap(nStart, nEnd);

  // Compute the pillar positions around the opening (we'll use these as the true "gate bounds")
  const gapWidth = (() => {
    if (nStart <= nEnd) return nEnd - nStart;
    return (nEnd + full) - nStart;
  })();
  const midTheta = (() => {
    if (nStart <= nEnd) return nStart + gapWidth / 2;
    return norm(nStart + gapWidth / 2);
  })();

  // Create gate side pillars (towers) sitting at the edges of the opening
  const pillarHalfAngle = Math.min(0.05, gapWidth / 4);
  const towerAngles = [norm(midTheta - pillarHalfAngle), norm(midTheta + pillarHalfAngle)];
  const towerW = thickness * 2.2;
  const towerD = thickness * 2.2;
  const towerH = height + 8;
  const towerR = (innerR + outerR) / 2;
  const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
  const towerMat = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });

  towerAngles.forEach(theta => {
    const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
    const radial = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
    const pos = radial.clone().multiplyScalar(towerR);

    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(pos.x, towerH / 2, pos.z);
    tower.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.atan2(tangent.x, tangent.z));
    group.add(tower);

    // Decorative cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(towerW * 0.6, towerW * 0.6, 1.2, 10), darkerStone);
    cap.position.set(pos.x, towerH + 0.6, pos.z);
    group.add(cap);
  });

  // EFFECTIVE GATE SPAN: strictly between the two pillars
  let gateStart = towerAngles[0];
  let gateEnd = towerAngles[1];
  // Ensure gateStart -> gateEnd is the smaller positive arc that actually spans between pillars
  const arc = norm(gateEnd - gateStart);
  if (arc > Math.PI) {
    // swap to ensure smallest direct arc from start to end
    const tmp = gateStart; gateStart = gateEnd; gateEnd = tmp;
  }

  // Helper to test if angle is strictly between the gate pillars (no extra padding)
  function angleInGate(theta) {
    const t = norm(theta);
    const s = norm(gateStart);
    const e = norm(gateEnd);
    if (s <= e) {
      return t > s && t < e;
    } else {
      return t > s || t < e;
    }
  }

  // REMOVE ALL WALL/GATE-RELATED THINGS BETWEEN THE PILLARS:
  // 1) Do NOT place crenellations or buttresses in the gate span
  const crenHeight = 3.2;
  const crenWidth = 3.2;
  const crenDepth = thickness + 0.8;
  const crenR = (innerR + outerR) / 2;
  const crenGeo = new THREE.BoxGeometry(crenWidth, crenHeight, crenDepth);
  const arcStep = 12 / radius; // radians
  const crenAngles = [];
  for (let theta = 0; theta < full; theta += arcStep) {
    if (angleInGate(theta)) continue; // skip inside gate
    crenAngles.push(theta);
  }
  if (crenAngles.length > 0) {
    const inst = new THREE.InstancedMesh(crenGeo, accentStone, crenAngles.length);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const m = new THREE.Matrix4();
    let idx = 0;
    for (let k = 0; k < crenAngles.length; k++) {
      const theta = crenAngles[k];
      const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
      const radial = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
      const pos = radial.clone().multiplyScalar(crenR);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.atan2(tangent.x, tangent.z));
      m.compose(
        new THREE.Vector3(pos.x, height + crenHeight / 2 + 0.05, pos.z),
        q,
        new THREE.Vector3(1,1,1)
      );
      inst.setMatrixAt(idx++, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  }

  const buttressSpacing = 60 / radius; // radians
  const buttressWidth = 2.2;
  const buttressDepth = thickness + 1.2;
  const buttressHeight = height * 0.85;
  const buttressGeo = new THREE.BoxGeometry(buttressWidth, buttressHeight, buttressDepth);
  const buttAngles = [];
  for (let theta = 0; theta < full; theta += buttressSpacing) {
    if (angleInGate(theta)) continue; // skip inside gate
    buttAngles.push(theta);
  }
  if (buttAngles.length > 0) {
    const instB = new THREE.InstancedMesh(buttressGeo, stoneMat, buttAngles.length);
    instB.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const m2 = new THREE.Matrix4();
    let idx2 = 0;
    for (let k = 0; k < buttAngles.length; k++) {
      const theta = buttAngles[k];
      const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
      const radial = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
      const pos = radial.clone().multiplyScalar(crenR);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.atan2(tangent.x, tangent.z));
      m2.compose(
        new THREE.Vector3(pos.x, buttressHeight / 2, pos.z),
        q,
        new THREE.Vector3(1,1,1)
      );
      instB.setMatrixAt(idx2++, m2);
    }
    instB.instanceMatrix.needsUpdate = true;
    group.add(instB);
  }

  // 2) Physics proxies around the ring, skip anything between pillars
  const circumference = 2 * Math.PI * radius;
  const count = Math.max(24, Math.floor(circumference / colliderSpacing));
  const colliders = [];

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    if (angleInGate(theta)) continue; // skip colliders inside gate

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    const proxy = new THREE.Object3D();
    proxy.position.set(x, height / 2, z);
    proxy.userData.collider = {
      type: 'sphere',
      radius: colliderRadius
    };
    proxy.userData.label = 'Wall';
    proxy.userData.onInteract = null;

    group.add(proxy);
    colliders.push(proxy);
  }

  // 3) REMOVE any visual/decoration that was formerly placed across the opening:
  //    - No paving wedge
  //    - No overhead banner beam
  //    These were intentionally removed to keep the gate span completely clear.

  scene.add(group);
  return { group, colliders };
}
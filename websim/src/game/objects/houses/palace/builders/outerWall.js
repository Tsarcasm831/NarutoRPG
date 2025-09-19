import * as THREE from 'three';

export function buildOuterWall(CFG, mats) {
  const g = new THREE.Group();
  const { ellipse, thickness, height, segments, postEveryDeg, postSize, railThickness, color, stepLip, skipFrontSegments } = CFG.outerWall;

  // Which indices are the front panels? (+Z ~ 90°)
  const frontIndex = Math.round(segments * 0.25);
  const skip = new Set();
  for (let k = 0; k < skipFrontSegments; k++) {
    skip.add(frontIndex - Math.floor(skipFrontSegments / 2) + k);
  }

  // Panels
  for (let i = 0; i < segments; i++) {
    if (skip.has(i)) continue;

    const t0 = (i / segments) * Math.PI * 2;
    const t1 = ((i + 1) / segments) * Math.PI * 2;
    const p0 = new THREE.Vector3(Math.cos(t0) * ellipse.a, 0, Math.sin(t0) * ellipse.b);
    const p1 = new THREE.Vector3(Math.cos(t1) * ellipse.a, 0, Math.sin(t1) * ellipse.b);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const segLen = p0.distanceTo(p1);

    const box = new THREE.Mesh(new THREE.BoxGeometry(segLen, height, thickness), mats.wallMat);
    box.position.copy(mid).add(new THREE.Vector3(0, height / 2, 0));
    box.rotation.y = -Math.atan2(p1.z - p0.z, p1.x - p0.x);
    box.castShadow = box.receiveShadow = true;
    g.add(box);

    const lip = new THREE.Mesh(new THREE.BoxGeometry(segLen, railThickness, thickness + stepLip), mats.wallMat);
    lip.position.copy(mid).add(new THREE.Vector3(0, height + railThickness / 2, 0));
    lip.rotation.y = box.rotation.y;
    lip.castShadow = lip.receiveShadow = true;
    g.add(lip);
  }

  // Posts (skip around the opening)
  const [px, py, pz] = postSize;
  const segAngleDeg = 360 / segments;
  const halfGapDeg = (skipFrontSegments * segAngleDeg) / 2 + 2; // +2° margin

  for (let deg = 0; deg < 360; deg += postEveryDeg) {
    // front is 90°
    if (Math.abs(((deg - 90 + 540) % 360) - 180) < halfGapDeg) continue;

    const t = THREE.MathUtils.degToRad(deg);
    const x = Math.cos(t) * ellipse.a;
    const z = Math.sin(t) * ellipse.b;
    const post = new THREE.Mesh(new THREE.BoxGeometry(px, py, pz), mats.postMat);
    post.position.set(x, py / 2 + 0.1, z + 0.25);
    post.lookAt(0, post.position.y, 0);
    post.castShadow = post.receiveShadow = true;
    g.add(post);
  }

  return g;
}
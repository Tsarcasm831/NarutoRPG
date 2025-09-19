import * as THREE from 'three';

export function buildColliders(CFG, position, scale = 1) {
  const proxies = [];

  const addSphere = (x, z, r, label = 'Palace') => {
    const p = new THREE.Object3D();
    const wx = position.x + x * scale;
    const wz = position.z + z * scale;
    p.position.set(wx, 0, wz);
    p.userData.collider = { type: 'sphere', radius: r * scale };
    p.userData.label = label;
    proxies.push(p);
  };

  const addAABB = (cx, cz, hX, hZ, label = 'Palace') => {
    const p = new THREE.Object3D();
    const wx = position.x + cx * scale;
    const wz = position.z + cz * scale;
    p.position.set(wx, 0, wz);
    p.userData.collider = {
      type: 'aabb',
      center: { x: wx, z: wz },
      halfExtents: { x: hX * scale, z: hZ * scale }
    };
    p.userData.label = label;
    proxies.push(p);
  };

  const addOBB = (cx, cz, hX, hZ, rotY, label = 'Palace Wall') => {
    const p = new THREE.Object3D();
    const wx = position.x + cx * scale;
    const wz = position.z + cz * scale;
    p.position.set(wx, 0, wz);
    p.userData.collider = {
      type: 'obb',
      center: { x: wx, z: wz },
      halfExtents: { x: hX * scale, z: hZ * scale },
      rotationY: rotY
    };
    p.userData.label = label;
    proxies.push(p);
  };

  // 1) Rotunda main body as a single circle collider (use largest base tier radius)
  const baseR = CFG.rotunda.tiers[0].r;
  addSphere(0, 0, baseR + 2, 'Rotunda');

  // 2) Pods as individual circle colliders
  CFG.podPositions.forEach(p => {
    const size = p.large ? CFG.podLarge : CFG.podNormal;
    addSphere(p.x, p.z, size.r + 1.2, p.large ? 'Pod (Large)' : 'Pod');
  });

  // 3) Porch as an AABB in front of the entrance (+Z)
  {
    const r0 = CFG.rotunda.tiers[0].r;
    const porch = CFG.rotunda.porch;
    const cx = 0;
    const cz = r0 + porch.depth / 2;
    addAABB(cx, cz, porch.width / 2, porch.depth / 2, 'Porch');
  }

  // 4) Outer elliptical wall: precise OBBs per panel + posts to match visuals exactly
  {
    const { ellipse, thickness, segments, skipFrontSegments, postEveryDeg, postSize } = CFG.outerWall;

    // Identify indices to skip (front opening at +Z ~ 90°)
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

      const rotY = -Math.atan2(p1.z - p0.z, p1.x - p0.x);
      const hX = segLen / 2;
      const hZ = thickness / 2;

      addOBB(mid.x, mid.z, hX, hZ, rotY, 'Outer Wall Panel');
    }

    // Posts
    const [px, , pz] = postSize;
    const segAngleDeg = 360 / segments;
    const halfGapDeg = (skipFrontSegments * segAngleDeg) / 2 + 2; // +2° margin
    for (let deg = 0; deg < 360; deg += postEveryDeg) {
      // front is 90°
      if (Math.abs(((deg - 90 + 540) % 360) - 180) < halfGapDeg) continue;

      const t = THREE.MathUtils.degToRad(deg);
      const x = Math.cos(t) * ellipse.a;
      const z = Math.sin(t) * ellipse.b + 0.25; // same small offset as visual

      // Facing toward center
      const rotY = Math.atan2(-z, -x);
      const hX = px / 2;
      const hZ = pz / 2;

      addOBB(x, z, hX, hZ, rotY, 'Outer Wall Post');
    }
  }

  return proxies;
}
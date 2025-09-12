import * as THREE from 'three';

export function buildRotunda(CFG, mats) {
  const group = new THREE.Group();
  const { tiers, segments, trimHeight, strut, crownFins, porch } = CFG.rotunda;

  let yCursor = 0;
  tiers.forEach((t, idx) => {
    const geo = new THREE.CylinderGeometry(t.r, t.r, t.h, segments);
    const mat = new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.y = yCursor + t.h / 2;
    group.add(mesh);

    if (idx < tiers.length - 1) {
      const ringGeo = new THREE.CylinderGeometry(t.r + 1.2, t.r + 1.2, trimHeight, segments);
      const ring = new THREE.Mesh(ringGeo, mats.trimMat);
      ring.position.y = mesh.position.y + t.h / 2 + trimHeight / 2 - 0.01;
      ring.castShadow = ring.receiveShadow = true;
      group.add(ring);
    }
    yCursor += t.h;
  });

  // Red vertical struts
  {
    const Hfull = tiers[0].h + tiers[1].h + tiers[2].h;
    const H = Hfull * (strut.heightScale ?? 0.45);
    const yBase = tiers[0].h / 2;
    const strutGeo = new THREE.BoxGeometry(strut.width, H, strut.depth);
    const strutMat = new THREE.MeshStandardMaterial({ color: strut.color, roughness: 0.85 });
    for (let a = 0; a < 360; a += strut.everyDeg) {
      const r = tiers[0].r - strut.inset;
      const x = Math.cos(THREE.MathUtils.degToRad(a)) * r;
      const z = Math.sin(THREE.MathUtils.degToRad(a)) * r;
      const s = new THREE.Mesh(strutGeo, strutMat);
      s.castShadow = s.receiveShadow = true;
      s.position.set(x, yBase + H / 2, z);
      s.lookAt(0, s.position.y, 0);
      group.add(s);
    }
  }

  // Crown fins
  {
    const fin = new THREE.BoxGeometry(crownFins.w, crownFins.h, crownFins.t);
    const baseY = tiers.slice(0, 3).reduce((a, t) => a + t.h, 0) + 3;
    const r = tiers[3].r + 2.5;
    for (let i = 0; i < crownFins.count; i++) {
      const theta = (i / crownFins.count) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const m = new THREE.Mesh(fin, mats.whiteMat);
      m.castShadow = m.receiveShadow = true;
      m.position.set(x, baseY + crownFins.h / 2, z);
      m.lookAt(0, m.position.y, 0);
      m.rotateX(THREE.MathUtils.degToRad(crownFins.tiltDeg));
      group.add(m);
    }
  }

  // Entrance/porch on ground
  {
    const p = new THREE.Group();
    const w = porch.width, d = porch.depth, h = porch.height;
    const r0 = tiers[0].r;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), mats.woodMat);
    deck.castShadow = deck.receiveShadow = true;
    deck.position.set(0, 1, r0 + d / 2 - 0.01);
    p.add(deck);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(10, h, 1), mats.whiteMat);
    frame.castShadow = frame.receiveShadow = true;
    frame.position.set(0, h / 2, r0 + 0.6);
    p.add(frame);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + porch.roofOverhang * 2, 1.2, d * 0.8), mats.whiteMat);
    roof.castShadow = roof.receiveShadow = true;
    roof.position.set(0, h + 1.2, r0 + d * 0.6);
    p.add(roof);

    group.add(p);
  }

  return group;
}
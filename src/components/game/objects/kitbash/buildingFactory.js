import * as THREE from 'three';
import { makeMats, tagRole } from './materials.js';
import { KitbashKit as Kit } from './kit.js';
import { pick } from './palettes.js';
import { recolorGroup, footprintRadius } from './helpers.js';
import { getBox } from './geometry.js';

export function makeBuilding(rng, pal) {
  const mats = makeMats(pal);
  const g = new THREE.Group();
  const design = pick(['rect', 'rect', 'L', 'cyl', 'oct', 'courtyard', 'twinBridge', 'stilt', 'terraced', 'drumOnBox', 'boxOnDrum'], rng);

  const baseW = 2.0 + rng() * 2.5, baseD = 1.8 + rng() * 2.2, baseR = 1.2 + rng() * 1.3;
  const levelH = 0.95 + rng() * 0.45;
  let y = 0;

  function rectFloors(n = 1, w = baseW, d = baseD) {
    for (let i = 0; i < n; i++) {
      const shrink = 1 - i * 0.08 - rng() * 0.04;
      const lv = Kit.rectLevel({ w: w * shrink, d: d * shrink, h: levelH, mats });
      lv.position.y = y + levelH / 2; g.add(lv); y += levelH;
      if (i === 0 && design === 'L') {
        const arm = Kit.rectLevel({ w: w * 0.6, d: d * 0.5, h: levelH * 0.9, mats });
        arm.position.set(-w * 0.3, levelH * 0.45, d * 0.25); lv.add(arm);
      }
    }
    const last = g.children[g.children.length - 1].userData.size;
    const roofType = pick(['flat', 'hip', 'flat', 'hip'], rng);
    const roof = (roofType === 'flat') ? Kit.flatRoof({ w: last.w * 1.02, d: last.d * 1.02, mats })
      : Kit.hipRoof({ w: last.w * 1.02, d: last.d * 1.02, mats });
    roof.position.y = y; g.add(roof);
  }
  function roundFloors(n = 1, r = baseR, sides = 14) {
    for (let i = 0; i < n; i++) {
      const shrink = 1 - i * 0.08 - rng() * 0.04;
      const lv = Kit.cylLevel({ r: r * shrink, h: levelH, mats, sides });
      lv.position.y = y + levelH / 2; g.add(lv); y += levelH;
    }
    const last = g.children[g.children.length - 1].userData.size;
    const roof = Kit.coneRoof({ r: last.r * 1.02, h: 0.55 + 0.25 * (n === 1 ? 1.25 : 1), mats, sides });
    roof.position.y = y; g.add(roof);
  }

  switch (design) {
    case 'rect': rectFloors(1 + (rng() < 0.6 ? 1 : 0)); break;
    case 'L': rectFloors(1 + (rng() < 0.5 ? 1 : 0)); break;
    case 'cyl': roundFloors(1 + (rng() < 0.6 ? 1 : 0), baseR, 14); break;
    case 'oct': roundFloors(1 + (rng() < 0.5 ? 1 : 0), baseR, 8); break;
    case 'courtyard': {
      const w = baseW * 1.35, d = baseD * 1.35, gap = 0.9;
      const wings = [
        { x: 0, z: -(d - gap) / 2, w, d: 0.6 },
        { x: 0, z: (d - gap) / 2, w, d: 0.6 },
        { x: -(w - gap) / 2, z: 0, w: 0.6, d },
        { x: (w - gap) / 2, z: 0, w: 0.6, d }
      ];
      const floors = 1 + (rng() < 0.5 ? 1 : 0);
      for (let f = 0; f < floors; f++) {
        const h = levelH * (1 - f * 0.06);
        for (const seg of wings) { const lv = Kit.rectLevel({ w: seg.w, d: seg.d, h, mats }); lv.position.set(seg.x, y + h / 2, seg.z); g.add(lv); }
        y += h;
      }
      const roof = Kit.flatRoof({ w: w * 0.9, d: d * 0.9, mats }); roof.position.y = y; g.add(roof);
      break;
    }
    case 'twinBridge': {
      const s = 0.75;
      const left = Kit.rectLevel({ w: baseW, d: baseD, h: levelH, mats });
      const right = Kit.rectLevel({ w: baseW * s, d: baseD * s, h: levelH, mats });
      left.position.set(-baseW * 0.8, levelH / 2, 0); right.position.set(baseW * 0.8, levelH / 2, 0);
      g.add(left, right); y = levelH;
      const bridge = new THREE.Mesh(getBox(baseW * 0.9, 0.08, 0.6), mats.roofAlt); tagRole(bridge, 'roof'); bridge.position.set(0, y + 0.15, 0); g.add(bridge);
      const roofL = Kit.flatRoof({ w: baseW * 1.02, d: baseD * 1.02, mats }); roofL.position.set(-baseW * 0.8, y, 0);
      const roofR = Kit.hipRoof({ w: baseW * s * 1.02, d: baseD * s * 1.02, mats }); roofR.position.set(baseW * 0.8, y, 0);
      g.add(roofL, roofR);
      break;
    }
    case 'stilt': {
      const w = baseW * 1.15, d = baseD * 1.1;
      const posts = Kit.posts({ w, d, h: 0.6, mats }); g.add(posts);
      const lv = Kit.rectLevel({ w, d, h: levelH, mats }); lv.position.y = 0.6 + levelH / 2; g.add(lv); y = 0.6 + levelH;
      const aw = Kit.awning({ w: w * 0.9, d: 0.7, mats }); aw.position.set(0, 0.6 + 0.9, d / 2 + 0.01); g.add(aw);
      const roof = Kit.hipRoof({ w: w * 1.02, d: d * 1.02, mats }); roof.position.y = y; g.add(roof);
      break;
    }
    case 'terraced': {
      const n = 2 + (rng() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const w = baseW * (1 - i * 0.12), d = baseD * (1 - i * 0.06);
        const lv = Kit.rectLevel({ w, d, h: levelH * 0.95, mats });
        lv.position.set(0, y + (levelH * 0.95) / 2, i * 0.35); g.add(lv); y += levelH * 0.95;
        if (i < n - 1) { const aw = Kit.awning({ w, d: 0.7, mats }); aw.position.set(0, y - 0.15, i * 0.35 + d / 2 + 0.01); g.add(aw); }
      }
      const last = g.children[g.children.length - 1].userData.size;
      const roof = Kit.flatRoof({ w: last.w * 1.02, d: last.d * 1.02, mats }); roof.position.y = y; g.add(roof);
      break;
    }
    case 'drumOnBox': {
      const base = Kit.rectLevel({ w: baseW * 1.15, d: baseD * 1.15, h: levelH, mats });
      base.position.y = levelH / 2; g.add(base); y = levelH;
      const drum = Kit.cylLevel({ r: baseR * 0.95, h: levelH * 0.95, mats, sides: 12 });
      drum.position.y = y + (levelH * 0.95) / 2; g.add(drum); y += levelH * 0.95;
      const roof = Kit.coneRoof({ r: (baseR * 0.95) * 1.02, h: 0.7, mats, sides: 12 }); roof.position.y = y; g.add(roof);
      break;
    }
    case 'boxOnDrum': {
      const drum = Kit.cylLevel({ r: baseR * 1.05, h: levelH, mats, sides: 14 });
      drum.position.y = levelH / 2; g.add(drum); y = levelH;
      const top = Kit.rectLevel({ w: baseW * 0.95, d: baseD * 0.9, h: levelH * 0.9, mats });
      top.position.y = y + (levelH * 0.9) / 2; g.add(top); y += levelH * 0.9;
      const roof = Kit.hipRoof({ w: top.userData.size.w * 1.02, d: top.userData.size.d * 1.02, mats }); roof.position.y = y; g.add(roof);
      break;
    }
  }
  const box3 = new THREE.Box3().setFromObject(g);
  const size = box3.getSize(new THREE.Vector3());
  const plinth = new THREE.Mesh(getBox(size.x * 1.02, 0.06, size.z * 1.02), mats.dark);
  plinth.position.y = 0.03; plinth.receiveShadow = true; g.add(plinth);
  const door = new THREE.Mesh(getBox(0.5, 0.75, 0.05), mats.trim); tagRole(door, 'trim');
  door.position.set(0, 0.38, -size.z / 2 + 0.05); g.add(door);
  g.rotation.y = (Math.random() * Math.PI * 2);
  g.userData = { isBuilding: true, recolor: (p) => recolorGroup(g, p), paletteName: pal.name };
  g.userData.radius = footprintRadius(g);
  return g;
}


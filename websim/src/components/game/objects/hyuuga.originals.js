import * as THREE from 'three';
import { getBox, getCyl } from './kitbash/geometry.js';
import { makeMats, tagRole } from './kitbash/materials.js';
import { KitbashKit as Kit } from './kitbash/kit.js';
import { recolorGroup, footprintRadius } from './kitbash/helpers.js';

function gabledRoof({ w, d, h = 0.6, mats }) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(getBox(w, 0.06, d), mats.roof); tagRole(slab, 'roof'); slab.position.y = 0.06 / 2; g.add(slab);
  const ridge = new THREE.Mesh(getBox(w * 0.96, 0.06, d * 0.2), mats.roofAlt); tagRole(ridge, 'roof'); ridge.position.y = 0.06 + h * 0.2; g.add(ridge);
  return g;
}

function makeCourtyardHouse({ pal, seed = Math.random }) {
  const mats = makeMats(pal);
  const g = new THREE.Group();
  const w = 3.4, d = 3.1, gap = 1.5;
  const wings = [
    { x: 0, z: -(d - gap) / 2, w, d: 0.7 },
    { x: 0, z: (d - gap) / 2, w, d: 0.7 },
    { x: -(w - gap) / 2, z: 0, w: 0.7, d },
    { x: (w - gap) / 2, z: 0, w: 0.7, d }
  ];
  const levelH = 1.05;
  for (const seg of wings) {
    const lv = Kit.rectLevel({ w: seg.w, d: seg.d, h: levelH, mats });
    lv.position.set(seg.x, levelH / 2, seg.z); g.add(lv);
    const roof = gabledRoof({ w: seg.w * 1.02, d: seg.d * 1.02, mats }); roof.position.y = levelH; lv.add(roof);
  }
  // A small central garden plinth
  const base = new THREE.Mesh(getBox(w * 0.9, 0.04, d * 0.9), mats.dark); base.position.y = 0.02; base.receiveShadow = true; g.add(base);
  g.userData = { isBuilding: true, recolor: (p) => recolorGroup(g, p), paletteName: pal.name };
  g.userData.radius = footprintRadius(g);
  return g;
}

function makeDojoHall({ pal }) {
  const mats = makeMats(pal);
  const g = new THREE.Group();
  const w = 4.2, d = 1.4, h = 1.0;
  const posts = Kit.posts({ w: w * 1.1, d: d * 1.05, h: 0.55, mats, spacing: 1.1 }); g.add(posts);
  const hall = Kit.rectLevel({ w, d, h, mats, margins: { left: 0.08, right: 0.08, front: 0.18, back: 0.18 } }); hall.position.y = 0.55 + h / 2; g.add(hall);
  const aw = Kit.awning({ w: w * 0.98, d: 0.8, mats }); aw.position.set(0, 0.55 + 0.72, d / 2 + 0.01); g.add(aw);
  const roof = gabledRoof({ w: w * 1.02, d: d * 1.02, h: 0.6, mats }); roof.position.y = 0.55 + h; g.add(roof);
  g.userData = { isBuilding: true, recolor: (p) => recolorGroup(g, p), paletteName: pal.name };
  g.userData.radius = footprintRadius(g);
  return g;
}

function makeSmallPagoda({ pal }) {
  const mats = makeMats(pal);
  const g = new THREE.Group();
  const r = 0.9;
  const lv1 = Kit.cylLevel({ r: r * 1.15, h: 0.95, mats, sides: 10 }); lv1.position.y = 0.95 / 2; g.add(lv1);
  const lv2 = Kit.cylLevel({ r: r, h: 0.85, mats, sides: 12 }); lv2.position.y = 0.95 + 0.85 / 2; g.add(lv2);
  const roof = Kit.coneRoof({ r: r * 1.02, h: 0.65, mats, sides: 12 }); roof.position.y = 0.95 + 0.85; g.add(roof);
  g.userData = { isBuilding: true, recolor: (p) => recolorGroup(g, p), paletteName: pal.name };
  g.userData.radius = footprintRadius(g);
  return g;
}

function makeGatehouse({ pal }) {
  const mats = makeMats(pal);
  const g = new THREE.Group();
  const w = 3.2, d = 1.6, h = 1.0;
  // Perimeter wall slab
  const wall = new THREE.Mesh(getBox(w * 1.2, 0.25, d * 1.2), mats.trim); tagRole(wall, 'trim'); wall.position.y = 0.125; wall.receiveShadow = true; g.add(wall);
  const body = Kit.rectLevel({ w, d, h, mats }); body.position.y = h / 2; g.add(body);
  const roof = Kit.hipRoof({ w: w * 1.06, d: d * 1.06, h: 0.55, mats }); roof.position.y = h; g.add(roof);
  g.userData = { isBuilding: true, recolor: (p) => recolorGroup(g, p), paletteName: pal.name };
  g.userData.radius = footprintRadius(g);
  return g;
}

export function buildHyuugaOriginals(THREE, pal, rng) {
  const fns = [makeCourtyardHouse, makeDojoHall, makeSmallPagoda, makeGatehouse];
  const n = 6; // few distinct shapes
  const out = [];
  for (let i = 0; i < n; i++) {
    const fn = fns[i % fns.length];
    out.push(fn({ pal, rng }));
  }
  return out;
}


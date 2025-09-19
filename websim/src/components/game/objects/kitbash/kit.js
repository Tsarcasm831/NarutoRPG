import * as THREE from 'three';
import { getBox, getCyl } from './geometry.js';
import { tagRole } from './materials.js';

export const KitbashKit = {
  rectLevel({ w, d, h = 1.35, inset = 0.02, mats, margins }) {
    const M = Object.assign({ left: 0.18, right: 0.18, front: 0.18, back: 0.18 }, margins || {});
    const level = new THREE.Group();
    const wBody = w * (1 - inset), dBody = d * (1 - inset);
    const body = new THREE.Mesh(getBox(wBody, h, dBody), mats.wall);
    tagRole(body, 'wall'); body.castShadow = body.receiveShadow = true; level.add(body);
    if (h > 0.9) {
      const bandH = 0.24, y = 0.32 * h, dd = 0.01, eps = 0.0015;
      // FRONT/BACK along X
      const x0 = -wBody / 2 + M.left, x1 = wBody / 2 - M.right;
      const fbLen = Math.max(0.2, x1 - x0);
      const fbTiles = Math.max(1, Math.floor(fbLen / 0.26));
      const fbW = fbLen / fbTiles;
      for (const sign of [-1, 1]) {
        const z = sign * (dBody / 2 + dd / 2 + eps);
        for (let i = 0; i < fbTiles; i++) {
          const x = x0 + (i + 0.5) * fbW;
          const win = new THREE.Mesh(getBox(fbW, bandH, dd), mats.window);
          tagRole(win, 'window');
          win.position.set(x, y, z);
          level.add(win);
        }
      }
      // LEFT/RIGHT along Z
      const z0 = -dBody / 2 + M.back, z1 = dBody / 2 - M.front;
      const lrLen = Math.max(0.2, z1 - z0);
      const lrTiles = Math.max(1, Math.floor(lrLen / 0.26));
      const lrW = lrLen / lrTiles;
      for (const sign of [-1, 1]) {
        const x = sign * (wBody / 2 + dd / 2 + eps);
        for (let i = 0; i < lrTiles; i++) {
          const z = z0 + (i + 0.5) * lrW;
          const win = new THREE.Mesh(getBox(lrW, bandH, dd), mats.window);
          tagRole(win, 'window');
          win.rotation.y = Math.PI / 2;
          win.position.set(x, y, z);
          level.add(win);
        }
      }
    }
    const belt = new THREE.Mesh(getBox(wBody * 0.99, 0.06, dBody * 0.99), mats.trim);
    tagRole(belt, 'trim'); belt.position.y = h / 2 + 0.03; belt.castShadow = belt.receiveShadow = true; level.add(belt);
    level.userData.size = { w, d, h, wBody, dBody };
    return level;
  },

  cylLevel({ r, h = 1.35, mats, sides = 14 }) {
    const level = new THREE.Group();
    const bodyR = r * (1 - 0.02);
    const body = new THREE.Mesh(getCyl(bodyR, h, sides), mats.wall);
    tagRole(body, 'wall'); body.castShadow = body.receiveShadow = true; level.add(body);
    if (h > 0.9) {
      const windows = 12, dd = 0.01, eps = 0.0015;
      const ringR = bodyR + dd / 2 + eps;
      for (let i = 0; i < windows; i++) {
        const a = i / windows * Math.PI * 2;
        const tile = new THREE.Mesh(getBox(0.22, 0.26, dd), mats.window); tagRole(tile, 'window');
        tile.position.set(Math.cos(a) * ringR, 0.32 * h, Math.sin(a) * ringR);
        tile.lookAt(0, tile.position.y, 0);
        level.add(tile);
      }
    }
    const belt = new THREE.Mesh(getCyl(bodyR * 0.99, 0.06, sides), mats.trim); tagRole(belt, 'trim');
    belt.position.y = h / 2 + 0.03; level.add(belt);
    level.userData.size = { r, h, bodyR };
    return level;
  },

  flatRoof({ w, d, th = 0.12, mats }) {
    const g = new THREE.Group();
    const deck = new THREE.Mesh(getBox(w, th, d), mats.roof); tagRole(deck, 'roof');
    deck.position.y = th / 2; deck.castShadow = deck.receiveShadow = true; g.add(deck);
    const para = new THREE.Mesh(getBox(w * 0.96, 0.18, d * 0.96), mats.roofAlt); tagRole(para, 'roof');
    para.position.y = th + 0.09; g.add(para);
    return g;
  },

  hipRoof({ w, d, h = 0.55, mats }) {
    const g = new THREE.Group();
    const slab1 = new THREE.Mesh(getBox(w, 0.08, d), mats.roof); tagRole(slab1, 'roof');
    const slab2 = slab1.clone(); slab1.position.y = h * 0.3; slab2.position.y = h * 0.6;
    g.add(slab1, slab2);
    return g;
  },

  coneRoof({ r, h = 0.7, mats, sides = 12 }) {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.02, h, sides), mats.roof); tagRole(cone, 'roof');
    cone.position.y = h * 0.5; cone.castShadow = cone.receiveShadow = true; g.add(cone);
    return g;
  },

  posts({ w, d, h = 0.6, mats, spacing = 0.9 }) {
    const g = new THREE.Group(); const r = 0.06;
    const gridX = Math.max(2, Math.floor(w / spacing)), gridZ = Math.max(2, Math.floor(d / spacing));
    for (let ix = 0; ix < gridX; ix++) for (let iz = 0; iz < gridZ; iz++) {
      const x = -w / 2 + (ix / (gridX - 1)) * w, z = -d / 2 + (iz / (gridZ - 1)) * d;
      const post = new THREE.Mesh(getCyl(r, h, 10), mats.trim); tagRole(post, 'trim');
      post.position.set(x, h / 2, z); g.add(post);
    }
    return g;
  },

  awning({ w, d = 0.5, th = 0.06, mats }) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(getBox(w, th, d), mats.roofAlt); tagRole(plate, 'roof');
    plate.position.y = th / 2; g.add(plate);
    return g;
  },
};


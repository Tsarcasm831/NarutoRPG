// konohaHospital.js
// ESM module that builds the Konoha Hospital scene.
// Usage below (after this file).

// Minimal HTML to use it

// <!doctype html>
// <html>
//   <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
//   <body style="margin:0">
//     <div id="app" style="position:relative;height:100vh"></div>
//     <script type="module">
//       import createHospital from './hospital.js';
//       createHospital({ container: document.getElementById('app') });
//     </script>
//   </body>
// </html>

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

export default function createHospital(options = {}) {
  const {
    container = document.body,
    background = 0xdcdcdc,
    showUI = true,
    pixelRatio = Math.min(devicePixelRatio, 2),
  } = options;

  // ensure the container can host absolutely-positioned UI
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  /* --- renderer / scene / camera --- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(
    55,
    (container.clientWidth || innerWidth) / (container.clientHeight || innerHeight),
    0.1,
    4000
  );
  camera.position.set(520, 300, 560);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 95, 0);

  if (showUI) addOverlay(container, "Overhangs pitch downward • Blue sign shelf moved under the red seal");

  /* --- lights --- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7a7a7a, 0.6));

  const sun = new THREE.DirectionalLight(0xffffff, 1.05);
  sun.position.set(500, 700, 320);
  sun.castShadow = true;

  // shadow map resolution
  sun.shadow.mapSize.set(2048, 2048);

  // orthographic shadow frustum
  sun.shadow.camera.left = -1100;
  sun.shadow.camera.right = 1100;
  sun.shadow.camera.top = 900;
  sun.shadow.camera.bottom = -900;

  // depth range
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 1800;
  sun.shadow.camera.updateProjectionMatrix();

  // shadow acne tuning
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.6;

  scene.add(sun);

  /* --- materials --- */
  const M = {
    wall: new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.95, metalness: 0.02 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x86bffd, roughness: 0.6, metalness: 0.15 }),
    lip: new THREE.MeshStandardMaterial({ color: 0x244566, roughness: 0.7, metalness: 0.15 }),
    eave: new THREE.MeshStandardMaterial({ color: 0xf1c546, roughness: 0.7, metalness: 0.08 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x212428, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x68d1d3,
      roughness: 0.12,
      metalness: 0.02,
      envMapIntensity: 0.5,
      emissive: 0x1a8085,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.92,
    }),
    stone: new THREE.MeshStandardMaterial({ color: 0xbac2cc, roughness: 1 }),
    fence: new THREE.MeshBasicMaterial({ color: 0xb8c2cc, wireframe: true }),
    green: new THREE.MeshStandardMaterial({ color: 0x3da45e, roughness: 0.85, metalness: 0.03 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc43a2f, roughness: 0.86, metalness: 0.03 }),
    bush: new THREE.MeshStandardMaterial({ color: 0x6cab60, roughness: 1 }),
  };

  /* --- helpers --- */
  const addBox = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  function addWindow(group, x, y, zFace, w = 30, h = 36) {
    const frame = addBox(w + 4, h + 4, 2, M.dark, x, y, zFace + 1.0);
    const glass = addBox(w, h, 1.2, M.glass, x, y, zFace - 1.2);
    group.add(frame, glass);
  }

  // hard-down awning: front edge always lower than hinge
  function awningDown(x, y, zFace, { w = 46, depth = 16, drop = 9 } = {}) {
    const g = new THREE.Group();

    const hinge = new THREE.Mesh(new THREE.BoxGeometry(w, 2, 2), M.eave);
    g.add(hinge);

    const tilt = Math.atan2(drop, depth); // positive => front down
    const panelGeom = new THREE.BoxGeometry(w, 2, depth);
    panelGeom.translate(0, 0, depth / 2); // pivot at wall
    const panel = new THREE.Mesh(panelGeom, M.eave);
    panel.rotation.x = tilt;

    const dz = Math.cos(tilt) * depth;
    const dy = -Math.sin(tilt) * depth; // below hinge
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w, 2, 2.6), M.eave);
    lip.position.set(0, dy, dz);

    g.add(panel, lip);
    g.position.set(x, y, zFace + 0.05);
    g.traverse((m) => (m.castShadow = m.receiveShadow = true));
    return g;
  }

  function bush(x, z) {
    const g = new THREE.Group();
    for (const s of [1, 0.92, 0.85, 0.78]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(8 * s, 16, 12), M.bush);
      b.position.set((Math.random() * 2 - 1) * 4, 6 + Math.random() * 1.5, (Math.random() * 2 - 1) * 3);
      b.castShadow = b.receiveShadow = true;
      g.add(b);
    }
    g.position.set(x, 0, z);
    return g;
  }

  /* --- base pad --- */
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1200, 20, 900), M.stone);
  pad.position.y = -10;
  pad.receiveShadow = true;
  scene.add(pad);

  /* --- hospital block --- */
  const hospital = new THREE.Group();
  const bodyW = 760,
    bodyH = 168,
    bodyD = 190;
  const zFront = bodyD / 2;
  const zBack = -bodyD / 2;

  hospital.add(addBox(bodyW, bodyH, bodyD, M.wall, 0, bodyH / 2, 0));

  // roof + lip
  const roofY = bodyH + 3;
  hospital.add(addBox(bodyW + 48, 6, bodyD + 48, M.roof, 0, roofY, 0));
  const lipY = roofY + 6;
  const lipT = 4,
    lipW = bodyW + 48,
    lipD = bodyD + 48;
  const strips = new THREE.Group();
  strips.add(addBox(lipW, lipT, 4, M.lip, 0, lipY, lipD / 2 - 2));
  strips.add(addBox(lipW, lipT, 4, M.lip, 0, lipY, -lipD / 2 + 2));
  strips.add(addBox(4, lipT, lipD - 8, M.lip, lipW / 2 - 2, lipY, 0));
  strips.add(addBox(4, lipT, lipD - 8, M.lip, -lipW / 2 + 2, lipY, 0));
  hospital.add(strips);

  // pillars
  const pDepth = 26,
    pillarCenterZ = zFront - pDepth / 2;
  [-320, -240, -160, -80, 0, 80, 160, 240, 320].forEach((x) => {
    hospital.add(addBox(22, bodyH, pDepth, M.wall, x, bodyH / 2, pillarCenterZ));
  });

  // windows + awnings (forced downward)
  const wins = new THREE.Group();
  const floors = [42, 92, 142];
  const cols = [-320, -240, -160, -80, 80, 160, 240, 320];
  floors.forEach((y) => {
    cols.forEach((x) => {
      addWindow(wins, x, y, zFront);
      wins.add(awningDown(x, y + 26, zFront, { w: 46, depth: 16, drop: 10 }));
    });
  });
  hospital.add(wins);

  // door (green, +0.1m proud)
  hospital.add(addBox(92, 96, 4, M.green, 0, 52, zFront + 10));

  // bushes (skip center span)
  const bushes = new THREE.Group();
  for (let i = -330; i <= 330; i += 60) {
    if (Math.abs(i) < 90) continue;
    bushes.add(bush(i, zFront + 18));
  }
  hospital.add(bushes);

  // sign + BLUE shelf under red seal
  (function () {
    const g = new THREE.Group();
    g.add(addBox(280, 40, 6, M.green, 0, 110, zFront + 2));
    g.add(addBox(280, 4, 8, M.dark, 0, 130, zFront + 1.5));
    g.add(addBox(280, 4, 8, M.dark, 0, 90, zFront + 1.5));

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(38, 38, 6, 6), M.eave);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 110, zFront + 5.5);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 8, 24), M.red);
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, 110, zFront + 9.5);
    g.add(rim, seal);

    const shelfGeom = new THREE.BoxGeometry(240, 3, 56);
    shelfGeom.translate(0, 0, 28);
    const shelf = new THREE.Mesh(shelfGeom, M.roof);
    shelf.rotation.x = 0.0;
    shelf.position.set(0, 104, zFront + 4); // below the seal
    g.add(shelf);

    hospital.add(g);
  })();

  // deck + fence (rails respect side orientation)
  (function () {
    const deck = addBox(540, 6, 240, M.stone, 0, bodyH + 28, 0);
    deck.material.color.set(0xf6f8fb);
    hospital.add(deck);

    const fenceH = 36,
      rail = 3;
    const sides = [
      { len: 540, x: 0, z: 120, ry: 0, axis: "x" },
      { len: 540, x: 0, z: -120, ry: 0, axis: "x" },
      { len: 240, x: 270, z: 0, ry: Math.PI / 2, axis: "z" },
      { len: 240, x: -270, z: 0, ry: Math.PI / 2, axis: "z" },
    ];
    const f = new THREE.Group();
    sides.forEach((s) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(s.len, fenceH, 24, 6), M.fence);
      plane.position.set(s.x, bodyH + 28 + fenceH / 2, s.z);
      plane.rotation.y = s.ry;
      f.add(plane);

      if (s.axis === "x") {
        f.add(addBox(s.len, rail, rail, M.stone, s.x, bodyH + 28 + fenceH, s.z));
        f.add(addBox(s.len, rail, rail, M.stone, s.x, bodyH + 28, s.z));
      } else {
        f.add(addBox(rail, rail, s.len, M.stone, s.x, bodyH + 28 + fenceH, s.z));
        f.add(addBox(rail, rail, s.len, M.stone, s.x, bodyH + 28, s.z));
      }
    });
    hospital.add(f);
  })();

  // rotunda (rear-right)
  (function () {
    const cx = bodyW / 2 - 72,
      cz = zBack + 58;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, 40, 28), M.wall);
    drum.position.set(cx, bodyH + 12, cz);
    const eave = new THREE.Mesh(new THREE.CylinderGeometry(62, 62, 4, 28), M.eave);
    eave.position.set(cx, bodyH + 32, cz);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(68, 50, 28), M.eave);
    cone.position.set(cx, bodyH + 57, cz);
    scene.add(drum, eave, cone);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = cx + Math.cos(a) * 46;
      const z = cz + Math.sin(a) * 46;
      scene.add(addBox(22, 26, 2, M.dark, x, bodyH + 12, z));
      scene.add(addBox(18, 22, 1.2, M.glass, x, bodyH + 12, z - 1.2));
    }
  })();

  // tank/stack (rear-left)
  (function () {
    const base = addBox(140, 14, 100, M.wall, -bodyW / 2 + 128, bodyH + 20, -bodyD / 2 + 44);
    scene.add(base);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 16, 24), M.wall);
    stand.position.set(base.position.x - 18, bodyH + 28, base.position.z - 8);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(32, 30, 64, 28), M.stone);
    tank.position.set(stand.position.x, bodyH + 66, stand.position.z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(20, 30, 10, 28), M.stone);
    cap.position.set(stand.position.x, bodyH + 98, stand.position.z);
    const util = addBox(40, 26, 16, M.green, base.position.x + 30, bodyH + 30, base.position.z + 16);
    const v1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 16, 20), M.stone);
    v1.position.set(base.position.x - 14, bodyH + 26, base.position.z + 28);
    const v2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 46, 20), M.dark);
    v2.position.set(v1.position.x, bodyH + 53, v1.position.z);
    scene.add(stand, tank, cap, util, v1, v2);
  })();

  // cables
  (function () {
    const y = (bodyH + 3) + 6 + 2;
    const zEdge = zFront - 12;
    const cable = (pts) => {
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      const g = new THREE.TubeGeometry(curve, 160, 2.3, 10, false);
      const m = new THREE.Mesh(g, M.dark);
      m.castShadow = m.receiveShadow = true;
      return m;
    };
    scene.add(
      cable([
        new THREE.Vector3(-360, y, zEdge - 4),
        new THREE.Vector3(-220, y + 22, zEdge - 6),
        new THREE.Vector3(-40, y + 10, zEdge - 2),
        new THREE.Vector3(160, y + 24, zEdge - 5),
        new THREE.Vector3(320, y + 12, zEdge),
        new THREE.Vector3(380, y, zEdge - 3),
      ])
    );
    scene.add(
      cable([
        new THREE.Vector3(-300, y + 8, zEdge + 10),
        new THREE.Vector3(-180, y + 26, zEdge - 2),
        new THREE.Vector3(-20, y + 14, zEdge + 8),
        new THREE.Vector3(120, y + 26, zEdge + 2),
        new THREE.Vector3(220, y + 12, zEdge + 9),
      ])
    );
  })();

  // finish
  hospital.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
    }
  });
  scene.add(hospital);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 1500),
    new THREE.ShadowMaterial({ opacity: 0.25 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // resize
  const resize = () => {
    const w = container.clientWidth || innerWidth;
    const h = container.clientHeight || innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  if (container !== document.body && "ResizeObserver" in window) {
    const ro = new ResizeObserver(resize);
    ro.observe(container);
  }

  // animate
  (function loop() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  // return handles for further tweaks
  return { scene, camera, renderer, controls };
}

/* ---------- tiny UI helper ---------- */
function addOverlay(container, text) {
  const div = document.createElement("div");
  div.textContent = text;
  Object.assign(div.style, {
    position: "absolute",
    left: "12px",
    top: "12px",
    padding: "8px 10px",
    color: "#111",
    background: "rgba(255,255,255,.8)",
    border: "1px solid #bbb",
    borderRadius: "10px",
    font: "12px system-ui,-apple-system,Segoe UI,Roboto",
    backdropFilter: "blur(6px)",
    pointerEvents: "none",
    zIndex: 10,
  });
  container.appendChild(div);
}

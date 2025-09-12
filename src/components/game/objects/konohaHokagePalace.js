// konohaHokagePalace.js
//
// HOW TO USE (drop into any HTML page):
// -------------------------------------------------------------
// <script type="importmap">
// {
//   "imports": {
//     "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
//     "three/examples/jsm/controls/OrbitControls.js":
//       "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
//   }
// }
// </script>
// <script type="module">
//   import createHokagePalace from './konohaHokagePalace.js';
//   // Option A: mount to the full page
//   const api = createHokagePalace({ mount: document.body });
//   // Option B: mount to a specific container
//   // const api = createHokagePalace({ mount: document.getElementById('app') });
//   // api.dispose() later to clean everything up.
// </script>
// -------------------------------------------------------------
//
// Notes:
// - Requires modern browsers with ES modules.
// - You can access {scene, camera, renderer, controls, complex} from the returned api.
// - Pass {withUI:false} to hide the small overlay, or {background: 0x000000} to change bg.
//

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// @tweakable default background color (hex) for the standalone Hokage Palace viewer
const HOKAGE_BG_COLOR = 0x1a2027;
// @tweakable show the small on-screen help overlay
const HOKAGE_WITH_UI = true;
// @tweakable help overlay text shown in the viewer
const HOKAGE_UI_TEXT = 'Hokage Building — center tower with crown + two side towers. Drag to orbit.';

export default function createHokagePalace({
  mount = document.body,
  withUI = HOKAGE_WITH_UI,
  background = HOKAGE_BG_COLOR
} = {}) {
  // --- Size helpers
  const isBody = mount === document.body || mount === document.documentElement;
  function getSize() {
    if (isBody) return { w: window.innerWidth, h: window.innerHeight };
    const r = mount.getBoundingClientRect();
    // Fallback if container has 0 height; give it something sane
    return { w: Math.max(1, r.width || mount.clientWidth || 1),
             h: Math.max(1, r.height || mount.clientHeight || 1) };
  }

  // --- Scene / Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const { w, h } = getSize();
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  // --- Camera / Controls
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 4000);
  camera.position.set(520, 320, 540);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 120, 0);
  controls.enableDamping = true;

  // --- Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x435262, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.25);
  sun.position.set(600, 820, 220);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -1200;
  sun.shadow.camera.right = 1200;
  sun.shadow.camera.top = 800;
  sun.shadow.camera.bottom = -800;
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 2200;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 1.2;
  scene.add(sun);

  // --- Ground (dark plaza)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Palette / materials
  const Palette = {
    wall: 0xe88978, // salmon plaster
    eave: 0xe6d556, // yellow tiles
    trim: 0xeedfd9, // light trim (door frame / parapet)
    slit: 0x24282e, // black/dark windows
    emblem: 0xe5543d, // emblem plate
    roofTop: 0xf6eee8 // off-white top platform/crown
  };
  const M = {
    wall: new THREE.MeshStandardMaterial({ color: Palette.wall, roughness: 0.93, metalness: 0.02 }),
    eave: new THREE.MeshStandardMaterial({
      color: Palette.eave, roughness: 0.9, metalness: 0.02,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    }),
    trim: new THREE.MeshStandardMaterial({ color: Palette.trim, roughness: 0.95 }),
    slit: new THREE.MeshStandardMaterial({ color: Palette.slit, roughness: 0.9 }),
    emblem: new THREE.MeshStandardMaterial({ color: Palette.emblem, roughness: 0.8 }),
    top: new THREE.MeshStandardMaterial({ color: Palette.roofTop, roughness: 0.95 })
  };
  const TILE_SEAM_MAT = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 1, transparent: true, opacity: 0.18
  });

  // --- Helpers
  function cylinder(rTop, rBot, h, mat, seg = 32) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  function box(w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  function ringEave(radius, width, thickness, tilt = 0.0) {
    const g = new THREE.RingGeometry(radius - width, radius, 64, 1);
    const m = new THREE.Mesh(g, M.eave);
    m.rotation.x = -Math.PI / 2 + tilt;
    m.castShadow = m.receiveShadow = true;

    const tiles = new THREE.Group();
    const tileCount = Math.max(24, Math.floor((2 * Math.PI * radius) / 8));
    for (let i = 0; i < tileCount; i++) {
      const a = (i / tileCount) * Math.PI * 2;
      const seg = box(width * 0.92, thickness, 1.2, TILE_SEAM_MAT);
      seg.position.set(
        Math.cos(a) * (radius - width * 0.45),
        thickness / 2,
        Math.sin(a) * (radius - width * 0.45)
      );
      seg.rotation.y = -a;
      tiles.add(seg);
    }
    const grp = new THREE.Group();
    grp.add(m);
    grp.add(tiles);
    return grp;
  }
  function slitWindows(radius, y, count = 18, h = 5, w = 2.4) {
    const g = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const s = box(w, h, 1.4, M.slit);
      s.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      s.lookAt(0, y, 0);
      g.add(s);
    }
    return g;
  }
  function squareWindows(radius, y, count = 8, size = 8) {
    const g = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const frame = box(size + 2, size + 2, 1.6, M.trim);
      const glass = box(size, size, 1.0, M.slit);
      frame.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      frame.lookAt(0, y, 0);
      glass.position.copy(frame.position);
      glass.lookAt(0, y, 0);
      g.add(frame, glass);
    }
    return g;
  }
  function whiteCrown(radius, y) {
    const grp = new THREE.Group();
    const plat = cylinder(radius * 0.98, radius * 0.98, 3, M.top, 48);
    plat.position.y = y;
    grp.add(plat);
    const fence = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.86, 0.6, 10, 64), M.slit);
    fence.position.y = y + 2.0;
    fence.rotation.x = Math.PI / 2;
    grp.add(fence);
    const spikes = 12;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.ConeGeometry(3.2, 26, 12), M.top);
      c.position.set(Math.cos(a) * radius * 0.78, y + 2, Math.sin(a) * radius * 0.78);
      c.lookAt(0, y + 26, 0);
      grp.add(c);
    }
    return grp;
  }
  function emblemDisc(r = 14, y = 0, symbol = true) {
    const grp = new THREE.Group();
    const disc = cylinder(r, r, 2.6, M.emblem, 48);
    disc.position.y = y;
    grp.add(disc);
    if (symbol) {
      // simple "leaf swirl" mark: 2 arcs + dot — stylized
      const mark = new THREE.Mesh(new THREE.TorusGeometry(r * 0.45, 1.1, 8, 32, Math.PI * 1.5), M.slit);
      mark.position.set(0, y + 1.6, r - 0.5);
      mark.rotation.x = Math.PI / 2;
      grp.add(mark);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), M.slit);
      dot.position.set(0, y + 1.7, r - 0.4);
      grp.add(dot);
    }
    return grp;
  }

  // --- Tower Factory
  function makeHokageTower({
    baseRadius = 80,
    tiers = [
      { h: 40, r: 1.0, eave: true, slit: true },
      { h: 36, r: 0.86, eave: true, slit: true },
      { h: 30, r: 0.72, eave: true, slit: false },
      { h: 26, r: 0.58, eave: false, slit: false } // top drum
    ],
    crown = true,
    emblemAtTier = 2,
    squareTopWindows = true
  } = {}) {
    const tower = new THREE.Group();
    let y = 0;
    const eaveWidth = 18;
    const eaveThick = 2.0;

    tiers.forEach((t, i) => {
      const R = baseRadius * t.r;
      const drum = cylinder(R * 0.99, R * 1.01, t.h, M.wall, 48);
      drum.position.y = y + t.h / 2;
      tower.add(drum);

      if (t.slit) {
        const sl = slitWindows(R * 0.96, drum.position.y + t.h * 0.12, Math.round(16 * t.r + 10));
        tower.add(sl);
      }
      if (t.eave) {
        const eave = ringEave(R * 1.12, eaveWidth, eaveThick, 0.02);
        eave.position.y = y + t.h + 1.0;
        tower.add(eave);
      }
      if (i === emblemAtTier) {
        const em = emblemDisc(14, drum.position.y + t.h * 0.28, true);
        em.position.z = baseRadius * 0.72;
        tower.add(em);
      }
      if (squareTopWindows && i === tiers.length - 1) {
        const sw = squareWindows(R * 0.78, drum.position.y + t.h * 0.35, 8, 10);
        tower.add(sw);
        const parapet = cylinder(R * 0.82, R * 0.82, 3, M.top, 48);
        parapet.position.y = y + t.h + 2;
        tower.add(parapet);
      }
      y += t.h + (t.eave ? 4 : 0);
    });

    if (crown) {
      const topR = baseRadius * tiers[tiers.length - 1].r * 0.82;
      const crownGrp = whiteCrown(topR, y + 2);
      tower.add(crownGrp);
    }

    // doorway
    const doorW = 26, doorH = 36;
    const frame = box(doorW + 6, doorH + 6, 2.4, M.trim);
    frame.position.set(0, doorH / 2 + 2, baseRadius * 1.01);
    const door = box(doorW, doorH, 1.4, M.slit);
    door.position.copy(frame.position);
    tower.add(frame, door);

    return tower;
  }

  // --- Build the complex
  const complex = new THREE.Group();
  complex.name = 'HokageComplex';
  scene.add(complex);

  // Center (taller)
  const center = makeHokageTower({
    baseRadius: 90,
    tiers: [
      { h: 46, r: 1.0, eave: true, slit: true },
      { h: 40, r: 0.85, eave: true, slit: true },
      { h: 34, r: 0.70, eave: true, slit: false },
      { h: 30, r: 0.58, eave: false, slit: false }
    ],
    crown: true,
    emblemAtTier: 1
  });
  center.position.set(0, 0, 0);
  complex.add(center);

  // Left & Right (shorter)
  const left = makeHokageTower({
    baseRadius: 70,
    tiers: [
      { h: 36, r: 1.0, eave: true, slit: true },
      { h: 30, r: 0.82, eave: true, slit: true },
      { h: 26, r: 0.66, eave: true, slit: false },
      { h: 22, r: 0.52, eave: false, slit: false }
    ],
    crown: false,
    emblemAtTier: 1
  });
  left.position.set(-150, 0, -10);
  complex.add(left);

  const right = left.clone();
  right.position.set(150, 0, -10);
  complex.add(right);

  // --- Optional UI
  let uiEl = null;
  if (withUI) {
    uiEl = document.createElement('div');
    uiEl.textContent = HOKAGE_UI_TEXT;
    uiEl.style.position = 'absolute';
    uiEl.style.left = '12px';
    uiEl.style.top = '12px';
    uiEl.style.padding = '8px 10px';
    uiEl.style.color = '#eaeaea';
    uiEl.style.background = 'rgba(0,0,0,.55)';
    uiEl.style.border = '1px solid #333';
    uiEl.style.borderRadius = '10px';
    uiEl.style.font = '12px system-ui,-apple-system,Segoe UI,Roboto';
    uiEl.style.backdropFilter = 'blur(4px)';
    // place UI relative to mount
    (isBody ? document.body : mount).appendChild(uiEl);
  }

  // --- Resize handling
  let resizeObs = null;
  function handleResize() {
    const { w: W, h: H } = getSize();
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  if (isBody) {
    window.addEventListener('resize', handleResize);
  } else if ('ResizeObserver' in window) {
    resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(mount);
  } else {
    window.addEventListener('resize', handleResize);
  }

  // --- Render loop
  let rafId = 0;
  let running = true;
  (function loop() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  })();

  // --- Dispose helper
  function dispose() {
    running = false;
    cancelAnimationFrame(rafId);
    if (isBody) {
      window.removeEventListener('resize', handleResize);
    } else if (resizeObs) {
      resizeObs.disconnect();
      resizeObs = null;
    } else {
      window.removeEventListener('resize', handleResize);
    }
    if (uiEl && uiEl.parentNode) uiEl.parentNode.removeChild(uiEl);
    if (renderer.domElement && renderer.domElement.parentNode === mount) {
      mount.removeChild(renderer.domElement);
    }
    scene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
          else obj.material.dispose?.();
        }
      }
    });
    renderer.dispose();
  }

  // Expose a tiny API for further tweaking if you want
  return { scene, camera, renderer, controls, complex, dispose };
}
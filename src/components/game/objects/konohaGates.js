// konohaGates.js
// ─────────────────────────────────────────────────────────────────────────────
// USAGE (drop this in your HTML as a <script type="module">):
//
// <!-- (Recommended) Add an import map somewhere in your <head> -->
// <script type="importmap">
// {
//   "imports": {
//     "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
//     "three/examples/jsm/controls/OrbitControls.js":
//       "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
//   }
// }
// </script>
//
// <!-- Then import and mount -->
// <script type="module">
//   import createKonohaGates from './konohaGates.js';
//
//   // Mount into <body>. You can also pass a specific container element.
//   const api = createKonohaGates(document.body, {
//     ui: true,             // show on-screen help overlay
//     keyboard: true,       // enable O/C/T keybindings
//     ground: true,         // draw ground plane
//     town: true,           // draw simple background town
//     background: 0xbfe6ff, // scene background color (number or null for transparent)
//     pixelRatioMax: 2      // clamp devicePixelRatio
//   });
//
//   // Programmatic control:
//   // api.openGates(); api.closeGates(); api.toggleGates(); api.setGateOpenFraction(0..1);
//   // Cleanup when you remove it:
//   // api.dispose();
// </script>
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Create the Konoha Gates scene and return a small control API.
 * @param {HTMLElement} container - The element to attach the WebGL canvas to (default document.body)
 * @param {Object} opts - Options
 * @returns {{
 *   openGates: ()=>void,
 *   closeGates: ()=>void,
 *   toggleGates: ()=>void,
 *   setGateOpenFraction: (f:number)=>void,
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   dispose: ()=>void
 * }}
 */
export function createKonohaGates(container = document.body, opts = {}) {
  // Options with sane defaults
  const {
    ui = true,
    keyboard = true,
    ground = true,
    town = true,
    background = 0xbfe6ff,
    pixelRatioMax = 2
  } = opts;

  // Renderer / scene / camera
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background == null });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelRatioMax));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (background != null) scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(16, 10, 26);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 6, 0);
  controls.enableDamping = true;

  // Lights
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(20, 30, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.35));

  // Ground
  let groundMesh = null;
  if (ground) {
    groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshLambertMaterial({ color: 0xd9c39b })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
  }

  // ===== Texture helpers (depend on renderer for anisotropy) =====
  function makePlankTexture({ w = 512, h = 1024, base = '#86a688', groove = '#2c3a2f', mark = 'あ' }) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // Planks
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const plankW = w / 10; ctx.strokeStyle = groove; ctx.lineWidth = 3;
    for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(i * plankW, 0); ctx.lineTo(i * plankW, h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 6; i++) { const y = (i + 1) * (h / 7); ctx.fillRect(0, y - 3, w, 6); }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, w - 12, h - 12);

    // Painted hiragana
    ctx.save();
    ctx.translate(w * 0.52, h * 0.60);
    ctx.rotate(mark === 'あ' ? -0.08 : 0.08);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fontSize = Math.floor(h * 0.72);
    ctx.font = `900 ${fontSize}px 'Yu Mincho','Hiragino Mincho Pro','Noto Serif JP','MS Mincho',serif`;
    ctx.lineWidth = Math.max(14, Math.floor(fontSize * 0.06));
    ctx.strokeStyle = '#7a1b16'; ctx.fillStyle = '#7a1b16';
    ctx.strokeText(mark, 0, 0);
    ctx.fillText(mark, 0, 0);
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1;
    return tex;
  }

  function makeLeafSignTexture(w = 1024, h = 256) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // Panel frame
    ctx.fillStyle = '#efe9df'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 10; ctx.strokeRect(8, 8, w - 16, h - 16);

    // 忍 … [crest] … 忍
    ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = "bold 140px 'Yu Mincho','Hiragino Mincho Pro','Noto Serif JP','MS Mincho',serif";
    ctx.fillText('忍', w * 0.12, h * 0.55);
    ctx.fillText('忍', w * 0.88, h * 0.55);

    // Crest (spiral + tail + wedge)
    const cx = w * 0.5, cy = h * 0.53;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.05);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2b2b2b'; ctx.fillStyle = '#2b2b2b'; ctx.lineWidth = 10;

    const R = 62, k = 26 / Math.PI, turns = 1.45 * Math.PI;
    ctx.beginPath();
    for (let t = 0; t <= turns; t += 0.02) {
      const r = R - k * t;
      const x = r * Math.cos(t), y = r * Math.sin(t);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    const tEnd = turns, rEnd = R - k * tEnd;
    const xEnd = rEnd * Math.cos(tEnd), yEnd = rEnd * Math.sin(tEnd);
    ctx.quadraticCurveTo(xEnd + 48, yEnd - 10, xEnd + 112, yEnd - 18);
    ctx.stroke();

    const ang = 2.1, tipLen = 22, baseW = 22;
    const bx = R * Math.cos(ang), by = R * Math.sin(ang);
    const tx = (R + tipLen) * Math.cos(ang), ty = (R + tipLen) * Math.sin(ang);
    const px = Math.cos(ang + Math.PI / 2) * (baseW / 2);
    const py = Math.sin(ang + Math.PI / 2) * (baseW / 2);
    ctx.beginPath();
    ctx.moveTo(bx + px, by + py); ctx.lineTo(tx, ty); ctx.lineTo(bx - px, by - py);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1;
    return tex;
  }

  // ===== Gate dimensions =====
  const openingWidth = 12;
  const towerThickness = 4;
  const towerDepth = 8;
  const doorHeight = 8.8;
  const doorThickness = 0.3;
  const doorWidth = openingWidth / 2;

  const gate = new THREE.Group();
  scene.add(gate);

  // Towers
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb69a7a, roughness: 0.9 });
  const towerGeo = new THREE.BoxGeometry(towerThickness, 10, towerDepth);
  const leftTower = new THREE.Mesh(towerGeo, stoneMat);
  const rightTower = new THREE.Mesh(towerGeo, stoneMat);
  leftTower.position.set(-(openingWidth / 2 + towerThickness / 2), 5, 0);
  rightTower.position.set(+(openingWidth / 2 + towerThickness / 2), 5, 0);
  leftTower.castShadow = rightTower.castShadow = true;
  gate.add(leftTower, rightTower);

  // Lintel
  const lintelWidth = openingWidth + towerThickness * 2 + 0.2;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelWidth, 2.2, towerDepth + 0.2), stoneMat);
  lintel.position.set(0, 10.6, 0);
  gate.add(lintel);

  // Signboard
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 2.6),
    new THREE.MeshBasicMaterial({ map: makeLeafSignTexture(), transparent: false })
  );
  sign.position.set(0, 11.4, towerDepth / 2 + 0.11);
  gate.add(sign);

  // Roofs
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xd88f38, roughness: 0.95 });
  function addRoof(y, w, d, t, tilt) {
    const slabL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, t, d), roofMat);
    const slabR = slabL.clone();
    slabL.position.set(-w * 0.22, y, 0); slabR.position.set(w * 0.22, y, 0);
    slabL.rotation.z = tilt; slabR.rotation.z = -tilt;
    slabL.castShadow = slabR.castShadow = true;
    gate.add(slabL, slabR);
  }
  const roofSpan = openingWidth + towerThickness * 2 + 10;
  addRoof(13.0, roofSpan, 12, 0.6, 0.22);
  addRoof(15.0, roofSpan - 6, 10, 0.6, 0.20);

  // ===== Doors (hinges at inner faces) =====
  const hingeZ = towerDepth / 2 + doorThickness / 2 + 0.02; // avoid clipping when > 90°
  const doorGroupL = new THREE.Group();
  const doorGroupR = new THREE.Group();
  doorGroupL.position.set(-openingWidth / 2, doorHeight / 2 + 0.5, hingeZ);
  doorGroupR.position.set(openingWidth / 2, doorHeight / 2 + 0.5, hingeZ);

  const doorMeshL = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
    new THREE.MeshStandardMaterial({ map: makePlankTexture({ mark: 'あ' }), roughness: 0.95 })
  );
  const doorMeshR = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
    new THREE.MeshStandardMaterial({ map: makePlankTexture({ mark: 'ん' }), roughness: 0.95 })
  );
  doorMeshL.position.set(doorWidth / 2, 0, 0);
  doorMeshR.position.set(-doorWidth / 2, 0, 0);
  doorGroupL.add(doorMeshL); doorGroupR.add(doorMeshR);
  gate.add(doorGroupL, doorGroupR);

  // Background town (simple)
  let townGroup = null;
  if (town) {
    townGroup = new THREE.Group();
    const houseMat = new THREE.MeshLambertMaterial({ color: 0xd7c6a8 });
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 2, 2 + Math.random() * 2, 2), houseMat);
      b.position.set(-10 + i * 3, 1.1, -18 - Math.random() * 6);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, 4), new THREE.MeshLambertMaterial({ color: 0xa45a22 }));
      roof.position.set(b.position.x, b.position.y + (b.geometry.parameters.height / 2) + 1.0, b.position.z);
      roof.castShadow = true; townGroup.add(b, roof);
    }
    scene.add(townGroup);
  }

  // ===== Door rig / controls =====
  const DOOR_OPEN_ANGLE = THREE.MathUtils.degToRad(115);
  let doorTarget = { L: -DOOR_OPEN_ANGLE, R: DOOR_OPEN_ANGLE }; // start fully open

  function setGateOpenFraction(f) {
    f = THREE.MathUtils.clamp(f, 0, 1);
    doorTarget.L = THREE.MathUtils.lerp(0, -DOOR_OPEN_ANGLE, f);
    doorTarget.R = THREE.MathUtils.lerp(0, DOOR_OPEN_ANGLE, f);
  }
  function openGates() { setGateOpenFraction(1); }
  function closeGates() { setGateOpenFraction(0); }
  function toggleGates() {
    const isClosed = Math.abs(doorTarget.L) < 0.01 && Math.abs(doorTarget.R) < 0.01;
    setGateOpenFraction(isClosed ? 1 : 0);
  }

  // Initialize pose (fully open)
  doorGroupL.rotation.y = doorTarget.L;
  doorGroupR.rotation.y = doorTarget.R;

  // Optional UI overlay
  let uiDiv = null;
  if (ui) {
    uiDiv = document.createElement('div');
    uiDiv.textContent = 'Drag to look • O=open C=close T=toggle • or call openGates()/closeGates()';
    Object.assign(uiDiv.style, {
      position: 'absolute', left: '12px', top: '12px', padding: '8px 10px',
      color: '#eaeaea', background: 'rgba(0,0,0,.55)', border: '1px solid #333',
      borderRadius: '10px', font: '12px system-ui,-apple-system,Segoe UI,Roboto',
      backdropFilter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none'
    });
    // Ensure the container is position:relative so the overlay sits on top
    const prevPos = getComputedStyle(container).position;
    if (prevPos === 'static') container.style.position = 'relative';
    container.appendChild(uiDiv);
  }

  // Keyboard bindings
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'o') openGates();
    if (k === 'c') closeGates();
    if (k === 't') toggleGates();
  }
  if (keyboard) addEventListener('keydown', onKeyDown);

  // Resize handling (container-aware)
  function resize() {
    const w = container.clientWidth || innerWidth;
    const h = container.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = Math.max(0.0001, w / Math.max(1, h));
    camera.updateProjectionMatrix();
    if (ui && uiDiv) { uiDiv.style.left = '12px'; uiDiv.style.top = '12px'; }
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  addEventListener('resize', resize);

  // Animate
  let raf = 0;
  const clock = new THREE.Clock();
  (function animate() {
    const dt = clock.getDelta();
    controls.update();
    doorGroupL.rotation.y = THREE.MathUtils.damp(doorGroupL.rotation.y, doorTarget.L, 6, dt);
    doorGroupR.rotation.y = THREE.MathUtils.damp(doorGroupR.rotation.y, doorTarget.R, 6, dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  })();

  function dispose() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    removeEventListener('resize', resize);
    if (keyboard) removeEventListener('keydown', onKeyDown);
    controls.dispose();
    scene.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.map?.dispose?.(), m => m.dispose?.());
        else obj.material?.map?.dispose?.(), obj.material?.dispose?.();
      }
    });
    renderer.dispose();
    renderer.domElement?.remove?.();
    if (ui && uiDiv) uiDiv.remove();
  }

  // Expose API
  const api = {
    openGates, closeGates, toggleGates, setGateOpenFraction,
    scene, camera, renderer, dispose
  };
  // Also attach for quick console poking if only one instance is used
  // (harmless if overwritten by multiple calls)
  Object.assign(window, api);

  return api;
}

export default createKonohaGates;

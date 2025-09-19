// konohaAcademy.js — Dual ground rotundas, clean roofs, NO ground elements.

// <script type="module">
//   import init from './konohaAcademy.js';
//   init(); // attaches to document.body
// </script>

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

export default function init(container = document.body) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9c8ff);

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // robust on big flats
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // --- Camera & Controls ---
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 5000);
  camera.position.set(520, 300, 520);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(220, 70, 10);
  controls.enableDamping = true;

  // --- Lights ---
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(600, 700, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -800;  sun.shadow.camera.right = 800;
  sun.shadow.camera.top  =  600;  sun.shadow.camera.bottom = -600;
  sun.shadow.camera.near =   50;  sun.shadow.camera.far    = 1400;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 1.2;
  scene.add(sun);

  // --- Materials ---
  const M = {
    plaster : new THREE.MeshStandardMaterial({ color:0xf2efe9, roughness:.92, metalness:.02 }),
    red     : new THREE.MeshStandardMaterial({ color:0xc8452d, roughness:.82, metalness:.04 }),
    eave    : new THREE.MeshStandardMaterial({
      color:0xd7a14d, roughness:.72, metalness:.06,
      polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1
    }),
    stone   : new THREE.MeshStandardMaterial({ color:0xa6adb7, roughness:.95, metalness:.02 }),
    dark    : new THREE.MeshStandardMaterial({ color:0x2f3338, roughness:.9 }),
    roofWalk: new THREE.MeshStandardMaterial({
      color:0x8f949b, roughness:.95, metalness:.02,
      polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-2
    })
  };

  // --- Helpers ---
  function addEaveRims(group, box, inset=6, levels=3, rise=5, lift=0.1){
    const bb = new THREE.Box3().setFromObject(box);
    const size = bb.getSize(new THREE.Vector3());
    const center = bb.getCenter(new THREE.Vector3());
    for (let i=0;i<levels;i++){
      const shrink = inset + i*6;
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(size.x - shrink, 2, size.z - shrink),
        M.eave
      );
      rim.position.set(center.x, bb.max.y - 1 - i*rise + lift, center.z);
      rim.castShadow = true;
      rim.receiveShadow = false; // no self-shadow banding
      group.add(rim);
    }
  }
  function addRedBelts(group, box, yOffsets=[-12,5,22], thick=4){
    const b = new THREE.Box3().setFromObject(box);
    const size = b.getSize(new THREE.Vector3());
    const center = b.getCenter(new THREE.Vector3());
    yOffsets.forEach(off=>{
      const belt = new THREE.Mesh(new THREE.BoxGeometry(size.x+2, thick, size.z+2), M.red);
      belt.position.set(center.x, center.y - size.y/2 + thick/2 + (off+12), center.z);
      belt.castShadow = belt.receiveShadow = true;
      group.add(belt);
    });
  }
  function addWindowRow(group, from, to, y, z, step=20){
    for(let x=from; x<=to; x+=step){
      const w = new THREE.Mesh(new THREE.BoxGeometry(4,3,1), M.dark);
      w.position.set(x, y, z);
      w.castShadow=true; group.add(w);
    }
  }
  function roofYJustAboveEave(mesh, lift=0.1, clearance=0.15){
    const bb = new THREE.Box3().setFromObject(mesh);
    const eaveTopY = bb.max.y - 1 + lift; // top of first rim
    return eaveTopY + clearance;
  }

  // --- Rotunda builder ---
  function buildRotunda(radius=90, baseY=0){
    const rot = new THREE.Group();
    let y = baseY, R = radius;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R*1.04, R*1.06, 16, 72), M.stone);
    base.position.y = y + 8; base.castShadow=base.receiveShadow=true; rot.add(base); y+=16;

    const tiers = [
      {h:18, col:M.plaster},{h:4,col:M.red},
      {h:18, col:M.plaster},{h:4,col:M.red},
      {h:16, col:M.plaster},{h:4,col:M.red},
      {h:15, col:M.plaster},{h:4,col:M.red},
      {h:14, col:M.plaster}
    ];
    for(const t of tiers){
      const g = new THREE.CylinderGeometry(R*0.99, R*1.00, t.h, 72, 1, false);
      const m = new THREE.Mesh(g, t.col);
      m.position.y = y + t.h/2; m.castShadow=m.receiveShadow=true; rot.add(m);
      y += t.h; if(t.col===M.plaster) R *= 0.985;
    }
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(R*0.96, R*1.02, 4, 72), M.stone);
    deck.position.y = y+2; deck.castShadow=deck.receiveShadow=true; rot.add(deck); y+=4;
    const e1 = new THREE.Mesh(new THREE.CylinderGeometry(R*0.95, R*1.05, 3.2, 72), M.eave);
    e1.position.y = y+1.6; e1.castShadow=e1.receiveShadow=true; rot.add(e1); y+=3.2;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(R*0.64, 9, 72), M.eave);
    cap.position.y = y+4.5; cap.castShadow=cap.receiveShadow=true; rot.add(cap); y+=9;
    const look = new THREE.Mesh(new THREE.CylinderGeometry(R*0.48, R*0.5, 6, 72), M.stone);
    look.position.y = y+3; look.castShadow=look.receiveShadow=true; rot.add(look);
    return rot;
  }

  // --- Left rotunda (ground) ---
  const rotundaLeft = buildRotunda(90, 0);
  rotundaLeft.position.set(-60, 0, -120);
  scene.add(rotundaLeft);

  // --- Main L-wing (mirrored) ---
  const wing = new THREE.Group();

  const A = new THREE.Mesh(new THREE.BoxGeometry(640, 140, 140), M.plaster);
  A.position.set(260, 70, -20);
  A.castShadow=A.receiveShadow=true; wing.add(A);

  const B = new THREE.Mesh(new THREE.BoxGeometry(240, 140, 180), M.plaster);
  B.position.set(560, 70, 140);
  B.castShadow=B.receiveShadow=true; wing.add(B);

  addRedBelts(wing, A); addRedBelts(wing, B);
  addEaveRims(wing, A, 8, 3, 5, 0.1);
  addEaveRims(wing, B, 8, 3, 5, 0.1);

  // Grey roof sits directly on top of brown eaves (both blocks)
  const roofA_Y = roofYJustAboveEave(A);
  const roofB_Y = roofYJustAboveEave(B);
  const innerY  = Math.min(roofA_Y, roofB_Y);

  const roofA = new THREE.Mesh(new THREE.BoxGeometry(640-30, 3, 140-30), M.roofWalk);
  roofA.position.set(260, roofA_Y, -20); roofA.castShadow=roofA.receiveShadow=true; wing.add(roofA);

  const roofB = new THREE.Mesh(new THREE.BoxGeometry(240-30, 3, 180-30), M.roofWalk);
  roofB.position.set(560, roofB_Y, 140); roofB.castShadow=roofB.receiveShadow=true; wing.add(roofB);

  const inner = new THREE.Mesh(new THREE.BoxGeometry(200-20, 3, 200-20), M.roofWalk);
  inner.position.set(460, innerY, 50); inner.castShadow=inner.receiveShadow=true; wing.add(inner);

  // Windows
  addWindowRow(wing, -40, 560, 92, 50);
  addWindowRow(wing, -40, 560, 112, 50);
  addWindowRow(wing, 460, 680, 92, 226);
  addWindowRow(wing, 460, 680, 112, 226);

  // Small rooftop pavilion
  {
    const pav = new THREE.Group();
    const pBase = new THREE.Mesh(new THREE.CylinderGeometry(20,20,5,48), M.stone);
    pBase.position.set(640, 145, 220); pBase.castShadow=pBase.receiveShadow=true; pav.add(pBase);
    const pEave = new THREE.Mesh(new THREE.CylinderGeometry(22,26,4,48), M.eave);
    pEave.position.set(640, 152, 220); pEave.castShadow=pEave.receiveShadow=true; pav.add(pEave);
    const pCap  = new THREE.Mesh(new THREE.ConeGeometry(18, 10, 48), M.eave);
    pCap.position.set(640, 163, 220); pCap.castShadow=pCap.receiveShadow=true; pav.add(pCap);
    wing.add(pav);
  }
  scene.add(wing);

  // --- Right rotunda (same width, ~12% taller, ground) ---
  const rotundaRight = buildRotunda(90, 0);
  rotundaRight.scale.y = 1.12;
  rotundaRight.position.set(780, 0, 140);
  scene.add(rotundaRight);

  // --- Loop / Resize ---
  function onResize(){
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener("resize", onResize);

  (function loop(){
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  // optional handle for external control
  return { scene, renderer, camera, controls, dispose: () => {
    removeEventListener("resize", onResize);
    renderer.dispose();
    renderer.domElement.remove();
  }};
}

// konohaChuuninArena.js — Stylized Konoha Exam Arena (trimmed version)
// Usage:
//   import konohaChuuninArena from './konohaChuuninArena.js';
//   konohaChuuninArena(); // mounts to document.body
//
// Options (partial override):
//   konohaChuuninArena(container, {
//     belt:{ rOuter:238, height:76 }, innerWall:{ r:188, h:90 },
//     colors:{ ground:0x9bc18f }
//   });

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

export default function konohaChuuninArena(container = document.body, opts = {}) {
  /* ---------- config (mergeable) ---------- */
  const CFG = {
    belt:   { rOuter: 238, height: 76, seg: 220, color: 0x7c4a2a, innerGap: 38 },
    innerWall: { r: 188, h: 90, color: 0xF1F1F1 },
    stripes: { color: 0xffffff, topY: 70, midY: 32, h: 3.6 },
    windows: { count: 22, w: 21, h: 11, z: 3.2, y: 13, embed: 1.6, skipArcStart: 0.15, skipArcEnd: 0.50 },
    ribs: { count: 12, w: 8, t: 12, leanDeg: 8, baseH: 10, tieH: 6 },
    colors: { roof:0xdc9330, timber:0x7e4b2b, ground:0x9bc18f }
  };
  deepMerge(CFG, opts);

  /* ---------- scene / renderer ---------- */
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 8000);
  camera.position.set(520, 360, 520);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI*0.495;
  controls.minDistance = 200;
  controls.maxDistance = 2200;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-700, 900, 520);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-1600,right:1600,top:1600,bottom:-1600,far:4000});
  scene.add(sun);

  // ground pad
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(1600,1600,2,180),
    new THREE.MeshStandardMaterial({ color: CFG.colors.ground, roughness:0.95 })
  );
  ground.position.y = -8;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- materials ---------- */
  const matBelt   = new THREE.MeshStandardMaterial({ color: CFG.belt.color, roughness:0.7, metalness:0.04, side:THREE.DoubleSide });
  const matStripe = new THREE.MeshStandardMaterial({ color: CFG.stripes.color, roughness:0.4, metalness:0.05, side:THREE.DoubleSide });
  const matGlass  = new THREE.MeshStandardMaterial({ color: 0x79c7ff, roughness:0.25, metalness:0.25, envMapIntensity:0.6, side:THREE.DoubleSide });
  const matStone  = new THREE.MeshStandardMaterial({ color: CFG.innerWall.color, roughness:0.92, side:THREE.DoubleSide });
  const matDark   = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness:0.85, side:THREE.DoubleSide });
  const matRoof   = new THREE.MeshStandardMaterial({ color: CFG.colors.roof, roughness:0.55, metalness:0.08 });
  const matTimber = new THREE.MeshStandardMaterial({ color: CFG.colors.timber, roughness:0.85, side:THREE.DoubleSide });

  /* ---------- helpers ---------- */
  const box = (w,h,d,mat)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.castShadow=m.receiveShadow=true; return m; };
  const cylinderOpen = (r,h,mat,seg=48)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg,1,true),mat); m.castShadow=m.receiveShadow=true; return m; };
  const cylinderCap = (r,h,mat,seg=48)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat); m.castShadow=m.receiveShadow=true; return m; };

  /* ---------- arena floor ---------- */
  {
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(CFG.innerWall.r-6, CFG.innerWall.r-6, 2, 120),
                                 new THREE.MeshStandardMaterial({ color:0x2f7a34, roughness:0.95 }));
    inner.receiveShadow = true; scene.add(inner);

    const center = new THREE.Mesh(new THREE.CylinderGeometry(52,52,2.2,60),
                                  new THREE.MeshStandardMaterial({ color:0x285e2e, roughness:0.95 }));
    center.position.y = 1.1; center.receiveShadow = true; scene.add(center);
  }

  /* ---------- inner wall (touches ground) ---------- */
  {
    const { r, h } = CFG.innerWall;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 192, 1, true), matStone);
    wall.position.y = h/2;
    wall.castShadow = wall.receiveShadow = true;
    scene.add(wall);
  }

  /* ---------- outer belt ---------- */
  (function buildBelt(){
    const H = CFG.belt.height, R = CFG.belt.rOuter, gap = CFG.belt.innerGap;

    const prof = [];
    const add = (y, r)=>prof.push(new THREE.Vector2(r, y));
    add(0,     R-10);
    add(6,     R-2);
    add(H*0.28, R);
    add(H*0.42, R-4);
    add(H*0.55, R-10);
    add(H*0.70, R-2);
    add(H,      R-12);

    const outerShell = new THREE.Mesh(new THREE.LatheGeometry(prof, CFG.belt.seg), matBelt);
    outerShell.position.y = H/2; outerShell.castShadow = outerShell.receiveShadow = true; scene.add(outerShell);

    const profIn = prof.map(v => new THREE.Vector2(v.x - gap, v.y));
    const innerShell = new THREE.Mesh(new THREE.LatheGeometry(profIn, CFG.belt.seg), matBelt);
    innerShell.position.y = H/2; innerShell.castShadow = innerShell.receiveShadow = true; scene.add(innerShell);

    const topOuter = R-12, topInner = topOuter - gap;
    const botOuter = R-10, botInner = botOuter - gap;
    const top = new THREE.Mesh(new THREE.RingGeometry(topInner, topOuter, 220, 1), matBelt);
    top.rotation.x = -Math.PI/2; top.position.y = H; scene.add(top);
    const bottom = new THREE.Mesh(new THREE.RingGeometry(botInner, botOuter, 220, 1), matBelt);
    bottom.rotation.x = -Math.PI/2; bottom.position.y = 0; scene.add(bottom);

    // white stripes
    const ring = ()=> new THREE.Mesh(
      new THREE.CylinderGeometry(R+1.5, R+1.5, CFG.stripes.h, 180, 1, true),
      matStripe
    );
    const stripeTop = ring(), stripeMid = ring();
    stripeTop.position.y = CFG.stripes.topY; stripeMid.position.y = CFG.stripes.midY;
    stripeTop.receiveShadow = stripeMid.receiveShadow = true;
    scene.add(stripeTop, stripeMid);

    // base windows
    const g = new THREE.BoxGeometry(CFG.windows.w, CFG.windows.h, CFG.windows.z);
    const wins = new THREE.InstancedMesh(g, matGlass, CFG.windows.count);
    wins.castShadow = wins.receiveShadow = true;
    let c = 0;
    for(let i=0;i<CFG.windows.count;i++){
      const a = (i/CFG.windows.count)*Math.PI*2;
      if (a > Math.PI*CFG.windows.skipArcStart && a < Math.PI*CFG.windows.skipArcEnd) continue; // skip gate sector
      const r = R + 1.8 - CFG.windows.embed;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), a);
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(Math.cos(a)*r, CFG.windows.y, Math.sin(a)*r),
        q,
        new THREE.Vector3(1,1,1)
      );
      wins.setMatrixAt(c++, m);
    }
    wins.count = c;
    scene.add(wins);

    // ribs and bases/ties
    const lean = CFG.ribs.leanDeg * Math.PI/180;
    const ribGeo  = new THREE.BoxGeometry(CFG.ribs.w, H+8, CFG.ribs.t);
    const baseGeo = new THREE.BoxGeometry(CFG.ribs.w*1.6, CFG.ribs.baseH, CFG.ribs.t*1.6);
    const tieGeo  = new THREE.BoxGeometry(CFG.ribs.w*1.3, CFG.ribs.tieH, CFG.ribs.t*1.3);
    const ribs  = new THREE.InstancedMesh(ribGeo,  matBelt, CFG.ribs.count);
    const bases = new THREE.InstancedMesh(baseGeo, matBelt, CFG.ribs.count);
    const ties  = new THREE.InstancedMesh(tieGeo,  matBelt, CFG.ribs.count);
    ribs.castShadow = bases.castShadow = ties.castShadow = true;
    ribs.receiveShadow = bases.receiveShadow = ties.receiveShadow = true;

    for(let i=0;i<CFG.ribs.count;i++){
      const a = (i/CFG.ribs.count)*Math.PI*2;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0))
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), lean));
      const pos = new THREE.Vector3(Math.cos(a)*(R- CFG.ribs.t*0.25), H/2, Math.sin(a)*(R- CFG.ribs.t*0.25));
      ribs.setMatrixAt(i, new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1,1,1)));

      const basePos = new THREE.Vector3(Math.cos(a)*(R- CFG.ribs.t*0.25), CFG.ribs.baseH/2, Math.sin(a)*(R- CFG.ribs.t*0.25));
      bases.setMatrixAt(i, new THREE.Matrix4().compose(basePos, new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a,0)), new THREE.Vector3(1,1,1)));

      const tiePos = new THREE.Vector3(Math.cos(a)*(R- CFG.ribs.t*0.25), H - CFG.ribs.tieH/2, Math.sin(a)*(R- CFG.ribs.t*0.25));
      ties.setMatrixAt(i, new THREE.Matrix4().compose(tiePos, new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a,0)), new THREE.Vector3(1,1,1)));
    }
    scene.add(ribs, bases, ties);

    // little front door panel
    const door = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 3), matDark);
    const da = Math.PI*1.18;
    door.position.set(Math.cos(da)*(R+1.8), 8, Math.sin(da)*(R+1.8));
    door.rotation.y = -da;
    door.castShadow = door.receiveShadow = true;
    scene.add(door);
  })();

  /* ---------- attached buildings (trimmed) ---------- */
  (function buildComplex(){
    const baseY = CFG.belt.height + 0.5;

    // wings (both sides)
    scene.add(buildWing({ pos:[CFG.innerWall.r+120, baseY+24, -84], yaw:  Math.PI*0.08 }));
    scene.add(buildWing({ pos:[CFG.innerWall.r+120, baseY+24,  +84], yaw: -Math.PI*0.08 }));

    // center block + two hip roofs
    const body = new THREE.Mesh(new THREE.BoxGeometry(110, 70, 80), matStone);
    body.position.set(CFG.innerWall.r+110, baseY+35, 0);
    body.castShadow = body.receiveShadow = true; scene.add(body);

    const r1 = hipRoofSolid(130, 16, 100, 4, 8);
    r1.position.set(body.position.x, body.position.y+43, body.position.z);
    const r2 = hipRoofSolid(90, 14, 60, 4, 8);
    r2.position.set(body.position.x, r1.position.y+18, body.position.z);
    scene.add(r1, r2);

    // domed annex (right)
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(26,26,46,32), matStone);
    drum.position.set(CFG.innerWall.r+70, baseY+23, 56);
    drum.castShadow = drum.receiveShadow = true; scene.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(28,32,20,0,Math.PI*2,0,Math.PI/2), matRoof);
    dome.position.copy(drum.position); dome.position.y += 23;
    dome.castShadow = dome.receiveShadow = true; scene.add(dome);

    // small gatehouse
    const gh = new THREE.Group();
    const ghBody = new THREE.Mesh(new THREE.BoxGeometry(36, 28, 32), matStone);
    ghBody.castShadow = ghBody.receiveShadow = true; gh.add(ghBody);
    const ghRoof = gableRoofSolid(50, 12, 40, 3, 6, 'z'); ghRoof.position.y = 28; gh.add(ghRoof);
    const R = CFG.belt.rOuter;
    gh.position.set(Math.cos(0.36)*(R+34), 14, Math.sin(0.36)*(R+34));
    gh.lookAt(0, gh.position.y, 0);
    scene.add(gh);
  })();

  /* ---------- roof helpers ---------- */
  function hipRoofSolid(w, h, d, thickness=4, overhang=6){
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w+overhang*2, thickness, d+overhang*2), matTimber);
    slab.position.y = thickness/2; slab.castShadow = slab.receiveShadow = true; g.add(slab);
    const pyr = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)/1.42 + overhang*1.1, h, 4), matRoof);
    pyr.rotation.y = Math.PI/4; pyr.position.y = thickness + h/2 + 0.01;
    pyr.castShadow = pyr.receiveShadow = true; g.add(pyr);
    return g;
  }
  function gableRoofSolid(w, h, d, thickness=4, overhang=8, axis='z'){
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + overhang*2, thickness, d + overhang*2), matTimber);
    slab.position.y = thickness/2; slab.castShadow = slab.receiveShadow = true; g.add(slab);
    const span = (axis==='z' ? d : w)/2 + overhang;
    const tri = new THREE.Shape(); tri.moveTo(-span,0); tri.lineTo(span,0); tri.lineTo(0,h); tri.closePath();
    const depth = (axis==='z'? w : d) + overhang*2;
    const extrude = new THREE.ExtrudeGeometry(tri, { depth, bevelEnabled:false }); extrude.center();
    const roof = new THREE.Mesh(extrude, matRoof);
    if(axis==='z'){ roof.rotation.x = Math.PI/2; } else { roof.rotation.z = -Math.PI/2; }
    roof.position.y = thickness + 0.01; roof.castShadow = roof.receiveShadow = true; g.add(roof);
    return g;
  }

  /* ---------- wing builder ---------- */
  function buildWing({ pos, yaw = 0, groundY = 0 }) {
    const baseW = 140, baseD = 60, baseH = 50;
    const windows = 9, roofH = 14;
    const wing = new THREE.Group();

    const oldTopY = pos[1] + baseH / 2;
    const newH = Math.max(baseH, oldTopY - groundY);
    const newPosY = (oldTopY + groundY) / 2;

    const body = new THREE.Mesh(new THREE.BoxGeometry(baseW, newH, baseD), matStone);
    body.castShadow = body.receiveShadow = true; wing.add(body);

    const outwardSign = pos[2] >= 0 ? +1 : -1;
    const slit = new THREE.BoxGeometry(6, 18, 2.6);
    const inst = new THREE.InstancedMesh(slit, matDark, windows);
    const yWin = Math.max(6, newH * 0.05);
    for (let i = 0; i < windows; i++) {
      const t = (i + 0.5) / windows - 0.5;
      const x = t * (baseW * 0.82);
      const z = outwardSign * (baseD / 2 + 1.3);
      const m = new THREE.Matrix4().makeTranslation(x, yWin - newH/2, z);
      inst.setMatrixAt(i, m);
    }
    inst.castShadow = inst.receiveShadow = true;
    wing.add(inst);

    const roof = hipRoofSolid(baseW * 1.08, roofH, baseD * 1.08, 4, 6);
    roof.position.y = newH / 2 + 2;
    wing.add(roof);

    wing.position.set(pos[0], newPosY, pos[2]);
    wing.rotation.y = yaw;
    return wing;
  }

  /* ---------- loop / resize ---------- */
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

  // expose handles
  return { scene, renderer, camera, controls, dispose(){
    removeEventListener("resize", onResize);
    renderer.dispose();
    renderer.domElement.remove();
  }};
}

/* ---------- tiny merge helper ---------- */
function deepMerge(t, s){
  if(!s) return t;
  for(const k of Object.keys(s)){
    if(s[k] && typeof s[k]==="object" && !Array.isArray(s[k])){
      if(!t[k]) t[k] = {};
      deepMerge(t[k], s[k]);
    }else{
      t[k] = s[k];
    }
  }
  return t;
}

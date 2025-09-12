import * as THREE from "three";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";
import { buildWalls, addFrames, addBanners, addPipes, addDoor } from "./builders.js";
import { makeCarpet, makeBanner } from "./textures.js";

export function initScene(mountEl, onLockedChange){
  // renderer
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, logarithmicDepthBuffer:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
  renderer.shadowMap.enabled = true;
  mountEl.appendChild(renderer.domElement);

  // scene / camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1e9d2);
  const camera = new THREE.PerspectiveCamera(70, mountEl.clientWidth/mountEl.clientHeight, 0.2, 150);
  camera.position.set(0, 1.72, 9.9);
  camera.lookAt(0, 1.72, 0);

  // controls
  const controls = new PointerLockControls(camera, renderer.domElement);
  controls.addEventListener('lock', () => { onLockedChange(true); initAudio(); state.audio?.ctx?.resume?.(); });
  controls.addEventListener('unlock', () => { onLockedChange(false); stopAllSteps(); });

  // lighting
  scene.add(new THREE.HemisphereLight(0xfff3cf, 0x2a2e33, 0.6));
  const sun = new THREE.DirectionalLight(0xffe2a2, .8);
  sun.position.set(12, 10, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  scene.add(sun);

  // corridor dimensions
  const innerR = 7.2;
  const outerR = 10.4;
  const height = 3.0;

  // helper: ring mesh
  function ring(radiusInner, radiusOuter, y, color, rough=0.95, metal=0){
    const shape = new THREE.Shape().absarc(0,0,radiusOuter,0,Math.PI*2,false);
    const hole = new THREE.Path().absarc(0,0,radiusInner,0,Math.PI*2,true);
    shape.holes.push(hole);
    const geo = new THREE.ShapeGeometry(shape, 128);
    const mat = new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    return mesh;
  }

  // floor
  const floorGroup = new THREE.Group(); scene.add(floorGroup);
  floorGroup.add(ring(innerR-0.25, innerR, 0, 0x6a4b2e, .85, .05));
  floorGroup.add(ring(outerR, outerR+0.25, 0, 0x6a4b2e, .85, .05));
  const carpetTex = new THREE.CanvasTexture(makeCarpet(1024));
  carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping;
  carpetTex.repeat.set(2,2);
  const carpet = ring(innerR, outerR, 0.003, 0x8eb07a, .95, 0);
  carpet.material.map = carpetTex;
  floorGroup.add(carpet);

  // ceiling
  const ceiling = ring(innerR-0.1, outerR+0.1, height, 0xbfae86, 1, 0);
  ceiling.rotation.x = Math.PI/2;
  ceiling.material.side = THREE.DoubleSide;
  scene.add(ceiling);

  // ceiling lights
  const lightMat = new THREE.MeshBasicMaterial({ color:0xfff0c4 });
  for (let i=0;i<14;i++){
    const a = (i/14)*Math.PI*2 + (i%2?0.12:-0.05);
    const r = (innerR + outerR)/2;
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), lightMat);
    d.position.set(Math.sin(a)*r, height-0.08, Math.cos(a)*r);
    d.rotation.x = -Math.PI/2;
    scene.add(d);

    const pt = new THREE.PointLight(0xffeab0, 0.6, 8, 2.0);
    pt.position.copy(d.position).add(new THREE.Vector3(0,-0.05,0));
    scene.add(pt);
  }

  // walls and decor
  const wallGroup = new THREE.Group(); scene.add(wallGroup);
  buildWalls(wallGroup, innerR, height, true);
  buildWalls(wallGroup, outerR, height, false);
  addFrames(scene, outerR, height, { isInner:false });
  addFrames(scene, innerR, height, { isInner:true });
  addBanners(scene, innerR, height, new THREE.CanvasTexture(makeBanner(320,1024)));
  addPipes(scene, innerR, height);
  const doorRef = addDoor(scene, innerR, height, Math.PI, { recess:true });
  const doorRefOuter = addDoor(scene, outerR, height, 0, { recess:false });

  // movement
  const state = {
    keys:{forward:false,back:false,left:false,right:false,run:false},
    speed:4.16, runMul:1.85, tmp:new THREE.Vector3(),
    doors:[
      {ref:doorRef, open:false, angle:0, target:0, vel:0, openDir:-1, autoCloseAt:0},
      {ref:doorRefOuter, open:false, angle:0, target:0, vel:0, openDir:+1, autoCloseAt:0}
    ],
    audio:{ctx:null,gain:null,buffers:[],playing:[],ready:false,lastStep:0}
  };
  function onKey(e,down){
    switch(e.code){
      case 'KeyW': state.keys.forward=down; break;
      case 'KeyS': state.keys.back=down; break;
      case 'KeyA': state.keys.left=down; break;
      case 'KeyD': state.keys.right=down; break;
      case 'ShiftLeft': case 'ShiftRight': state.keys.run=down; break;
      case 'KeyF':
        if (down){
          const camPos = camera.position;
          let nearest=null, best=1e9;
          for (const d of state.doors){
            const p = new THREE.Vector3(); d.ref.group.getWorldPosition(p);
            const dist = camPos.distanceTo(p);
            if (dist < best && dist < 1.8){ best = dist; nearest = d; }
          }
          if (nearest){
            nearest.open = !nearest.open;
            nearest.target = nearest.open ? nearest.openDir * Math.PI*0.7 : 0;
            if (nearest === state.doors[0] && nearest.open) {
              try { window.parent?.postMessage({ type: 'openHokageInterior' }, '*'); } catch {}
            }
            nearest.autoCloseAt = nearest.open ? performance.now() + 4500 : 0;
          }
        }
        break;
    }
  }
  addEventListener('keydown', e=>onKey(e,true));
  addEventListener('keyup', e=>onKey(e,false));

  // resize
  function onResize(){
    const w = mountEl.clientWidth, h = mountEl.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  }
  addEventListener('resize', onResize);

  // simple audio init and helpers for footsteps
  function initAudio(){
    if (state.audio.ctx) return;
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const gain = ctx.createGain(); gain.gain.value = 0.6; gain.connect(ctx.destination);
    state.audio.ctx = ctx; state.audio.gain = gain;
    Promise.all(['./footstep1.mp3','./footstep2.mp3'].map(u=>fetch(u).then(r=>r.arrayBuffer()).then(b=>ctx.decodeAudioData(b)))).then(bufs=>{
      state.audio.buffers = bufs; state.audio.ready = true;
    });
  }
  function playStep(){
    const a = state.audio; if (!a.ready || a.buffers.length===0) return;
    const src = a.ctx.createBufferSource();
    src.buffer = a.buffers[Math.random()<0.5?0:1];
    src.playbackRate.value = 0.9 + Math.random()*0.2;
    const g = a.ctx.createGain(); g.gain.value = 0.9 - Math.random()*0.2;
    src.connect(g); g.connect(a.gain); src.start(0);
    a.playing.push(src); src.onended = ()=>{ a.playing = a.playing.filter(s=>s!==src); };
  }
  function stopAllSteps(){
    const a = state.audio; if (!a || !a.playing) return;
    a.playing.forEach(s=>{ try{s.stop(0);}catch{} }); a.playing.length = 0;
  }

  // loop
  const clock = new THREE.Clock();
  let raf = 0;
  (function loop(){
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.033);

    if (controls.isLocked){
      const accel = state.speed * (state.keys.run?state.runMul:1);
      const dir = new THREE.Vector3(
        (state.keys.right?1:0) + (state.keys.left?-1:0),
        0,
        (state.keys.back?-1:0) + (state.keys.forward?1:0)
      );
      if (dir.lengthSq()>0) dir.normalize();

      // replaced yaw-based movement with camera-facing movement on XZ
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; if (forward.lengthSq()>0) forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();
      const wish = new THREE.Vector3().addScaledVector(forward, dir.z).addScaledVector(right, dir.x); if (wish.lengthSq()>0) wish.normalize();

      state.tmp.copy(camera.position);
      if (wish.lengthSq()>0) state.tmp.addScaledVector(wish, accel*dt);
      state.tmp.y = 1.72;

      const r = Math.hypot(state.tmp.x, state.tmp.z);
      let minR = innerR+0.35; const maxR = outerR-0.35;
      // allow entry through inner door when it's open and the player is aligned with it
      const innerDoor = state.doors[0];
      if (innerDoor && Math.abs(innerDoor.angle) > 0.9){
        const doorAngle = Math.atan2(innerDoor.ref.group.position.x, innerDoor.ref.group.position.z);
        const playerAngle = Math.atan2(state.tmp.x, state.tmp.z);
        const angDiff = Math.atan2(Math.sin(playerAngle-doorAngle), Math.cos(playerAngle-doorAngle));
        if (Math.abs(angDiff) < 0.22) minR = innerR - 1.2;
      }
      if (r < minR){
        const nx = state.tmp.x / (r||1e-6), nz = state.tmp.z / (r||1e-6);
        state.tmp.x = nx * minR; state.tmp.z = nz * minR;
      } else if (r > maxR){
        const nx = state.tmp.x / r, nz = state.tmp.z / r;
        state.tmp.x = nx * maxR; state.tmp.z = nz * maxR;
      }

      camera.position.copy(state.tmp);
    }

    // animate doors towards targets (spring-damped, with auto-close)
    for (const d of state.doors){
      if (d.open && d.autoCloseAt && performance.now() > d.autoCloseAt){
        d.open = false; d.target = 0; d.autoCloseAt = 0;
      }
      const k = 18.0, c = 8.0; // stiffness and damping
      const acc = k*(d.target - d.angle) - c*d.vel;
      d.vel += acc * dt;
      d.angle += d.vel * dt;
      d.ref.hinge.rotation.y = d.angle;
    }

    // footsteps: cadence while moving; stop immediately when idle
    const moving = controls.isLocked && (
      state.keys.forward || state.keys.back || state.keys.left || state.keys.right
    );
    if (moving){
      if (state.audio.ctx && state.audio.ctx.state === 'suspended') state.audio.ctx.resume();
      const rateMul = state.keys.run ? 1.45 : 1.0;
      state.audio.lastStep += dt * rateMul;
      const stepInterval = state.keys.run ? 0.33 : 0.46;
      if (state.audio.lastStep >= stepInterval){ state.audio.lastStep = 0; playStep(); }
    } else {
      if (state.audio.lastStep !== 0) { stopAllSteps(); state.audio.lastStep = 0; }
    }

    renderer.render(scene, camera);
  })();

  return {
    lock: () => controls.lock(),
    dispose: () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      removeEventListener('keydown', e=>onKey(e,true)); 
      removeEventListener('keyup', e=>onKey(e,false));  
      renderer.dispose();
      mountEl.removeChild(renderer.domElement);
      try{ stopAllSteps(); state.audio?.ctx?.close?.(); }catch{}
    }
  };
}
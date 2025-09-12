import * as THREE from "three";
import { makeBanner } from "./textures.js";

export function buildWalls(group, radius, H, isInner){
  const segs = 96;
  const lowerH = 1.05;
  const upperH = H - lowerH;

  const lowerMat = new THREE.MeshStandardMaterial({ color:0xe8d397, roughness:.95, metalness:.02 });
  const upperMat = new THREE.MeshStandardMaterial({ color:isInner?0x854e39:0x8a5b3f, roughness:.9, metalness:.04 });

  const geoLower = new THREE.CylinderGeometry(radius, radius, lowerH, segs, 1, true);
  const geoUpper = new THREE.CylinderGeometry(radius, radius, upperH, segs, 1, true);

  const lower = new THREE.Mesh(geoLower, lowerMat);
  lower.position.y = lowerH/2; lower.castShadow = true; lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(geoUpper, upperMat);
  upper.position.y = lowerH + upperH/2; upper.castShadow = true; upper.receiveShadow = true;
  group.add(upper);

  // trims slightly offset with polygonOffset to prevent z-fighting
  const trimMat = new THREE.MeshStandardMaterial({ color:0x5f3a24, roughness:.8, metalness:.05, polygonOffset:true, polygonOffsetFactor:1, polygonOffsetUnits:1 });
  const trimOffset = 0.012;
  const trim1 = new THREE.Mesh(new THREE.CylinderGeometry(radius+trimOffset, radius+trimOffset, 0.055, segs, 1, true), trimMat);
  trim1.position.y = lowerH + 0.001; group.add(trim1);
  const trim2 = new THREE.Mesh(new THREE.CylinderGeometry(radius+trimOffset, radius+trimOffset, 0.055, segs, 1, true), trimMat);
  trim2.position.y = H - 0.055 + 0.001; group.add(trim2);
}

export function addFrames(scene, radius, H, options = {}){
  const group = new THREE.Group(); scene.add(group);
  const { isInner = false } = options;
  const mat = new THREE.MeshStandardMaterial({ color:0x2e3138, roughness:.7, metalness:.08 });
  // Prepare outer-wall portrait textures (use each exactly once)
  const outerImageUrls = [
    'src/assets/images/Hashirama_Senju.png',
    'src/assets/images/Tobirama_Senju.png',
    'src/assets/images/Minato_Namikaze.png',
    'src/assets/images/Naruto_Uzumaki.png',
    'src/assets/images/Hatake_Kakashi.png',
    'src/assets/images/Jiraiya.png',
    'src/assets/images/Orochimaru.png',
    'src/assets/images/Tsunade.png',
  ];
  const texLoader = new THREE.TextureLoader();
  let nextOuterImage = 0;
  const wood = new THREE.MeshStandardMaterial({ color:0x6b5234, roughness:.8, metalness:.05 });
  const crookedIndex = -1; // all frames should be square/level
  for (let i=0;i<14;i++){
    const a = (i/14)*Math.PI*2 + (i%2?0.22:-0.05);
    const w = 0.6, h = 0.8, depth = 0.03;
    const doorAngles = isInner ? [Math.PI] : [0];
    const dAng = Math.min(...doorAngles.map(da => Math.abs(Math.atan2(Math.sin(a-da), Math.cos(a-da)))));
    if (dAng < 0.22) continue;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(w+0.06, h+0.06, depth+0.02), wood);
    const rOffset = isInner ? 0.05 : -0.05;
    frame.position.set(Math.sin(a)*(radius + rOffset), 1.65, Math.cos(a)*(radius + rOffset));
    frame.lookAt(0,1.65,0);
    if (isInner) frame.rotateY(Math.PI);
    frame.rotation.z = 0;
    frame.castShadow = true; group.add(frame);

    // replace curved board with a slightly inset flat panel to prevent clipping
    // Outer wall frames should display portraits; inner wall stays plain
    const panelGeo = new THREE.PlaneGeometry(w-0.04, h-0.04);
    let panelMat;
    if (!isInner && nextOuterImage < outerImageUrls.length){
      const url = outerImageUrls[nextOuterImage++];
      const tex = texLoader.load(url);
      // Ensure correct color space for PNGs
      if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
      // Fix upside-down portraits for specific files
      if (url.includes('Tobirama') || url.includes('Minato') || url.includes('Hashirama')){
        tex.flipY = false; tex.needsUpdate = true;
      }
      panelMat = new THREE.MeshStandardMaterial({ map:tex, color:0xffffff, roughness:.7, metalness:.08, side:THREE.DoubleSide });
    } else {
      panelMat = new THREE.MeshStandardMaterial({ color:0x2e3138, roughness:.7, metalness:.08, side:THREE.DoubleSide });
    }
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0, 0.031);
    panel.castShadow = true;
    frame.add(panel);
  }
}

export function addBanners(scene, radius, H, bannerTexture){
  const tex = bannerTexture || new THREE.CanvasTexture(makeBanner(320,1024));
  const group = new THREE.Group(); scene.add(group);
  for (let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + 0.05;
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55,1.6),
      new THREE.MeshStandardMaterial({ map:tex, roughness:.9, metalness:.02, side:THREE.DoubleSide })
    );
    p.position.set(Math.sin(a)*(radius-0.05), 1.8, Math.cos(a)*(radius-0.05));
    p.lookAt(0,p.position.y,0); p.rotateY(Math.PI);
    p.castShadow = true; group.add(p);

    const trim = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58,1.64),
      new THREE.MeshStandardMaterial({ color:0x3e2b60, roughness:.9, metalness:.02, side:THREE.DoubleSide })
    );
    trim.position.copy(p.position); trim.quaternion.copy(p.quaternion);
    group.add(trim);
    p.position.add(p.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.01));
  }
}

export function addPipes(scene, radius, H){
  const mat = new THREE.MeshStandardMaterial({ color:0x45322c, roughness:.7, metalness:.2 });
  for (let i=0;i<10;i++){
    const a = (i/10)*Math.PI*2 + 0.1;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06, H-0.2, 12), mat);
    pipe.position.set(Math.sin(a)*(radius-0.05), (H-0.2)/2, Math.cos(a)*(radius-0.05));
    pipe.lookAt(0,pipe.position.y,0); pipe.rotateY(Math.PI);
    pipe.castShadow = true; scene.add(pipe);
  }
}

export function addDoor(scene, radius, H, angle = Math.PI, options = {}){
  const { recess = false } = options;
  const group = new THREE.Group(); scene.add(group);
  const w = 1.0, h = 2.2, depth = 0.06;
  const frameMat = new THREE.MeshStandardMaterial({ color:0x4a321d, roughness:.85, metalness:.05, polygonOffset:true, polygonOffsetFactor:1, polygonOffsetUnits:1 });
  const doorMat = new THREE.MeshStandardMaterial({ color:0x7b5a3a, roughness:.8, metalness:.06 });
  const knobMat = new THREE.MeshStandardMaterial({ color:0xd4bf6a, roughness:.4, metalness:.6 });
  const x = Math.sin(angle)*(radius-0.02), z = Math.cos(angle)*(radius-0.02), y = h/2;
  group.position.set(x, y, z); group.lookAt(0, y, 0); group.rotateY(Math.PI);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w+0.08, h+0.08, depth), frameMat); frame.castShadow=true; frame.receiveShadow=true; group.add(frame);
  // hinge pivot for door rotation (around left edge)
  const hinge = new THREE.Group(); hinge.position.set(-w/2, 0, 0.03); group.add(hinge);
  const door = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth-0.02), doorMat);
  door.position.set(w/2, 0, 0.0); door.castShadow=true; door.receiveShadow=true; hinge.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04,16,16), knobMat);
  knob.position.set(w*0.34, 0.0, 0.025); knob.castShadow=true; door.add(knob);
  if (recess){
    const recessDepth = 1.4, recessW = w+0.02, recessH = h+0.02;
    const recessMat = new THREE.MeshStandardMaterial({ color:0x0b0c0e, roughness:1.0, metalness:0.0, side:THREE.BackSide });
    const recessBox = new THREE.Mesh(new THREE.BoxGeometry(recessW, recessH, recessDepth), recessMat);
    recessBox.position.set(0, 0, -recessDepth/2 - 0.03);
    recessBox.receiveShadow = true; group.add(recessBox);

    const deskMat = new THREE.MeshStandardMaterial({ color:0x1a1d22, roughness:.95, metalness:.02 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.5), deskMat);
    deskTop.position.set(0, -0.4, -0.7); deskTop.castShadow=true; recessBox.add(deskTop);
    const legGeo = new THREE.BoxGeometry(0.06, 0.6, 0.06);
    for (const sx of [-0.38, 0.38]){
      for (const sz of [-0.2, 0.2]){
        const leg = new THREE.Mesh(legGeo, deskMat);
        leg.position.set(sx, -0.73, -0.7+sz); leg.castShadow=true; recessBox.add(leg);
      }
    }
    const dim = new THREE.PointLight(0xffe6b0, 0.12, 2.2, 2.0);
    dim.position.set(0.0, 0.4, -0.4); group.add(dim);
  }
  return { group, hinge, width:w, height:h };
}

import * as THREE from "three";

// Builds the Ichiraku shop as a THREE.Group (no renderer/camera here).
// Returns { group, colliderProxies } so the world system can add it and collisions work.
export function createIchiraku({ position = new THREE.Vector3(0, 0, 0), settings = {} } = {}) {
  const shop = new THREE.Group();
  shop.position.copy(position);

  // Helper: canvas text texture
  function makeTextTexture({
    w=512,h=256, bg="#e7e0d2", fg="#4a2a21", text="ラーメン", font="bold 160px 'Noto Sans JP'",
    draw=(ctx)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
                 ctx.fillStyle=fg;ctx.font=font;ctx.textAlign="center";ctx.textBaseline="middle";
                 ctx.fillText(text,w/2,h/2);}
  }={}) {
    const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
    const ctx = cv.getContext('2d');
    draw(ctx);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // Base box
  const baseMat = new THREE.MeshStandardMaterial({color:0x7c6f66, roughness:.9});
  const base = new THREE.Mesh(new THREE.BoxGeometry(14,6,9), baseMat);
  base.position.y = 3;
  base.castShadow = base.receiveShadow = !!settings.shadows;
  shop.add(base);

  // Side annex
  const annex = new THREE.Mesh(new THREE.BoxGeometry(8,4,6), baseMat);
  annex.position.set(3.3, 5, -1.2);
  annex.castShadow = annex.receiveShadow = !!settings.shadows;
  shop.add(annex);

  // Windows
  const glassMat = new THREE.MeshStandardMaterial({color:0x223347, roughness:.2, metalness:.1, emissive:0x111318});
  function addWindow(x,y,z,w=3,h=2){
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w,h), glassMat);
    g.position.set(x,y,z);
    g.castShadow = g.receiveShadow = !!settings.shadows;
    shop.add(g);
  }
  addWindow(0,4.2,4.51,6.5,2.1);
  addWindow(-5,4.2,4.51,3,2);
  addWindow(5.1,6,-2.5,4,2);

  // Roof main
  function makeGabledRoof(w,d,h, color=0x6b5a52){
    const geom = new THREE.ConeGeometry(Math.max(w,d), h, 4);
    const mat  = new THREE.MeshStandardMaterial({color, roughness:.85, metalness:.05});
    const roof = new THREE.Mesh(geom, mat);
    roof.rotation.y = Math.PI/4;
    roof.castShadow = roof.receiveShadow = !!settings.shadows;
    return roof;
  }
  const roof1 = makeGabledRoof(16,10,3.5,0x6e5d55);
  roof1.position.y=7.3;
  shop.add(roof1);

  // Front lean-to roof
  const roofMat = new THREE.MeshStandardMaterial({color:0x5a4a43, roughness:.9});
  const lean = new THREE.Mesh(new THREE.BoxGeometry(12,0.25,4.2), roofMat);
  lean.position.set(0,4.6,6.0);
  lean.rotation.x = -Math.PI*0.08;
  lean.castShadow = lean.receiveShadow = !!settings.shadows;
  shop.add(lean);

  // Vent stacks
  function addStack(x,z,h=2.2,r=0.5){
    const m = new THREE.MeshStandardMaterial({color:0x8a8178, roughness:.8, metalness:.2});
    const s = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24), m);
    s.position.set(x, 6+h/2, z);
    s.castShadow = s.receiveShadow = !!settings.shadows;
    shop.add(s);
  }
  addStack(-2.3, -1.6, 2.2);
  addStack(-3.5,  0.2, 1.6);
  addStack( 1.8, -1.1, 1.9);

  // Counter bar
  const counter = new THREE.Mesh(new THREE.BoxGeometry(10.5,0.3,1.2),
                                 new THREE.MeshStandardMaterial({color:0x3b2e28, roughness:.8}));
  counter.position.set(0,2.7,5.2);
  counter.castShadow = counter.receiveShadow = !!settings.shadows;
  shop.add(counter);

  // Stools
  function addStool(x){
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.2,16),
                                new THREE.MeshStandardMaterial({color:0x2f2f2f, roughness:.8}));
    seat.position.set(x,1.1,4.7);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.9,12),
                                new THREE.MeshStandardMaterial({color:0x1b1b1b, metalness:.6, roughness:.4}));
    pole.position.set(x,0.6,4.7);
    seat.castShadow = seat.receiveShadow = !!settings.shadows;
    pole.castShadow = pole.receiveShadow = !!settings.shadows;
    shop.add(seat,pole);
  }
  [-4,-2,0,2,4].forEach(addStool);

  // Noren
  const norenGroup = new THREE.Group(); shop.add(norenGroup);
  const words = ["一","ラ","ー","メ","ン","楽"];
  const panelW = 1.6, panelH = 1.4;
  for(let i=0;i<words.length;i++){
    const tex = makeTextTexture({
      w:512,h:512,bg:"#efe7d7",fg:"#5a2f22",
      font:"bold 280px 'Noto Sans JP'", text:words[i]
    });
    const mat = new THREE.MeshStandardMaterial({map:tex, roughness:.95});
    const p = new THREE.Mesh(new THREE.PlaneGeometry(panelW,panelH), mat);
    p.position.set(-4 + i*(panelW+0.05), 3.1, 6.51);
    p.castShadow = p.receiveShadow = !!settings.shadows;
    norenGroup.add(p);
  }

  // Signboard
  const signTex = makeTextTexture({
    w:256,h:768,bg:"#dde4e8",fg:"#21303a",
    draw:(ctx)=>{
      const {width:w,height:h}=ctx.canvas;
      ctx.fillStyle="#dde4e8"; ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#21303a"; ctx.font="bold 170px 'Noto Sans JP'";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.save(); ctx.translate(w/2,h/2); ctx.rotate(-Math.PI/2);
      ctx.fillText("やき",0,0); ctx.restore();
    }
  });
  const signMat = new THREE.MeshStandardMaterial({map:signTex, roughness:.95});
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2,5.5), signMat);
  sign.position.set(9,4.5,2.5); sign.rotation.y = -Math.PI/4;
  sign.castShadow = sign.receiveShadow = !!settings.shadows;
  shop.add(sign);

  // Lantern
  const lanternBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.6,1.2,8,16),
    new THREE.MeshStandardMaterial({color:0xf2c6a0, emissive:0x442200, roughness:.6})
  );
  lanternBody.position.set(-7.2,3.4,5.9);
  lanternBody.castShadow = lanternBody.receiveShadow = !!settings.shadows;
  shop.add(lanternBody);

  // Gas cylinders
  function gasCylinder(x,z){
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5,0.5,3,16),
      new THREE.MeshStandardMaterial({color:0x5b3f36, roughness:.85})
    );
    body.position.set(x,1.6,z);
    body.castShadow = body.receiveShadow = !!settings.shadows;
    shop.add(body);
  }
  gasCylinder(6.2,3.2);
  gasCylinder(7.2,3.2);

  // Tiny figures
  function tinyPerson(x, color=0xff7f2a){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25,0.6,4,10),
                                new THREE.MeshStandardMaterial({color, roughness:.8}));
    body.position.y = 1.6; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,16,16),
                                new THREE.MeshStandardMaterial({color:0xffc89b, roughness:.6}));
    head.position.y = 2.2; g.add(head);
    g.position.set(x,0,4.7);
    g.traverse(n => { if (n.isMesh) { n.castShadow = !!settings.shadows; n.receiveShadow = !!settings.shadows; }});
    return g;
  }
  shop.add(tinyPerson(-1.9, 0xff7f2a));
  shop.add(tinyPerson(-3.4, 0x517c9c));

  // Collider proxies matching the visible geometry more closely
  const colliderProxies = [];

  function addBoxCollider(cx, cz, hx, hz, label = 'Ichiraku') {
    const proxy = new THREE.Object3D();
    const wx = position.x + cx;
    const wz = position.z + cz;
    proxy.position.set(wx, 0, wz);
    proxy.userData.collider = {
      type: 'obb',
      center: { x: wx, z: wz },
      halfExtents: { x: hx, z: hz },
      rotationY: 0
    };
    proxy.userData.label = label;
    colliderProxies.push(proxy);
  }

  // Main shop base (14 x 9)
  addBoxCollider(0, 0, 7, 4.5, 'Ichiraku Base');
  // Side annex (8 x 6) positioned at (3.3, -1.2)
  addBoxCollider(3.3, -1.2, 4, 3, 'Ichiraku Annex');
  // Front lean-to roof (12 x 4.2) centered forward at z=6
  addBoxCollider(0, 6, 6, 2.1, 'Ichiraku Front Roof');

  // Apply shadow toggle to all meshes
  if (typeof settings.shadows === 'boolean') {
    shop.traverse(n => {
      if (n.isMesh) {
        n.castShadow = settings.shadows;
        n.receiveShadow = settings.shadows;
      }
    });
  }

  return { group: shop, colliderProxies };
}
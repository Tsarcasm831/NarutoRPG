import * as THREE from "three";
import { makeHokagePanel } from "./textures.js";

export function buildWalls(scene){
  const radius = 6.9, height = 3.0, segments = 14;
  const group = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({ color: 0xC79A62, metalness: 0.05, roughness: 0.75 });
  const mullion = new THREE.MeshStandardMaterial({ color: 0xB98B56, metalness: 0.1, roughness: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, thickness: 0.05, ior: 1.2 });

  for (let i=0;i<segments;i++){
    const theta0 = (i/segments) * Math.PI*2;
    const theta1 = ((i+1)/segments) * Math.PI*2;
    const theta = (theta0+theta1)/2;

    const isWindow = (i % 2 === 0) || (i === Math.floor(segments/2));
    const panelWidth = 2 * Math.sin((theta1-theta0)/2) * radius;

    const col = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.6), mullion);
    col.position.set(Math.sin(theta0)*radius, height/2-0.02, Math.cos(theta0)*radius);
    col.lookAt(0,col.position.y,0);
    col.userData.collide = true;
    group.add(col);

    const col2 = col.clone();
    col2.position.set(Math.sin(theta1)*radius, height/2-0.02, Math.cos(theta1)*radius);
    col2.userData.collide = true;
    group.add(col2);

    const railTop = new THREE.Mesh(new THREE.BoxGeometry(panelWidth-0.22, 0.16, 0.5), mullion);
    railTop.position.set(Math.sin(theta)*radius, height-0.08, Math.cos(theta)*radius);
    railTop.lookAt(0,railTop.position.y,0);
    railTop.userData.collide = true;
    group.add(railTop);

    const sill = railTop.clone();
    sill.position.y = 0.9;
    sill.userData.collide = true;
    group.add(sill);

    if (isWindow){
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth-0.28, height-1.06), glassMat);
      plane.position.set(Math.sin(theta)*radius, (height-0.9)/2+0.9, Math.cos(theta)*radius);
      plane.lookAt(0,plane.position.y,0);
      plane.userData.collide = true;
      group.add(plane);
    } else {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(panelWidth-0.24, height-1.06, 0.45), wood);
      wall.position.set(Math.sin(theta)*radius, (height-0.9)/2+0.9, Math.cos(theta)*radius);
      wall.lookAt(0,wall.position.y,0);
      wall.castShadow = true; wall.receiveShadow = true;
      wall.userData.collide = true;
      group.add(wall);
    }
  }

  scene.add(group);
}

export function buildDesk(){
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 1.0, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xD6B88A, metalness: 0.06, roughness: 0.65 })
  );
  base.scale.z = 0.62;
  base.position.y = 0.5;
  base.castShadow = true; base.receiveShadow = true;
  base.userData.collide = true;
  g.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.3, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0xE6D1A9, metalness: 0.04, roughness: 0.55 })
  );
  top.scale.z = 0.62;
  top.position.y = 1.04;
  top.castShadow = true; top.receiveShadow = true;
  top.userData.collide = true;
  g.add(top);

  const panelTex = new THREE.CanvasTexture(makeHokagePanel(512, 256));
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.9),
    new THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.0, roughness: 0.95 })
  );
  panel.position.set(0, 0.65, 1.35);
  panel.rotation.y = Math.PI;
  panel.castShadow = true;
  panel.userData.collide = true;
  g.add(panel);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x9DC7B8, roughness: 0.8 })
  );
  seat.position.set(0, 0.62, -0.25);
  seat.castShadow = true; seat.receiveShadow = true;
  seat.userData.collide = true;
  g.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x9DC7B8, roughness: 0.8 })
  );
  back.position.set(0, 1.08, -0.55);
  back.castShadow = true; back.receiveShadow = true;
  back.userData.collide = true;
  g.add(back);

  return g;
}

export function buildProps(){
  const grp = new THREE.Group();

  function book(w,h,d,color){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({ color, roughness:.9, metalness:.02 }));
    m.castShadow = true; m.receiveShadow = true; return m;
  }
  const colors = [0xc73f3f,0x3f7fc7,0xf2a65a,0x68a357,0x8e6cc6,0xf0c808,0x444f77];
  function stack(x,z, n=5){
    let y = 1.08;
    for (let i=0;i<n;i++){
      const w = 0.22+Math.random()*0.08, h = 0.035+Math.random()*0.01, d = 0.3+Math.random()*0.06;
      const b = book(w,h,d, colors[Math.floor(Math.random()*colors.length)]);
      b.position.set(x + (Math.random()*0.06-0.03), y + h/2 + i*(h+0.008), z + (Math.random()*0.06-0.03));
      b.userData.collide = true;
      grp.add(b);
    }
  }
  stack(-0.9, 0.25, 6);
  stack(0.95, 0.2, 5);
  stack(1.0, -0.3, 4);

  function scroll(x,z){
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.35,16),
      new THREE.MeshStandardMaterial({ color: 0xEEE7D6, roughness: .85 }));
    body.rotation.z = Math.PI/2;
    body.position.set(x, 1.10, z);
    body.castShadow = true;
    body.userData.collide = true;
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.02,12),
      new THREE.MeshStandardMaterial({ color: 0x403832, roughness:.6 }));
    cap1.position.set(x-0.18,1.10,z);
    cap1.rotation.z = Math.PI/2;
    cap1.castShadow = true;
    cap1.userData.collide = true;
    const cap2 = cap1.clone(); cap2.position.x = x+0.18;
    grp.add(body, cap1, cap2);
  }
  scroll(-0.2, 0.4);
  scroll(0.35, 0.15);

  const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.1,18),
    new THREE.MeshStandardMaterial({ color:0x1a1a1a, roughness:.4, metalness:.1 }));
  ink.position.set(-0.25, 1.12, 0.05); ink.castShadow = true; grp.add(ink);
  ink.userData.collide = true;

  return grp;
}

export function buildSkyline(){
  const grp = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(60,60,0.02,64),
    new THREE.MeshStandardMaterial({ color:0xd7e8c5, roughness:.95 })
  );
  ground.position.y = -0.02; ground.receiveShadow = true; grp.add(ground);
  ground.userData.collide = false;

  const hillMat = new THREE.MeshStandardMaterial({ color:0x94b29b, roughness:1.0 });
  for (let i=0;i<8;i++){
    const r = 25 + Math.random()*12;
    const a = (i/8)*Math.PI*2 + Math.random()*0.2;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(6+Math.random()*3, 24, 16), hillMat);
    hill.scale.set(1.8,0.6,1.8);
    hill.position.set(Math.sin(a)*r, 2.2, Math.cos(a)*r);
    grp.add(hill);
    hill.userData.collide = false;
  }

  const bMat = new THREE.MeshStandardMaterial({ color:0xE7D7A3, roughness:.9 });
  for (let i=0;i<14;i++){
    const r = 18 + Math.random()*16;
    const a = (i/14)*Math.PI*2 + Math.random()*0.15;
    const h = 2 + Math.random()*2.5;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,h,24), bMat);
    cyl.position.set(Math.sin(a)*r, h/2, Math.cos(a)*r);
    grp.add(cyl);
    cyl.userData.collide = false;

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,0.25,24),
      new THREE.MeshStandardMaterial({ color:0xC7B483, roughness:.9 }));
    cap.position.set(cyl.position.x, h+0.12, cyl.position.z);
    grp.add(cap);
    cap.userData.collide = false;
  }
  return grp;
}
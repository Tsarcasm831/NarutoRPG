// citySlice.kit.js
// Core palette, materials, utils, and roof/level helpers used by all buildings.
// Usage:
//   import * as THREE from "three";
//   import { createKit } from "./citySlice.kit.js";
//   const kit = createKit(THREE); // {THREE, Palette, M, box, cyl, cone, ...}
//   // pass { THREE, kit } to exotics/builders.

export function createKit(THREE) {
  // Palette & materials
  const Palette = {
    plasterA:0xf2efe9, plasterB:0xf5f1e6, plasterC:0xf0ebdf,
    vermilion:0xc8452d, brick:0xb94637, rust:0xb4562d,
    wood:0x6f5233, frame:0x34383e, band:0x8a8f7a,
    roofTerracotta:0xd24b30, roofOrange:0xe0662f, roofClay:0xb1492c,
    roofTeal:0x3a8f7b, roofSea:0x3f844a, roofBlue:0x5b73b8, roofSlate:0x2f3338
  };
  const M = {
    plasterA:new THREE.MeshStandardMaterial({color:Palette.plasterA, roughness:.95, metalness:.02}),
    plasterB:new THREE.MeshStandardMaterial({color:Palette.plasterB, roughness:.95, metalness:.02}),
    plasterC:new THREE.MeshStandardMaterial({color:Palette.plasterC, roughness:.95, metalness:.02}),
    wood:    new THREE.MeshStandardMaterial({color:Palette.wood, roughness:.9,  metalness:.03}),
    frame:   new THREE.MeshStandardMaterial({color:Palette.frame, roughness:.9,  metalness:.02}),
    band:    new THREE.MeshStandardMaterial({color:Palette.band,  roughness:.95, metalness:.02}),
    glass:   new THREE.MeshStandardMaterial({color:0x9dbbd0, roughness:.2,  metalness:.02}),
    roof:(c)=>new THREE.MeshStandardMaterial({
      color:c, roughness:.9, metalness:.03, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1
    })
  };

  // Utils / kit pieces
  const box=(w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.castShadow=m.receiveShadow=true; return m;};
  const cyl=(r,h,mat,seg=48)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat); m.castShadow=m.receiveShadow=true; return m;};
  const cone=(r,h,mat,seg=48)=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,seg),mat); m.castShadow=m.receiveShadow=true; return m;};

  function edges(mesh,alpha=.28){
    const g=new THREE.EdgesGeometry(mesh.geometry,25);
    const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x000,transparent:true,opacity:alpha}));
    l.position.copy(mesh.position); l.rotation.copy(mesh.rotation); mesh.add(l);
  }

  function windowRect(w=9,h=8,d=1.2){
    const g=new THREE.Group();
    const fr=box(w,h,d,M.frame); fr.position.y=h/2; g.add(fr);
    const gl=box(w-2,h-2,d-.6,M.glass); gl.position.set(0,h/2,.35); g.add(gl);
    return g;
  }
  function ringWindows(grp,r,y,count=6){
    for(let i=0;i<count;i++){
      const a=(i/count)*Math.PI*2;
      const W=windowRect(10,9,1.2);
      W.position.set(Math.cos(a)*r, y, Math.sin(a)*r);
      W.lookAt(0,y,0); grp.add(W);
    }
  }
  function archStrip(grp, w,d,y,count=6,spacing=14){
    for(let i=0;i<count;i++){
      const x=-w/2+10+i*spacing;
      const t=windowRect(10,9,1.2); t.position.set(x,y,d/2+1); t.rotation.y=Math.PI; grp.add(t);
      const b=t.clone(); b.position.z=-d/2-1; b.rotation.y=0; grp.add(b);
    }
  }
  function belt(grp, w,d,y,th=4,color=Palette.vermilion){
    const m=new THREE.MeshStandardMaterial({color, roughness:.9, metalness:.02});
    const s=box(w+2,th,d+2,m); s.position.y=y; grp.add(s);
  }

  // Roofs
  function hipRoof(w,d,color){
    const grp=new THREE.Group();
    const t=2.2, base = box(w,t,d,M.roof(color)); base.position.y=t/2; grp.add(base); edges(base,.35);
    const rim = box(w+2,1.2,d+2,M.roof(Palette.roofSlate)); rim.position.y=t+1.2/2; grp.add(rim);
    return grp;
  }
  function gableRoof(w,d,color){
    const grp=new THREE.Group(), t=2.2, slope=Math.max(w,d)*0.22;
    const s1=box(w,t,d/2,M.roof(color)); s1.position.set(0,t/2,-d/4);
    const s2=box(w,t,d/2,M.roof(color)); s2.position.set(0,t/2, d/4);
    const ang=Math.atan2(slope,d/2); s1.rotation.x= ang; s2.rotation.x=-ang; [s1,s2].forEach(s=>{edges(s,.35); grp.add(s);});
    const ridge=box(w+1.4,1.4,1.4,M.roof(Palette.roofSlate)); ridge.position.set(0, t/2 + Math.sin(ang)*(d/2), 0); grp.add(ridge);
    return grp;
  }
  function domeRoof(r,color){
    const grp=new THREE.Group();
    const drum=cyl(r*0.96,8,M.roof(Palette.roofSlate),40); drum.position.y=4; grp.add(drum);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(r,42,30,0,Math.PI*2,0,Math.PI/2), M.roof(color));
    dome.position.y=4; dome.castShadow=dome.receiveShadow=true; grp.add(dome);
    const fin=cone(r*0.2,8,M.roof(Palette.roofSlate),32); fin.position.y=4+r*0.98; grp.add(fin);
    return grp;
  }
  function coneRoof(r,color){
    const grp=new THREE.Group();
    const eave=cyl(r*1.05,3,M.roof(Palette.roofSlate),40); eave.position.y=1.5; grp.add(eave);
    const con=cone(r, r*1.25, M.roof(color), 40); con.position.y=1.5+r*0.62; grp.add(con);
    return grp;
  }
  function addUpturnedCorners(target,w,d,tilt=0.5,len=10){
    const plate=(sx,sz,angX,px,pz)=>{
      const p=box(len,1.2,sz,M.roof(Palette.roofSlate));
      p.position.set(px, 2.2, pz); p.rotation.x=angX; target.add(p);
    };
    const offX=w/2+0.2, offZ=d/2-3;
    plate(len,6, tilt,  offX, -offZ);
    plate(len,6,-tilt,  offX,  offZ);
    plate(len,6, tilt, -offX,  offZ);
    plate(len,6,-tilt, -offX, -offZ);
  }

  // Rect block level
  function rectLevel({w=64,d=44,h=24, plaster="A", skirt=true}={}){
    const mat = plaster==="B"?M.plasterB:plaster==="C"?M.plasterC:M.plasterA;
    const grp=new THREE.Group();
    const body=box(w,h,d,mat); body.position.y=h/2; grp.add(body);
    const t=2.2;
    const corners=[[-w/2+t/2,h/2,-d/2+t/2],[w/2-t/2,h/2,-d/2+t/2],[-w/2+t/2,h/2,d/2-t/2],[w/2-t/2,h/2,d/2-t/2]];
    corners.forEach(p=>{const c=box(t,h,t,M.band); c.position.set(...p); grp.add(c);});
    if(skirt){ const s=box(w+2,6,d+2,M.band); s.position.y=3; grp.add(s); }
    // attach helper for arch strips
    grp.__archStrip = (W,D,Y, C) => archStrip(grp, W,D,Y, C, 14);
    return grp;
  }

  return {
    THREE, Palette, M,
    // shapes
    box, cyl, cone, edges,
    // detail helpers
    windowRect, ringWindows, archStrip, belt,
    // roofs
    hipRoof, gableRoof, domeRoof, coneRoof, addUpturnedCorners,
    // blocks
    rectLevel
  };
}

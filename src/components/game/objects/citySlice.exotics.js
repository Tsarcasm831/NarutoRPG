// citySlice.exotics.js
// Specialized buildings built using the kit helpers.
export function createExotics(THREE, kit) {
  const {
    Palette, M,
    box, cyl, cone,
    ringWindows, belt,
    hipRoof, gableRoof, domeRoof, coneRoof, addUpturnedCorners,
    rectLevel
  } = kit;

  function drumTower({r=30, floors=3, beltColor=Palette.vermilion, roofColor=Palette.roofBlue, plaster="A"}={}){
    const grp=new THREE.Group(); let y=0, radius=r;
    for(let f=0; f<floors; f++){
      const mat = plaster==="B"?M.plasterB:plaster==="C"?M.plasterC:M.plasterA;
      const drum=cyl(radius, 22, mat, 40); drum.position.y=y+11; grp.add(drum);
      ringWindows(grp, radius*0.92, y+13, 8);
      belt(grp, radius*2+2, radius*2+2, y+5, 4, beltColor);
      y+=22; radius*=0.93;
    }
    const top=domeRoof(radius*0.98, roofColor); top.position.y=y+2; grp.add(top);
    return grp;
  }
  function pagoda({w=80,d=60, tiers=3, roofColor=Palette.roofOrange, plaster="B"}={}){
    const grp=new THREE.Group(); let Y=0, W=w, D=d;
    for(let i=0;i<tiers;i++){
      const L=rectLevel({w:W,d:D,h:20,plaster}); L.position.y=Y; grp.add(L);
      L.__archStrip(W,D,12, Math.max(4, Math.floor(W/18)));
      const RF = hipRoof(W+6, D+6, roofColor); RF.position.y=Y+20.8; grp.add(RF);
      addUpturnedCorners(RF, W+6, D+6, 0.55, 12);
      Y += 22; W*=0.86; D*=0.86;
    }
    const cap=cone(8,14,M.roof(Palette.roofSlate)); cap.position.y=Y+6; grp.add(cap);
    return grp;
  }
  function terrace({w=86,d=46, floors=2, roofColor=Palette.roofClay, plaster="A"}={}){
    const grp=new THREE.Group();
    for(let f=0; f<floors; f++){
      const L=rectLevel({w,d,h:22,plaster}); L.position.y=f*22; grp.add(L);
      L.__archStrip(w,d,12, Math.floor(w/16));
      if(f===1){
        const deck=box(w-16,2,10,M.wood); deck.position.set(0, 22+2, d/2+5.5); grp.add(deck);
        const rail=box(w-16,6,1.2,M.frame); rail.position.set(0, 22+2+3, d/2+5.5); grp.add(rail);
      }
    }
    const roof=gableRoof(w+4,d+4,roofColor); roof.position.y=floors*22+1.6; grp.add(roof);
    return grp;
  }
  function bathhouse({w=70,d=48, r=26, roofMain=Palette.roofTeal, roofSides=Palette.roofTerracotta, plaster="C"}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:20,plaster}); L.position.y=0; grp.add(L);
    L.__archStrip(w,d,12, Math.floor(w/16));
    const drum=cyl(r,22, M.plasterA, 40); drum.position.set(0,11,0); grp.add(drum);
    ringWindows(grp,r*0.92, 14, 6);
    const dome=domeRoof(r*0.98, roofMain); dome.position.y=22+2; grp.add(dome);
    const wingW=(w*0.46)|0;
    const W1=rectLevel({w:wingW,d:d*0.8,h:18,plaster:"B"}); W1.position.set(-w/2-wingW/2+6, 0, 0); grp.add(W1);
    const W2=W1.clone(); W2.position.x*=-1; grp.add(W2);
    const R1=hipRoof(wingW+6, d*0.8+6, roofSides); R1.position.set(W1.position.x, 18.8, 0); addUpturnedCorners(R1, wingW+6, d*0.8+6); grp.add(R1);
    const R2=hipRoof(wingW+6, d*0.8+6, roofSides); R2.position.set(W2.position.x, 18.8, 0); addUpturnedCorners(R2, wingW+6, d*0.8+6); grp.add(R2);
    return grp;
  }
  function gatehouse({w=84,d=36, roofColor=Palette.roofTerracotta, coneColor=Palette.roofSea, plaster="B"}={}){
    const grp=new THREE.Group();
    const base=rectLevel({w,d,h:22,plaster}); base.position.y=0; grp.add(base);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(8,8,14,24,1,true,0,Math.PI), M.frame);
    arch.rotation.z = Math.PI/2; arch.position.set(0,11,d/2+1); grp.add(arch);
    const top=rectLevel({w:w*0.92,d:d*0.92,h:18,plaster:"A"}); top.position.y=22; grp.add(top);
    belt(grp,w*0.92,d*0.92,22+2.2,4,Palette.vermilion);
    const roof=hipRoof(w*0.96+6, d*0.96+6, roofColor); roof.position.y=41.2; addUpturnedCorners(roof,w*0.96+6,d*0.96+6); grp.add(roof);
    const r=12, t1=coneRoof(r, coneColor); t1.position.set(-w/2-4, 22, -d/2+6); grp.add(t1);
    const t2=coneRoof(r, coneColor); t2.position.set( w/2+4, 22, -d/2+6); grp.add(t2);
    return grp;
  }
  const libraryTower=({r=20, floors=4, roofColor=Palette.roofTeal, beltColor=Palette.brick}={})=> drumTower({r, floors, beltColor, roofColor, plaster:"B"});

  function octagonTower({r=26,floors=3,roofColor=Palette.roofSea,plaster="A"}={}){
    const grp=new THREE.Group(); let y=0, rad=r;
    for(let i=0;i<floors;i++){
      const mat=plaster==="B"?M.plasterB:plaster==="C"?M.plasterC:M.plasterA;
      const drum=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,20,8), mat);
      drum.castShadow=drum.receiveShadow=true; drum.position.y=y+10; grp.add(drum);
      ringWindows(grp, rad*0.9, y+12, 8);
      y+=20; rad*=0.94;
    }
    const cap=coneRoof(rad*0.98, roofColor); cap.position.y=y+2; grp.add(cap);
    return grp;
  }
  function hexPavilion({r=22, roofColor=Palette.roofOrange, open=true}={}){
    const grp=new THREE.Group();
    const seg=6, h=14;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(r,r,4,seg), M.band); base.position.y=2; base.castShadow=base.receiveShadow=true; grp.add(base);
    for(let i=0;i<seg;i++){
      const a=(i/seg)*Math.PI*2;
      const col=open?cyl(1.8,h,M.wood,12):box(6,h,2,M.wood);
      const px=Math.cos(a)*r*0.9, pz=Math.sin(a)*r*0.9;
      col.position.set(px, h/2+4, pz);
      col.lookAt(0,col.position.y,0); grp.add(col);
    }
    const roof=coneRoof(r*1.02, roofColor); roof.position.y=h+5; grp.add(roof);
    return grp;
  }
  function stupa({r=24, levels=5, roofColor=Palette.roofSea}={}){
    const grp=new THREE.Group(); let y=0, rad=r;
    for(let i=0;i<levels;i++){
      const ring=cyl(rad, 10, M.plasterC, 48); ring.position.y=y+5; grp.add(ring);
      belt(grp, rad*2, rad*2, y+1.8, 3, Palette.vermilion);
      y+=10; rad*=0.9;
    }
    const spire=new THREE.Group();
    spire.add(cone(rad,rad*1.1,M.roof(roofColor),32));
    const tip=cone(Math.max(2,rad*0.2), 10, M.roof(Palette.roofSlate),24); tip.position.y=rad*1.1; spire.add(tip);
    spire.position.y=y+2; grp.add(spire);
    return grp;
  }
  function teaHouseStilts({w=64,d=44, roofColor=Palette.roofTerracotta}={}){
    const grp=new THREE.Group();
    const deck=box(w,2,d,M.wood); deck.position.y=10; grp.add(deck);
    for(let x=-w/2+6; x<=w/2-6; x+=w-12){
      for(let z=-d/2+6; z<=d/2-6; z+=d-12){
        const post=cyl(2,10,M.wood,12); post.position.set(x,5,z); grp.add(post);
      }
    }
    const body=rectLevel({w:d*0.9,d:w*0.6,h:16,plaster:"B"}); body.position.y=12; grp.add(body);
    const roof=hipRoof(w+10, d+10, roofColor); roof.position.y=22; addUpturnedCorners(roof,w+10,d+10,0.6,14); grp.add(roof);
    return grp;
  }
  function marketHall({w=120,d=44, roofColor=Palette.roofClay}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:18,plaster:"A"}); L.position.y=0; grp.add(L);
    L.__archStrip(w,d,10, Math.floor(w/12));
    const roof=gableRoof(w+6,d+6,roofColor); roof.position.y=19.4; grp.add(roof);
    return grp;
  }
  function bellPavilion({w=70,d=70, roofColor=Palette.roofOrange}={}){
    const grp=new THREE.Group();
    const pad=box(w,3,d,M.band); pad.position.y=1.5; grp.add(pad);
    for(let x=-w/2+8;x<=w/2-8;x+=w-16){
      for(let z=-d/2+8;z<=d/2-8;z+=d-16){
        const col=cyl(3,16,M.wood,14); col.position.set(x,8,z); grp.add(col);
      }
    }
    const roof=hipRoof(w+12,d+12,roofColor); roof.position.y=18; addUpturnedCorners(roof,w+12,d+12,0.6,16); grp.add(roof);
    const bell=cyl(5,6,M.roof(Palette.roofSlate),24); bell.position.y=12; grp.add(bell);
    return grp;
  }
  function siheyuan({w=120,d=120, roofColor=Palette.roofTerracotta}={}){
    const grp=new THREE.Group();
    const wing=()=>{ const g=rectLevel({w:44,d:28,h:16,plaster:"C"}); const r=hipRoof(50,34,roofColor); r.position.y=16.8; addUpturnedCorners(r,50,34,0.6,12); g.add(r); return g; };
    const north=wing(); north.position.set(0,0,-d/2+20); grp.add(north);
    const south=wing(); south.position.set(0,0, d/2-20); grp.add(south);
    const west=wing();  west.position.set(-w/2+24,0,0);  west.rotation.y=Math.PI/2; grp.add(west);
    const east=wing();  east.position.set( w/2-24,0,0);  east.rotation.y=Math.PI/2; grp.add(east);
    return grp;
  }
  function twinBridge({w=56,d=40,h=24, roofColor=Palette.roofTeal}={}){
    const grp=new THREE.Group();
    const A=rectLevel({w,d,h,plaster:"B"}); A.position.set(-w,0,0); grp.add(A);
    const B=rectLevel({w,d,h,plaster:"B"}); B.position.set( w,0,0); grp.add(B);
    const roofA=hipRoof(w+6,d+6,roofColor); roofA.position.set(-w,h+1.4,0); grp.add(roofA);
    const roofB=hipRoof(w+6,d+6,roofColor); roofB.position.set( w,h+1.4,0); grp.add(roofB);
    const bridge=box(w*1.2,4, d*0.6, M.wood); bridge.position.y=h+8; grp.add(bridge);
    const cover=gableRoof(w*1.2+6,d*0.6+6,Palette.roofOrange); cover.position.y=h+10; grp.add(cover);
    return grp;
  }
  function toriiGateComplex({w=80,d=30, roofColor=Palette.roofTerracotta}={}){
    const grp=new THREE.Group();
    // torii
    const postA=cyl(3,20,M.wood,16); postA.position.set(-w/2+8,10,-d/2); grp.add(postA);
    const postB=postA.clone(); postB.position.x*=-1; grp.add(postB);
    const lintel=box(w-16,3,6,M.wood); lintel.position.set(0,21,-d/2); grp.add(lintel);
    const kasagi=box(w-10,2,8,M.roof(Palette.roofSlate)); kasagi.position.set(0,23,-d/2); grp.add(kasagi);
    // small guardhouse behind
    const house=rectLevel({w:50,d:30,h:16,plaster:"A"}); house.position.y=0; grp.add(house);
    const r=hipRoof(54,34,roofColor); r.position.y=17; addUpturnedCorners(r,54,34,0.6,12); grp.add(r);
    return grp;
  }
  function barrelHall({w=100,d=40, roofColor=Palette.roofSea}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:18,plaster:"C"}); L.position.y=0; grp.add(L);
    // Approx barrel with multiple sloped plates
    const roof=new THREE.Group(); const seg=5;
    for(let i=0;i<seg;i++){
      const t=box(w+6,2,(d+6)/seg,M.roof(roofColor));
      const z=-d/2-3 + (i+0.5)*(d+6)/seg;
      const ang=(i - (seg-1)/2)*0.18;
      t.position.set(0, 19+i*0.3, z); t.rotation.x=ang; roof.add(t);
    }
    roof.position.y=0; grp.add(roof);
    return grp;
  }
  function karahafuHall({w=84,d=44, roofColor=Palette.roofTerracotta}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:18,plaster:"A"}); L.position.y=0; grp.add(L);
    const roof=gableRoof(w+6,d+6,roofColor); roof.position.y=19.4; addUpturnedCorners(roof,w+6,d+6,0.55,12); grp.add(roof);
    // decorative cusped front (fake karahafu)
    const crest=box(26,10,1.4,M.roof(Palette.roofSlate)); crest.position.set(0,26,d/2+1.6); grp.add(crest);
    return grp;
  }
  function drumPagodaHybrid({w=70,d=50,r=22}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:18,plaster:"B"}); L.position.y=0; grp.add(L);
    const roof=hipRoof(w+6,d+6,Palette.roofOrange); roof.position.y=19.2; addUpturnedCorners(roof,w+6,d+6,0.55,12); grp.add(roof);
    const drum=cyl(r,18,M.plasterA,36); drum.position.y=32; grp.add(drum);
    const dome=domeRoof(r*0.98,Palette.roofTeal); dome.position.y=42; grp.add(dome);
    return grp;
  }
  function tallWatchtower({w=36,d=36,floors=4, roofColor=Palette.roofSea}={}){
    const grp=new THREE.Group();
    for(let i=0;i<floors;i++){
      const L=rectLevel({w,d,h:18,plaster:i%2?"B":"C"}); L.position.y=i*18; grp.add(L);
    }
    const cap=coneRoof(Math.min(w,d)*0.7, roofColor); cap.position.y=floors*18+2; grp.add(cap);
    return grp;
  }
  const cornerPagoda = ({w=90,d=66,tiers=3, roofColor=Palette.roofOrange}={}) => pagoda({w,d,tiers,roofColor,plaster:"A"});

  // NEW: Five original and unique buildings
  function spiralTower({w=56,d=56,floors=4, roofColor=Palette.roofBlue, plaster="B"}={}){
    const grp=new THREE.Group();
    let Y=0, W=w, D=d;
    const rotStep=0.28;
    for(let i=0;i<floors;i++){
      const L=rectLevel({w:W,d:D,h:16,plaster});
      L.position.y=Y; L.rotation.y=i*rotStep; grp.add(L);
      belt(grp, W*0.98, D*0.98, Y+1.2, 3, Palette.brick);
      Y += 16; W*=0.9; D*=0.9;
    }
    const cap=gableRoof(Math.max(W,D)+6, Math.min(W,D)+6, roofColor); cap.position.y=Y+1.6; grp.add(cap);
    return grp;
  }
  function lotusPavilion({r=24, petals=8, roofColor=Palette.roofTeal, plaster="A"}={}){
    const grp=new THREE.Group();
    const base=cyl(r,6,M.band,petals); base.position.y=3; grp.add(base);
    const core=cyl(r*0.7,14,plaster==="B"?M.plasterB:plaster==="C"?M.plasterC:M.plasterA,petals); core.position.y=7+7; grp.add(core);
    // petal cones around
    for(let i=0;i<petals;i++){
      const a=(i/petals)*Math.PI*2;
      const pet=cone(r*0.35, r*0.6, M.roof(roofColor), 22);
      pet.position.set(Math.cos(a)*r*0.92, 9, Math.sin(a)*r*0.92);
      pet.lookAt(0, 9, 0); // face inward, slight tilt comes from lookAt
      grp.add(pet);
    }
    const crown=domeRoof(r*0.62, roofColor); crown.position.y=20; grp.add(crown);
    return grp;
  }
  function fanRoofHall({w=96,d=44, roofColor=Palette.roofOrange, plaster="C"}={}){
    const grp=new THREE.Group();
    const L=rectLevel({w,d,h:18,plaster}); L.position.y=0; grp.add(L);
    const main=gableRoof(w+6,d+6,roofColor); main.position.y=19.2; grp.add(main);
    // fan out two small hips front/back
    const s=hipRoof(w*0.6, d*0.5, roofColor);
    const sF=s.clone(); sF.position.set(0, 19.8, d/2+2.2); grp.add(sF);
    const sB=s.clone(); sB.position.set(0, 19.8, -d/2-2.2); grp.add(sB);
    addUpturnedCorners(sF, w*0.6, d*0.5, 0.5, 10);
    addUpturnedCorners(sB, w*0.6, d*0.5, 0.5, 10);
    return grp;
  }
  function skyBridgeTowers({w=40,d=36,h=22, gap=64, roofColor=Palette.roofSea, plaster="B"}={}){
    const grp=new THREE.Group();
    const left=new THREE.Group(), right=new THREE.Group();
    for(let i=0;i<3;i++){
      const L=rectLevel({w,d,h:18,plaster:i%2?"A":plaster}); L.position.y=i*18; left.add(L);
      const R=rectLevel({w,d,h:18,plaster:i%2?"A":plaster}); R.position.y=i*18; right.add(R);
    }
    const capL=coneRoof(Math.min(w,d)*0.7, roofColor); capL.position.y=3*18+2; left.add(capL);
    const capR=coneRoof(Math.min(w,d)*0.7, roofColor); capR.position.y=3*18+2; right.add(capR);
    left.position.x=-gap/2 - w/2; right.position.x=gap/2 + w/2; grp.add(left); grp.add(right);
    // Bridges at two heights
    const deck1=box(gap,3, d*0.4, M.wood); deck1.position.set(0, 18+8, 0); grp.add(deck1);
    const deck2=box(gap,3, d*0.4, M.wood); deck2.position.set(0, 18*2+8, 0); grp.add(deck2);
    return grp;
  }
  function tieredGardenHouse({w=90,d=60, tiers=3, roofColor=Palette.roofClay, plaster="A"}={}){
    const grp=new THREE.Group();
    let W=w, D=d, Y=0;
    for(let i=0;i<tiers;i++){
      const L=rectLevel({w:W,d:D,h:18,plaster}); L.position.y=Y; grp.add(L);
      // garden deck on south side
      const deck=box(W*0.8,2,8,M.wood); deck.position.set(0, Y+18+1, D/2+5); grp.add(deck);
      const planter=box(W*0.78,4,2,M.band); planter.position.set(0, Y+18+3, D/2+9); grp.add(planter);
      Y+=20; W*=0.88; D*=0.9;
    }
    const roof=hipRoof(W+6, D+6, roofColor); roof.position.y=Y+1.4; addUpturnedCorners(roof,W+6,D+6,0.5,10); grp.add(roof);
    return grp;
  }

  return {
    drumTower, pagoda, terrace, bathhouse, gatehouse, libraryTower,
    octagonTower, hexPavilion, stupa, teaHouseStilts, marketHall, bellPavilion,
    siheyuan, twinBridge, toriiGateComplex, barrelHall, karahafuHall,
    drumPagodaHybrid, tallWatchtower, cornerPagoda,
    // new
    spiralTower, lotusPavilion, fanRoofHall, skyBridgeTowers, tieredGardenHouse
  };
}

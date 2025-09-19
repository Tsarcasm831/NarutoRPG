// citySlice.originals.js
// First 15 buildings (kept from "originals" in buildings2.html). Returns an array of Groups.
export function buildOriginals(THREE, kit, ex) {
  const P = kit.Palette;
  const {
    pagoda, drumTower, terrace, bathhouse, gatehouse, libraryTower
  } = ex;

  return [
    pagoda({w:92,d:68,tiers:3,roofColor:P.roofOrange,plaster:"B"}),
    drumTower({r:34,floors:3,roofColor:P.roofBlue,beltColor:P.vermilion,plaster:"A"}),
    terrace({w:96,d:48,floors:2,roofColor:P.roofClay,plaster:"C"}),
    bathhouse({w:88,d:56,r:30,roofMain:P.roofTeal,roofSides:P.roofTerracotta,plaster:"B"}),
    gatehouse({w:96,d:40,roofColor:P.roofTerracotta,coneColor:P.roofSea,plaster:"A"}),

    pagoda({w:86,d:62,tiers:4,roofColor:P.roofTerracotta,plaster:"A"}),
    libraryTower({r:22,floors:5,roofColor:P.roofSea,beltColor:P.rust}),
    terrace({w:88,d:44,floors:3,roofColor:P.roofOrange,plaster:"B"}),
    bathhouse({w:78,d:52,r:26,roofMain:P.roofBlue,roofSides:P.roofOrange,plaster:"C"}),
    drumTower({r:36,floors:2,roofColor:P.roofSea,beltColor:P.brick,plaster:"B"}),

    gatehouse({w:90,d:38,roofColor:P.roofClay,coneColor:P.roofTeal,plaster:"C"}),
    pagoda({w:100,d:72,tiers:3,roofColor:P.roofOrange,plaster:"A"}),
    terrace({w:82,d:42,floors:2,roofColor:P.roofTerracotta,plaster:"B"}),
    libraryTower({r:24,floors:4,roofColor:P.roofBlue,beltColor:P.vermilion}),
    bathhouse({w:92,d:60,r:32,roofMain:P.roofSea,roofSides:P.roofClay,plaster:"A"})
  ];
}

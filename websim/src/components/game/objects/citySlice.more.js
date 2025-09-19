// citySlice.more.js
// Second 15 buildings (more oriental variety). Returns an array of Groups.
export function buildMore(THREE, kit, ex) {
  const P = kit.Palette;
  const {
    octagonTower, hexPavilion, stupa, teaHouseStilts, marketHall,
    bellPavilion, siheyuan, twinBridge, toriiGateComplex, barrelHall,
    karahafuHall, drumPagodaHybrid, tallWatchtower, cornerPagoda
  } = ex;

  return [
    octagonTower({r:28,floors:3,roofColor:P.roofSea,plaster:"B"}),
    hexPavilion({r:26,roofColor:P.roofOrange}),
    stupa({r:26,levels:5,roofColor:P.roofTeal}),
    teaHouseStilts({w:78,d:52,roofColor:P.roofTerracotta}),
    marketHall({w:140,d:46,roofColor:P.roofClay}),

    bellPavilion({w:86,d:86,roofColor:P.roofOrange}),
    siheyuan({w:140,d:140,roofColor:P.roofTerracotta}),
    twinBridge({w:60,d:36,h:22,roofColor:P.roofTeal}),
    toriiGateComplex({w:96,d:36,roofColor:P.roofTerracotta}),
    barrelHall({w:120,d:46,roofColor:P.roofSea}),

    karahafuHall({w:96,d:48,roofColor:P.roofTerracotta}),
    drumPagodaHybrid({w:84,d:58,r:24}),
    tallWatchtower({w:40,d:40,floors:5,roofColor:P.roofSea}),
    cornerPagoda({w:104,d:76,tiers:4,roofColor:P.roofOrange}),
    octagonTower({r:30,floors:4,roofColor:P.roofBlue,plaster:"C"})
  ];
}

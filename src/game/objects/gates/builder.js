import * as THREE from 'three';

/**
 * Lightweight gate builder adapted from components/game/objects/konohaGates.js
 * Returns { group, colliders } so the caller can add to the scene and register collisions.
 * Parameters:
 *  - scale: world scale multiplier (default 4 to match ~48u wall opening)
 *  - settings: { shadows: boolean }
 */
export function buildKonohaGatesGroup({ scale = 4, settings = {} } = {}) {
  const group = new THREE.Group();
  const castRec = (obj) => { obj.castShadow = obj.receiveShadow = !!settings.shadows; return obj; };

  // Materials
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb69a7a, roughness:.92 });
  const roofMat = new THREE.MeshStandardMaterial({
      color: 0xd88f38, roughness:.95,
      polygonOffset: true, polygonOffsetFactor:-1, polygonOffsetUnits:-2
  });
  const signMat = new THREE.MeshStandardMaterial({
      color: 0x2b2b2b, roughness:.95 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x86a688, roughness:.95 });
  const plankRim = new THREE.MeshStandardMaterial({ color: 0x2c3a2f, roughness:.95 });

  // Helpers to make simple canvas textures (no external files)
  function makePlankTexture({ w = 512, h = 1024, base = '#86a688', groove = '#2c3a2f', mark = 'あ' }) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const plankW = w / 10; ctx.strokeStyle = groove; ctx.lineWidth = 3;
    for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(i * plankW, 0); ctx.lineTo(i * plankW, h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 6; i++) { const y = (i + 1) * (h / 7); ctx.fillRect(0, y - 3, w, 6); }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, w - 12, h - 12);

    // Painted hiragana
    ctx.save(); ctx.translate(w * 0.52, h * 0.60); ctx.rotate(-0.08); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fontSize = Math.floor(h * 0.72);
    ctx.font = `900 ${fontSize}px 'Yu Mincho','Hiragino Mincho Pro','Noto Serif JP','MS Mincho',serif`;
    ctx.lineWidth = Math.max(14, Math.floor(fontSize * 0.06)); ctx.strokeStyle = '#7a1b16'; ctx.fillStyle = '#7a1b16';
    ctx.strokeText(mark, 0, 0);
    ctx.fillText(mark, 0, 0);
    ctx.restore();
  }

  // Minimal static gate: two towers + lintel, with simple OBBs
  const towerGeo = new THREE.BoxGeometry(4, 10, 8);
  const left = castRec(new THREE.Mesh(towerGeo, stoneMat)), right = castRec(left.clone());
  left.position.set(-8, 5, 0); right.position.set(8, 5, 0); group.add(left, right);
  const lintel = castRec(new THREE.Mesh(new THREE.BoxGeometry(22, 2, 8.2), stoneMat));
  lintel.position.set(0, 11, 0); group.add(lintel);
  group.userData._obbLocals = [{ pos: new THREE.Vector3(-8, 0, 0), hx: 2, hz: 4, label: 'Gate Tower' }, { pos: new THREE.Vector3(8, 0, 0), hx: 2, hz: 4, label: 'Gate Tower' }];
  group.scale.setScalar(scale);
  return { group };
}
import * as THREE from 'three';

export function buildEmblem(CFG, mats) {
  const grp = new THREE.Group();
  const { plateRadius, plateColor, symbolColor, offsetY } = CFG.rotunda.emblem;

  // Red plate
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(plateRadius, plateRadius, 1.2, 64),
    new THREE.MeshStandardMaterial({ color: plateColor, roughness: 0.75 })
  );
  plate.rotation.x = Math.PI / 2;
  grp.add(plate);

  // Position above ledge & forward
  const midR = CFG.rotunda.tiers[1].r - 0.2;
  const baseY = CFG.rotunda.tiers[2].h + CFG.rotunda.tiers[1].h * 0.35 + CFG.rotunda.tiers[0].h * 0.25;
  grp.position.set(0, baseY + (offsetY ?? 0), midR + 2.5);

  const symbolMat = new THREE.MeshStandardMaterial({
    color: symbolColor, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide
  });

  // Fallback emblem (Konoha-like), rotated +90° around X
  const g = new THREE.Group();
  g.position.z = 0.9;
  g.rotation.x = Math.PI / 2;

  const swirl = new THREE.Mesh(
    new THREE.TorusGeometry(plateRadius * 0.56, plateRadius * 0.09, 18, 96, Math.PI * 1.3),
    symbolMat
  );
  swirl.rotation.set(Math.PI / 2, 0, Math.PI * 0.22);
  g.add(swirl);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(plateRadius * 0.17, plateRadius * 0.26, 32), symbolMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.set(plateRadius * 0.28, -plateRadius * 0.02, 0);
  g.add(tip);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(plateRadius * 0.52, plateRadius * 0.09, 0.6), symbolMat);
  tail.rotation.z = -0.18;
  tail.position.set(plateRadius * 0.1, -plateRadius * 0.42, 0);
  g.add(tail);

  grp.add(g);
  grp.renderOrder = 2;

  return grp;
}


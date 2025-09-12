import * as THREE from 'three';
import { pick } from './palettes.js';

export function recolorGroup(group, pal) {
  group.traverse(o => {
    if (o.isMesh && o.userData.role) {
      const role = o.userData.role, mat = o.material;
      if (role === 'window') { mat.color.set(pal.win); mat.emissive.set(pal.win); }
      else if (role === 'roof') { mat.color.set(pick(pal.roof)); }
      else if (role === 'trim') { mat.color.set(pick(pal.trim)); }
      else if (role === 'wall') { mat.color.set(pick(pal.wall)); }
      mat.needsUpdate = true;
    }
  });
  group.userData.paletteName = pal.name;
}

export function footprintRadius(obj) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const s = box.getSize(new THREE.Vector3());
  return 0.5 * Math.hypot(s.x, s.z) + 0.30;
}


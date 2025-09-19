import * as THREE from 'three';

export const GCache = { box: new Map(), cyl: new Map() };

export const getBox = (w, h, d) => {
  const k = `${w}|${h}|${d}`;
  if (!GCache.box.has(k)) GCache.box.set(k, new THREE.BoxGeometry(w, h, d));
  return GCache.box.get(k);
};

export const getCyl = (r, h, s = 16) => {
  const k = `${r}|${h}|${s}`;
  if (!GCache.cyl.has(k)) GCache.cyl.set(k, new THREE.CylinderGeometry(r, r, h, s));
  return GCache.cyl.get(k);
};


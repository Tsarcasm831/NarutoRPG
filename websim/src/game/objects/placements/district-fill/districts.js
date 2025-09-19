import { WORLD_SIZE } from '/src/scene/terrain.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

export function getDistrictPolygonById(districtId) {
  // Prefer live model (edited in browser) and fall back to defaults
  const liveModel = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || {};
  const districts = { ...(MAP_DEFAULT_MODEL?.districts || {}), ...(liveModel?.districts || {}) };
  const d = districts[districtId];
  if (!d || !Array.isArray(d.points) || d.points.length < 3) return null;
  const poly = d.points.map(([px, py]) => ({
    x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2,
    z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2,
  }));
  // centroid
  const c = poly.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
  const centroid = { x: c.x / poly.length, z: c.z / poly.length };
  return { poly, centroid };
}

// Utility: list district ids matching any of the given prefixes (case-insensitive)
export function listDistrictIdsByPrefix(prefixes = ['district', 'residential']) {
  const liveModel = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || {};
  const merged = { ...(MAP_DEFAULT_MODEL?.districts || {}), ...(liveModel?.districts || {}) };
  const prefs = (prefixes || []).map(p => String(p).toLowerCase());
  const ids = [];
  for (const key of Object.keys(merged)) {
    const low = key.toLowerCase();
    if (prefs.some(p => low.startsWith(p))) ids.push(key);
  }
  return ids;
}

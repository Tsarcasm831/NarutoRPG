import { DISTRICT_ENABLE_LOCALSTORAGE, DISTRICT_PERSIST_KEY_PREFIX } from './constants.js';

export function getPersistKey(id) {
  return `${DISTRICT_PERSIST_KEY_PREFIX}${id}`;
}

export function loadSavedLayout(districtId) {
  if (!DISTRICT_ENABLE_LOCALSTORAGE) return null;
  try {
    const raw = localStorage.getItem(getPersistKey(districtId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) && !(data && typeof data === 'object')) return null;
    return data;
  } catch (_) {
    return null;
  }
}

export function loadExternalLayout(districtId) {
  try {
    const d = window.__districtLayouts && window.__districtLayouts[districtId];
    // Accept either legacy array or object { meta, entries }
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') return d;
  } catch (_) {}
  return null;
}

export function saveLayout(districtId, entriesOrObj) {
  if (!DISTRICT_ENABLE_LOCALSTORAGE) return;
  try {
    localStorage.setItem(getPersistKey(districtId), JSON.stringify(entriesOrObj));
  } catch (_) {
    // ignore storage errors (quota, privacy modes)
  }
}

export function downloadLayoutAsJson(districtId, entriesOrObj) {
  try {
    const blob = new Blob([JSON.stringify(entriesOrObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${districtId}.buildings.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  } catch (_) {
    // no-op
  }
}

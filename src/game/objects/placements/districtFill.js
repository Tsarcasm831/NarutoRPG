import * as THREE from 'three';
import {
  buildingToHullPoints,
  convexHullXZ,
  polygonArea,
} from '../../../components/game/objects/citySlice.helpers.js';

import {
  DISTRICT_FILL_SOURCE,
  DISTRICT_TARGET_COVERAGE,
  DISTRICT_ALLEY_CLEARANCE,
  DISTRICT_BORDER_BAND_WIDTH,
  DISTRICT_BORDER_STEP,
  DISTRICT_AREA_PER_BUILDING,
  DISTRICT_MIN_BUILDINGS,
  DISTRICT_MAX_BUILDINGS,
  DISTRICT_SCALES,
  DISTRICT_ROT_JITTER,
  DISTRICT_MAX_ATTEMPTS,
  DISTRICT_ENABLE_LOCALSTORAGE,
  DISTRICT_PERSIST_KEY_PREFIX,
  DISTRICT_DEFAULT_VARIETY_RATIO,
} from './district-fill/constants.js';

import { makeTemplatePool, getTemplateBaseName, buildTemplateNameMap, choosePrimaryTemplate, pickTemplateWithPrimary } from './district-fill/templates.js';
import { getDistrictPolygonById, listDistrictIdsByPrefix as listIdsPrefix } from './district-fill/districts.js';
import { randomPointInPoly, signedArea, distPointSeg } from './district-fill/geometry.js';
import { tryPlaceAlongEdge, tryPlaceBuilding } from './district-fill/placementCore.js';
import { loadExternalLayout, loadSavedLayout, saveLayout, downloadLayoutAsJson } from './district-fill/persist.js';
import { buildRoadSegments, ensureNotOnRoad, obbOverlapsAnyRoad } from './shared/roadCollision.js';

// Public: place buildings inside a specific district without overlaps or boundary leakage
export function fillDistrict(scene, objectGrid, { districtId = '', source = DISTRICT_FILL_SOURCE, paletteIndex = 0, shadows = false } = {}) {
  if (!districtId) return null;
  const data = getDistrictPolygonById(districtId);
  if (!data) return null;
  const { poly, centroid } = data;
  const area = polygonArea(poly);
  // Fallback min count based on area heuristic
  const fallbackTarget = Math.max(DISTRICT_MIN_BUILDINGS, Math.min(DISTRICT_MAX_BUILDINGS, Math.round(area / DISTRICT_AREA_PER_BUILDING)));

  const root = new THREE.Group();
  root.name = `DistrictFill:${districtId}`;
  scene.add(root);

  // Auto-select Hyuuga pool for Hyuuga district unless caller overrides
  const lowId = String(districtId).toLowerCase();
  const effectiveSource = (source && source !== DISTRICT_FILL_SOURCE)
    ? source
    : (lowId.startsWith('hyuuga') ? 'hyuuga' : source);

  const templates = makeTemplatePool(THREE, { source: effectiveSource, paletteIndex });
  if (!templates || templates.length === 0) return root;

  // Build road segments once; provide a closure used by placementCore to avoid roads
  const roadSegments = buildRoadSegments();
  const avoidRoad = (b) => ensureNotOnRoad(b, roadSegments);

  // Try to load a persisted layout: faster and stable across reloads
  const savedData = loadExternalLayout(districtId) || loadSavedLayout(districtId);
  const savedIsArray = Array.isArray(savedData);
  const savedEntries = savedIsArray ? savedData : (savedData && Array.isArray(savedData.entries) ? savedData.entries : null);
  const savedMeta = savedIsArray ? null : (savedData && typeof savedData === 'object' ? (savedData.meta || null) : null);
  if (savedEntries && savedEntries.length > 0) {
    try {
      // Build a quick lookup for templates by baseName
      const map = buildTemplateNameMap(templates);
      let uniqueCounter = 0;
      const runTag = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : Date.now();
      const entries = savedEntries;
      // Determine primary variety rule if meta provides, else derive from districtId
      const primaryName = (savedMeta && savedMeta.primaryBaseName) || choosePrimaryTemplate(templates, districtId).name;
      const varietyRatio = (savedMeta && typeof savedMeta.varietyRatio === 'number') ? savedMeta.varietyRatio : DISTRICT_DEFAULT_VARIETY_RATIO;
      // Keep overlap constraints while honoring saved positions by re-fitting scales
      const placedOBBsSaved = [];
      for (let idx = 0; idx < entries.length; idx++) {
        const e = entries[idx];
        const baseName = e?.baseName || 'Building';
        // Prefer a matching template by name; otherwise pick a deterministic variety based on district/position/index
        let tpl = map.get(baseName);
        if (!tpl || baseName === 'Building') {
          // Choose primary by default, allow some variety
          tpl = pickTemplateWithPrimary(templates, primaryName, varietyRatio) || templates[0];
        }

        // Order candidate relative scales by closeness to saved absolute scale ratio, then try smaller for fitting
        const tmp = tpl.clone(true);
        const templateScale = tmp.scale?.x || 1;
        const savedRatio = (typeof e.scale === 'number' && templateScale > 0) ? (e.scale / templateScale) : 1;
        const ordered = [...DISTRICT_SCALES].sort((a, b) => Math.abs(a - savedRatio) - Math.abs(b - savedRatio));

        const res = tryPlaceBuilding({
          tpl,
          pos: { x: e.pos?.[0] ?? 0, z: e.pos?.[1] ?? 0 },
          rot: e.rotY ?? 0,
          scales: ordered,
          poly,
          root,
          placedOBBs: placedOBBsSaved,
          clearance: DISTRICT_ALLEY_CLEARANCE
        });

        if (res.building) {
          const chosenName = getTemplateBaseName(tpl) || baseName || 'Building';
          // Prefer the saved entry's baseName (e.g., unique name like "building-#") for display/tooltips
          const displayName = (typeof e.baseName === 'string' && e.baseName.trim() !== '') ? e.baseName : chosenName;
          const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
          res.building.name = `${displayName} [${uid}]`;
          res.building.userData = { ...(res.building.userData || {}), uid, baseName: displayName, templateName: chosenName };
          placedOBBsSaved.push(res.obb);
        }
      }
      // Colliders are built below for root.children
      root.traverse(o => { if (o.isMesh) { o.castShadow = !!shadows; o.receiveShadow = !!shadows; } });
      if (objectGrid) {
        root.children.forEach((building) => {
          if (!building) return;
          try { building.updateWorldMatrix(true, true); } catch (_) {}
          const pts = buildingToHullPoints(building);
          const hull = convexHullXZ(pts);
          if (hull.length >= 3) {
            const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
            const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
            const proxy = new THREE.Object3D();
            proxy.position.set(cx, 0, cz);
            proxy.userData = {
              label: (building.userData?.baseName || building.name || 'District Building'),
              collider: { type: 'polygon', points: hull }
            };
            objectGrid.add(proxy);
            scene.add(proxy);
          }
        });
      }
      return root;
    } catch (e) {
      console.warn('Failed to load saved layout for', districtId, e);
    }
  }

  // Unique naming context for this run
  const runTag = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : Date.now();
  let uniqueCounter = 0;

  const placedOBBs = [];
  const placedHullAreas = [];
  const coverage = () => (placedHullAreas.reduce((s, a) => s + a, 0)) / Math.max(1, area);

  // Helper: tag naming
  function tagBuilding(b, baseName) {
    const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
    b.name = `${baseName} [${uid}]`;
    b.userData = { ...(b.userData || {}), uid, baseName };
  }

  // Choose a primary template for this district (majority of placements)
  const primary = choosePrimaryTemplate(templates, districtId);
  const varietyRatio = DISTRICT_DEFAULT_VARIETY_RATIO;

  // Phase 1: prioritize outer borders — align building sides with border and push inward by clearance
  const orientSign = signedArea(poly) >= 0 ? 1 : -1; // +1 for CCW
  const edgeSamples = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ez = b.z - a.z;
    const elen = Math.hypot(ex, ez);
    if (elen < 1e-6) continue;
    const nx = (orientSign > 0 ? -ez : ez) / elen; // inward normal
    const nz = (orientSign > 0 ? ex : -ex) / elen;
    const steps = Math.max(1, Math.floor(elen / DISTRICT_BORDER_STEP));
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps; // center samples along the edge
      edgeSamples.push({ a, b, t, inward: { x: nx, z: nz } });
    }
  }
  // Shuffle samples to avoid clumping per-edge
  for (let i = edgeSamples.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [edgeSamples[i], edgeSamples[j]] = [edgeSamples[j], edgeSamples[i]];
  }
  for (let si = 0; si < edgeSamples.length; si++) {
    const s = edgeSamples[si];
    const tpl = pickTemplateWithPrimary(templates, primary.name, varietyRatio) || templates[0];
    if (!tpl) break;
    const baseName = tpl.name || 'Building';
        const res = tryPlaceAlongEdge({ tpl, edgeA: s.a, edgeB: s.b, t: s.t, inwardNormal: s.inward, scales: DISTRICT_SCALES, poly, root, placedOBBs, clearance: DISTRICT_ALLEY_CLEARANCE, avoidRoad });
    if (res.building) {
      tagBuilding(res.building, baseName);
      placedOBBs.push(res.obb);
      const pts = buildingToHullPoints(res.building);
      const hull = convexHullXZ(pts);
      if (hull.length >= 3) placedHullAreas.push(polygonArea(hull));
    }
  }

  // Phase 2: biased interior fill (still favor near-border)
  let guard = 0;
  let failStreak = 0;
  const FAIL_STREAK_LIMIT = 200;
  while (guard < DISTRICT_MAX_ATTEMPTS && failStreak < FAIL_STREAK_LIMIT) {
    guard++;
    const tpl = pickTemplateWithPrimary(templates, primary.name, varietyRatio) || templates[0];
    if (!tpl) break;
    // rejection sample with bias: accept point if within band or with probability proportional to 1/(1+d)
    const pos = randomPointInPoly(poly, centroid);
    // Align rotation to nearest edge tangent (no random jitter)
    let best = { d: Infinity, rot: 0 };
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const d = distPointSeg(pos, a, b);
      if (d < best.d) {
        best.d = d;
        const ex = b.x - a.x, ez = b.z - a.z;
        best.rot = Math.atan2(ez, ex);
      }
    }
    const rot = best.rot;
    const baseName = tpl.name || 'Building';
    const res = tryPlaceBuilding({ tpl, pos, rot, scales: DISTRICT_SCALES, poly, root, placedOBBs, clearance: DISTRICT_ALLEY_CLEARANCE, avoidRoad });
    if (res.building) {
      tagBuilding(res.building, baseName);
      placedOBBs.push(res.obb);
      const pts = buildingToHullPoints(res.building);
      const hull = convexHullXZ(pts);
      if (hull.length >= 3) placedHullAreas.push(polygonArea(hull));
      failStreak = 0;
    } else {
      failStreak++;
    }
  }

  // Persist the resulting layout for future loads
  try {
    const entries = root.children
      .filter(ch => ch && !ch.userData?.collider)
      .map(b => ({
        baseName: (b.userData?.baseName || b.name || 'Building').replace(/\s*\[[^\]]+\]$/, ''),
        pos: [b.position.x, b.position.z],
        rotY: b.rotation?.y || 0,
        scale: b.scale?.x || 1
      }));
    if (entries.length > 0) {
      const layoutObj = {
        meta: {
          primaryBaseName: primary?.name || null,
          varietyRatio,
          source,
          paletteIndex
        },
        entries
      };
      saveLayout(districtId, layoutObj);
      // Cache in-memory so subsequent consumers in this session can use it
      try {
        window.__districtLayouts = window.__districtLayouts || {};
        window.__districtLayouts[districtId] = layoutObj;
      } catch (_) { /* ignore */ }
      // Also trigger a downloadable JSON so it can be committed to the repo (static load on next run)
      downloadLayoutAsJson(districtId, layoutObj);
      // Expose quick dev export hook once per session
      if (!window.__exportDistrictLayout) {
        window.__exportDistrictLayout = (id) => {
          try {
            const raw = loadSavedLayout(id);
            if (raw) downloadLayoutAsJson(id, raw);
          } catch (_) {}
        };
      }
    }
  } catch (e) {
    console.warn('Failed to persist layout for', districtId, e);
  }

  // Lighting flags
  root.traverse(o => { if (o.isMesh) { o.castShadow = !!shadows; o.receiveShadow = !!shadows; } });

  // Build polygon colliders and add to grid + scene
  if (objectGrid) {
    root.children.forEach((building) => {
      if (!building) return;
      try { building.updateWorldMatrix(true, true); } catch (_) {}
      const pts = buildingToHullPoints(building);
      const hull = convexHullXZ(pts);
      if (hull.length >= 3) {
        const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
        const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
        const proxy = new THREE.Object3D();
        proxy.position.set(cx, 0, cz);
        proxy.userData = {
          label: (building.userData?.baseName || building.name || 'District Building'),
          collider: { type: 'polygon', points: hull },
        };
        objectGrid.add(proxy);
        scene.add(proxy); // Add directly in world for consistent transforms
      }
    });
  }

  return root;
}

export function listDistrictIdsByPrefix(prefixes = ['district', 'residential']) {
  return listIdsPrefix(prefixes);
}

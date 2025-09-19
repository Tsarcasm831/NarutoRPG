import * as THREE from 'three';
import { buildKitbashSet } from '../../../components/game/objects/kitbash.builds.js';
import { buildingToHullPoints, convexHullXZ, getBuildingOBB, buildingFullyInsidePolys, buildingFullyInsidePoly, obbOverlaps, polygonArea } from '../../../components/game/objects/citySlice.helpers.js';
// Extracted constants and helpers
import {
  KITBASH_ORIGIN,
  KITBASH_ROWS,
  KITBASH_COLS,
  KITBASH_SPACING_X,
  KITBASH_SPACING_Z,
  KITBASH_SCALE,
  KITBASH_JITTER_ROT,
  KITBASH_MAX_NUDGE,
  KITBASH_NUDGE_STEP,
  KITBASH_DISTRICT_ENFORCE,
  KITBASH_DROP_IF_FAIL,
  KITBASH_AREA_PER_BUILDING,
  KITBASH_MIN_TOTAL_PER_DISTRICT,
  KITBASH_MAX_TOTAL_PER_DISTRICT,
  KITBASH_MIN_LOCAL_SCALE,
} from './kitbash/constants.js';
import {
  makeDistrictPolysAndCentroids,
  nudgeTowardNearestDistrict,
  overlapsAnyCitySlice,
  countPolygonsInsidePoly,
  ensureMinLocalScale,
} from './kitbash/helpers.js';
import { buildRoadSegments, obbOverlapsAnyRoad, ensureNotOnRoad } from './shared/roadCollision.js';

// helpers moved to ./kitbash/helpers.js

export function placeKitbash(scene, objectGrid, settings) {
  try {
    const root = new THREE.Group();
    root.name = 'KitbashRoot';
    scene.add(root);
    // Apply final scale up front so all world-matrix based checks use correct sizes
    root.scale.setScalar(KITBASH_SCALE);

    // District model from live map (or defaults)
    const { polys: districtPolys, cents: districtCentroids } = makeDistrictPolysAndCentroids();

    // Unique naming context for this placement run
    const runTag = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : Date.now();
    let uniqueCounter = 0;

    // Build meshes
    const builds = buildKitbashSet(THREE, { count: KITBASH_ROWS * KITBASH_COLS, paletteIndex: settings?.citySlicePaletteIndex ?? 0 });

    // Precompute road segments for road avoidance across placements
    const roadSegments = buildRoadSegments();

    // Layout grid around origin
    const X0 = KITBASH_ORIGIN.x - (KITBASH_COLS - 1) * KITBASH_SPACING_X / 2;
    const Z0 = KITBASH_ORIGIN.z - (KITBASH_ROWS - 1) * KITBASH_SPACING_Z / 2;

    let idx = 0;
    for (let r = 0; r < KITBASH_ROWS; r++) {
      for (let c = 0; c < KITBASH_COLS; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        // Assign unique name/identifier to each building
        const baseName = b.name || 'Kitbash Building';
        const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
        b.name = `${baseName} [${uid}]`;
        b.userData = { ...(b.userData || {}), uid, baseName };
        const px = X0 + c * KITBASH_SPACING_X;
        const pz = Z0 + r * KITBASH_SPACING_Z;
        b.position.set(px, 0, pz);
        b.rotation.y = (Math.random() - 0.5) * KITBASH_JITTER_ROT;
        root.add(b);
        // Keep local scale from going below our minimum (uniform)
        ensureMinLocalScale(b);

        // Avoid overlapping CitySlice: nudge outward if needed (use world OBB size)
        b.updateWorldMatrix(true, true);
        let obb = getBuildingOBB(b);
        let radius = Math.max(obb.hx, obb.hz);
        let center = new THREE.Vector3(obb.center.x, 0, obb.center.z);
        if (objectGrid && overlapsAnyCitySlice(center, radius, objectGrid)) {
          // Nudge in spiral pattern until free
          let placed = false;
          const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [-1, 1], [1, -1], [-1, -1]
          ];
          const step = KITBASH_NUDGE_STEP;
          for (let k = 1; k <= KITBASH_MAX_NUDGE && !placed; k++) {
            for (let d = 0; d < dirs.length && !placed; d++) {
              const nx = px + dirs[d][0] * step * k;
              const nz = pz + dirs[d][1] * step * k;
              b.position.set(nx, 0, nz);
              b.updateWorldMatrix(true, true);
              obb = getBuildingOBB(b);
              center.set(obb.center.x, 0, obb.center.z);
              radius = Math.max(obb.hx, obb.hz);
              if (!overlapsAnyCitySlice(center, radius, objectGrid)) {
                placed = true;
              }
            }
          }
          if (!placed) {
            // Could not find a non-overlapping spot; drop this building
            root.remove(b);
          }
        }

        // Enforce no-road overlap (nudge away; drop if fails)
        if (root.children.includes(b)) {
          try { b.updateWorldMatrix(true, true); } catch (_) {}
          if (obbOverlapsAnyRoad(getBuildingOBB(b), roadSegments)) {
            const ok = ensureNotOnRoad(b, roadSegments);
            if (!ok || obbOverlapsAnyRoad(getBuildingOBB(b), roadSegments)) {
              root.remove(b);
            }
          }
        }

        // Enforce district containment (after any overlap resolution)
        if (KITBASH_DISTRICT_ENFORCE && districtPolys.length > 0 && root.children.includes(b)) {
          if (!buildingFullyInsidePolys(b, districtPolys)) {
            const ok = nudgeTowardNearestDistrict(b, districtCentroids, districtPolys, buildingFullyInsidePolys);
            if (!ok || !buildingFullyInsidePolys(b, districtPolys)) {
              if (KITBASH_DROP_IF_FAIL) {
                root.remove(b);
              }
            }
          }
        }
      }
    }

    // Area-based backfill: for each district, ensure total buildings (slice + kitbash) reaches a target by area
    if (KITBASH_DISTRICT_ENFORCE && districtPolys.length > 0 && objectGrid) {
      const newlyPlaced = root.children.slice(); // Buildings from grid placement
      // Prepare a small template pool to clone from if we need extras
      const templatePool = root.children.filter(Boolean);
      const getTemplate = () => {
        if (templatePool.length > 0) return templatePool[(Math.random() * templatePool.length) | 0];
        const [one] = buildKitbashSet(THREE, { count: 1, paletteIndex: settings?.citySlicePaletteIndex ?? 0 });
        // scale will be applied via root scale
        return one;
      };
      // Helper: uniform sample inside polygon (rejection over bbox)
      const sampleInside = (poly, centroid) => {
        const bbox = poly.reduce((b, p) => ({
          minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
          minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z)
        }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
        for (let t = 0; t < 150; t++) {
          const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
          const z = bbox.minZ + Math.random() * (bbox.maxZ - bbox.minZ);
          if (pointInPolyXZ({ x, z }, poly)) return { x, z };
        }
        return { x: centroid.x, z: centroid.z };
      };
      for (let i = 0; i < districtPolys.length; i++) {
        const poly = districtPolys[i];
        const centroid = districtCentroids[i];
        const area = polygonArea(poly);
        const totalTarget = Math.max(
          KITBASH_MIN_TOTAL_PER_DISTRICT,
          Math.min(KITBASH_MAX_TOTAL_PER_DISTRICT, Math.round(area / KITBASH_AREA_PER_BUILDING))
        );
        const citySliceBuildings = countPolygonsInsidePoly(objectGrid, poly, centroid);
        const kitbashBuildings = newlyPlaced.filter(b => buildingFullyInsidePoly(b, poly)).length;
        const present = citySliceBuildings + kitbashBuildings;

        // Existing kitbash OBBs within this district to avoid overlaps
        const existingKitbashOBBs = newlyPlaced
          .filter(b => buildingFullyInsidePoly(b, poly))
          .map(getBuildingOBB);
        const placedOBBs = [];

        let needed = Math.max(0, totalTarget - present);
        while (needed > 0) {
          const tpl = getTemplate();
          if (!tpl) break;
          const b = tpl.clone(true);
          const baseName = b.name || 'Kitbash Building';
          const uid = `${runTag}-${(++uniqueCounter).toString().padStart(3, '0')}`;
          b.name = `${baseName} [${uid}]`;
          b.userData = { ...(b.userData || {}), uid, baseName };
          let placed = false;
          const tries = 320;
          for (let t = 0; t < tries && !placed; t++) {
            const { x: px, z: pz } = sampleInside(poly, centroid);
            b.position.set(px, 0, pz);
            b.rotation.y = (Math.random() - 0.5) * KITBASH_JITTER_ROT;
            // Try descending scales to fit small districts
            const templateScale = tpl.scale?.x || 1;
            const scales = [1.0, 0.85, 0.7, 0.55, 0.42, 0.34, 0.28];
            for (let si = 0; si < scales.length && !placed; si++) {
              b.scale.setScalar(Math.max(KITBASH_MIN_LOCAL_SCALE, templateScale * scales[si]));
              try { b.updateWorldMatrix(true, true); } catch (_) {}
              if (!buildingFullyInsidePoly(b, poly)) continue;
              const obb = getBuildingOBB(b);
              // Avoid CitySlice via spatial grid
              const center = { x: obb.center.x, z: obb.center.z };
              const radius = Math.max(obb.hx, obb.hz);
              if (overlapsAnyCitySlice(center, radius, objectGrid)) continue;
              // Avoid roads with nudge attempt
              if (obbOverlapsAnyRoad(obb, roadSegments)) {
                const okRoad = ensureNotOnRoad(b, roadSegments);
                try { b.updateWorldMatrix(true, true); } catch (_) {}
                if (!okRoad || obbOverlapsAnyRoad(getBuildingOBB(b), roadSegments)) continue;
                if (!buildingFullyInsidePoly(b, poly)) continue; // ensure still inside after nudge
              }
              // Avoid existing/placed kitbash via OBB overlap
              const okVsExisting = existingKitbashOBBs.every(o => !obbOverlaps(obb, o));
              const okVsPlaced = placedOBBs.every(o => !obbOverlaps(obb, o));
              if (!okVsExisting || !okVsPlaced) continue;
              root.add(b);
              placedOBBs.push(obb);
              placed = true;
            }
          }
          if (!placed) {
            // Relaxed fallback to ensure at least minimal coverage
            const { x: px, z: pz } = centroid;
            const templateScale = tpl.scale?.x || 1;
            b.position.set(px, 0, pz);
            b.rotation.y = (Math.random() - 0.5) * KITBASH_JITTER_ROT;
            b.scale.setScalar(Math.max(KITBASH_MIN_LOCAL_SCALE, templateScale * 0.28));
            // Only add if not on a road
            try { b.updateWorldMatrix(true, true); } catch (_) {}
            if (!obbOverlapsAnyRoad(getBuildingOBB(b), roadSegments)) {
              root.add(b);
            }
          }
          needed--;
        }
      }
    }

    // Lighting/shadows and scale first so matrices represent final transforms
    root.traverse(o => { if (o.isMesh) { o.castShadow = !!settings?.shadows; o.receiveShadow = !!settings?.shadows; } });
    root.scale.setScalar(KITBASH_SCALE);

    // Build colliders and proxies with unique interaction handler
    if (objectGrid) {
      root.children.forEach((building) => {
        if (!building) return;
        // Ensure world matrices are up to date (important after applying root scale)
        try { building.updateWorldMatrix(true, true); } catch (_) {}
        const pts = buildingToHullPoints(building);
        const hull = convexHullXZ(pts);
        if (hull.length >= 3) {
          const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
          const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
          const proxy = new THREE.Object3D();
          proxy.position.set(cx, 0, cz);
          proxy.userData = {
            label: building.name || 'Kitbash Building',
            collider: { type: 'polygon', points: hull },
            onInteract: () => {
              try {
                window.dispatchEvent(new CustomEvent('open-kitbash-building', {
                  detail: {
                    name: building.name || 'Kitbash Building',
                    palette: building.userData?.paletteName || 'custom'
                  }
                }));
              } catch (_) { /* no-op */ }
            }
          };
          objectGrid.add(proxy);
          // Add directly to the scene to avoid inheriting root scale on the proxy transform
          scene.add(proxy);
          // Also attach a color hint for minimap
          try { proxy.userData.colorHex = 'c084fc'; } catch (_) {}
        }
      });
    }

    return root;
  } catch (e) {
    console.warn('Failed to place Kitbash set:', e);
    return null;
  }
}

import { buildingFullyInsidePoly, obbOverlaps, getBuildingOBB } from '../../../../components/game/objects/citySlice.helpers.js';
import { obbWithClearance, supportExtentAlong } from './geometry.js';

export function tryPlaceAlongEdge({ tpl, edgeA, edgeB, t, inwardNormal, scales, poly, root, placedOBBs, clearance, avoidRoad }) {
  const ex = edgeB.x - edgeA.x, ez = edgeB.z - edgeA.z;
  const tx = edgeA.x + ex * t, tz = edgeA.z + ez * t;
  const rot = Math.atan2(ez, ex);
  const b = tpl.clone(true);
  b.rotation.y = rot;
  const templateScale = b.scale?.x || 1;
  for (let si = 0; si < scales.length; si++) {
    b.scale.setScalar(Math.max(0.25, templateScale * scales[si]));
    // start at edge sample, then push inward to align side with border
    b.position.set(tx, 0, tz);
    try { b.updateWorldMatrix(true, true); } catch (_) {}
    const obb0 = getBuildingOBB(b);
    const ext = supportExtentAlong(obb0, inwardNormal.x, inwardNormal.z);
    b.position.set(tx + inwardNormal.x * (clearance + ext), 0, tz + inwardNormal.z * (clearance + ext));
    try { b.updateWorldMatrix(true, true); } catch (_) {}
    if (!buildingFullyInsidePoly(b, poly)) continue;
    const obb = getBuildingOBB(b);
    const obbInflated = obbWithClearance(obb, clearance);
    const okNoOverlap = placedOBBs.every(o => !obbOverlaps(obbInflated, o));
    if (!okNoOverlap) continue;
    root.add(b);
    // Optional road avoidance: if provided and fails, discard and continue
    if (typeof avoidRoad === 'function') {
      const okRoad = avoidRoad(b);
      if (!okRoad) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      // Recompute OBB after potential nudge and re-validate constraints
      try { b.updateWorldMatrix(true, true); } catch (_) {}
      const obb2 = getBuildingOBB(b);
      if (!buildingFullyInsidePoly(b, poly)) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      const okNoOverlap2 = placedOBBs.every(o => !obbOverlaps(obbWithClearance(obb2, clearance), o));
      if (!okNoOverlap2) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      return { building: b, obb: obb2 };
    }
    return { building: b, obb };
  }
  try { b.removeFromParent?.(); } catch (_) {}
  return { building: null, obb: null };
}

export function tryPlaceBuilding({ tpl, pos, rot, scales, poly, root, placedOBBs, clearance, avoidRoad }) {
  const b = tpl.clone(true);
  b.position.set(pos.x, 0, pos.z);
  b.rotation.y = rot;
  const templateScale = b.scale?.x || 1;
  for (let si = 0; si < scales.length; si++) {
    b.scale.setScalar(Math.max(0.25, templateScale * scales[si]));
    try { b.updateWorldMatrix(true, true); } catch (_) {}
    if (!buildingFullyInsidePoly(b, poly)) continue;
    const obb = getBuildingOBB(b);
    const obbInflated = obbWithClearance(obb, clearance);
    const okNoOverlap = placedOBBs.every(o => !obbOverlaps(obbInflated, o));
    if (!okNoOverlap) continue;
    root.add(b);
    if (typeof avoidRoad === 'function') {
      const okRoad = avoidRoad(b);
      if (!okRoad) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      // Recompute and re-validate
      try { b.updateWorldMatrix(true, true); } catch (_) {}
      const obb2 = getBuildingOBB(b);
      if (!buildingFullyInsidePoly(b, poly)) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      const okNoOverlap2 = placedOBBs.every(o => !obbOverlaps(obbWithClearance(obb2, clearance), o));
      if (!okNoOverlap2) { try { b.removeFromParent?.(); } catch (_) {}; continue; }
      return { building: b, obb: obb2 };
    }
    return { building: b, obb };
  }
  try { b.removeFromParent?.(); } catch (_) {}
  return { building: null, obb: null };
}

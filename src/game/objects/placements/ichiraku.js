import { parseGridLabel, posForCell } from '../utils/gridLabel.js';
import { createIchiraku } from '../houses/ichiraku.js';
import * as THREE from 'three';

// Place the Ichiraku ramen shop at a specific grid label.
export function placeIchiraku(scene, objectGrid, worldSize, settings, label = 'MS387') {
  try {
    const { i, j } = parseGridLabel(label);
    const pos = posForCell(i, j, worldSize);
    pos.y = 0;

    const { group, colliderProxies } = createIchiraku({ position: pos, settings });

    // Apply requested transform: rotate 90deg clockwise and scale 2x
    const SCALE = 2;
    const YAW = Math.PI * 1.5; // 180° from current (previously +90°)
    group.rotation.y = YAW;
    group.scale.set(SCALE, SCALE, SCALE);

    // Update collider proxies to match rotation/scale around placement center
    if (Array.isArray(colliderProxies)) {
      const cos = Math.cos(YAW), sin = Math.sin(YAW);
      colliderProxies.forEach(proxy => {
        const ldx = proxy.position.x - pos.x;
        const ldz = proxy.position.z - pos.z;
        // rotate then scale the local offset around center
        const rdx = ldx * cos + ldz * sin;
        const rdz = -ldx * sin + ldz * cos;
        const ndx = rdx * SCALE;
        const ndz = rdz * SCALE;
        const wx = pos.x + ndx;
        const wz = pos.z + ndz;

        proxy.position.set(wx, 0, wz);
        if (proxy.userData && proxy.userData.collider) {
          const col = proxy.userData.collider;
          col.center = { x: wx, z: wz };
          if (col.halfExtents) {
            col.halfExtents = {
              x: (col.halfExtents.x || 0) * SCALE,
              z: (col.halfExtents.z || 0) * SCALE
            };
          }
          col.rotationY = YAW;
          proxy.userData.collider = col;
        }
      });
    }
    // NEW: enforce full containment of Ichiraku within a district via its OBB proxies
    const live = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || null;
    const polys = live?.districts ? Object.values(live.districts)
      .filter(d=>Array.isArray(d.points)&&d.points.length>=3)
      .map(d=>d.points.map(([px,py])=>({ x:(px/100)*worldSize - worldSize/2, z:(py/100)*worldSize - worldSize/2 }))) : [];
    const pointInPoly = (p, poly)=>{ let s=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const a=poly[i],b=poly[j]; const inter=((a.z>p.z)!==(b.z>p.z))&&(p.x< (b.x-a.x)*(p.z-a.z)/((b.z-a.z)||1e-9)+a.x); if(inter) s=!s;} return s; };
    const obbCorners = (obb)=>{ const c=obb.center, hx=obb.halfExtents.x, hz=obb.halfExtents.z, a=obb.rotationY||0; const cos=Math.cos(a), sin=Math.sin(a); const pts=[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]]; return pts.map(([x,z])=>({ x:c.x + x*cos - z*sin, z:c.z + x*sin + z*cos })); };
    const proxyFullyInside = (p)=> polys.length===0 ? true : polys.some(poly => obbCorners(p.userData.collider).every(pt=>pointInPoly(pt,poly)));
    if (Array.isArray(colliderProxies) && colliderProxies.some(p=>p.userData?.collider?.type==='obb') && !colliderProxies.every(proxyFullyInside)) {
      // Skip placement if not fully inside any district
      return null;
    }

    scene.add(group);

    if (Array.isArray(colliderProxies)) {
      colliderProxies.forEach(proxy => {
        scene.add(proxy);
        objectGrid.add(proxy);
      });
    }

    return group;
  } catch (e) {
    console.warn(`Failed to place Ichiraku at ${label}:`, e);
    return null;
  }
}

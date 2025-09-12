import * as THREE from "three";

export function createPhysics(camera, controls, colliders){
  const state = {
    keys: { forward:false, back:false, left:false, right:false, run:false },
    velocity: new THREE.Vector3(),
    speed: 7.8,
    runMul: 2.0,
    playerRadius: 0.28,
    tmp: new THREE.Vector3(),
    eyeHeight: 1.72
  };

  function onKey(e, down){
    switch(e.code){
      case 'KeyW': state.keys.forward = down; break;
      case 'KeyS': state.keys.back = down; break;
      case 'KeyA': state.keys.left = down; break;
      case 'KeyD': state.keys.right = down; break;
      case 'ShiftLeft': case 'ShiftRight': state.keys.run = down; break;
    }
  }

  const dir = new THREE.Vector3(), forward = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3(), up = new THREE.Vector3(0,1,0);
  const cp = new THREE.Vector3(), normal = new THREE.Vector3();
  const segA = new THREE.Vector3(), segB = new THREE.Vector3(), segDir = new THREE.Vector3(), q = new THREE.Vector3();

  function closestPointToOBB(obb,p,out){
    const e=obb.rotation.elements,dx=p.x-obb.center.x,dy=p.y-obb.center.y,dz=p.z-obb.center.z;
    const lx=dx*e[0]+dy*e[1]+dz*e[2], ly=dx*e[3]+dy*e[4]+dz*e[5], lz=dx*e[6]+dy*e[7]+dz*e[8];
    const cx=Math.max(-obb.halfSize.x,Math.min(obb.halfSize.x,lx));
    const cy=Math.max(-obb.halfSize.y,Math.min(obb.halfSize.y,ly));
    const cz=Math.max(-obb.halfSize.z,Math.min(obb.halfSize.z,lz));
    const wx=cx*e[0]+cy*e[3]+cz*e[6]+obb.center.x, wy=cx*e[1]+cy*e[4]+cz*e[7]+obb.center.y, wz=cx*e[2]+cy*e[5]+cz*e[8]+obb.center.z;
    return out.set(wx,wy,wz);
  }

  function update(dt){
    if (!controls.isLocked) return;

    dir.set(0,0,0);
    if (state.keys.forward) dir.z += 1;
    if (state.keys.back) dir.z -= 1;
    if (state.keys.left) dir.x -= 1;
    if (state.keys.right) dir.x += 1;
    if (dir.lengthSq() > 0) dir.normalize();

    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    right.crossVectors(forward, up).normalize();
    wish.set(0,0,0).addScaledVector(forward, dir.z).addScaledVector(right, dir.x);
    if (wish.lengthSq() > 0) wish.normalize();

    const damping = Math.exp(-8 * dt);
    state.velocity.multiplyScalar(damping);
    if (dir.lengthSq() > 0){
      state.velocity.addScaledVector(wish, state.speed * (state.keys.run ? state.runMul : 1.0) * dt);
    }

    state.tmp.copy(camera.position).addScaledVector(state.velocity, dt);
    state.tmp.y = state.eyeHeight;

    const r = state.playerRadius, eps = 1e-4;
    segA.set(state.tmp.x, r, state.tmp.z);
    segB.set(state.tmp.x, state.eyeHeight - r, state.tmp.z);
    segDir.subVectors(segB, segA);
    const segLenSq = Math.max(segDir.lengthSq(), 1e-6);

    for (let i=0;i<colliders.length;i++){
      const obb = colliders[i];

      const toA = q.subVectors(obb.center, segA);
      let t = THREE.MathUtils.clamp(toA.dot(segDir) / segLenSq, 0, 1);
      const pSeg1 = cp.copy(segA).addScaledVector(segDir, t);
      const pObb1 = closestPointToOBB(obb, pSeg1, normal);

      const toA2 = q.subVectors(pObb1, segA);
      t = THREE.MathUtils.clamp(toA2.dot(segDir) / segLenSq, 0, 1);
      const pSeg2 = cp.copy(segA).addScaledVector(segDir, t);
      const pObb2 = closestPointToOBB(obb, pSeg2, q);

      normal.subVectors(pSeg2, pObb2);
      const distSq = normal.lengthSq();
      const rSq = r*r;
      if (distSq < rSq){
        normal.y = 0;
        const len = normal.length() || 1e-6;
        normal.multiplyScalar(1/len);
        const push = (r - Math.min(Math.sqrt(distSq), r)) + eps;
        state.tmp.addScaledVector(normal, push);
        segA.x = state.tmp.x; segA.z = state.tmp.z;
        segB.x = state.tmp.x; segB.z = state.tmp.z;

        const vn = state.velocity.dot(normal);
        if (vn < 0) state.velocity.addScaledVector(normal, -vn);
      }
    }

    camera.position.copy(state.tmp);
  }

  return { onKey, update, state };
}
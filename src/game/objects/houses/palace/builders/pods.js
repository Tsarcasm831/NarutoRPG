import * as THREE from 'three';

export function buildPods(CFG, mats) {
  const group = new THREE.Group();
  CFG.podPositions.forEach(p => {
    const size = p.large ? CFG.podLarge : CFG.podNormal;
    const pod = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(size.r, size.r, size.h, 48), mats.redWallMat);
    body.position.y = size.h / 2;
    body.castShadow = body.receiveShadow = true;
    pod.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(size.r * 0.92, size.r * 0.92, size.capH, 48), mats.whiteMat);
    cap.position.y = size.h + size.capH / 2;
    cap.castShadow = cap.receiveShadow = true;
    pod.add(cap);

    pod.position.set(p.x, 0, p.z);
    group.add(pod);
  });
  return group;
}


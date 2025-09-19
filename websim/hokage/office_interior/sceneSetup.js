import * as THREE from "three";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";
import { OBB } from "https://unpkg.com/three@0.160.0/examples/jsm/math/OBB.js";
import { buildWalls, buildDesk, buildProps, buildSkyline } from "./builders.js";
import { makeConcrete } from "./textures.js";

export function setupScene(container, onLockChange){
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  const isMobile = (window.innerWidth <= 820);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xCFE7FF);
  const camera = new THREE.PerspectiveCamera(70, container.clientWidth/container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.72, 0);

  const controls = new PointerLockControls(camera, renderer.domElement);
  controls.addEventListener('lock', () => onLockChange(true));
  controls.addEventListener('unlock', () => onLockChange(false));

  const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x22282f, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1c4, 0.85);
  sun.position.set(8, 10, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xbfa57a, 0.22));

  const floorTex = new THREE.CanvasTexture(makeConcrete(1024));
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(2.5, 2.5);
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(7.0, 7.0, 0.06, 64),
    new THREE.MeshStandardMaterial({ color: 0x868B8E, map: floorTex, roughness: 0.85, metalness: 0.05 })
  );
  floor.receiveShadow = true;
  floor.position.y = -0.03;
  scene.add(floor);

  const ceilingTex = new THREE.CanvasTexture(makeConcrete(1024));
  ceilingTex.wrapS = ceilingTex.wrapT = THREE.RepeatWrapping;
  ceilingTex.repeat.set(2, 2);
  const ceiling = new THREE.Mesh(
    new THREE.CylinderGeometry(7.0, 7.0, 0.08, 64),
    new THREE.MeshStandardMaterial({ color: 0xB79C6A, map: ceilingTex, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide })
  );
  ceiling.position.y = 3.1;
  scene.add(ceiling);

  buildWalls(scene);

  const desk = buildDesk();
  desk.position.set(0, 0, -1.6);
  scene.add(desk);
  const props = buildProps();
  desk.add(props);

  const skyline = buildSkyline();
  skyline.position.y = 0;
  scene.add(skyline);

  function onResize(){
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  const colliders = [];
  scene.traverse(o => {
    if (o.isMesh && o.userData && o.userData.collide && o.geometry) {
      o.updateWorldMatrix(true, false);
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox.clone();
      const obb = new OBB(bb.getCenter(new THREE.Vector3()), bb.getSize(new THREE.Vector3()).multiplyScalar(0.5));
      obb.applyMatrix4(o.matrixWorld);
      colliders.push(obb);
    }
  });

  const cleanupScene = () => {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  };

  return { renderer, scene, camera, controls, colliders, cleanupScene, isMobile };
}
// @tweakable base path anchor for terrain imports (change only if your host serves /src under a different root)
import { WORLD_SIZE as WORLD_SIZE_CONST } from '../../scene/terrain.js';
import { ObjectGrid } from './grid.js';
/* @tweakable enable targeted removal of specific Hokage Office instances by grid label */
const HOKAGE_OFFICE_CLEANUP_ENABLED = true;
/* @tweakable labels to remove Hokage Office from (e.g., duplicates/strays) */
const HOKAGE_OFFICE_BLOCKED_LABELS = ['KM300'];
/* @tweakable removal radius (world units) around the label center to match office parts/colliders */
const HOKAGE_OFFICE_CLEANUP_RADIUS = 280;
// @tweakable enable/disable spawning CitySlice buildings
const ENABLE_CITY_SLICE = false;
// @tweakable enable/disable spawning Kitbash buildings
const ENABLE_KITBASH = false;
import { placeHokagePalace } from './placements/hokagePalace.js';
import { placeHokageMonument } from './placements/hokageMonument.js';
import { placeIchiraku } from './placements/ichiraku.js';
import { placeHospital } from './placements/hospital.js';
import { placeArena } from './placements/arena.js';
import { placeCitySlice } from './placements/citySlice.js';
import { placeKitbash } from './placements/kitbash.js';
// Forest placement (random deciduous assortment)
import { placeDeciduousTreesInForests } from './placements/trees/index.js';
import { fillDistrict, listDistrictIdsByPrefix } from './placements/districtFill.js';
import { parseGridLabel, posForCell } from './utils/gridLabel.js';
import * as THREE from 'three';


function spawnFestivalDecor(scene, objectGrid) {
  const group = new THREE.Group();
  group.name = 'EventFestivalDecor';
  const lanternPositions = [
    { x: 18, z: 12 },
    { x: -18, z: 12 },
    { x: 18, z: -12 },
    { x: -18, z: -12 }
  ];
  lanternPositions.forEach((pos, idx) => {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffc978 }));
    lantern.position.set(pos.x, 8.5, pos.z);
    lantern.name = 'FestivalLantern_' + idx;
    const light = new THREE.PointLight(0xffb347, 1.4, 55, 2);
    light.position.set(pos.x, 8.5, pos.z);
    light.name = 'FestivalLanternLight_' + idx;
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 8), new THREE.MeshBasicMaterial({ color: 0xff8f3c }));
    tassel.position.set(pos.x, 6.3, pos.z);
    group.add(lantern);
    group.add(light);
    group.add(tassel);
  });
  const banner = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 1.2), new THREE.MeshStandardMaterial({ color: 0xd16b16 }));
  banner.position.set(0, 11.5, 0);
  banner.rotation.y = Math.PI / 6;
  group.add(banner);
  scene.add(group);
  return [group];
}

function spawnInvasionBarricades(scene, objectGrid) {
  const group = new THREE.Group();
  group.name = 'EventInvasionBarricades';
  const extras = [];
  const segments = [
    { position: new THREE.Vector3(0, 2, -150), length: 32, rotation: 0 },
    { position: new THREE.Vector3(26, 2, -165), length: 24, rotation: 0.32 },
    { position: new THREE.Vector3(-26, 2, -165), length: 24, rotation: -0.32 }
  ];
  segments.forEach((seg, idx) => {
    const geometry = new THREE.BoxGeometry(seg.length, 4, 6);
    const material = new THREE.MeshStandardMaterial({ color: 0x6b3e1b });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(seg.position);
    mesh.rotation.y = seg.rotation;
    mesh.name = 'EventBarricade_' + idx;
    group.add(mesh);

    const stakeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
    const stakeMaterial = new THREE.MeshStandardMaterial({ color: 0x4f2c17 });
    for (let i = -2; i <= 2; i++) {
      const stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
      stake.position.set(seg.position.x + i * 5 * Math.cos(seg.rotation), 5, seg.position.z + i * 5 * Math.sin(seg.rotation));
      stake.rotation.z = Math.PI / 4;
      stake.name = 'EventBarricadeStake_' + idx + '_' + i;
      group.add(stake);
    }

    const collider = new THREE.Object3D();
    collider.name = 'EventBarricadeCollider_' + idx;
    collider.position.copy(seg.position);
    collider.userData = {
      label: 'Makeshift Barricade',
      colorHex: 'b87333',
      collider: {
        type: 'obb',
        center: { x: seg.position.x, z: seg.position.z },
        halfExtents: { x: seg.length / 2, z: 3 },
        rotationY: seg.rotation
      }
    };
    objectGrid.add(collider);
    scene.add(collider);
    extras.push(collider);
  });
  scene.add(group);
  return [group, ...extras];
}

function spawnMedicalCamp(scene, objectGrid) {
  const group = new THREE.Group();
  group.name = 'EventMedicalCamp';
  const extras = [];
  const tents = [
    { position: { x: -18, z: 160 }, rotation: Math.PI / 12 },
    { position: { x: -6, z: 148 }, rotation: -Math.PI / 8 },
    { position: { x: 8, z: 165 }, rotation: Math.PI / 16 }
  ];
  const tentGeometry = new THREE.ConeGeometry(6, 5, 5, 1, false);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xdedede });
  tents.forEach((tent, idx) => {
    const mesh = new THREE.Mesh(tentGeometry, baseMaterial.clone());
    mesh.position.set(tent.position.x, 2.5, tent.position.z);
    mesh.rotation.y = tent.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'EventMedicalTent_' + idx;
    group.add(mesh);

    const crossVertical = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xbd2d2d }));
    crossVertical.position.set(tent.position.x, 4.2, tent.position.z + 1.5);
    group.add(crossVertical);
    const crossHorizontal = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xbd2d2d }));
    crossHorizontal.position.set(tent.position.x, 4.2, tent.position.z + 1.5);
    group.add(crossHorizontal);

    const collider = new THREE.Object3D();
    collider.name = 'EventMedicalCollider_' + idx;
    collider.position.set(tent.position.x, 0, tent.position.z);
    collider.userData = {
      label: 'Field Medical Tent',
      colorHex: 'dcdcdc',
      collider: {
        type: 'aabb',
        center: { x: tent.position.x, z: tent.position.z },
        halfExtents: { x: 6, z: 6 }
      }
    };
    objectGrid.add(collider);
    scene.add(collider);
    extras.push(collider);
  });

  const light = new THREE.PointLight(0x88c4ff, 1.4, 60, 2);
  light.position.set(-10, 9, 158);
  group.add(light);
  scene.add(group);
  return [group, ...extras];
}

// Build all world objects and return { objects, grid }
export function updateObjects(scene, currentObjects, settings, worldState = {}) {
  // Remove previously added objects
  currentObjects.forEach(obj => scene.remove(obj));

  const renderObjects = [];
  const worldSize = WORLD_SIZE_CONST;
  const objectGrid = new ObjectGrid(worldSize, 200);

  // Buildings
  const palace = placeHokagePalace(scene, objectGrid, worldSize, settings);
  if (palace) renderObjects.push(palace);

  const monument = placeHokageMonument(scene, objectGrid, worldSize, settings);
  if (monument) renderObjects.push(monument);

  // Hospital (GLB)
  const hospital = placeHospital(scene, objectGrid, worldSize, settings);
  if (hospital) renderObjects.push(hospital);

  // Chuunin Arena (GLB)
  const arena = placeArena(scene, objectGrid, worldSize, settings, 'IA183');
  if (arena) renderObjects.push(arena);

  const ichiraku = placeIchiraku(scene, objectGrid, worldSize, settings);
  if (ichiraku) renderObjects.push(ichiraku);

  // Populate forests from map polygons with a randomized mix of deciduous trees
  try {
    const forestGroup = placeDeciduousTreesInForests(scene, objectGrid, worldSize, settings, { spacing: 18 });
    if (forestGroup) renderObjects.push(forestGroup);
  } catch (e) {
    console.warn('Forest deciduous placement failed:', e);
  }

  if (ENABLE_CITY_SLICE) {
    const citySlice = placeCitySlice(scene, objectGrid, settings);
    if (citySlice) renderObjects.push(citySlice);
  }

  // Kitbash neighborhood: separate colliders + unique interactions; avoid CitySlice overlap
  if (ENABLE_KITBASH) {
    const kitbash = placeKitbash(scene, objectGrid, settings);
    if (kitbash) renderObjects.push(kitbash);
  }

  // District fill: populate all districts whose id starts with 'district' or 'residential'
  try {
    const ids = listDistrictIdsByPrefix(['district', 'residential']);
    for (const id of ids) {
      try {
        const group = fillDistrict(scene, objectGrid, {
          districtId: id,
          source: 'mixed',
          paletteIndex: settings?.citySlicePaletteIndex ?? 0,
          shadows: settings?.shadows,
        });
        if (group) renderObjects.push(group);
      } catch (e) {
        console.warn('District fill failed for', id, e);
      }
    }
  } catch (e) {
    console.warn('District fill enumeration failed:', e);
  }

  // KonohaTown buildings removed

  const activeEvent = worldState?.activeEvent || null;
  if (activeEvent) {
    const type = String(activeEvent.type || '').toLowerCase();
    let extras = [];
    if (type === 'festival') {
      extras = spawnFestivalDecor(scene, objectGrid) || [];
    } else if (type === 'invasion') {
      extras = spawnInvasionBarricades(scene, objectGrid) || [];
    } else if (type === 'emergency') {
      extras = spawnMedicalCamp(scene, objectGrid) || [];
    }
    if (Array.isArray(extras)) {
      extras.forEach(obj => {
        if (!obj) return;
        renderObjects.push(obj);
      });
    }
  }


  // NEW: remove only the Hokage Office instance/colliders near specific grid labels (e.g., KM300)
  if (HOKAGE_OFFICE_CLEANUP_ENABLED && Array.isArray(HOKAGE_OFFICE_BLOCKED_LABELS)) {
    for (const label of HOKAGE_OFFICE_BLOCKED_LABELS) {
      try {
        const { i, j } = parseGridLabel(label);
        const p = posForCell(i, j, worldSize);
        // Remove GLB group(s) named 'HokageOffice(GLB)' near target
        const children = [...scene.children];
        for (const c of children) {
          if (c?.name === 'HokageOffice(GLB)') {
            const dx = c.position.x - p.x, dz = c.position.z - p.z;
            if (dx*dx + dz*dz <= HOKAGE_OFFICE_CLEANUP_RADIUS * HOKAGE_OFFICE_CLEANUP_RADIUS) {
              scene.remove(c);
            }
          }
        }
        // Remove/disable colliders and proxies labelled as Hokage Office near target
        for (const key in objectGrid.grid) {
          const arr = objectGrid.grid[key];
          if (!Array.isArray(arr)) continue;
          objectGrid.grid[key] = arr.filter(obj => {
            const lbl = obj?.userData?.label || '';
            if (lbl.includes('Hokage Office')) {
              const dx = obj.position.x - p.x, dz = obj.position.z - p.z;
              if (dx*dx + dz*dz <= HOKAGE_OFFICE_CLEANUP_RADIUS * HOKAGE_OFFICE_CLEANUP_RADIUS) {
                // Also remove from scene and neutralize collider just in case
                obj.userData.collider = null;
                obj.visible = false;
                scene.remove(obj);
                return false; // drop from spatial grid
              }
            }
            return true;
          });
        }
      } catch (e) {
        console.warn('Hokage Office cleanup failed for', label, e);
      }
    }
  }

  return { objects: renderObjects, grid: objectGrid };
}

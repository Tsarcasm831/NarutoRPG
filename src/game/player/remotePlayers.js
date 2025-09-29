import * as THREE from 'three';
import { createNpcRig } from '../npcs/common.js';
import { PLAYER_CHARACTERS } from './characterCatalog.js';

const characterIndex = new Map(
  PLAYER_CHARACTERS.map((character) => [String(character.key || '').toLowerCase(), character])
);

const getCharacterMeta = (key) => {
  if (!key) return null;
  const normalized = String(key).trim().toLowerCase();
  return characterIndex.get(normalized) || null;
};

const createFallbackRig = (sessionId, name = 'Shinobi', color = 0x1e90ff) => {
  const group = new THREE.Group();
  group.name = name;
  group.userData.remoteSessionId = sessionId;
  const geometry = new THREE.CapsuleGeometry(1.1, 3.8, 8, 16);
  const material = new THREE.MeshStandardMaterial({ color, emissive: 0x111111 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 2.8;
  group.add(mesh);
  return group;
};

export const spawnRemotePlayer = async ({ scene, settings, player }) => {
  if (!scene || !player) return null;
  const meta = getCharacterMeta(player.characterKey);
  const label = player.characterName || meta?.name || `Shinobi ${player.sessionId.slice(0, 4)}`;
  const scale = meta?.scale || 2.8;
  const manifestPath = meta?.manifest;
  const position = new THREE.Vector3(
    Number(player.position?.x) || 0,
    Number(player.position?.y) || 0,
    Number(player.position?.z) || 0
  );

  if (!manifestPath) {
    const fallback = createFallbackRig(player.sessionId, label);
    fallback.position.copy(position);
    scene.add(fallback);
    return fallback;
  }

  try {
    const rig = await createNpcRig({
      scene,
      settings,
      name: label,
      manifestPath,
      position,
      scale,
      autoAdd: false
    });
    rig.userData.remoteSessionId = player.sessionId;
    rig.position.copy(position);
    scene.add(rig);
    return rig;
  } catch (error) {
    console.error('[RemotePlayer] Failed to create rig; using fallback.', error);
    const fallback = createFallbackRig(player.sessionId, label, 0xb5651d);
    fallback.position.copy(position);
    scene.add(fallback);
    return fallback;
  }
};

export const updateRemotePlayerTransform = (rig, state = {}) => {
  if (!rig) return;
  const position = state.position || {};
  if (typeof position.x === 'number' && typeof position.z === 'number') {
    rig.position.set(
      Number.isFinite(position.x) ? position.x : rig.position.x,
      Number.isFinite(position.y) ? position.y : rig.position.y,
      Number.isFinite(position.z) ? position.z : rig.position.z
    );
  }
  const rotation = state.rotation || {};
  if (typeof rotation.y === 'number') {
    rig.rotation.y = rotation.y;
  }
};

const disposeObject3D = (object) => {
  object.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose && material.dispose());
        } else if (child.material.dispose) {
          child.material.dispose();
        }
      }
    }
  });
};

export const removeRemotePlayer = ({ scene, rig }) => {
  if (!rig) return;
  try {
    if (rig.parent) {
      rig.parent.remove(rig);
    } else if (scene) {
      scene.remove(rig);
    }
  } catch (_) {}
  try {
    disposeObject3D(rig);
  } catch (_) {}
};

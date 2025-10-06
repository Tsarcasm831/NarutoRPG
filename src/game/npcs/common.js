import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

// Minimal set of filenames to prefer when spawning idle NPCs
const DEFAULT_ESSENTIAL = [
  'Animation_Idle_12_withSkin.glb',
  'Animation_Idle_11_withSkin.glb',
  'Animation_Idle_withSkin.glb',
  'Animation_Casual_Walk_withSkin.glb',
  'Animation_Walking_withSkin.glb',
  'Animation_Running_withSkin.glb',
];

function getAnimationName(url) {
  const fileName = url.substring(url.lastIndexOf('/') + 1);
  let name = fileName.replace('Animation_', '').replace('_withSkin.glb', '');
  return name
    .toLowerCase()
    .split('_')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function chooseDefaultAnimation(availableNames) {
  const order = [
    'idle12',
    'idle11',
    'idle',
    'casualWalk',
    'unsteadyWalk',
    'walking',
    'running',
    'runFast',
    'arise',
  ];
  for (const key of order) {
    if (availableNames.includes(key)) return key;
  }
  return availableNames[0] || null;
}

function toFileNames(urls) {
  return urls.map((u) => u.substring(u.lastIndexOf('/') + 1)).filter(Boolean);
}

function localBaseFor(name) {
  const normalized = (name || '').toLowerCase().split(/\s+/)[0];
  switch (normalized) {
    case 'naruto':
      return 'temp/Naruto/biped/';
    case 'sasuke':
      return 'temp/Sasuke/';
    case 'sakura':
      return 'temp/Sakura/biped/';
    case 'shikamaru':
      return 'temp/Shikamaru/';
    case 'neji':
      return 'temp/Neji/biped/';
    case 'orochimaru':
      return 'temp/Orochimaru/biped/';
    case 'kakashi':
      return 'temp/Kakashi_Jonin/';
    case 'hashirama':
      return 'temp/hashirama/biped/';
    case 'jiraiya':
      return 'temp/jiraiya/biped/';
    case 'killerbee':
    case 'killer':
    case 'bee':
      return 'temp/killerbee/biped/';
    case 'rocklee':
    case 'rock':
    case 'lee':
      return 'temp/rocklee/biped/';
    case 'tsunade':
      return 'temp/tsunade/biped/';
    default:
      return 'temp/';
  }
}

const ABSOLUTE_URL_REGEX = /^(?:https?:)?\/\//i;

export async function loadCharacterAssetsFromManifest(manifestPath, essential = DEFAULT_ESSENTIAL, characterName = '') {
  const loader = new GLTFLoader();

  const res = await fetch(manifestPath);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${manifestPath}`);
  const data = await res.json();
  const urls = Array.isArray(data?.files) ? data.files : [];
  if (!urls.length) throw new Error(`No files in manifest: ${manifestPath}`);

  const localBase = localBaseFor(characterName);
  const normalizeUrl = (value) => {
    const url = typeof value === 'string' ? value.trim() : '';
    if (!url) return url;
    if (ABSOLUTE_URL_REGEX.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return url;
    if (url.startsWith('temp/')) return url;
    if (url.startsWith('./') || url.startsWith('../')) return url;
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    return `${localBase}${fileName}`;
  };

  const essentials = urls.filter((u) => essential.some((m) => u.endsWith(m)));
  const toLoad = essentials.length ? essentials : [urls[0]];
  const normalizedTargets = Array.from(new Set(toLoad.map((url) => normalizeUrl(url)))).filter(Boolean);

  const fileNames = toFileNames(urls);
  const localUrls = fileNames.map((fn) => `${localBase}${fn}`);
  const localEssentials = localUrls.filter((u) => essential.some((m) => u.endsWith(m)));
  const localToLoad = Array.from(new Set((localEssentials.length ? localEssentials : localUrls))).filter(Boolean);

  const loadTargets = async (targets) =>
    (
      await Promise.all(
        targets.map(
          (url) =>
            new Promise((resolve) =>
              loader.load(
                url,
                (gltf) => resolve({ gltf, url }),
                undefined,
                () => resolve(null)
              )
            )
        )
      )
    ).filter(Boolean);

  let assets = [];

  if (localToLoad.length) {
    try {
      assets = await loadTargets(localToLoad);
    } catch (_) {
      assets = [];
    }
  }

  if (!assets.length && normalizedTargets.length) {
    assets = await loadTargets(normalizedTargets);
  }

  if (!assets.length) throw new Error(`Could not load any GLB from manifest: ${manifestPath}`);

  const defaultAsset = assets[0];
  const model = defaultAsset.gltf.scene;
  const clips = {};
  let defaultClipName = null;
  for (const a of assets) {
    const clip = a.gltf?.animations?.[0];
    if (clip) {
      const key = getAnimationName(a.url);
      clips[key] = clip;
      if (!defaultClipName && a === defaultAsset) {
        defaultClipName = key;
      }
    }
  }

  return { model, clips, defaultClipName };
}

export function createNpcRig({ scene, settings, name, manifestPath, position, scale = 4, autoAdd = true }) {
  const group = new THREE.Group();
  group.name = name;
  group.userData.type = 'npc';
  group.position.copy(position || new THREE.Vector3());
  // Add a simple spherical collider around the NPC for player collision
  // Keep collider roughly proportional to visual scale (2.5 @ scale 4 -> 0.625 per scale unit)
  group.userData.collider = { type: 'sphere', radius: 0.625 * (scale || 4) };

  return loadCharacterAssetsFromManifest(manifestPath, undefined, name).then(({ model, clips, defaultClipName }) => {
    model.scale.set(scale, scale, scale);
    model.traverse((child) => {
      try {
        if (child.isMesh) {
          child.castShadow = settings?.shadows;
          child.receiveShadow = true;
        }
      } catch (_) {}
    });
    // Save reference for behaviors that need to rotate the visible model
    try { group.userData.model = model; } catch (_) {}
    group.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    const names = Object.keys(clips);
    for (const n of names) {
      actions[n] = mixer.clipAction(clips[n]);
    }

    // Prefer the clip from the same GLB as the model to ensure binding works
    const preferred = defaultClipName && names.includes(defaultClipName) ? defaultClipName : null;
    const defaultName = preferred || chooseDefaultAnimation(names);
    if (defaultName && actions[defaultName]) {
      actions[defaultName].setLoop(THREE.LoopRepeat).reset().play();
      group.userData.currentAnimation = defaultName;
    }

    group.userData.mixer = mixer;
    group.userData.animations = actions;

    if (autoAdd) {
      scene.add(group);
    }
    return group;
  }).catch((err) => {
    console.error(`[NPC] Failed to spawn ${name} from ${manifestPath}:`, err);
    throw err;
  });
}

// Optional: call per-frame if you want their idle animations to update
export function updateNpc(group, delta) {
  if (!group || !group.userData?.mixer) return;
  try { group.userData.mixer.update(delta); } catch (_) {}
}

const COLLISION_CHAT_DURATION = 15;
const COLLISION_CHAT_COOLDOWN = 3.5;
const COLLISION_CHAT_SEARCH_PADDING = 2.5;

const LOCOMOTION_CHECK_DISTANCE = 6.5;
const LOCOMOTION_CHECK_TIME = 4.5;
const LOCOMOTION_MIN_MOVEMENT = 1.25;

function ensureLocomotionState(npcGroup) {
  if (!npcGroup?.userData) return null;
  if (!npcGroup.userData.__locomotionMonitor) {
    const pos = npcGroup.position || { x: 0, y: 0, z: 0 };
    let lastPosition;
    try {
      lastPosition = pos.clone ? pos.clone() : new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0);
    } catch (_) {
      lastPosition = { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
    }
    npcGroup.userData.__locomotionMonitor = {
      lastPosition,
      distance: 0,
      elapsed: 0,
    };
  }
  return npcGroup.userData.__locomotionMonitor;
}

function pickLocomotion(actions) {
  if (!actions) return null;
  const candidates = ['walking', 'casualWalk', 'running', 'runFast', 'unsteadyWalk'];
  for (const name of candidates) {
    if (actions[name]) return name;
  }
  const keys = Object.keys(actions);
  return keys.length ? keys[0] : null;
}

function pickIdle(actions) {
  if (!actions) return null;
  if (actions.idle12) return 'idle12';
  if (actions.idle11) return 'idle11';
  if (actions.idle) return 'idle';
  if (actions.casualWalk) return 'casualWalk';
  const keys = Object.keys(actions);
  return keys.length ? keys[0] : null;
}

export function monitorNpcLocomotion(npcGroup, delta) {
  if (!npcGroup?.userData || !npcGroup.position) return;
  if (npcGroup.userData.interacting) return;
  const ai = npcGroup.userData.ai;
  if (ai && ai.conversationActive) return;

  const state = ensureLocomotionState(npcGroup);
  if (!state) return;

  const pos = npcGroup.position;
  const last = state.lastPosition;
  let moved = 0;
  if (last) {
    const dx = (pos.x || 0) - (last.x || 0);
    const dz = (pos.z || 0) - (last.z || 0);
    moved = Math.hypot(dx, dz);
  }

  if (last?.copy && typeof last.copy === 'function') {
    try { last.copy(pos); } catch (_) {}
  } else {
    state.lastPosition = pos.clone
      ? pos.clone()
      : { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
  }

  if (!Number.isFinite(moved)) moved = 0;
  state.distance += moved;
  state.elapsed += Number(delta) || 0;

  if (state.distance < 1e-3 && state.elapsed < LOCOMOTION_CHECK_TIME) {
    return;
  }

  const shouldCheck =
    state.distance >= LOCOMOTION_CHECK_DISTANCE || state.elapsed >= LOCOMOTION_CHECK_TIME;
  if (!shouldCheck) {
    return;
  }

  const actions = npcGroup.userData.animations || {};
  const currentName = npcGroup.userData.currentAnimation;
  const currentAction = currentName ? actions[currentName] : null;
  const isMoving = state.distance >= LOCOMOTION_MIN_MOVEMENT;

  if (isMoving) {
    const running = isActionRunning(currentAction);
    if (!running) {
      const locomotionName = pickLocomotion(actions);
      if (locomotionName && actions[locomotionName]) {
        const action = actions[locomotionName];
        try {
          Object.values(actions).forEach((anim) => {
            if (anim === action) return;
            try { anim.stop(); } catch (_) {}
          });
          action.clampWhenFinished = false;
          action.enabled = true;
          action.paused = false;
          action.reset();
          action.setLoop(THREE.LoopRepeat);
          action.play();
          npcGroup.userData.currentAnimation = action._clip?.name || locomotionName;
        } catch (_) {}
      }
    }
  } else if (currentAction && !isActionRunning(currentAction)) {
    const idleName = pickIdle(actions);
    if (idleName && actions[idleName]) {
      const action = actions[idleName];
      try {
        Object.values(actions).forEach((anim) => {
          if (anim === action) return;
          try { anim.stop(); } catch (_) {}
        });
        action.clampWhenFinished = false;
        action.enabled = true;
        action.paused = false;
        action.reset();
        action.setLoop(THREE.LoopRepeat);
        action.play();
        npcGroup.userData.currentAnimation = action._clip?.name || idleName;
      } catch (_) {}
    }
  }

  state.distance = 0;
  state.elapsed = 0;
}

function ensureCollisionState(npcGroup) {
  if (!npcGroup?.userData) return null;
  if (!npcGroup.userData.__collisionChatState) {
    npcGroup.userData.__collisionChatState = {
      active: false,
      timer: 0,
      cooldown: 0,
      partnerId: null,
      partnerRef: null,
      playing: null,
    };
  }
  return npcGroup.userData.__collisionChatState;
}

function stopAllAnimations(group) {
  const actions = group?.userData?.animations;
  if (!actions) return;
  try {
    Object.values(actions).forEach((action) => action.stop());
  } catch (_) {}
}

function pickChatAnimation(actions) {
  if (!actions) return null;
  const candidates = [
    'listeningGesture',
    'standAndChat',
    'talkWithRightHand',
    'talking',
    'idle12',
    'idle11',
    'idle',
  ];
  for (const name of candidates) {
    if (actions[name]) return name;
  }
  const values = Object.keys(actions);
  return values.length ? values[0] : null;
}

function isActionRunning(action) {
  if (!action) return false;
  if (typeof action.isRunning === 'function') {
    try {
      return action.isRunning();
    } catch (_) {
      return !!action.enabled && !action.paused;
    }
  }
  return !!action.enabled && !action.paused;
}

export function playNpcInteractionAnimation(group) {
  const actions = group?.userData?.animations;
  if (!actions) return false;
  const desired = pickChatAnimation(actions);
  if (!desired) return false;
  const action = actions[desired];
  if (!action) return false;
  const targetName = action._clip?.name || desired;
  if (group?.userData?.currentAnimation === targetName && isActionRunning(action)) {
    return true;
  }
  try {
    stopAllAnimations(group);
    action.clampWhenFinished = false;
    action.enabled = true;
    action.paused = false;
    action.reset();
    action.setLoop(THREE.LoopRepeat);
    action.play();
    if (group?.userData) {
      group.userData.currentAnimation = targetName;
    }
    return true;
  } catch (_) {
    return false;
  }
}

function playChatAnimation(group, state) {
  const played = playNpcInteractionAnimation(group);
  if (played && group?.userData?.currentAnimation) {
    state.playing = group.userData.currentAnimation;
  }
}

function endCollisionState(group, state, { setCooldown = true } = {}) {
  if (!state) return;
  state.active = false;
  state.timer = 0;
  state.partnerId = null;
  state.partnerRef = null;
  state.playing = null;
  if (setCooldown) {
    state.cooldown = COLLISION_CHAT_COOLDOWN;
  }
}

function startCollisionChat(group, state, partner, partnerState) {
  state.active = true;
  state.timer = COLLISION_CHAT_DURATION;
  state.partnerId = partner?.uuid || null;
  state.partnerRef = partner || null;
  state.playing = null;
  state.cooldown = 0;

  if (partnerState) {
    partnerState.active = true;
    partnerState.timer = COLLISION_CHAT_DURATION;
    partnerState.partnerId = group?.uuid || null;
    partnerState.partnerRef = group || null;
    partnerState.playing = null;
    partnerState.cooldown = 0;
  }

  playChatAnimation(group, state);
  if (partner && partnerState) {
    playChatAnimation(partner, partnerState);
  }
}

export function ensureNpcCollisionIdle(npcGroup, delta, objectGrid) {
  if (!npcGroup || !npcGroup.userData) return false;
  if (npcGroup.userData.interacting) return false;

  const ai = npcGroup.userData.ai;
  if (ai && ai.conversationActive) return false;

  const state = ensureCollisionState(npcGroup);
  if (!state) return false;

  if (state.cooldown > 0) {
    state.cooldown = Math.max(0, state.cooldown - (Number(delta) || 0));
  }

  if (state.active) {
    state.timer -= Number(delta) || 0;
    const partner = state.partnerRef;
    const stillPartnered =
      partner &&
      partner.userData &&
      partner.userData.__collisionChatState &&
      partner.userData.__collisionChatState.partnerId === npcGroup.uuid &&
      partner.userData.__collisionChatState.active;
    if (state.timer <= 0 || !stillPartnered) {
      if (partner?.userData?.__collisionChatState) {
        endCollisionState(partner, partner.userData.__collisionChatState);
      }
      endCollisionState(npcGroup, state);
      return false;
    }
    playChatAnimation(npcGroup, state);
    return true;
  }

  if (!objectGrid || typeof objectGrid.getObjectsNear !== 'function') {
    return false;
  }

  const colliderRadius = npcGroup.userData?.collider?.radius ?? 2.0;
  const searchRadius = colliderRadius + COLLISION_CHAT_SEARCH_PADDING;
  let nearby;
  try {
    nearby = objectGrid.getObjectsNear(npcGroup.position, searchRadius) || [];
  } catch (_) {
    nearby = [];
  }

  for (const candidate of nearby) {
    if (!candidate || candidate === npcGroup) continue;
    if (candidate.userData?.type !== 'npc') continue;
    if (candidate.userData.interacting) continue;

    const otherState = ensureCollisionState(candidate);
    if (!otherState) continue;
    if (otherState.active && otherState.partnerId !== npcGroup.uuid) continue;
    if (state.cooldown > 0 || otherState.cooldown > 0) continue;

    const otherRadius = candidate.userData?.collider?.radius ?? 2.0;
    const totalRadius = Math.max(0.1, colliderRadius + otherRadius);
    const dx = candidate.position.x - npcGroup.position.x;
    const dz = candidate.position.z - npcGroup.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq > totalRadius * totalRadius) continue;

    const myId = npcGroup.uuid || '';
    const otherId = candidate.uuid || '';
    if (myId > otherId) {
      // Let the consistently ordered instance initiate the chat to avoid double-starts.
      continue;
    }

    startCollisionChat(npcGroup, state, candidate, otherState);
    return true;
  }

  return false;
}

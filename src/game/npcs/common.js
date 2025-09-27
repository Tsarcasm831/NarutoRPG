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
  switch ((name || '').toLowerCase()) {
    case 'naruto':
      return 'temp/Naruto/biped/';
    case 'sasuke':
      return 'temp/Sasuke/';
    case 'sakura':
      return 'temp/Sakura/biped/';
    case 'shikamaru':
      return 'temp/Shikamaru/';
    default:
      return 'temp/';
  }
}

export async function loadCharacterAssetsFromManifest(manifestPath, essential = DEFAULT_ESSENTIAL, characterName = '') {
  const loader = new GLTFLoader();

  const res = await fetch(manifestPath);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${manifestPath}`);
  const data = await res.json();
  const urls = Array.isArray(data?.files) ? data.files : [];
  if (!urls.length) throw new Error(`No files in manifest: ${manifestPath}`);

  const essentials = urls.filter((u) => essential.some((m) => u.endsWith(m)));
  const toLoad = essentials.length ? essentials : [urls[0]];

  let assets = (await Promise.all(
    toLoad.map((url) =>
      new Promise((resolve) =>
        loader.load(
          url,
          (gltf) => resolve({ gltf, url }),
          undefined,
          () => resolve(null)
        )
      )
    )
  )).filter(Boolean);

  // Fallback: if remote GLBs failed (e.g., CORS/404), try local temp files using the same filenames
  if (!assets.length) {
    try {
      const fileNames = toFileNames(urls);
      const localBase = localBaseFor(characterName);
      const localUrls = fileNames.map((fn) => `${localBase}${fn}`);
      const localEssentials = localUrls.filter((u) => essential.some((m) => u.endsWith(m)));
      const localToLoad = localEssentials.length ? localEssentials : localUrls;

      assets = (await Promise.all(
        localToLoad.map((url) =>
          new Promise((resolve) =>
            loader.load(
              url,
              (gltf) => resolve({ gltf, url }),
              undefined,
              () => resolve(null)
            )
          )
        )
      )).filter(Boolean);
    } catch (_) {
      // ignore, will error below if still empty
    }
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

export function createNpcRig({ scene, settings, name, manifestPath, position, scale = 4 }) {
  const group = new THREE.Group();
  group.name = name;
  group.userData.type = 'npc';
  group.position.copy(position || new THREE.Vector3());
  // Add a simple spherical collider around the NPC for player collision
  group.userData.collider = { type: 'sphere', radius: 2.5 };

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

    scene.add(group);
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

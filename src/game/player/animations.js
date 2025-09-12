import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

const ANIMATION_PATH_PREFIX = 'https://www.lordtsarcasm.com/bucket/Naruto/LandofFire/Kakashi_Jonin/';
export const DEFAULT_ANIMATION = 'idle11';

// NEW: Load only a minimal set of clips needed for gameplay to reduce lag
const ESSENTIAL_ANIMATION_FILES = [
    'Animation_Idle_11_withSkin.glb',
    'Animation_Walking_withSkin.glb',
    'Animation_RunFast_withSkin.glb',
    'Animation_Running_withSkin.glb',
    'Animation_Regular_Jump_withSkin.glb',
    'Animation_Fall1_withSkin.glb',
    'Animation_Punch_Combo_1_withSkin.glb',
    'Animation_Roll_Dodge_withSkin.glb'
];

/**
 * Parses a clean, camelCase animation name from a GLB file URL.
 * @param {string} url - The full URL of the animation file.
 * @returns {string} A camelCase name for the animation.
 */
function getAnimationName(url) {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    // e.g., Animation_Idle_11_withSkin.glb
    let name = fileName.replace('Animation_', '').replace('_withSkin.glb', '');
    // e.g., Idle_11
    
    // Convert to camelCase
    return name
        .toLowerCase()
        .split('_')
        .map((part, index) => {
            if (index === 0) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join('');
}


/**
 * Loads all player animations from the JSON file.
 * This function loads the GLB files, extracts animation clips, and one model with skin.
 * Optimized to load only essential animations to avoid heavy CPU/GPU usage and memory spikes.
 * @returns {Promise<{model: THREE.Group, animations: Object}>} A promise that resolves with the player model and an object containing all animation clips.
 */
export async function loadPlayerAssets() {
    const loader = new GLTFLoader();
    
    const response = await fetch('./src/components/json/kakashiAnimations.json');
    const { files: animationUrls } = await response.json();

    if (!animationUrls || animationUrls.length === 0) {
        throw new Error("No animation files found in JSON.");
    }

    // Filter URLs to essential files only
    const essentialUrls = animationUrls.filter(url =>
        ESSENTIAL_ANIMATION_FILES.some(name => url.endsWith(name))
    );

    if (essentialUrls.length === 0) {
        // Fallback to at least idle if filter failed
        const idle = animationUrls.find(u => u.includes('Animation_Idle_11_withSkin.glb'));
        if (idle) essentialUrls.push(idle);
    }
    
    let model = null;
    const animations = {};

    const assetPromises = essentialUrls.map(url => {
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                gltf => resolve({ gltf, url }),
                undefined,
                error => {
                    console.error(`Failed to load asset from ${url}:`, error);
                    resolve(null); // Resolve with null to not fail the whole batch
                }
            );
        });
    });

    const loadedAssets = (await Promise.all(assetPromises)).filter(a => a);

    // Find the default animation to get the model from
    const defaultAssetUrl = essentialUrls.find(url => getAnimationName(url) === DEFAULT_ANIMATION)
        || essentialUrls[0];
    const defaultAsset = loadedAssets.find(a => a.url === defaultAssetUrl) || loadedAssets[0];

    if (defaultAsset) {
        model = defaultAsset.gltf.scene;
    } else {
        throw new Error("Could not load any model from the animation files.");
    }

    // Extract all animation clips that were loaded
    loadedAssets.forEach(({ gltf, url }) => {
        const clip = gltf.animations[0];
        if (clip) {
            const name = getAnimationName(url);
            animations[name] = clip;
        }
    });

    return { model, animations };
}

/**
 * Plays a new animation on the player model.
 * @param {THREE.Group} player - The player group object.
 * @param {string} name - The name of the animation to play.
 */
export function playAnimation(player, name) {
    if (player.userData.currentAnimation === name || !player.userData.mixer) return;
    
    const { mixer, animations, currentAnimation } = player.userData;
    
    const newAction = animations[name];
    if (!newAction) {
        // console.warn(`Animation "${name}" not found.`);
        return;
    }
    
    const oldAction = currentAnimation ? animations[currentAnimation] : null;

    // Clean up previous one-shot animation listener if it exists
    if (player.userData.actionFinishListener) {
        mixer.removeEventListener('finished', player.userData.actionFinishListener);
        player.userData.actionFinishListener = null;
    }

    if (oldAction) {
        oldAction.fadeOut(0.2);
    }
    
    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
    
    // Separate one-shot animations into locking and non-locking
    const oneShotLocking = ['regularJump', 'rollDodge'];
    const oneShotNonLocking = ['punchCombo1'];

    if (oneShotLocking.includes(name)) {
        // Lock player actions until this one-shot completes
        player.userData.actionLocked = true;

        newAction.setLoop(THREE.LoopOnce, 1);
        newAction.clampWhenFinished = true;

        player.userData.actionFinishListener = (e) => {
            if (e.action === newAction) {
                // Unlock after finishing the one-shot and transition to a suitable state
                player.userData.actionLocked = false;

                // If we're in the air (from a jump), go to falling. Otherwise, go to idle.
                const nextAnim = name === 'regularJump' ? 'fall1' : 'idle11';
                playAnimation(player, nextAnim);
            }
        };
        mixer.addEventListener('finished', player.userData.actionFinishListener);
    } else if (oneShotNonLocking.includes(name)) {
        // Do NOT lock movement, but still run as a one-shot and then return to idle
        newAction.setLoop(THREE.LoopOnce, 1);
        newAction.clampWhenFinished = true;

        player.userData.actionFinishListener = (e) => {
            if (e.action === newAction) {
                // Return to idle (movement system will immediately override to walk/run if moving)
                playAnimation(player, 'idle11');
            }
        };
        mixer.addEventListener('finished', player.userData.actionFinishListener);
    } else {
        newAction.setLoop(THREE.LoopRepeat);
    }

    player.userData.currentAnimation = name;
}
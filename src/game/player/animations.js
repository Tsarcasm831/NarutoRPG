import * as THREE from 'three';
import { loadCharacterAssetsFromManifest } from '../npcs/common.js';
import { getPlayerIdentity } from './identity.js';

export const DEFAULT_ANIMATION = 'idle11';

const BASE_ANIMATION_FALLBACKS = {
    idle11: ['idle12', 'idle'],
    walking: ['casualWalk'],
    running: ['runFast', 'casualWalk', 'walking'],
    regularJump: ['arise', 'idle11'],
    fall1: ['idle11'],
    punchCombo1: ['chargedGroundSlam', 'standAndChat', 'running'],
    rollDodge: ['running', 'walking'],
    runFast: ['running']
};

const mergeFallbacks = (base, overrides = {}) => {
    const merged = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (!Array.isArray(value)) {
            continue;
        }
        merged[key] = value;
    }
    return merged;
};

const ensureRequiredAnimations = (animations, fallbacks) => {
    for (const [target, candidates] of Object.entries(fallbacks)) {
        if (animations[target]) continue;
        for (const candidate of candidates) {
            if (candidate && animations[candidate]) {
                animations[target] = animations[candidate];
                break;
            }
        }
    }
};

const pickDefaultAnimation = (animations, preferred) => {
    if (preferred && animations[preferred]) return preferred;
    if (animations[DEFAULT_ANIMATION]) return DEFAULT_ANIMATION;
    const idleFallbacks = ['idle12', 'idle'];
    for (const name of idleFallbacks) {
        if (animations[name]) return name;
    }
    const keys = Object.keys(animations);
    return keys.length ? keys[0] : DEFAULT_ANIMATION;
};

/**
 * Loads the active player character model and animations based on the runtime identity.
 * @returns {Promise<{model: THREE.Group, animations: Object, defaultAnimation: string}>}
 */
export async function loadPlayerAssets(identityOverride = null) {
    const character = identityOverride || getPlayerIdentity();
    if (!character) {
        throw new Error('Player identity not set before loading assets.');
    }

    const animationConfig = character.animation || {};
    const { model, clips } = await loadCharacterAssetsFromManifest(
        character.manifest,
        animationConfig.essential,
        character.key || character.name
    );

    const animations = { ...clips };
    const fallbackMap = mergeFallbacks(BASE_ANIMATION_FALLBACKS, animationConfig.remap);
    ensureRequiredAnimations(animations, fallbackMap);

    const defaultAnimation = pickDefaultAnimation(animations, animationConfig.default);

    return { model, animations, defaultAnimation };
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
                const defaultAnim = player.userData.defaultAnimation || DEFAULT_ANIMATION;
                const nextAnim = name === 'regularJump'
                    ? (animations['fall1'] ? 'fall1' : defaultAnim)
                    : defaultAnim;
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
                const defaultAnim = player.userData.defaultAnimation || DEFAULT_ANIMATION;
                playAnimation(player, defaultAnim);
            }
        };
        mixer.addEventListener('finished', player.userData.actionFinishListener);
    } else {
        newAction.setLoop(THREE.LoopRepeat);
    }

    player.userData.currentAnimation = name;
}

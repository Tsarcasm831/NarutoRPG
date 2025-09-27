import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';

function randDir() {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.sin(a), z: Math.cos(a) };
}

export function attachWanderFree(npcGroup, options = {}) {
  const speed = Math.max(3, Math.min(25, options.speed || 10));
  npcGroup.userData.ai = {
    type: 'wanderFree',
    dir: randDir(),
    speed,
    wait: 0,
    changeIn: 1.5 + Math.random() * 2.5, // seconds until re-pick direction
    radius: Math.max(1.2, Math.min(3.0, options.radius || (npcGroup.userData?.collider?.radius ?? 2.0))),
  };
}

export function updateWanderFree(npcGroup, delta, objectGrid) {
  const ai = npcGroup?.userData?.ai;
  if (!ai || ai.type !== 'wanderFree') return;

  // If interacting, freeze in place and play idle
  if (npcGroup.userData?.interacting) {
    try {
      const actions = npcGroup.userData.animations || {};
      if (actions.idle12 && npcGroup.userData.currentAnimation !== 'idle12') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle12.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle12';
      } else if (actions.idle11 && npcGroup.userData.currentAnimation !== 'idle11') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle11.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle11';
      } else if (actions.idle && npcGroup.userData.currentAnimation !== 'idle') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle';
      }
    } catch (_) {}
    return;
  }

  // Countdown timers
  if (ai.wait > 0) {
    ai.wait -= delta;
    if (ai.wait < 0) ai.wait = 0;
    // Keep idle animation while waiting
    try {
      const actions = npcGroup.userData.animations || {};
      if (actions.idle12 && npcGroup.userData.currentAnimation !== 'idle12') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle12.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle12';
      } else if (actions.idle11 && npcGroup.userData.currentAnimation !== 'idle11') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle11.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle11';
      } else if (actions.idle && npcGroup.userData.currentAnimation !== 'idle') {
        Object.values(actions).forEach(a => a.stop());
        actions.idle.setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = 'idle';
      }
    } catch (_) {}
    return;
  }

  ai.changeIn -= delta;
  if (ai.changeIn <= 0) {
    ai.dir = randDir();
    ai.changeIn = 1.5 + Math.random() * 2.5;
    if (Math.random() < 0.25) ai.wait = 0.4 + Math.random() * 0.8; // short pause sometimes
  }

  // Intended move in XZ
  const step = ai.speed * delta;
  const intended = { x: npcGroup.position.x + ai.dir.x * step, z: npcGroup.position.z + ai.dir.z * step };

  // Ignore self during collision resolution
  const restoreFlag = npcGroup.userData.__ignoreCollision;
  npcGroup.userData.__ignoreCollision = true;
  const resolved = resolveCollisions(intended, ai.radius, objectGrid);
  npcGroup.userData.__ignoreCollision = restoreFlag;

  const dx = resolved.x - npcGroup.position.x;
  const dz = resolved.z - npcGroup.position.z;
  const movedDist = Math.hypot(dx, dz);

  // If we barely moved (likely blocked), pick a new direction and short wait to avoid jitter
  if (movedDist < 0.01) {
    ai.dir = randDir();
    ai.wait = 0.2 + Math.random() * 0.4;
    return;
  }

  npcGroup.position.x = resolved.x;
  npcGroup.position.z = resolved.z;

  // Face move direction
  try {
    const model = npcGroup.userData.model || npcGroup.children?.[0];
    if (model) {
      model.rotation.y = Math.atan2(dx, dz);
    }
  } catch (_) {}

  // Prefer idle if no walk, otherwise play walking when moving
  try {
    const actions = npcGroup.userData.animations || {};
    const playing = npcGroup.userData.currentAnimation;
    const isMoving = movedDist > 0.01;
    const play = (name) => {
      if (!actions[name]) return;
      if (playing !== name) {
        Object.values(actions).forEach(a => a.stop());
        actions[name].setLoop(THREE.LoopRepeat).reset().play();
        npcGroup.userData.currentAnimation = name;
      }
    };
    if (isMoving && (actions.walking || actions.casualWalk || actions.running || actions.runFast)) {
      play(
        actions.walking ? 'walking'
        : actions.casualWalk ? 'casualWalk'
        : actions.running ? 'running'
        : 'runFast'
      );
    } else if (!isMoving && (actions.idle12 || actions.idle11 || actions.idle)) {
      play(actions.idle12 ? 'idle12' : (actions.idle11 ? 'idle11' : 'idle'));
    }
  } catch (_) {}
}

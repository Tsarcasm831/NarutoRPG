import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';

function randDir() {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.sin(a), z: Math.cos(a) };
}

export function attachWanderFree(npcGroup, options = {}) {
  const speed = Math.max(3, Math.min(25, options.speed || 10));
  const pauseMin = Math.max(0, options.pauseMin ?? 2);
  const pauseMax = Math.max(pauseMin, options.pauseMax ?? 7);
  const pauseChance = Math.max(0, Math.min(1, options.pauseChance ?? 0.6));
  const dirChangeMin = Math.max(0.5, options.dirChangeMin ?? 3);
  const dirChangeMax = Math.max(dirChangeMin, options.dirChangeMax ?? 6);

  npcGroup.userData.ai = {
    type: 'wanderFree',
    dir: randDir(),
    speed,
    wait: 0,
    changeIn: dirChangeMin + Math.random() * (dirChangeMax - dirChangeMin), // seconds until re-pick direction
    radius: Math.max(1.2, Math.min(3.0, options.radius || (npcGroup.userData?.collider?.radius ?? 2.0))),
    // Conversation state + config
    conversationActive: false,
    convoCooldown: 0,
    pauseMin,
    pauseMax,
    pauseChance,
    dirChangeMin,
    dirChangeMax,
  };
}

export function updateWanderFree(npcGroup, delta, objectGrid) {
  const ai = npcGroup?.userData?.ai;
  if (!ai || ai.type !== 'wanderFree') return;

  // Reduce conversation cooldown each frame
  if (ai.convoCooldown > 0) ai.convoCooldown -= delta;

  // If mid-conversation, freeze locomotion (mixer updates happen elsewhere)
  if (ai.conversationActive) {
    return;
  }

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
    ai.changeIn = ai.dirChangeMin + Math.random() * (ai.dirChangeMax - ai.dirChangeMin);
    if (Math.random() < ai.pauseChance) {
      ai.wait = ai.pauseMin + Math.random() * (ai.pauseMax - ai.pauseMin);
    }
  }

  // Naruto-specific collision conversation trigger
  try {
    if (String(npcGroup.name).toLowerCase() === 'naruto' && (ai.convoCooldown || 0) <= 0 && objectGrid) {
      const nearby = objectGrid.getObjectsNear(npcGroup.position, 12) || [];
      const myR = npcGroup.userData?.collider?.radius ?? ai.radius ?? 2;
      let partner = null;
      for (let i = 0; i < nearby.length; i++) {
        const o = nearby[i];
        if (!o || o === npcGroup) continue;
        if (o.userData?.type !== 'npc') continue;
        const r = o.userData?.collider?.radius ?? 2;
        const dx = o.position.x - npcGroup.position.x;
        const dz = o.position.z - npcGroup.position.z;
        const d = Math.hypot(dx, dz);
        if (d <= myR + r + 0.4) { partner = o; break; }
      }
      if (partner) {
        // Orient both toward each other
        try {
          const meModel = npcGroup.userData.model || npcGroup.children?.[0];
          const otModel = partner.userData?.model || partner.children?.[0];
          if (meModel) meModel.rotation.y = Math.atan2(partner.position.x - npcGroup.position.x, partner.position.z - npcGroup.position.z);
          if (otModel) otModel.rotation.y = Math.atan2(npcGroup.position.x - partner.position.x, npcGroup.position.z - partner.position.z);
        } catch (_) {}

        const narutoActions = npcGroup.userData.animations || {};
        const otherActions = partner.userData?.animations || {};
        const meMixer = npcGroup.userData.mixer;
        const otMixer = partner.userData?.mixer;

        const talkName = narutoActions.talkWithRightHand ? 'talkWithRightHand' : (narutoActions.standAndChat ? 'standAndChat' : null);
        const listenNameMe = narutoActions.listeningGesture ? 'listeningGesture' : null;
        const listenNameOther = otherActions.listeningGesture ? 'listeningGesture' : null;

        const stopAll = (actions) => { try { Object.values(actions || {}).forEach(a => a.stop()); } catch(_) {} };
        const playOnce = (group, actions, mixer, name, onFinished) => {
          if (!name || !actions[name] || !mixer) { onFinished?.(); return; }
          try {
            stopAll(actions);
            const act = actions[name];
            act.reset();
            act.setLoop(THREE.LoopOnce, 1);
            act.clampWhenFinished = true;
            group.userData.currentAnimation = name;
            const handler = (e) => {
              if (e?.action === act) { try { mixer.removeEventListener('finished', handler); } catch(_) {}; onFinished?.(); }
            };
            try { mixer.addEventListener('finished', handler); } catch(_) {}
            act.play();
          } catch(_) { onFinished?.(); }
        };
        const playRepeat = (group, actions, mixer, name, reps = 2, onFinished) => {
          if (!name || !actions[name] || !mixer) { onFinished?.(); return; }
          try {
            stopAll(actions);
            const act = actions[name];
            act.reset();
            act.setLoop(THREE.LoopRepeat, Math.max(1, reps));
            act.clampWhenFinished = true;
            group.userData.currentAnimation = name;
            const handler = (e) => {
              if (e?.action === act) { try { mixer.removeEventListener('finished', handler); } catch(_) {}; onFinished?.(); }
            };
            try { mixer.addEventListener('finished', handler); } catch(_) {}
            act.play();
          } catch(_) { onFinished?.(); }
        };

        // Begin conversation
        ai.conversationActive = true;
        ai.wait = 0;
        ai.convoCooldown = 4 + Math.random() * 4;
        const partnerAI = partner.userData?.ai;
        if (partnerAI && partnerAI.type === 'wanderFree') {
          partnerAI.conversationActive = true;
          partnerAI.wait = 0;
          partnerAI.convoCooldown = 4 + Math.random() * 4;
        }

        // Other NPC listens twice
        playRepeat(partner, otherActions, otMixer, listenNameOther, 2, () => {
          try {
            const a = partner.userData.animations || {};
            const idle = a.idle12 ? 'idle12' : (a.idle11 ? 'idle11' : (a.idle ? 'idle' : null));
            if (idle && a[idle]) { Object.values(a).forEach(x => x.stop()); a[idle].setLoop(THREE.LoopRepeat).reset().play(); partner.userData.currentAnimation = idle; }
          } catch(_) {}
        });

        // Naruto talks, then listens, then resume
        playOnce(npcGroup, narutoActions, meMixer, talkName, () => {
          playOnce(npcGroup, narutoActions, meMixer, listenNameMe || talkName, () => {
            ai.conversationActive = false;
            ai.wait = 0.5 + Math.random();
            const pAI = partner.userData?.ai;
            if (pAI && pAI.type === 'wanderFree') {
              pAI.conversationActive = false;
              pAI.wait = 0.5 + Math.random();
            }
          });
        });

        // Skip movement this frame while starting the sequence
        return;
      }
    }
  } catch (_) {}


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

import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';
import {
  ensureNpcCollisionIdle,
  playNpcInteractionAnimation,
  lockNpcInteractionPosition,
  releaseNpcInteractionPosition,
} from '../common.js';

function normalizePolygon(points) {
  if (!Array.isArray(points)) return null;
  const poly = points
    .map((point) => {
      if (!point) return null;
      if (Array.isArray(point) && point.length >= 2) {
        const x = Number(point[0]);
        const z = Number(point[1]);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
        return { x, z };
      }
      if (typeof point === 'object' && Number.isFinite(point.x) && Number.isFinite(point.z)) {
        return { x: Number(point.x), z: Number(point.z) };
      }
      return null;
    })
    .filter(Boolean);
  return poly.length >= 3 ? poly : null;
}

function polygonCentroid(points) {
  if (!Array.isArray(points) || points.length < 3) return null;
  let area = 0;
  let cx = 0;
  let cz = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const { x: x1, z: z1 } = points[i];
    const { x: x2, z: z2 } = points[(i + 1) % n];
    const cross = x1 * z2 - x2 * z1;
    area += cross;
    cx += (x1 + x2) * cross;
    cz += (z1 + z2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-5) {
    const avg = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
      { x: 0, z: 0 }
    );
    return { x: avg.x / n, z: avg.z / n };
  }
  return { x: cx / (6 * area), z: cz / (6 * area) };
}

function pointInPolygon(x, z, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return true;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const zi = polygon[i].z;
    const xj = polygon[j].x;
    const zj = polygon[j].z;
    const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function projectOnSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 <= 1e-9) {
    return { x: ax, z: az, dist2: (px - ax) * (px - ax) + (pz - az) * (pz - az) };
  }
  const t = ((px - ax) * vx + (pz - az) * vz) / len2;
  const clamped = Math.max(0, Math.min(1, t));
  const x = ax + vx * clamped;
  const z = az + vz * clamped;
  const dx = px - x;
  const dz = pz - z;
  return { x, z, dist2: dx * dx + dz * dz };
}

function nearestPointOnPolygon(px, pz, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 1) return null;
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const proj = projectOnSegment(px, pz, a.x, a.z, b.x, b.z);
    if (proj.dist2 < bestDist) {
      best = { x: proj.x, z: proj.z };
      bestDist = proj.dist2;
    }
  }
  return best;
}

function randDir() {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.sin(a), z: Math.cos(a) };
}

function pickLocomotionAction(actions) {
  if (!actions) return null;
  return (
    (actions.walking && 'walking') ||
    (actions.casualWalk && 'casualWalk') ||
    (actions.running && 'running') ||
    (actions.runFast && 'runFast') ||
    null
  );
}

function forceLocomotionAnimation(group) {
  if (!group?.userData) return;
  try {
    const actions = group.userData.animations || {};
    const locomotion = pickLocomotionAction(actions);
    const fallbackIdle = actions.idle12
      ? 'idle12'
      : (actions.idle11 ? 'idle11' : (actions.idle ? 'idle' : null));
    const next = locomotion || fallbackIdle;
    if (!next || !actions[next]) {
      group.userData.currentAnimation = null;
      return;
    }
    Object.values(actions).forEach((act) => {
      if (!act || act === actions[next]) return;
      try { act.stop(); } catch (_) {}
    });
    const action = actions[next];
    try {
      action.clampWhenFinished = false;
      action.enabled = true;
      action.paused = false;
      action.reset();
      action.setLoop(THREE.LoopRepeat);
      action.play();
    } catch (_) {}
    group.userData.currentAnimation = next;
  } catch (_) {}
}

function finishConversationAndResume(group, cooldownSeconds = 7) {
  if (!group?.userData) return;
  try {
    const ai = group.userData.ai;
    if (ai && ai.type === 'wanderFree') {
      ai.conversationActive = false;
      ai.wait = 0;
      ai.dir = randDir();
      const min = ai.dirChangeMin || 1.5;
      const max = ai.dirChangeMax || min;
      ai.changeIn = min + Math.random() * Math.max(0, max - min);
      ai.convoCooldown = Math.max(0, cooldownSeconds);
    }
    group.userData.currentAnimation = null;
    forceLocomotionAnimation(group);
  } catch (_) {}
}

function isActionRunning(action) {
  if (!action) return false;
  if (typeof action.isRunning === 'function') {
    try { return action.isRunning(); } catch (_) { return !!action.enabled; }
  }
  return !!action.enabled;
}

export function attachWanderFree(npcGroup, options = {}) {
  const speed = Math.max(3, Math.min(25, options.speed || 10));
  const pauseMin = Math.max(0, options.pauseMin ?? 2);
  const pauseMax = Math.max(pauseMin, options.pauseMax ?? 7);
  const pauseChance = Math.max(0, Math.min(1, options.pauseChance ?? 0.6));
  const dirChangeMin = Math.max(0.5, options.dirChangeMin ?? 3);
  const dirChangeMax = Math.max(dirChangeMin, options.dirChangeMax ?? 6);

  const polygon = normalizePolygon(options.keepWithinPolygon);
  const centroid = polygon ? polygonCentroid(polygon) : null;
  if (polygon && !pointInPolygon(npcGroup.position.x, npcGroup.position.z, polygon)) {
    const fallback = nearestPointOnPolygon(npcGroup.position.x, npcGroup.position.z, polygon) || centroid;
    if (fallback) {
      npcGroup.position.x = fallback.x;
      npcGroup.position.z = fallback.z;
    }
  }

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
    polygon,
    polygonCentroid: centroid,
  };
}

export function updateWanderFree(npcGroup, delta, objectGrid) {
  const ai = npcGroup?.userData?.ai;
  if (!ai || ai.type !== 'wanderFree') return;

  const collisionLocked = ensureNpcCollisionIdle(npcGroup, delta, objectGrid);

  // Reduce conversation cooldown each frame
  if (ai.convoCooldown > 0) ai.convoCooldown -= delta;

  // If mid-conversation, freeze locomotion (mixer updates happen elsewhere)
  if (ai.conversationActive) {
    return;
  }

  // If interacting, freeze in place and play a conversation/listening pose
  if (npcGroup.userData?.interacting) {
    try { lockNpcInteractionPosition(npcGroup); } catch (_) {}
    try { playNpcInteractionAnimation(npcGroup); } catch (_) {}
    try { npcGroup.userData.__wasInteracting = true; } catch (_) {}
    return;
  }

  try { releaseNpcInteractionPosition(npcGroup); } catch (_) {}

  if (npcGroup.userData?.__wasInteracting && !npcGroup.userData.interacting) {
    try { npcGroup.userData.currentAnimation = null; } catch (_) {}
  }
  try { npcGroup.userData.__wasInteracting = !!npcGroup.userData.interacting; } catch (_) {}

  if (collisionLocked) {
    if (ai.wait > 0) {
      ai.wait -= delta;
      if (ai.wait < 0) ai.wait = 0;
    }
    return;
  }

  if (ai.polygon && !pointInPolygon(npcGroup.position.x, npcGroup.position.z, ai.polygon)) {
    const fallback = nearestPointOnPolygon(npcGroup.position.x, npcGroup.position.z, ai.polygon) || ai.polygonCentroid;
    if (fallback) {
      npcGroup.position.x = fallback.x;
      npcGroup.position.z = fallback.z;
      ai.dir = randDir();
      ai.wait = 0.1;
      ai.changeIn = ai.dirChangeMin || 1.5;
    }
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
        const partnerAI = partner.userData?.ai;
        if (partnerAI && partnerAI.type === 'wanderFree') {
          partnerAI.conversationActive = true;
          partnerAI.wait = 0;
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
            finishConversationAndResume(npcGroup, 7);
            const pAI = partner.userData?.ai;
            if (pAI && pAI.type === 'wanderFree') {
              finishConversationAndResume(partner, 7);
            } else {
              forceLocomotionAnimation(partner);
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

  if (ai.polygon && !pointInPolygon(resolved.x, resolved.z, ai.polygon)) {
    const fallback = nearestPointOnPolygon(npcGroup.position.x, npcGroup.position.z, ai.polygon) || ai.polygonCentroid;
    if (fallback) {
      const toX = fallback.x - npcGroup.position.x;
      const toZ = fallback.z - npcGroup.position.z;
      const len = Math.hypot(toX, toZ) || 1;
      ai.dir = { x: toX / len, z: toZ / len };
      ai.wait = 0;
      ai.changeIn = Math.max(0.5, Math.min(ai.changeIn, ai.dirChangeMin || 1.5));
      return;
    }
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
      const action = actions[name];
      if (!action) return;
      const alreadyPlaying = playing === name && isActionRunning(action);
      if (!alreadyPlaying) {
        Object.values(actions).forEach((a) => {
          if (a === action) return;
          try { a.stop(); } catch (_) {}
        });
        try {
          action.clampWhenFinished = false;
          action.enabled = true;
          action.paused = false;
          action.reset();
          action.setLoop(THREE.LoopRepeat);
          action.play();
        } catch (_) {}
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

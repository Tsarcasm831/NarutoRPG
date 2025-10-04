import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';
import {
  ensureNpcCollisionIdle,
  playNpcInteractionAnimation,
  lockNpcInteractionPosition,
  releaseNpcInteractionPosition,
} from '../common.js';
import { attachRoadPatrol } from './roadPatrol.js';
import { attachWanderFree } from './wanderFree.js';

const WALK_PATROL_SPEED = 5.75;
const RUN_PATROL_SPEED = 8.75;
const RETURN_WALK_SPEED = 6.5;
const RETURN_RUN_SPEED = 9.5;
const RETURN_TOLERANCE = 1.75;
const WANDER_SPEED = 5.25;
const WANDER_DURATION_MIN = 2;
const WANDER_DURATION_MAX = 30;
const WANDER_RADIUS = 20;
const WANDER_CENTER_JITTER = 10;
const MODE_POOL = ['walk', 'run'];

const DEFAULT_WANDER_SETTINGS = {
  speed: WANDER_SPEED,
  pauseChance: 0.7,
  pauseMin: 0.8,
  pauseMax: 3.8,
  dirChangeMin: 1.8,
  dirChangeMax: 4.2,
};

const DEFAULT_MODE_PROFILES = {
  walk: {
    speed: WALK_PATROL_SPEED,
    pauseChance: 0.32,
    pauseMin: 1.5,
    pauseMax: 4.2,
    minSegments: 6,
    deviation: {
      chance: 0.4,
      radiusMultiplier: 0.8,
      radiusMin: 8,
      speedMultiplier: 0.95,
      speedMin: 4.2,
      durationMin: 2,
      durationMax: 26,
      pauseChance: 0.5,
      pauseMin: 0.7,
      pauseMax: 3.6,
    },
  },
  run: {
    speed: RUN_PATROL_SPEED,
    pauseChance: 0.1,
    pauseMin: 0.5,
    pauseMax: 1.6,
    minSegments: 8,
    deviation: {
      chance: 0.25,
      radiusMultiplier: 0.65,
      radiusMin: 8,
      speedMultiplier: 0.85,
      speedMin: 5.5,
      durationMin: 2,
      durationMax: 18,
      pauseChance: 0.35,
      pauseMin: 0.7,
      pauseMax: 2.4,
    },
  },
};

const DEFAULT_RETURN_SPEEDS = {
  walk: RETURN_WALK_SPEED,
  run: RETURN_RUN_SPEED,
};

function mergeModeProfile(base, override = {}) {
  const deviation = {
    ...(base?.deviation || {}),
    ...(override?.deviation || {}),
  };
  return {
    ...base,
    ...override,
    deviation,
  };
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCirclePolygon(center, radius, steps = 14) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      z: center.z + Math.sin(angle) * radius,
    });
  }
  return points;
}

function playAnimationFromCandidates(npcGroup, candidates) {
  const actions = npcGroup?.userData?.animations;
  if (!actions) return false;
  const currentKey = npcGroup?.userData?.currentAnimation;
  const currentAction = currentKey ? actions[currentKey] : null;
  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i];
    const action = actions[key];
    if (!action) continue;
    if (currentAction === action) {
      try {
        if (typeof action.isRunning === 'function') {
          if (!action.isRunning()) {
            action.reset();
            action.play();
          }
        } else {
          action.enabled = true;
          action.play();
        }
      } catch (_) {}
      npcGroup.userData.currentAnimation = key;
      npcGroup.userData.currentAnimationAction = action;
      return true;
    }
    try {
      action.enabled = true;
      action.reset();
      action.setLoop(THREE.LoopRepeat);
      if (currentAction && typeof currentAction.crossFadeTo === 'function') {
        if (typeof currentAction.isRunning === 'function' && !currentAction.isRunning()) {
          currentAction.reset();
          currentAction.setLoop(THREE.LoopRepeat);
          currentAction.play();
        }
        action.play();
        currentAction.crossFadeTo(action, 0.35, true);
      } else {
        action.fadeIn?.(0.35);
        action.play();
        Object.values(actions).forEach((a) => {
          if (a === action) return;
          if (a === currentAction) {
            a.fadeOut?.(0.35);
            if (!a.fadeOut) {
              a.stop?.();
            }
            return;
          }
          a.fadeOut?.(0.35);
          if (!a.fadeOut) {
            a.stop?.();
          }
        });
      }
      npcGroup.userData.currentAnimation = key;
      npcGroup.userData.currentAnimationAction = action;
      return true;
    } catch (_) {
      return false;
    }
  }
  return false;
}

function playMoveAnimation(npcGroup, style) {
  if (style === 'run') {
    playAnimationFromCandidates(npcGroup, ['running', 'runFast', 'walking', 'casualWalk']);
  } else {
    playAnimationFromCandidates(npcGroup, ['walking', 'casualWalk', 'running', 'runFast']);
  }
}

function playIdleAnimation(npcGroup) {
  playAnimationFromCandidates(npcGroup, ['idle12', 'idle11', 'idle', 'casualWalk']);
}

function ensureModeQueue(routine) {
  if (!Array.isArray(routine.modeQueue) || routine.modeQueue.length === 0) {
    const pool = Array.isArray(routine.modePool) && routine.modePool.length > 0
      ? routine.modePool
      : MODE_POOL;
    routine.modeQueue = shuffle(pool);
  }
}

function takeNextPatrolMode(routine) {
  ensureModeQueue(routine);
  if (!Array.isArray(routine.modeQueue) || routine.modeQueue.length === 0) {
    return routine.lastPatrolMode === 'run' ? 'walk' : 'run';
  }
  let next = routine.modeQueue.shift();
  if (next === routine.lastPatrolMode && routine.modeQueue.length > 0) {
    const alt = routine.modeQueue.shift();
    routine.modeQueue.push(next);
    next = alt;
  }
  if (!next) {
    next = routine.lastPatrolMode === 'run' ? 'walk' : 'run';
  }
  return next;
}

function startWander(npcGroup, routine, overrideDuration = null) {
  routine.state = 'wandering';
  routine.loopTriggered = false;
  routine.returnFromMode = null;
  const duration = overrideDuration ?? (routine.wanderMin + Math.random() * (routine.wanderMax - routine.wanderMin));
  routine.wanderTimer = duration;

  const center = routine.spawn.clone();
  const jitter = Math.max(0, routine.wanderCenterJitter ?? WANDER_CENTER_JITTER);
  if (jitter > 0) {
    center.x += (Math.random() - 0.5) * jitter;
    center.z += (Math.random() - 0.5) * jitter;
  }
  const polygon = createCirclePolygon(center, routine.wanderRadius);
  routine.currentWanderPolygon = polygon;

  try {
    const wander = routine.wanderSettings || DEFAULT_WANDER_SETTINGS;
    attachWanderFree(npcGroup, {
      speed: wander.speed,
      pauseChance: wander.pauseChance,
      pauseMin: wander.pauseMin,
      pauseMax: wander.pauseMax,
      dirChangeMin: wander.dirChangeMin,
      dirChangeMax: wander.dirChangeMax,
      keepWithinPolygon: polygon,
    });
  } catch (_) {
    npcGroup.userData.ai = { type: 'narutoIdle' };
  }
}

function startPatrol(npcGroup, routine, mode) {
  routine.state = 'patrol';
  routine.loopTriggered = false;
  routine.returnFromMode = mode;
  routine.lastPatrolMode = mode;
  routine.currentPatrolMode = mode;

  const profile = routine.modeProfiles?.[mode] || DEFAULT_MODE_PROFILES[mode] || DEFAULT_MODE_PROFILES.walk;
  const speed = profile.speed ?? (mode === 'run' ? RUN_PATROL_SPEED : WALK_PATROL_SPEED);
  const pauseChance = profile.pauseChance ?? (mode === 'run' ? 0.1 : 0.32);
  const pauseMin = profile.pauseMin ?? (mode === 'run' ? 0.5 : 1.5);
  const pauseMax = profile.pauseMax ?? (mode === 'run' ? 1.6 : 4.2);
  const minSegments = profile.minSegments ?? (mode === 'run' ? 8 : 6);
  const deviationProfile = profile.deviation || {};
  const radiusMultiplier = deviationProfile.radiusMultiplier ?? (mode === 'run' ? 0.65 : 0.8);
  const deviationRadius = typeof deviationProfile.radius === 'number'
    ? deviationProfile.radius
    : Math.max(
        deviationProfile.radiusMin ?? 8,
        routine.wanderRadius * radiusMultiplier,
      );
  const speedMultiplier = deviationProfile.speedMultiplier ?? (mode === 'run' ? 0.85 : 0.95);
  const deviationSpeed = typeof deviationProfile.speed === 'number'
    ? deviationProfile.speed
    : Math.max(
        deviationProfile.speedMin ?? (mode === 'run' ? 5.5 : 4.2),
        speed * speedMultiplier,
      );
  const deviationDurationMin = deviationProfile.durationMin ?? 2;
  const deviationDurationMax = deviationProfile.durationMax ?? (mode === 'run' ? 18 : 26);
  const deviationPauseChance = deviationProfile.pauseChance ?? (mode === 'run' ? 0.35 : 0.5);
  const deviationPauseMin = deviationProfile.pauseMin ?? 0.7;
  const deviationPauseMax = deviationProfile.pauseMax ?? (mode === 'run' ? 2.4 : 3.6);
  const deviationChance = deviationProfile.chance ?? (mode === 'run' ? 0.25 : 0.4);

  const fallbackToWander = () => {
    startWander(npcGroup, routine, 18);
  };

  try {
    attachRoadPatrol(npcGroup, {
      speed,
      pauseChance,
      pauseMin,
      pauseMax,
      loop: {
        minSegments,
        onComplete: () => {
          if (!routine.loopTriggered && routine.state === 'patrol') {
            routine.loopTriggered = true;
          }
        },
      },
      deviation: {
        chance: deviationChance,
        radius: deviationRadius,
        speed: deviationSpeed,
        durationMin: deviationDurationMin,
        durationMax: deviationDurationMax,
        pauseChance: deviationPauseChance,
        pauseMin: deviationPauseMin,
        pauseMax: deviationPauseMax,
        radiusCollision: npcGroup.userData?.collider?.radius ?? 2.0,
      },
      onError: fallbackToWander,
    });
  } catch (_) {
    fallbackToWander();
  }
}

function startReturn(npcGroup, routine) {
  routine.state = 'returning';
  routine.loopTriggered = false;
  const speeds = routine.returnSpeeds || DEFAULT_RETURN_SPEEDS;
  const speed = routine.returnFromMode === 'run'
    ? (speeds.run ?? DEFAULT_RETURN_SPEEDS.run)
    : (speeds.walk ?? DEFAULT_RETURN_SPEEDS.walk);
  routine.returnSpeed = speed;
  routine.returnTolerance = routine.returnTolerance || RETURN_TOLERANCE;
  npcGroup.userData.ai = {
    type: 'narutoReturn',
    speed,
    radius: npcGroup.userData?.collider?.radius ?? 2.0,
  };
  playMoveAnimation(npcGroup, routine.returnFromMode === 'run' ? 'run' : 'walk');
}

export function attachNarutoRoutine(npcGroup, options = {}) {
  if (!npcGroup) return;
  const {
    spawnPosition,
    wanderRadius,
    wanderMin,
    wanderMax,
    returnTolerance,
    routineKey = '__narutoRoutine',
    modePool,
    startMode = 'walk',
    wanderSettings,
    modeProfiles,
    returnSpeeds,
    wanderCenterJitter,
  } = options || {};
  const spawn = spawnPosition && spawnPosition.isVector3
    ? spawnPosition.clone()
    : npcGroup.position.clone();
  const mergedWanderSettings = { ...DEFAULT_WANDER_SETTINGS, ...(wanderSettings || {}) };
  const mergedModeProfiles = {
    walk: mergeModeProfile(DEFAULT_MODE_PROFILES.walk, modeProfiles?.walk),
    run: mergeModeProfile(DEFAULT_MODE_PROFILES.run, modeProfiles?.run),
  };
  const mergedReturnSpeeds = { ...DEFAULT_RETURN_SPEEDS, ...(returnSpeeds || {}) };
  const routine = {
    state: 'init',
    spawn,
    wanderRadius: Math.max(8, wanderRadius || WANDER_RADIUS),
    wanderMin: Math.max(10, wanderMin ?? WANDER_DURATION_MIN),
    wanderMax: Math.max(wanderMin ?? WANDER_DURATION_MIN, wanderMax ?? WANDER_DURATION_MAX),
    returnTolerance: returnTolerance ?? RETURN_TOLERANCE,
    modeQueue: [],
    modePool: Array.isArray(modePool) && modePool.length > 0 ? modePool.slice() : MODE_POOL.slice(),
    loopTriggered: false,
    wanderTimer: 0,
    returnFromMode: null,
    lastPatrolMode: null,
    key: routineKey,
    startMode,
    wanderSettings: mergedWanderSettings,
    modeProfiles: mergedModeProfiles,
    returnSpeeds: mergedReturnSpeeds,
    wanderCenterJitter: wanderCenterJitter ?? WANDER_CENTER_JITTER,
  };
  npcGroup.userData.__narutoRoutineKey = routineKey;
  npcGroup.userData[routineKey] = routine;
  if (routineKey !== '__narutoRoutine') {
    npcGroup.userData.__narutoRoutine = routine;
  }
  startPatrol(npcGroup, routine, routine.startMode === 'run' ? 'run' : 'walk');
}

export function updateNarutoRoutine(npcGroup, delta, objectGrid) {
  const key = npcGroup?.userData?.__narutoRoutineKey || '__narutoRoutine';
  const routine = npcGroup?.userData?.[key] || npcGroup?.userData?.__narutoRoutine;
  if (!routine) return;
  const collisionLocked = ensureNpcCollisionIdle(npcGroup, delta, objectGrid);
  if (npcGroup.userData?.interacting) {
    try { lockNpcInteractionPosition(npcGroup); } catch (_) {}
    try { npcGroup.userData.__wasInteractingRoutine = true; } catch (_) {}
    try { playNpcInteractionAnimation(npcGroup); } catch (_) {}
    return;
  }

  try { releaseNpcInteractionPosition(npcGroup); } catch (_) {}

  if (npcGroup.userData?.__wasInteractingRoutine) {
    try { npcGroup.userData.currentAnimation = null; } catch (_) {}
    try { npcGroup.userData.__wasInteractingRoutine = false; } catch (_) {}
  }

  if (routine.state === 'patrol') {
    if (routine.loopTriggered) {
      startReturn(npcGroup, routine);
    }
    return;
  }

  if (routine.state === 'returning') {
    if (collisionLocked) {
      playIdleAnimation(npcGroup);
      return;
    }
    const ai = npcGroup.userData?.ai;
    if (!ai || ai.type !== 'narutoReturn') {
      startReturn(npcGroup, routine);
      return;
    }

    const target = routine.spawn;
    const dx = target.x - npcGroup.position.x;
    const dz = target.z - npcGroup.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= (routine.returnTolerance || RETURN_TOLERANCE)) {
      playIdleAnimation(npcGroup);
      startWander(npcGroup, routine);
      return;
    }

    const speed = ai.speed || routine.returnSpeed || RETURN_WALK_SPEED;
    const step = Math.min(speed * delta, distance);
    const normX = dx / (distance || 1);
    const normZ = dz / (distance || 1);
    const intended = {
      x: npcGroup.position.x + normX * step,
      z: npcGroup.position.z + normZ * step,
    };
    const restore = npcGroup.userData.__ignoreCollision;
    npcGroup.userData.__ignoreCollision = true;
    const resolved = resolveCollisions(intended, ai.radius || npcGroup.userData?.collider?.radius || 2.0, objectGrid);
    npcGroup.userData.__ignoreCollision = restore;
    npcGroup.position.x = resolved.x;
    npcGroup.position.z = resolved.z;

    try {
      const model = npcGroup.userData.model || npcGroup.children?.[0];
      if (model && distance > 0.01) {
        model.rotation.y = Math.atan2(normX, normZ);
      }
    } catch (_) {}

    playMoveAnimation(npcGroup, speed >= ((RUN_PATROL_SPEED + WALK_PATROL_SPEED) / 2) ? 'run' : 'walk');
    return;
  }

  if (routine.state === 'wandering') {
    if (routine.wanderTimer > 0) {
      routine.wanderTimer -= delta;
    }
    if (routine.wanderTimer <= 0) {
      routine.wanderTimer = 0;
      npcGroup.userData.ai = null;
      playIdleAnimation(npcGroup);
      const nextMode = takeNextPatrolMode(routine);
      startPatrol(npcGroup, routine, nextMode);
    }
  }
}

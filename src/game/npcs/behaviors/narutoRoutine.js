import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';
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
  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i];
    const action = actions[key];
    if (!action) continue;
    const current = npcGroup.userData.currentAnimation;
    if (current === key || current === action._clip?.name) return true;
    try {
      Object.values(actions).forEach((a) => a.stop());
      action.reset();
      action.setLoop(THREE.LoopRepeat);
      action.play();
      npcGroup.userData.currentAnimation = key;
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
    routine.modeQueue = shuffle(MODE_POOL);
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
  if (WANDER_CENTER_JITTER > 0) {
    center.x += (Math.random() - 0.5) * WANDER_CENTER_JITTER;
    center.z += (Math.random() - 0.5) * WANDER_CENTER_JITTER;
  }
  const polygon = createCirclePolygon(center, routine.wanderRadius);
  routine.currentWanderPolygon = polygon;

  try {
    attachWanderFree(npcGroup, {
      speed: WANDER_SPEED,
      pauseChance: 0.7,
      pauseMin: 0.8,
      pauseMax: 3.8,
      dirChangeMin: 1.8,
      dirChangeMax: 4.2,
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

  const speed = mode === 'run' ? RUN_PATROL_SPEED : WALK_PATROL_SPEED;
  const pauseChance = mode === 'run' ? 0.1 : 0.32;
  const pauseMin = mode === 'run' ? 0.5 : 1.5;
  const pauseMax = mode === 'run' ? 1.6 : 4.2;
  const minSegments = mode === 'run' ? 8 : 6;
  const deviationRadius = Math.max(8, routine.wanderRadius * (mode === 'run' ? 0.65 : 0.8));

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
        chance: mode === 'run' ? 0.25 : 0.4,
        radius: deviationRadius,
        speed: mode === 'run' ? Math.max(5.5, speed * 0.85) : Math.max(4.2, speed * 0.95),
        durationMin: 2,
        durationMax: mode === 'run' ? 18 : 26,
        pauseChance: mode === 'run' ? 0.35 : 0.5,
        pauseMin: 0.7,
        pauseMax: mode === 'run' ? 2.4 : 3.6,
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
  const speed = routine.returnFromMode === 'run' ? RETURN_RUN_SPEED : RETURN_WALK_SPEED;
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
  const spawn = options.spawnPosition && options.spawnPosition.isVector3
    ? options.spawnPosition.clone()
    : npcGroup.position.clone();
  const routine = {
    state: 'init',
    spawn,
    wanderRadius: Math.max(8, options.wanderRadius || WANDER_RADIUS),
    wanderMin: Math.max(10, options.wanderMin ?? WANDER_DURATION_MIN),
    wanderMax: Math.max(options.wanderMin ?? WANDER_DURATION_MIN, options.wanderMax ?? WANDER_DURATION_MAX),
    returnTolerance: options.returnTolerance ?? RETURN_TOLERANCE,
    modeQueue: [],
    loopTriggered: false,
    wanderTimer: 0,
    returnFromMode: null,
    lastPatrolMode: null,
  };
  npcGroup.userData.__narutoRoutine = routine;
  startPatrol(npcGroup, routine, 'walk');
}

export function updateNarutoRoutine(npcGroup, delta, objectGrid) {
  const routine = npcGroup?.userData?.__narutoRoutine;
  if (!routine) return;
  if (npcGroup.userData?.interacting) {
    playIdleAnimation(npcGroup);
    return;
  }

  if (routine.state === 'patrol') {
    if (routine.loopTriggered) {
      startReturn(npcGroup, routine);
    }
    return;
  }

  if (routine.state === 'returning') {
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

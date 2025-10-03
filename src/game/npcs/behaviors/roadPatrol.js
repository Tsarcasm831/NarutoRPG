import * as THREE from 'three';
import { resolveCollisions } from '/src/game/player/movement/collision.js';
import { loadKonohaRoads } from '/src/components/game/objects/konoha_roads.js';
import { WORLD_SIZE } from '/src/scene/terrain.js';
import { ensureNpcCollisionIdle } from '../common.js';

const WORLD_HALF = WORLD_SIZE / 2;

function toWorldPoint(point) {
  if (!Array.isArray(point) || point.length < 2) return null;
  const x = (Number(point[0]) / 100) * WORLD_SIZE - WORLD_HALF;
  const z = (Number(point[1]) / 100) * WORLD_SIZE - WORLD_HALF;
  return { x, z };
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

function segmentWithinPolygon(segment, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return true;
  const midX = (segment.start.x + segment.end.x) / 2;
  const midZ = (segment.start.z + segment.end.z) / 2;
  return pointInPolygon(midX, midZ, polygon);
}

function dist2(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return dx * dx + dz * dz;
}

function segmentProjection(px, pz, segment) {
  const ax = segment.start.x;
  const az = segment.start.z;
  const bx = segment.end.x;
  const bz = segment.end.z;
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 === 0) {
    return { point: { x: ax, z: az }, t: 0, dist2: dist2(px, pz, ax, az) };
  }
  const t = ((px - ax) * vx + (pz - az) * vz) / len2;
  const clamped = Math.max(0, Math.min(1, t));
  const projX = ax + vx * clamped;
  const projZ = az + vz * clamped;
  return { point: { x: projX, z: projZ }, t: clamped, dist2: dist2(px, pz, projX, projZ) };
}

function makeNodeKey(point) {
  return `${point.x.toFixed(2)},${point.z.toFixed(2)}`;
}

const WALK_SPEED_THRESHOLD = 7.25;

function ensureMoveAnimation(npcGroup, speed = WALK_SPEED_THRESHOLD) {
  const actions = npcGroup?.userData?.animations;
  if (!actions) return;
  const preferWalk = speed <= WALK_SPEED_THRESHOLD;
  const candidates = preferWalk
    ? ['walking', 'casualWalk', 'running', 'runFast']
    : ['running', 'runFast', 'walking', 'casualWalk'];
  for (const key of candidates) {
    const action = actions[key];
    if (!action) continue;
    const desiredName = action._clip?.name || key;
    if (npcGroup.userData.currentAnimation === desiredName) return;
    try {
      Object.values(actions).forEach((anim) => anim.stop());
      action.reset();
      action.setLoop(THREE.LoopRepeat);
      action.play();
      npcGroup.userData.currentAnimation = desiredName;
    } catch (_) {}
    return;
  }
}

function ensureIdleAnimation(npcGroup) {
  const actions = npcGroup?.userData?.animations;
  if (!actions) return;
  const idle = actions.idle12 || actions.idle11 || actions.idle || actions.casualWalk;
  if (!idle) return;
  try {
    Object.values(actions).forEach((action) => action.stop());
    idle.reset();
    idle.setLoop(THREE.LoopRepeat);
    idle.play();
    npcGroup.userData.currentAnimation = idle._clip?.name || 'idle';
  } catch (_) {}
}

function pickRandom(items) {
  if (!Array.isArray(items) || !items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function buildRoadNetwork(roads, minWidth = 3, restrictPolygon = null) {
  const segments = [];
  const nodes = new Map();
  const addNode = (key, point, segment, dir) => {
    const entry = nodes.get(key) || { point, links: [] };
    entry.links.push({ segment, dir });
    nodes.set(key, entry);
  };

  for (const road of roads || []) {
    const width = Number(road.width || 0);
    if (width < minWidth) continue;
    const pts = Array.isArray(road.points) ? road.points.map(toWorldPoint).filter(Boolean) : [];
    for (let i = 0; i < pts.length - 1; i++) {
      const start = pts[i];
      const end = pts[i + 1];
      if (!start || !end) continue;
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const length = Math.hypot(dx, dz);
      if (!Number.isFinite(length) || length <= 0.5) continue;
      const segment = {
        start,
        end,
        startKey: makeNodeKey(start),
        endKey: makeNodeKey(end),
        length,
      };
      if (restrictPolygon && !segmentWithinPolygon(segment, restrictPolygon)) continue;
      segments.push(segment);
      addNode(segment.startKey, start, segment, 1);
      addNode(segment.endKey, end, segment, -1);
    }
  }

  return { segments, nodes };
}

function nearestSegment(position, segments) {
  let best = null;
  let bestDist = Infinity;
  for (const segment of segments) {
    const proj = segmentProjection(position.x, position.z, segment);
    if (proj.dist2 < bestDist) {
      bestDist = proj.dist2;
      best = { segment, projection: proj };
    }
  }
  return best;
}

function chooseNextSegment(ai, currentNodeKey) {
  if (!currentNodeKey) return null;
  const node = ai.nodes.get(currentNodeKey);
  if (!node || !node.links.length) return null;
  const alternatives = node.links.filter((link) => link.segment !== ai.currentSegment);
  const pool = alternatives.length ? alternatives : node.links;
  return pickRandom(pool);
}

function setTarget(ai, npcGroup, targetPoint, speedOverride = null) {
  if (!targetPoint) return;
  ai.targetPoint = { x: targetPoint.x, z: targetPoint.z };
  ensureMoveAnimation(npcGroup, speedOverride ?? ai.speed ?? WALK_SPEED_THRESHOLD);
}

function maybeStartDeviation(ai, npcGroup) {
  if (!ai.deviation || ai.mode === 'deviate') return false;
  if (Math.random() >= ai.deviation.chance) return false;
  const duration = ai.deviation.durationMin + Math.random() * (ai.deviation.durationMax - ai.deviation.durationMin);
  ai.mode = 'deviate';
  ai.deviationState = {
    timer: duration,
    wait: 0,
    origin: { x: npcGroup.position.x, z: npcGroup.position.z },
    target: null,
  };
  ensureMoveAnimation(npcGroup, ai.deviation.speed);
  return true;
}

function handleArrival(ai, npcGroup) {
  if (ai.mode === 'approach') {
    ai.mode = 'patrol';
    if (!ai.currentSegment) return;
    const nextPoint = ai.travelDir > 0 ? ai.currentSegment.end : ai.currentSegment.start;
    setTarget(ai, npcGroup, nextPoint, ai.speed);
    return;
  }

  if (!ai.currentSegment) return;
  const pauseChance = ai.pauseChance ?? 0.5;
  if (Math.random() < pauseChance) {
    ai.wait = ai.pauseMin + Math.random() * (ai.pauseMax - ai.pauseMin);
    ensureIdleAnimation(npcGroup);
  }

  if (maybeStartDeviation(ai, npcGroup)) {
    ai.targetPoint = null;
    return;
  }

  const arrivedKey = ai.travelDir > 0 ? ai.currentSegment.endKey : ai.currentSegment.startKey;
  if (ai.loopConfig) {
    const loopState = ai.loopState || (ai.loopState = {
      originKey: ai.loopConfig.anchorKey || null,
      stepsSinceOrigin: 0,
      hasLeftOrigin: false,
      loopCount: 0,
    });
    if (!loopState.originKey) {
      loopState.originKey = ai.loopConfig.anchorKey || arrivedKey;
      loopState.stepsSinceOrigin = 0;
      loopState.hasLeftOrigin = false;
    } else {
      loopState.stepsSinceOrigin += 1;
      if (arrivedKey === loopState.originKey) {
        if (loopState.hasLeftOrigin && loopState.stepsSinceOrigin >= ai.loopConfig.minSegments) {
          loopState.loopCount += 1;
          loopState.stepsSinceOrigin = 0;
          loopState.hasLeftOrigin = false;
          if (ai.loopConfig.onComplete) {
            try {
              ai.loopConfig.onComplete(loopState.loopCount, npcGroup, ai);
            } catch (_) {}
          }
          if (ai.loopConfig.resetOriginOnComplete) {
            loopState.originKey = ai.loopConfig.anchorKey || arrivedKey;
          }
        } else {
          loopState.stepsSinceOrigin = 0;
          loopState.hasLeftOrigin = false;
        }
      } else {
        loopState.hasLeftOrigin = true;
      }
    }
  }

  const next = chooseNextSegment(ai, arrivedKey);
    if (!next) {
      ai.travelDir *= -1;
      const fallbackPoint = ai.travelDir > 0 ? ai.currentSegment.end : ai.currentSegment.start;
      setTarget(ai, npcGroup, fallbackPoint, ai.speed);
      return;
    }

    ai.currentSegment = next.segment;
    ai.travelDir = next.dir;
    const destination = ai.travelDir > 0 ? ai.currentSegment.end : ai.currentSegment.start;
    setTarget(ai, npcGroup, destination, ai.speed);
}

function randomPointInRadius(origin, radius) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius;
  return {
    x: origin.x + Math.cos(angle) * distance,
    z: origin.z + Math.sin(angle) * distance,
  };
}

function finishDeviation(ai, npcGroup) {
  ai.mode = 'approach';
  ai.deviationState = null;
  const nearest = nearestSegment(npcGroup.position, ai.segments);
  if (!nearest) {
    ai.targetPoint = null;
    ai.mode = 'patrol';
    return;
  }
  ai.currentSegment = nearest.segment;
  const distToStart = dist2(npcGroup.position.x, npcGroup.position.z, nearest.segment.start.x, nearest.segment.start.z);
  const distToEnd = dist2(npcGroup.position.x, npcGroup.position.z, nearest.segment.end.x, nearest.segment.end.z);
  ai.travelDir = distToEnd < distToStart ? 1 : -1;
  ai.pendingTarget = ai.travelDir > 0 ? nearest.segment.end : nearest.segment.start;
  setTarget(ai, npcGroup, nearest.projection.point, ai.speed);
}

function updateDeviation(ai, npcGroup, delta, objectGrid) {
  const deviation = ai.deviation;
  const state = ai.deviationState;
  if (!deviation || !state) {
    finishDeviation(ai, npcGroup);
    return;
  }

  state.timer -= delta;
  if (state.timer <= 0) {
    finishDeviation(ai, npcGroup);
    return;
  }

  if (state.wait > 0) {
    state.wait -= delta;
    if (state.wait <= 0) {
      state.wait = 0;
      ensureMoveAnimation(npcGroup, deviation.speed);
    } else {
      return;
    }
  }

  if (!state.target) {
    if (Math.random() < deviation.pauseChance) {
      state.wait = deviation.pauseMin + Math.random() * (deviation.pauseMax - deviation.pauseMin);
      ensureIdleAnimation(npcGroup);
      return;
    }
    state.target = randomPointInRadius(state.origin, deviation.radius);
    ensureMoveAnimation(npcGroup, deviation.speed);
  }

  const dx = state.target.x - npcGroup.position.x;
  const dz = state.target.z - npcGroup.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.1) {
    state.target = null;
    return;
  }

  const step = deviation.speed * delta;
  const prevX = npcGroup.position.x;
  const prevZ = npcGroup.position.z;
  const moveX = prevX + (dx / (distance || 1)) * Math.min(step, distance);
  const moveZ = prevZ + (dz / (distance || 1)) * Math.min(step, distance);
  const intended = { x: moveX, z: moveZ };
  const restoreFlag = npcGroup.userData.__ignoreCollision;
  npcGroup.userData.__ignoreCollision = true;
  const collisionRadius = deviation.radiusCollision ?? ai.radius;
  const resolved = resolveCollisions(intended, collisionRadius, objectGrid);
  npcGroup.userData.__ignoreCollision = restoreFlag;
  npcGroup.position.x = resolved.x;
  npcGroup.position.z = resolved.z;

  try {
    const model = npcGroup.userData.model || npcGroup.children?.[0];
    const moveDirX = npcGroup.position.x - prevX;
    const moveDirZ = npcGroup.position.z - prevZ;
    if (model && (Math.abs(moveDirX) > 1e-3 || Math.abs(moveDirZ) > 1e-3)) {
      model.rotation.y = Math.atan2(moveDirX, moveDirZ);
    }
  } catch (_) {}
}

export function attachRoadPatrol(npcGroup, options = {}) {
  const speed = Math.max(2, Math.min(20, options.speed || 8));
  const pauseMin = Math.max(0, options.pauseMin ?? 1.5);
  const pauseMax = Math.max(pauseMin, options.pauseMax ?? 4);
  const pauseChance = Math.max(0, Math.min(1, options.pauseChance ?? 0.35));
  const radius = Math.max(1.2, Math.min(3.0, options.radius || (npcGroup.userData?.collider?.radius ?? 2.0)));
  const fallback = typeof options.onError === 'function' ? options.onError : null;
  const restrictPolygon = Array.isArray(options.restrictToPolygon) && options.restrictToPolygon.length >= 3
    ? options.restrictToPolygon
    : null;
  const loopCfgRaw = options.loop && typeof options.loop === 'object' ? options.loop : null;
  const loopConfig = loopCfgRaw
    ? {
        minSegments: Math.max(1, loopCfgRaw.minSegments || 4),
        onComplete: typeof loopCfgRaw.onComplete === 'function' ? loopCfgRaw.onComplete : null,
        anchorKey: typeof loopCfgRaw.anchorKey === 'string' && loopCfgRaw.anchorKey.length ? loopCfgRaw.anchorKey : null,
        resetOriginOnComplete: loopCfgRaw.resetOriginOnComplete !== false,
      }
    : null;

  const deviationRaw = options.deviation && typeof options.deviation === 'object' ? options.deviation : null;
  const deviation = deviationRaw
    ? {
        chance: Math.max(0, Math.min(1, deviationRaw.chance ?? 0.3)),
        radius: Math.max(2, deviationRaw.radius ?? 10),
        speed: Math.max(2, Math.min(20, deviationRaw.speed ?? Math.max(2, speed * 0.85))),
        durationMin: Math.max(0.5, deviationRaw.durationMin ?? 4),
        durationMax: Math.max(
          Math.max(0.5, deviationRaw.durationMin ?? 4),
          deviationRaw.durationMax ?? 12,
        ),
        pauseChance: Math.max(0, Math.min(1, deviationRaw.pauseChance ?? pauseChance)),
        pauseMin: Math.max(0, deviationRaw.pauseMin ?? pauseMin),
        pauseMax: Math.max(deviationRaw.pauseMin ?? pauseMin, deviationRaw.pauseMax ?? pauseMax),
        radiusCollision: Math.max(1.2, Math.min(3.0, deviationRaw.radiusCollision || radius)),
      }
    : null;

  npcGroup.userData.ai = {
    type: 'roadPatrol',
    speed,
    radius,
    wait: 0,
    pauseMin,
    pauseMax,
    pauseChance,
    targetPoint: null,
    currentSegment: null,
    travelDir: 1,
    mode: 'init',
    pendingTarget: null,
    segments: [],
    nodes: new Map(),
    ready: false,
    loopConfig,
    loopState: loopConfig ? { originKey: loopConfig.anchorKey || null, stepsSinceOrigin: 0, hasLeftOrigin: false, loopCount: 0 } : null,
    deviation,
    deviationState: null,
  };

  loadKonohaRoads()
    .then(({ roads }) => {
      const { segments, nodes } = buildRoadNetwork(roads?.all || [], options.minRoadWidth || 3, restrictPolygon);
      if (!segments.length) {
        if (fallback) fallback();
        return;
      }
      const ai = npcGroup.userData.ai;
      if (!ai || ai.type !== 'roadPatrol') return;
      ai.segments = segments;
      ai.nodes = nodes;
      ai.ready = true;
      const nearest = nearestSegment(npcGroup.position, segments);
      if (nearest) {
        ai.currentSegment = nearest.segment;
        ai.mode = 'approach';
        ai.travelDir = Math.random() < 0.5 ? 1 : -1;
        ai.pendingTarget = ai.travelDir > 0 ? nearest.segment.end : nearest.segment.start;
        setTarget(ai, npcGroup, nearest.projection.point, ai.speed);
      }
    })
    .catch(() => {
      if (fallback) fallback();
    });
}

export function updateRoadPatrol(npcGroup, delta, objectGrid) {
  const ai = npcGroup?.userData?.ai;
  if (!ai || ai.type !== 'roadPatrol') return;

  const collisionLocked = ensureNpcCollisionIdle(npcGroup, delta, objectGrid);

  if (ai.wait > 0) {
    ai.wait -= delta;
    if (ai.wait <= 0) {
      ai.wait = 0;
      if (!collisionLocked) {
        ensureMoveAnimation(npcGroup, ai.mode === 'deviate' && ai.deviation ? ai.deviation.speed : ai.speed);
      }
    }
    return;
  }

  if (collisionLocked) {
    return;
  }

  if (ai.mode === 'deviate') {
    updateDeviation(ai, npcGroup, delta, objectGrid);
    if (ai.mode === 'deviate') {
      return;
    }
    if (ai.mode === 'approach') {
      ai.targetPoint = ai.targetPoint || null;
    }
  }

  if (!ai.ready || !ai.currentSegment) return;
  if (!ai.targetPoint) {
    handleArrival(ai, npcGroup);
    if (!ai.targetPoint) return;
  }

  const dx = ai.targetPoint.x - npcGroup.position.x;
  const dz = ai.targetPoint.z - npcGroup.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.05) {
    if (ai.mode === 'approach' && ai.pendingTarget) {
      setTarget(ai, npcGroup, ai.pendingTarget, ai.speed);
      ai.mode = 'patrol';
      ai.pendingTarget = null;
      return;
    }
    handleArrival(ai, npcGroup);
    return;
  }

  const moveSpeed = ai.speed;
  const step = moveSpeed * delta;
  const normX = dx / (distance || 1);
  const normZ = dz / (distance || 1);
  const moveX = npcGroup.position.x + normX * Math.min(step, distance);
  const moveZ = npcGroup.position.z + normZ * Math.min(step, distance);

  const intended = { x: moveX, z: moveZ };
  const restoreFlag = npcGroup.userData.__ignoreCollision;
  npcGroup.userData.__ignoreCollision = true;
  const resolved = resolveCollisions(intended, ai.radius, objectGrid);
  npcGroup.userData.__ignoreCollision = restoreFlag;

  npcGroup.position.x = resolved.x;
  npcGroup.position.z = resolved.z;

  try {
    const model = npcGroup.userData.model || npcGroup.children?.[0];
    if (model && distance > 0.01) {
      model.rotation.y = Math.atan2(normX, normZ);
    }
  } catch (_) {}

    if (Math.hypot(ai.targetPoint.x - npcGroup.position.x, ai.targetPoint.z - npcGroup.position.z) < 0.3) {
      if (ai.mode === 'approach' && ai.pendingTarget) {
        setTarget(ai, npcGroup, ai.pendingTarget, ai.speed);
        ai.mode = 'patrol';
        ai.pendingTarget = null;
      } else {
        handleArrival(ai, npcGroup);
      }
    }
}


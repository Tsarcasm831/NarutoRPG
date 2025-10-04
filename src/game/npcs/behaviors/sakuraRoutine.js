import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const SAKURA_ROUTINE_KEY = '__sakuraRoutine';

export function attachSakuraRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 20,
    wanderMin: 12,
    wanderMax: 33,
    wanderCenterJitter: 9,
    startMode: 'walk',
    modePool: ['walk', 'walk', 'run'],
    returnTolerance: 1.3,
    wanderSettings: {
      speed: 5.1,
      pauseChance: 0.82,
      pauseMin: 1.1,
      pauseMax: 4.5,
      dirChangeMin: 1.4,
      dirChangeMax: 3.2,
    },
    modeProfiles: {
      walk: {
        speed: 5.6,
        pauseChance: 0.44,
        pauseMin: 1.8,
        pauseMax: 4.8,
        minSegments: 6,
        deviation: {
          chance: 0.5,
          radiusMultiplier: 0.92,
          radiusMin: 8,
          speedMultiplier: 0.92,
          speedMin: 4.4,
          durationMin: 2,
          durationMax: 28,
          pauseChance: 0.58,
          pauseMin: 0.9,
          pauseMax: 3.6,
        },
      },
      run: {
        speed: 8.2,
        pauseChance: 0.18,
        pauseMin: 0.6,
        pauseMax: 1.6,
        minSegments: 7,
        deviation: {
          chance: 0.32,
          radiusMultiplier: 0.7,
          radiusMin: 9,
          speedMultiplier: 0.9,
          speedMin: 5.4,
          durationMin: 2.5,
          durationMax: 20,
          pauseChance: 0.4,
          pauseMin: 0.6,
          pauseMax: 2.0,
        },
      },
    },
    returnSpeeds: {
      walk: 6.1,
      run: 9.0,
    },
    ...options,
    routineKey: SAKURA_ROUTINE_KEY,
  });
}

export function updateSakuraRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== SAKURA_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

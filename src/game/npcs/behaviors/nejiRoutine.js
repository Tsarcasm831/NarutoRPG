import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const NEJI_ROUTINE_KEY = '__nejiRoutine';

export function attachNejiRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 24,
    wanderMin: 13,
    wanderMax: 32,
    wanderCenterJitter: 5,
    startMode: 'walk',
    modePool: ['walk', 'run', 'walk'],
    returnTolerance: 1.1,
    wanderSettings: {
      speed: 5.4,
      pauseChance: 0.6,
      pauseMin: 0.9,
      pauseMax: 3.2,
      dirChangeMin: 1.5,
      dirChangeMax: 3.5,
    },
    modeProfiles: {
      walk: {
        speed: 5.8,
        pauseChance: 0.36,
        pauseMin: 1.4,
        pauseMax: 3.4,
        minSegments: 7,
        deviation: {
          chance: 0.46,
          radiusMultiplier: 0.82,
          radiusMin: 8,
          speedMultiplier: 0.94,
          speedMin: 4.6,
          durationMin: 2,
          durationMax: 22,
          pauseChance: 0.48,
          pauseMin: 0.7,
          pauseMax: 2.6,
        },
      },
      run: {
        speed: 8.6,
        pauseChance: 0.08,
        pauseMin: 0.5,
        pauseMax: 1.4,
        minSegments: 8,
        deviation: {
          chance: 0.37,
          radiusMultiplier: 0.68,
          radiusMin: 9,
          speedMultiplier: 0.93,
          speedMin: 5.6,
          durationMin: 2.5,
          durationMax: 17,
          pauseChance: 0.32,
          pauseMin: 0.5,
          pauseMax: 1.8,
        },
      },
    },
    returnSpeeds: {
      walk: 6.4,
      run: 9.2,
    },
    ...options,
    routineKey: NEJI_ROUTINE_KEY,
  });
}

export function updateNejiRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== NEJI_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

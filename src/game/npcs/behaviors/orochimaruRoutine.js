import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const OROCHIMARU_ROUTINE_KEY = '__orochimaruRoutine';

export function attachOrochimaruRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 34,
    wanderMin: 14,
    wanderMax: 34,
    wanderCenterJitter: 12,
    startMode: 'walk',
    modePool: ['walk', 'walk', 'run', 'walk'],
    returnTolerance: 2.2,
    wanderSettings: {
      speed: 5.0,
      pauseChance: 0.74,
      pauseMin: 1.3,
      pauseMax: 4.0,
      dirChangeMin: 2.0,
      dirChangeMax: 4.8,
    },
    modeProfiles: {
      walk: {
        speed: 5.3,
        pauseChance: 0.38,
        pauseMin: 1.6,
        pauseMax: 4.5,
        minSegments: 6,
        deviation: {
          chance: 0.52,
          radiusMultiplier: 0.95,
          radiusMin: 10,
          speedMultiplier: 0.9,
          speedMin: 4.2,
          durationMin: 3,
          durationMax: 30,
          pauseChance: 0.55,
          pauseMin: 0.8,
          pauseMax: 3.4,
        },
      },
      run: {
        speed: 8.9,
        pauseChance: 0.14,
        pauseMin: 0.7,
        pauseMax: 1.7,
        minSegments: 7,
        deviation: {
          chance: 0.5,
          radiusMultiplier: 0.75,
          radiusMin: 11,
          speedMultiplier: 0.92,
          speedMin: 5.0,
          durationMin: 3,
          durationMax: 22,
          pauseChance: 0.36,
          pauseMin: 0.6,
          pauseMax: 2.1,
        },
      },
    },
    returnSpeeds: {
      walk: 6.0,
      run: 9.6,
    },
    ...options,
    routineKey: OROCHIMARU_ROUTINE_KEY,
  });
}

export function updateOrochimaruRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== OROCHIMARU_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

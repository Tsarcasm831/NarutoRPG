import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const SASUKE_ROUTINE_KEY = '__sasukeRoutine';

export function attachSasukeRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 28,
    wanderMin: 9,
    wanderMax: 24,
    wanderCenterJitter: 6,
    startMode: 'run',
    modePool: ['run', 'run', 'walk'],
    returnTolerance: 1.4,
    wanderSettings: {
      speed: 6.2,
      pauseChance: 0.42,
      pauseMin: 0.6,
      pauseMax: 2.2,
      dirChangeMin: 1.2,
      dirChangeMax: 2.6,
    },
    modeProfiles: {
      run: {
        speed: 9.2,
        pauseChance: 0.06,
        pauseMin: 0.4,
        pauseMax: 1.2,
        minSegments: 9,
        deviation: {
          chance: 0.45,
          radiusMultiplier: 0.72,
          radiusMin: 10,
          speedMultiplier: 0.96,
          speedMin: 6.0,
          durationMin: 3,
          durationMax: 15,
          pauseChance: 0.28,
          pauseMin: 0.5,
          pauseMax: 1.6,
        },
      },
      walk: {
        speed: 6.4,
        pauseChance: 0.25,
        pauseMin: 1.0,
        pauseMax: 2.6,
        minSegments: 7,
        deviation: {
          chance: 0.38,
          radiusMultiplier: 0.78,
          radiusMin: 9,
          speedMultiplier: 0.98,
          speedMin: 4.8,
          durationMin: 2,
          durationMax: 18,
          pauseChance: 0.42,
          pauseMin: 0.7,
          pauseMax: 2.4,
        },
      },
    },
    returnSpeeds: {
      walk: 6.9,
      run: 10.0,
    },
    ...options,
    routineKey: SASUKE_ROUTINE_KEY,
  });
}

export function updateSasukeRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== SASUKE_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

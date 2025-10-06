import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const TSUNADE_ROUTINE_KEY = '__tsunadeRoutine';

export function attachTsunadeRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 18,
    wanderMin: 16,
    wanderMax: 32,
    wanderCenterJitter: 5,
    modePool: ['walk', 'walk'],
    startMode: 'walk',
    wanderSettings: {
      pauseChance: 0.76,
      pauseMin: 1.6,
      pauseMax: 6.0,
      dirChangeMin: 1.8,
      dirChangeMax: 4.0,
    },
    modeProfiles: {
      walk: {
        pauseChance: 0.52,
        pauseMin: 1.2,
        pauseMax: 4.8,
        deviation: {
          chance: 0.32,
          radiusMultiplier: 0.85,
        },
      },
      run: {
        pauseChance: 0.16,
        pauseMin: 0.6,
        pauseMax: 1.6,
        deviation: {
          chance: 0.22,
          radiusMultiplier: 0.7,
          speedMultiplier: 0.85,
        },
      },
    },
    returnSpeeds: {
      walk: 6.0,
      run: 8.4,
    },
    ...options,
    routineKey: TSUNADE_ROUTINE_KEY,
  });
}

export function updateTsunadeRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== TSUNADE_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

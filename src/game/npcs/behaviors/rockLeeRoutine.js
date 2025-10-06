import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const ROCK_LEE_ROUTINE_KEY = '__rockLeeRoutine';

export function attachRockLeeRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 22,
    wanderMin: 10,
    wanderMax: 24,
    wanderCenterJitter: 8,
    modePool: ['run'],
    startMode: 'run',
    wanderSettings: {
      pauseChance: 0.18,
      pauseMin: 0.4,
      pauseMax: 1.6,
      dirChangeMin: 1.0,
      dirChangeMax: 2.2,
    },
    modeProfiles: {
      run: {
        pauseChance: 0.06,
        pauseMin: 0.3,
        pauseMax: 1.0,
        deviation: {
          chance: 0.42,
          radiusMultiplier: 0.7,
          speedMultiplier: 1.12,
          durationMin: 1.2,
          durationMax: 14,
        },
      },
    },
    returnSpeeds: {
      walk: 7.0,
      run: 10.0,
    },
    ...options,
    routineKey: ROCK_LEE_ROUTINE_KEY,
  });
}

export function updateRockLeeRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== ROCK_LEE_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

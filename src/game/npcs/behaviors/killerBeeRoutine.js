import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const KILLER_BEE_ROUTINE_KEY = '__killerBeeRoutine';

export function attachKillerBeeRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 24,
    wanderMin: 12,
    wanderMax: 28,
    wanderCenterJitter: 12,
    modePool: ['run', 'run', 'walk'],
    startMode: 'run',
    wanderSettings: {
      pauseChance: 0.28,
      pauseMin: 0.6,
      pauseMax: 2.2,
      dirChangeMin: 1.2,
      dirChangeMax: 2.8,
    },
    modeProfiles: {
      walk: {
        pauseChance: 0.28,
        pauseMin: 0.8,
        pauseMax: 2.4,
        deviation: {
          chance: 0.45,
          radiusMultiplier: 0.85,
          speedMultiplier: 1.05,
        },
      },
      run: {
        pauseChance: 0.08,
        pauseMin: 0.4,
        pauseMax: 1.2,
        deviation: {
          chance: 0.38,
          radiusMultiplier: 0.7,
          speedMultiplier: 1.1,
          durationMin: 1.4,
          durationMax: 16,
        },
      },
    },
    returnSpeeds: {
      walk: 7.4,
      run: 10.2,
    },
    ...options,
    routineKey: KILLER_BEE_ROUTINE_KEY,
  });
}

export function updateKillerBeeRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== KILLER_BEE_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const HASHIRAMA_ROUTINE_KEY = '__hashiramaRoutine';

export function attachHashiramaRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 26,
    wanderMin: 20,
    wanderMax: 42,
    wanderCenterJitter: 6,
    modePool: ['walk', 'run', 'walk'],
    startMode: 'walk',
    wanderSettings: {
      pauseChance: 0.58,
      pauseMin: 1.2,
      pauseMax: 4.8,
      dirChangeMin: 1.6,
      dirChangeMax: 3.6,
    },
    modeProfiles: {
      walk: {
        pauseChance: 0.42,
        deviation: {
          chance: 0.5,
          radiusMultiplier: 0.95,
        },
      },
      run: {
        pauseChance: 0.18,
        pauseMin: 0.6,
        pauseMax: 1.8,
        deviation: {
          chance: 0.32,
          radiusMultiplier: 0.75,
        },
      },
    },
    returnSpeeds: {
      walk: 6.8,
      run: 9.2,
    },
    ...options,
    routineKey: HASHIRAMA_ROUTINE_KEY,
  });
}

export function updateHashiramaRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== HASHIRAMA_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

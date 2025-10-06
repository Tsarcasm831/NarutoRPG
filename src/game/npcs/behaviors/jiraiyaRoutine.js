import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const JIRAIYA_ROUTINE_KEY = '__jiraiyaRoutine';

export function attachJiraiyaRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 30,
    wanderMin: 18,
    wanderMax: 36,
    wanderCenterJitter: 10,
    modePool: ['walk', 'walk', 'run'],
    startMode: 'walk',
    wanderSettings: {
      pauseChance: 0.68,
      pauseMin: 1.4,
      pauseMax: 5.6,
      dirChangeMin: 1.8,
      dirChangeMax: 4.6,
    },
    modeProfiles: {
      walk: {
        pauseChance: 0.45,
        pauseMax: 4.6,
        deviation: {
          chance: 0.55,
          radiusMultiplier: 1.05,
        },
      },
      run: {
        pauseChance: 0.22,
        pauseMin: 0.7,
        pauseMax: 2.2,
        deviation: {
          chance: 0.35,
          radiusMultiplier: 0.8,
          speedMultiplier: 0.9,
        },
      },
    },
    returnSpeeds: {
      walk: 6.2,
      run: 8.8,
    },
    ...options,
    routineKey: JIRAIYA_ROUTINE_KEY,
  });
}

export function updateJiraiyaRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== JIRAIYA_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

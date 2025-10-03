import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const SASUKE_ROUTINE_KEY = '__sasukeRoutine';

export function attachSasukeRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 26,
    wanderMin: 11,
    wanderMax: 26,
    startMode: 'run',
    modePool: ['run', 'walk'],
    ...options,
    routineKey: SASUKE_ROUTINE_KEY,
  });
}

export function updateSasukeRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== SASUKE_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

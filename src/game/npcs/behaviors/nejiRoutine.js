import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const NEJI_ROUTINE_KEY = '__nejiRoutine';

export function attachNejiRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 22,
    wanderMin: 13,
    wanderMax: 32,
    startMode: 'walk',
    modePool: ['walk', 'run'],
    returnTolerance: 1.2,
    ...options,
    routineKey: NEJI_ROUTINE_KEY,
  });
}

export function updateNejiRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== NEJI_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

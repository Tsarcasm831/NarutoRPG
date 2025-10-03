import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const OROCHIMARU_ROUTINE_KEY = '__orochimaruRoutine';

export function attachOrochimaruRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 30,
    wanderMin: 10,
    wanderMax: 28,
    startMode: 'walk',
    modePool: ['walk', 'run', 'run'],
    returnTolerance: 2.0,
    ...options,
    routineKey: OROCHIMARU_ROUTINE_KEY,
  });
}

export function updateOrochimaruRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== OROCHIMARU_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const SHIKAMARU_ROUTINE_KEY = '__shikamaruRoutine';

export function attachShikamaruRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 14,
    wanderMin: 18,
    wanderMax: 38,
    startMode: 'walk',
    modePool: ['walk'],
    returnTolerance: 1.5,
    ...options,
    routineKey: SHIKAMARU_ROUTINE_KEY,
  });
}

export function updateShikamaruRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== SHIKAMARU_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

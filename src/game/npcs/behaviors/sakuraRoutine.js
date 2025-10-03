import { attachNarutoRoutine, updateNarutoRoutine } from './narutoRoutine.js';

const SAKURA_ROUTINE_KEY = '__sakuraRoutine';

export function attachSakuraRoutine(npcGroup, options = {}) {
  attachNarutoRoutine(npcGroup, {
    wanderRadius: 18,
    wanderMin: 12,
    wanderMax: 30,
    startMode: 'walk',
    modePool: ['walk', 'walk', 'run'],
    ...options,
    routineKey: SAKURA_ROUTINE_KEY,
  });
}

export function updateSakuraRoutine(npcGroup, delta, objectGrid) {
  if (npcGroup?.userData?.__narutoRoutineKey !== SAKURA_ROUTINE_KEY) return;
  updateNarutoRoutine(npcGroup, delta, objectGrid);
}

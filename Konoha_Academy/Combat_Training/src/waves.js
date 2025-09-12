import { ENEMY, WAVE, GAME } from './constants.js';
import { randRange } from './utils.js';
import { scaleStat, scaleIntStat } from './balance.js';

function spawnPos() {
  // Spawn near borders
  const edge = Math.floor(randRange(0,4));
  if (edge === 0) return { x: randRange(0, GAME.WIDTH), y: -20 };
  if (edge === 1) return { x: GAME.WIDTH+20, y: randRange(0, GAME.HEIGHT) };
  if (edge === 2) return { x: randRange(0, GAME.WIDTH), y: GAME.HEIGHT+20 };
  return { x: -20, y: randRange(0, GAME.HEIGHT) };
}

export function waveConfig(wave) {
  // Enemy count grows 1.5x per wave; speed scales up per wave
  const count = Math.max(1, Math.round(20 * Math.pow(1.5, Math.max(0, (wave|0) - 1))));
  const speed = Math.round(ENEMY.SPEED * Math.pow(1.06, Math.max(0, (wave|0) - 1)));
  return { count, speed };
}

export function scheduleWave(state) {
  state.nextWaveTime = state.time + WAVE.NEXT_DELAY;
  state.paused = false;
  state.running = true;
}

export function maybeSpawnWave(state) {
  if (state.time < state.nextWaveTime || state.entities._spawning) return;
  const cfg = waveConfig(state.wave);
  state.entities._spawning = { left: cfg.count, t: 0, speed: cfg.speed };
  state.waveInProgress = true;
}

export function tickSpawning(state, dt) {
  const sp = state.entities._spawning;
  if (!sp) return;
  sp.t -= dt;
  if (sp.t <= 0 && sp.left > 0) {
    const pos = spawnPos();
    const hp = Math.max(1, Math.round(ENEMY.HP * Math.pow(1.4, Math.max(0, (state.wave|0) - 1))));
    const idx = Math.min((Math.max(0, Math.ceil((state.wave - 2) / 3))), 5);
    state.entities.enemies.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, hp, maxHp: hp, speed: sp.speed, touchCD: 0, variantIdx: idx });
    sp.left--; sp.t = Math.max(0.25, 1.6 * Math.pow(0.88, Math.max(0, (state.wave|0) - 1)));
  }
  if (sp.left <= 0) {
    delete state.entities._spawning;
  }
}

export function onWaveCleared(state) {
  state.wave = Math.min(1000, state.wave + 1);
  state.waveInProgress = false;
}

export function startWave(state) {
  const cfg = waveConfig(state.wave);
  for (let i = 0; i < cfg.count; i++) {
    const pos = spawnPos();
    const hp = Math.max(1, Math.round(ENEMY.HP * Math.pow(1.4, Math.max(0, (state.wave|0) - 1))));
    const idx = Math.min((Math.max(0, Math.ceil((state.wave - 2) / 3))), 5);
    state.entities.enemies.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, hp, maxHp: hp, speed: cfg.speed, touchCD: 0, variantIdx: idx });
  }
}
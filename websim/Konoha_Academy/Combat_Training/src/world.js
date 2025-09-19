import { GAME, PLAYER, ENEMY, SHURIKEN } from './constants.js';

export function makePlayer() {
  return {
    x: GAME.WIDTH/2,
    y: GAME.HEIGHT/2,
    vx: 0, vy: 0,
    hp: PLAYER.HP_MAX,
    cd: 0,
    cdMax: 0,
    alive: true,
    touchCD: 0,
  };
}

export function resetWorld(state) {
  state.wave = 1;
  state.score = 0;
  state.entities.enemies.length = 0;
  state.entities.shuriken.length = 0;
  state.player = makePlayer();
  // apply HP upgrades to new player
  const hpBonus = (state.upgrades?.hp || 0) * 10;
  state.player.hpMax = (PLAYER.HP_MAX + hpBonus);
  state.player.hp = state.player.hpMax;
  state.time = 0;
  state.nextWaveTime = 0;
  // reset input to avoid sticky keys between runs
  state.input.up = state.input.down = state.input.left = state.input.right = 0;
  state.input.mouse.down = false;
  state.floating = [];
}

export function makeEnemy(x, y, speed = ENEMY.SPEED) {
  return { x, y, vx: 0, vy: 0, hp: ENEMY.HP, speed, touchCD: 0, kx: 0, ky: 0 };
}

export function makeShuriken(x, y, vx, vy) {
  return { x, y, vx, vy, t: SHURIKEN.LIFE };
}
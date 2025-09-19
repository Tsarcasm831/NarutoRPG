import { PLAYER, SHURIKEN, ENEMY, GAME, SCORE } from './constants.js';
import { angleTo, vecFromAngle, dist2, withLen } from './utils.js';

const dmgForState = (state) => {
  const lvl = state.upgrades?.dmg || 0;
  return SHURIKEN.DAMAGE * (1 + 0.2 * lvl);
};

const atkCooldownForState = (state) => {
  const base = 1.0; // 1/s baseline (slower start)
  const lvl = state.upgrades?.atkspd || 0;
  const cd = base * Math.pow(0.92, lvl); // ~8% faster per level
  return Math.max(0.15, cd);
};

export function handleInput(state, dt) {
  const p = state.player;
  if (!p || !p.alive) return;
  p.vx = 0; p.vy = 0;
  p.cd = Math.max(0, p.cd - dt);
  // Auto-attack 2/s at nearest enemy
  if (p.cd <= 0 && state.entities.enemies.length > 0) {
    let nearest = state.entities.enemies[0], best = Infinity;
    for (const e of state.entities.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y, d2 = dx*dx + dy*dy;
      if (d2 < best) { best = d2; nearest = e; }
    }
    const a = angleTo(p.x, p.y, nearest.x, nearest.y);
    const v2 = vecFromAngle(a, SHURIKEN.SPEED);
    state.entities.shuriken.push({ x: p.x, y: p.y, vx: v2.x, vy: v2.y, t: SHURIKEN.LIFE });
    p.cd = atkCooldownForState(state); p.cdMax = p.cd; state.damageTimer = 0.05; state.audio?.shoot();
  }
}

export function tickEnemies(state, dt) {
  const p = state.player; if (!p) return;
  for (let j = state.entities.enemies.length - 1; j >= 0; j--) {
    const e = state.entities.enemies[j];
    const a = angleTo(e.x, e.y, p.x, p.y);
    const v = vecFromAngle(a, e.speed);
    e.vx = v.x; e.vy = v.y;
    e.kx = e.kx || 0; e.ky = e.ky || 0; e.kx *= 0.92; e.ky *= 0.92;
    e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;

    // Single-hit contact: deal wave-scaled damage and despawn enemy
    if (dist2(e.x, e.y, p.x, p.y) < (PLAYER.RADIUS + ENEMY.RADIUS) ** 2) {
      const dmg = Math.max(1, state.wave | 0);
      p.hp -= dmg; state.damageTimer = 0.1; state.audio?.hit();
      state.entities.enemies.splice(j, 1);
      if (p.hp <= 0) { p.alive = false; state.running = false; state.audio?.lose(); state.ui?.showGameOver(); }
      continue;
    }
  }
}

export function tickShuriken(state, dt) {
  const sh = state.entities.shuriken;
  for (let i = sh.length - 1; i >= 0; i--) {
    const s = sh[i];
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.t -= dt;
    // Out of bounds or expired
    if (s.t <= 0 || s.x < -16 || s.y < -16 || s.x > GAME.WIDTH+16 || s.y > GAME.HEIGHT+16) {
      sh.splice(i,1); continue;
    }
    // Collisions
    for (let j = state.entities.enemies.length - 1; j >= 0; j--) {
      const e = state.entities.enemies[j];
      if (dist2(s.x, s.y, e.x, e.y) < (SHURIKEN.RADIUS + ENEMY.RADIUS) ** 2) {
        const dealt = dmgForState(state);
        e.hp -= dealt;
        if (state.options?.showDamageNumbers !== false) {
          state.floating.push({ x:e.x, y:e.y, t:0.8, ttl:0.8, vY:-22, text: Math.ceil(dealt) });
        }
        e.kx = (e.kx || 0) + s.vx * ENEMY.KNOCKBACK; e.ky = (e.ky || 0) + s.vy * ENEMY.KNOCKBACK;
        sh.splice(i,1);
        if (e.hp <= 0) {
          state.entities.enemies.splice(j,1);
          state.score += SCORE.PER_KILL;
          state.chakraFocus = (state.chakraFocus || 0) + 1;
          state.audio?.pop();
        }
        break;
      }
    }
  }
}
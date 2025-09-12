import { GAME, PLAYER, SHURIKEN, ENEMY } from './constants.js';
import { ENEMY_IMG, SHURIKEN_IMG, BG_TEX, VIGNETTE_IMG, SHADOW_IMG, FOREST_GROUND_TEX, ENEMY_VARIANTS } from './assets.js';

export function clear(ctx, damageFlash=0) {
  ctx.save();
  ctx.fillStyle = GAME.BG;
  ctx.fillRect(0,0,GAME.WIDTH,GAME.HEIGHT);
  if (damageFlash > 0) {
    ctx.fillStyle = `rgba(220,0,0,${Math.min(0.15, damageFlash*2)})`;
    ctx.fillRect(0,0,GAME.WIDTH,GAME.HEIGHT);
  }
  ctx.restore();
}

function circle(ctx, x,y,r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

export function render(state, ctx) {
  // Background texture (forest dirt ground)
  if (FOREST_GROUND_TEX.complete && FOREST_GROUND_TEX.naturalWidth) {
    const pat = ctx.createPattern(FOREST_GROUND_TEX, 'repeat');
    if (pat) { ctx.save(); ctx.fillStyle = pat; ctx.fillRect(0,0,GAME.WIDTH,GAME.HEIGHT); ctx.restore(); }
  } else if (BG_TEX.complete && BG_TEX.naturalWidth) {
    const pat = ctx.createPattern(BG_TEX, 'repeat');
    if (pat) { ctx.save(); ctx.fillStyle = pat; ctx.fillRect(0,0,GAME.WIDTH,GAME.HEIGHT); ctx.restore(); }
  }

  // Shuriken
  ctx.save();
  ctx.lineCap = 'round';
  for (const s of state.entities.shuriken) {
    if (SHURIKEN_IMG.complete && SHURIKEN_IMG.naturalWidth) {
      const ang = Math.atan2(s.vy, s.vx);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
      ctx.drawImage(SHURIKEN_IMG, -10, -10, 20, 20); ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -6); ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Enemies
  for (const e of state.entities.enemies) {
    // shadow
    if (SHADOW_IMG.complete && SHADOW_IMG.naturalWidth) {
      ctx.drawImage(SHADOW_IMG, e.x - 18, e.y + 10, 36, 12);
    }
    const size = 36;
    const SPR = ENEMY_VARIANTS?.[e.variantIdx ?? 0] || ENEMY_IMG;
    if (SPR.complete && SPR.naturalWidth > 0) {
      const half = size / 2;
      const ang = Math.atan2(state.player?.y - e.y, state.player?.x - e.x) || 0;
      // slight facing tilt
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(ang);
      ctx.drawImage(SPR, -half, -half, size, size);
      ctx.restore();
    } else {
      circle(ctx, e.x, e.y, 14, '#111', null);
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x-6, e.y-1, 12, 2);
    }
    // enemy HP bar
    const hp = Math.max(0, e.hp) / (e.maxHp || ENEMY.HP);
    ctx.fillStyle = '#111'; ctx.fillRect(e.x - 12, e.y + 20, 24, 3);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(e.x - 12, e.y + 20, 24 * hp, 3);
  }

  // Player
  if (state.player) {
    const p = state.player;
    if (SHADOW_IMG.complete && SHADOW_IMG.naturalWidth) {
      ctx.drawImage(SHADOW_IMG, p.x - 20, p.y + 12, 40, 14);
    }
    circle(ctx, p.x, p.y, PLAYER.RADIUS+2, null, '#111');
    circle(ctx, p.x, p.y, PLAYER.RADIUS, '#111', null);
    // Face direction indicator
    const ang = Math.atan2(state.input.mouse.y - p.y, state.input.mouse.x - p.x);
    const eyeX = p.x + Math.cos(ang) * (PLAYER.RADIUS - 4);
    const eyeY = p.y + Math.sin(ang) * (PLAYER.RADIUS - 4);
    circle(ctx, eyeX, eyeY, 3, '#fff', null);
    // throw cooldown arc
    if (p.cd > 0) {
      const frac = p.cdMax ? (p.cd / p.cdMax) : (p.cd / PLAYER.THROW_CD);
      ctx.beginPath(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      ctx.arc(p.x, p.y, PLAYER.RADIUS + 6, -Math.PI/2, -Math.PI/2 + Math.PI*2*frac);
      ctx.stroke();
    }
  }

  // Floating damage numbers
  for (const f of state.floating) {
    const a = Math.max(0, f.t / (f.ttl || 1));
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.2);
    ctx.font = '700 14px "Noto Sans", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    ctx.strokeText(String(f.text), f.x, f.y); ctx.fillText(String(f.text), f.x, f.y);
    ctx.restore();
  }

  // Vignette overlay
  if (VIGNETTE_IMG.complete && VIGNETTE_IMG.naturalWidth) {
    ctx.drawImage(VIGNETTE_IMG, 0, 0, GAME.WIDTH, GAME.HEIGHT);
  }
}
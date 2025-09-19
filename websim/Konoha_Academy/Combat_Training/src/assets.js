export const ENEMY_IMG = new Image();
ENEMY_IMG.src = './naruto_enemy.png';
export const ENEMY_IMG_1 = new Image(); ENEMY_IMG_1.src = './naruto_enemy_1.png';
export const ENEMY_IMG_2 = new Image(); ENEMY_IMG_2.src = './naruto_enemy_2.png';
export const ENEMY_IMG_3 = new Image(); ENEMY_IMG_3.src = './naruto_enemy_3.png';
export const ENEMY_IMG_4 = new Image(); ENEMY_IMG_4.src = './naruto_enemy_4.png';
export const ENEMY_IMG_5 = new Image(); ENEMY_IMG_5.src = './naruto_enemy_5.png';
export const ENEMY_VARIANTS = [ENEMY_IMG, ENEMY_IMG_1, ENEMY_IMG_2, ENEMY_IMG_3, ENEMY_IMG_4, ENEMY_IMG_5];

export const SHURIKEN_IMG = new Image();
SHURIKEN_IMG.src = './shuriken.png';

export const BG_TEX = new Image();
BG_TEX.src = './bg_paper.png';

export const VIGNETTE_IMG = new Image();
VIGNETTE_IMG.src = './vignette.png';

export const SHADOW_IMG = new Image();
SHADOW_IMG.src = './fx_shadow.png';

export const GROUND_TEX = new Image();
GROUND_TEX.src = './src/assets/ground_texture.png';

export const FOREST_GROUND_TEX = new Image();
FOREST_GROUND_TEX.src = './src/assets/forest_ground.png';

export let assetsReady = false;
export function loadAssets() {
  return new Promise((resolve) => {
    const imgs = [ENEMY_IMG, ENEMY_IMG_1, ENEMY_IMG_2, ENEMY_IMG_3, ENEMY_IMG_4, ENEMY_IMG_5, SHURIKEN_IMG, BG_TEX, VIGNETTE_IMG, SHADOW_IMG, GROUND_TEX, FOREST_GROUND_TEX];
    let left = imgs.length;
    const done = () => { if (--left <= 0) { assetsReady = true; resolve(); } };
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth) return done();
      img.onload = done; img.onerror = done;
    });
  });
}
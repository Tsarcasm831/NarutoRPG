export const GAME = {
  WIDTH: 1024,
  HEIGHT: 576,
  BG: '#ffffff',
  TICK_RATE: 1 / 60,
};

export const PLAYER = {
  SPEED: 220,
  RADIUS: 14,
  HP_MAX: 100,
  THROW_CD: 0.22,
};

export const SHURIKEN = {
  SPEED: 540,
  RADIUS: 6,
  DAMAGE: 1,
  LIFE: 1.25,
};

export const ENEMY = {
  SPEED: 120,
  RADIUS: 14,
  DAMAGE: 12,
  TOUCH_COOLDOWN: 0.7,
  HP: 1,
  KNOCKBACK: 0.25,
};

export const WAVE = {
  START: 1,
  INTERVAL: 2.0, 
  NEXT_DELAY: 2.0,
};

export const SCORE = { PER_KILL: 10 };
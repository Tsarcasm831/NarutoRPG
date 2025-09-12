export const State = {
  running: false,
  paused: false,
  wave: 1,
  score: 0,
  time: 0,
  lastTick: 0,
  input: { up:0, down:0, left:0, right:0, mouse:{x:0,y:0,down:false} },
  player: null,
  entities: { enemies: [], shuriken: [] },
  damageTimer: 0,
  nextWaveTime: 0,
  rngSeed: Math.random(),
  chakraFocus: 0,
  upgrades: { dmg: 0, atkspd: 0, hp: 0 },
  floating: [],
  options: {}, // loaded from localStorage at boot
  waveInProgress: false,
};

export function newInput() {
  return { up:0, down:0, left:0, right:0, mouse:{ x:0, y:0, down:false } };
}

export function resetState(state = State) {
  state.running = false; state.paused = false;
  state.wave = 1; state.score = 0;
  state.time = 0; state.lastTick = 0;
  state.input = newInput();
  state.player = null;
  state.entities.enemies.length = 0; state.entities.shuriken.length = 0;
  state.damageTimer = 0; state.nextWaveTime = 0;
  state.rngSeed = Math.random();
  state.chakraFocus = 0; state.upgrades = { dmg:0, atkspd:0, hp:0 };
  state.floating = [];
  state.options = {};
  state.waveInProgress = false;
  return state;
}

export function setAudio(audio) { State.audio = audio; return State; }
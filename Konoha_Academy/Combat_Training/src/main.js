import { GAME, WAVE } from './constants.js';
import { State } from './state.js';
import { resetWorld } from './world.js';
import { handleInput, tickEnemies, tickShuriken } from './combat.js';
import { clear, render } from './render.js';
import { makeEngine } from './engine.js';
import { nowSec } from './utils.js';
import { bindUI } from './ui.js';
import { createAudio } from './audio.js';
import './assets.js';
import { maybeSpawnWave, scheduleWave, tickSpawning, onWaveCleared } from './waves.js';
import { loadAssets } from './assets.js';

const audio = createAudio();
State.audio = audio;

const Engine = makeEngine({
  update: tick,
  draw: (ctx) => { clear(ctx, State.damageTimer); render(State, ctx); }
});

const UI = bindUI(State);
State.ui = UI;

function setHud() { UI.updateHud(); }

function tick() {
  const t = nowSec();
  if (!State.lastTick) State.lastTick = t;
  let dt = Math.min(0.05, t - State.lastTick);
  State.lastTick = t;
  if (!State.running || State.paused) return;

  State.time += dt;
  State.damageTimer = Math.max(0, State.damageTimer - dt);

  handleInput(State, dt);
  tickEnemies(State, dt);
  tickShuriken(State, dt);
  tickSpawning(State, dt);

  // Wave clear detection must run before we consider spawning the next wave
  if (State.waveInProgress && (!State.entities._spawning || (State.entities._spawning && State.entities._spawning.left <= 0)) && State.entities.enemies.length === 0) {
    if (!State.paused) {
      onWaveCleared(State);
      // We are showing interwave screen which has its own pause-like state, so we don't use togglePause.
      UI.showInterWave(() => { 
        scheduleWave(State); 
      });
    }
  }

  // After handling clear/pause logic, allow spawning when due
  maybeSpawnWave(State);

  setHud();
  // floating damage numbers
  for (let i = State.floating.length - 1; i >= 0; i--) {
    const f = State.floating[i]; f.t -= dt; f.y += f.vY * dt; if (f.t <= 0) State.floating.splice(i,1);
  }
}

function bindInput() {
  const canvas = Engine.canvas;
  const onKey = (e, down) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') State.input.up = down?1:0;
    if (k === 's' || k === 'arrowdown') State.input.down = down?1:0;
    if (k === 'a' || k === 'arrowleft') State.input.left = down?1:0;
    if (k === 'd' || k === 'arrowright') State.input.right = down?1:0;
    if (k === 'p') State.togglePause();
    if (k === '`') { e.preventDefault(); State.togglePause(true); } // open pause menu
  };
  window.addEventListener('keydown', e => { onKey(e, true); });
  window.addEventListener('keyup', e => { onKey(e, false); });

  const rect = () => canvas.getBoundingClientRect();
  const updateMouse = (e) => {
    const r = rect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    State.input.mouse.x = x; State.input.mouse.y = y;
  };
  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('mousedown', (e) => { State.input.mouse.down = true; updateMouse(e); audio.resume(); });
  window.addEventListener('mouseup', () => { State.input.mouse.down = false; });
}

State.startGame = () => {
  resetWorld(State);
  scheduleWave(State);
  State.audio?.resume();
  State.running = true; State.paused = false;
  UI.updateHud();
};
State.togglePause = (to) => {
  State.paused = (typeof to === 'boolean') ? to : !State.paused;
  UI.setPaused(State.paused);
};

async function boot() {
  await loadAssets();
  // load options from localStorage and apply
  const saved = JSON.parse(localStorage.getItem('konoha.options')||'{}');
  State.options = saved;
  if (saved.startMuted && !audio.isMuted()) { audio.toggleMute(); }
  bindInput();
  UI.showMainMenu();
  Engine.start();
}

boot();
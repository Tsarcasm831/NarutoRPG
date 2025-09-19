export function bindUI(state) {
  const q = s => document.querySelector(s);
  const hudWave = q('#hudWave');
  const hudScore = q('#hudScore');
  const hudHP = q('#hudHP');
  const overlay = q('#overlay');
  const panel = overlay.querySelector('.panel');
  const panelTitle = q('#panelTitle');
  const panelBody = q('#panelBody');
  const primaryBtn = q('#primaryBtn');
  const muteBtn = q('#muteBtn');
  const hudChakra = q('#hudChakra');
  const hudLeft = q('#hudLeft');
  const btnDmg = null, btnAS = null, btnHP = null;
  const costDmg = null, costAS = null, costHP = null;

  const cost = (base, growth, lvl) => Math.round(base * Math.pow(growth, lvl));

  function refreshShop() {
    const u = state.upgrades;
    const cf = state.chakraFocus|0;
    hudChakra.textContent = String(cf);
    const cD = cost(5, 1.6, u.dmg||0);
    const cA = cost(5, 1.6, u.atkspd||0);
    const cH = cost(8, 1.6, u.hp||0);
    const dEl = panel.querySelector('#costDmg'), aEl = panel.querySelector('#costAS'), hEl = panel.querySelector('#costHP');
    if (dEl) dEl.textContent = `Cost ${cD} • L${u.dmg||0}`;
    if (aEl) aEl.textContent = `Cost ${cA} • L${u.atkspd||0}`;
    if (hEl) hEl.textContent = `Cost ${cH} • L${u.hp||0}`;
    panel.querySelector('#buyDmg')?.toggleAttribute('disabled', cf < cD);
    panel.querySelector('#buyAS')?.toggleAttribute('disabled', cf < cA);
    panel.querySelector('#buyHP')?.toggleAttribute('disabled', cf < cH);
  }

  function showPanel(title, body, btnLabel, onClick) {
    panelTitle.textContent = title;
    panelBody.textContent = body;
    primaryBtn.textContent = btnLabel;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    primaryBtn.onclick = () => { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden','true'); onClick?.(); };
    primaryBtn.focus();
  }

  function updateHud() {
    hudWave.textContent = String(state.wave);
    hudScore.textContent = String(state.score);
    hudHP.textContent = String(Math.max(0, Math.floor(state.player?.hp ?? 0)));
    const alive = state.entities?.enemies?.length || 0;
    const toSpawn = state.entities?._spawning?.left || 0;
    hudLeft.textContent = String(alive + toSpawn);
    refreshShop();
  }

  const tryBuy = (key, base, growth, onApply) => {
    const lvl = state.upgrades[key]||0;
    const c = cost(base, growth, lvl);
    if ((state.chakraFocus|0) >= c) {
      state.chakraFocus -= c;
      state.upgrades[key] = lvl + 1;
      onApply?.();
      updateHud();
    }
  };

  muteBtn.addEventListener('click', () => {
    const muted = state.audio?.toggleMute();
    muteBtn.textContent = muted ? 'Sound: Off' : 'Sound: On';
    muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  });
  // initialize label based on current audio state
  muteBtn.textContent = state.audio?.isMuted?.() ? 'Sound: Off' : 'Sound: On';
  muteBtn.setAttribute('aria-label', state.audio?.isMuted?.() ? 'Turn sound on' : 'Turn sound off');

  function buildShopPanel() {
    const wrap = document.createElement('div');
    wrap.className = 'shop-panel';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Upgrades');
    wrap.innerHTML = `
      <button id="buyDmg" class="shop-btn"><b>Damage +</b><span class="sub" id="costDmg">Cost 5</span></button>
      <button id="buyAS" class="shop-btn"><b>Attack Speed +</b><span class="sub" id="costAS">Cost 5</span></button>
      <button id="buyHP" class="shop-btn"><b>Max HP +</b><span class="sub" id="costHP">Cost 8</span></button>
    `;
    wrap.querySelector('#buyDmg')?.addEventListener('click', () => tryBuy('dmg', 5, 1.6, null));
    wrap.querySelector('#buyAS')?.addEventListener('click', () => tryBuy('atkspd', 5, 1.6, null));
    wrap.querySelector('#buyHP')?.addEventListener('click', () => tryBuy('hp', 8, 1.6, () => {
      const add = 10;
      if (state.player) {
        state.player.hpMax = (state.player.hpMax || state.player.hp || 0) + add;
        state.player.hp = Math.min(state.player.hpMax, (state.player.hp||0) + add);
      }
    }));
    return wrap;
  }

  function showPauseMenu() {
    panelTitle.textContent = 'Paused';
    panelBody.textContent = '';
    panel.querySelector('.shop-panel')?.remove();
    primaryBtn.textContent = 'Resume';
    primaryBtn.onclick = () => state.togglePause(false);
    const extra = document.createElement('div');
    extra.className = 'shop-panel';
    extra.innerHTML = `<button id="pauseOptions" class="shop-btn"><b>Options</b></button><button id="pauseExit" class="shop-btn"><b>Exit to Main Menu</b></button>`;
    panel.appendChild(extra);
    extra.querySelector('#pauseOptions')?.addEventListener('click', ()=>{ panelBody.textContent='Toggle sound via top-right button. Press P to pause.'; });
    extra.querySelector('#pauseExit')?.addEventListener('click', ()=>{ location.href = './menu.html'; });
    overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden','false'); primaryBtn.focus();
  }

  return {
    showMainMenu: () => showPanel('Konoha — Combat Training', 'You are stationary. Enemies converge each wave. You auto-throw shuriken at the nearest enemy twice per second. Earn Chakra Focus per kill and buy upgrades below.', 'Start Training', () => state.startGame()),
    showGameOver: () => showPanel('Training Failed', `Score: ${state.score} • Wave ${state.wave}`, 'Retry', () => state.startGame()),
    showInterWave(onNext) {
      // build overlay with shop
      panelTitle.textContent = 'Wave cleared';
      panelBody.textContent = 'Spend Chakra Focus on upgrades, then continue to the next wave.';
      // pause the game while upgrades are chosen so enemies don't spawn during the modal
      state.paused = true;
      // remove any old shop
      panel.querySelector('.shop-panel')?.remove();
      const shopEl = buildShopPanel();
      primaryBtn.textContent = 'Next Wave';
      primaryBtn.onclick = () => { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden','true'); onNext?.(); };
      panel.insertBefore(shopEl, primaryBtn);
      overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden','false');
      refreshShop();
      primaryBtn.focus();
    },
    setPaused(paused) {
      if (paused) showPauseMenu();
      else { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden','true'); }
    },
    updateHud,
  };
}

window.addEventListener('keydown', (e) => {
  const overlay = document.querySelector('#overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.querySelector('#primaryBtn')?.click(); }
});
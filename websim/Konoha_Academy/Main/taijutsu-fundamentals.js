
```
// removed function largeInlineScript() {}  // tombstone: moved into taijutsu-fundamentals.js

// ====== Data ======
const STANCES = [
  { id:'neutral', name:'Neutral', hint:'Balanced startup/recovery.' },
  { id:'aggressive', name:'Aggressive', hint:'Faster startup, longer recovery.' },
  { id:'defensive', name:'Defensive', hint:'Slower startup, shorter recovery; extra poise.' },
  { id:'mobile', name:'Mobile', hint:'Faster movement; dodge i-frames up.' },
];

const ACTIONS = {
  L: { key:'J', name:'Light',  glyph:'✊', startup:5, active:3, recovery:7, cost:6 },
  H: { key:'K', name:'Heavy',  glyph:'👊', startup:10, active:4, recovery:12, cost:12 },
  G: { key:'U', name:'Guard',  glyph:'🛡️', startup:3, active:8, recovery:4, cost:4 },
  D: { key:'I', name:'Dodge',  glyph:'💨', startup:4, active:2, recovery:6, cost:5 },
  '↑': { key:'ArrowUp',    name:'Up',    glyph:'⬆️', startup:0, active:0, recovery:0, cost:0 },
  '↓': { key:'ArrowDown',  name:'Down',  glyph:'⬇️', startup:0, active:0, recovery:0, cost:0 },
  '←': { key:'ArrowLeft',  name:'Left',  glyph:'⬅️', startup:0, active:0, recovery:0, cost:0 },
  '→': { key:'ArrowRight', name:'Right', glyph:'➡️', startup:0, active:0, recovery:0, cost:0 },
};

const DRILLS = [
  { name:'Basic String', seq:['L','L','H'] },
  { name:'Guard Break', seq:['L','H','H'] },
  { name:'Counter Smash', seq:['G','L','H'] },
  { name:'Sidestep Punish', seq:['→','D','H'] },
  { name:'Sweep Finish', seq:['D','L','H'] },
];

// ====== Elements ======
const dots = document.getElementById('dots');
const targetName = document.getElementById('targetName');
const targetSeqEl = document.getElementById('targetSeq');
const statusEl = document.getElementById('status');
const framesCard = document.getElementById('framesCard');
const fdStartup = document.getElementById('fdStartup');
const fdActive = document.getElementById('fdActive');
const fdRecovery = document.getElementById('fdRecovery');
const fdCost = document.getElementById('fdCost');

const staminaBar = document.querySelector('#staminaBar .fill');
const poiseBar = document.querySelector('#poiseBar .fill');

const strictChk = document.getElementById('strictChk');
const framesChk = document.getElementById('framesChk');
const autoResetChk = document.getElementById('autoResetChk');

const resetBtn = document.getElementById('resetBtn');
const helpBtn = document.getElementById('helpBtn'); // (future) toggle help

const stanceTabs = document.getElementById('stanceTabs');
const stanceHint = document.getElementById('stanceHint');
const actionPad = document.getElementById('actionPad');

// ====== State ======
let stance = 'neutral';
let input = [];
let target = null; // { name, seq }
let stamina = 100; let poise = 100;

// ====== Build UI ======
STANCES.forEach(s => {
  const b = document.createElement('button');
  b.className = 'tab'; b.textContent = s.name; b.dataset.stance = s.id;
  b.addEventListener('click', () => setStance(s.id));
  stanceTabs.appendChild(b);
});

function setStance(id){
  stance = id;
  document.querySelectorAll('.tab').forEach(el=> el.classList.toggle('active', el.dataset.stance===id));
  const s = STANCES.find(x=>x.id===id);
  stanceHint.textContent = `${s.name} stance — ${s.hint}`;
}

setStance('neutral');

// Action pad (L,H,G,D)
['L','H','G','D'].forEach(code => {
  const a = ACTIONS[code];
  const b = document.createElement('button');
  b.className = 'key';
  b.innerHTML = `<div class="glyph">${a.glyph}</div><div class="name">${a.name} <span class="hint">${a.key}</span></div>`;
  b.addEventListener('click', ()=> push(code));
  actionPad.appendChild(b);
});

// Direction pad
document.querySelectorAll('.dir[data-dir]').forEach(btn => btn.addEventListener('click', ()=> push(btn.dataset.dir)));

// Drills list
const drillList = document.getElementById('drillList');
DRILLS.forEach(d => {
  const b = document.createElement('button');
  b.className = 'btn'; b.style.width='100%'; b.style.textAlign='left';
  b.textContent = `${d.name} — ${d.seq.map(x=>ACTIONS[x].glyph||x).join(' ')}`;
  b.addEventListener('click', ()=> selectDrill(d));
  drillList.appendChild(b);
});

function selectDrill(d){
  target = d;
  targetName.textContent = d.name;
  targetSeqEl.textContent = ' — ' + d.seq.map(x=>ACTIONS[x].glyph||x).join(' ');
  input = [];
  renderDots();
  setStatus('');
}

// Dots builder (show up to 10, lock rest)
function renderDots(){
  const max = 10; dots.innerHTML = '';
  for (let i=0;i<max;i++){
    const el = document.createElement('div');
    el.className = 'dot' + (i>= (target?.seq.length||0) ? ' locked' : '');
    const inner = document.createElement('div'); inner.className = 'inner';
    inner.textContent = input[i] ? (ACTIONS[input[i]].glyph || input[i]) : '';
    el.appendChild(inner);
    dots.appendChild(el);
  }
  // Mark progress
  if (target){
    for (let i=0;i<input.length;i++){
      const ok = input[i] === target.seq[i];
      dots.children[i].classList.add(ok ? 'active' : 'fail');
    }
  }
}

function setStatus(msg,type){ 
  statusEl.textContent = msg || '';
  statusEl.className = 'status' + (type? ' ' + type : '');
}

// Frame panel toggle
framesChk.addEventListener('change', ()=> framesCard.hidden = !framesChk.checked);

// Bars
function setBar(bar, value){ bar.style.width = Math.max(0, Math.min(100, value)) + '%'; }

// Input push
function push(code){
  const a = ACTIONS[code];
  if (!a) return;
  // cost & stamina
  if (stamina < a.cost){
    shake(statusEl); setStatus('Not enough stamina.', 'no'); return;
  }
  stamina -= a.cost; setBar(staminaBar, stamina);

  // frame data (mock, with stance deltas)
  let mult = 1;
  if (stance==='aggressive') mult = .9; // faster startup
  if (stance==='defensive') mult = 1.1; // slower startup
  const startup = Math.max(1, Math.round(a.startup * mult));
  const active = a.active;
  const recovery = Math.round(a.recovery * (stance==='aggressive'?1.1: stance==='defensive'?0.9:1));
  if (framesChk.checked){
    fdStartup.textContent = startup; fdActive.textContent = active; fdRecovery.textContent = recovery; fdCost.textContent = a.cost;
  }

  input.push(code);
  renderDots();
  pulseDummy(a.glyph);

  // timing window (mock). If strict, cancel if too slow; here we just cap length
  if (target && input.length === target.seq.length){
    const ok = input.every((t,i)=> t===target.seq[i]);
    if (ok){
      setStatus('Combo complete!', 'ok');
      flashDots(true);
      if (autoResetChk.checked){ setTimeout(()=>{ input=[]; renderDots(); setStatus(''); }, 500); }
    } else {
      setStatus('Dropped combo.', 'no');
      flashDots(false);
    }
  }
}

function pulseDummy(mark){
  const d = document.getElementById('dummy');
  d.animate([{transform:'scale(1)',opacity:.95},{transform:'scale(1.06)',opacity:1},{transform:'scale(1)',opacity:.95}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
}

function flashDots(success){
  dots.animate(success?[ 
    {filter:'drop-shadow(0 0 0 rgba(34,197,94,0))'},{filter:'drop-shadow(0 0 20px rgba(34,197,94,.5))'},{filter:'drop-shadow(0 0 0 rgba(34,197,94,0))'}
  ]:[
    {filter:'drop-shadow(0 0 0 rgba(239,68,68,0))'},{filter:'drop-shadow(0 0 20px rgba(239,68,68,.5))'},{filter:'drop-shadow(0 0 0 rgba(239,68,68,0))'}
  ],{duration:360});
}

function shake(el){ el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:200}); }

// Undo & reset
function undo(){ input.pop(); renderDots(); setStatus(''); }
function reset(){ input=[]; renderDots(); setStatus(''); stamina=100; poise=100; setBar(staminaBar, stamina); setBar(poiseBar, poise); }

document.addEventListener('keydown', (e)=>{
  const k = e.key.toUpperCase();
  if (k==='BACKSPACE'){ e.preventDefault(); undo(); return; }
  const map = { J:'L', K:'H', U:'G', I:'D' };
  if (map[k]){ e.preventDefault(); push(map[k]); return; }
  const dirs = { ARROWUP:'↑', ARROWDOWN:'↓', ARROWLEFT:'←', ARROWRIGHT:'→' };
  if (dirs[k]){ e.preventDefault(); push(dirs[k]); return; }
});

resetBtn.addEventListener('click', reset);

// Seed default
selectDrill(DRILLS[0]);
reset();
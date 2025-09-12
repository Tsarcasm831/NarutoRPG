/* separated JS from prompt; compute UI interactions and wiring */
const big = document.getElementById('big');
const chakraFill = document.getElementById('chakraFill');
let chakra = 100;

const ctl = document.getElementById('ctl');
const out = document.getElementById('out');
const br  = document.getElementById('br');
const chan= document.getElementById('chan');

const prim = document.getElementById('prim');
const sec  = document.getElementById('sec');
const shape= document.getElementById('shape');
const range= document.getElementById('range');
const area = document.getElementById('area');

const onehand = document.getElementById('onehand');
const noseal  = document.getElementById('noseal');
const weapon  = document.getElementById('weapon');
const anchor  = document.getElementById('anchor');

const envWet = document.getElementById('envWet');
const envWind= document.getElementById('envWind');
const envRock= document.getElementById('envRock');
const envHot = document.getElementById('envHot');
const envStorm=document.getElementById('envStorm');

const vStab = document.getElementById('vStab');
const vLeak = document.getElementById('vLeak');
const vCast = document.getElementById('vCast');
const vNature = document.getElementById('vNature');
const vShape  = document.getElementById('vShape');
const vKekkei = document.getElementById('vKekkei');
const vCost = document.getElementById('vCost');
const vPot  = document.getElementById('vPot');
const vRisk = document.getElementById('vRisk');

const explainBtn = document.getElementById('explainBtn');
const explainBox = document.getElementById('explainBox');
const resetBtn = document.getElementById('resetBtn');

const NATURE_BASE = { fire:1.0, wind:1.0, light:1.15, earth:1.1, water:1.1, yin:1.2, yang:1.2 };
const NATURE_ICON = { fire:'🔥', wind:'🌀', light:'⚡', earth:'🪨', water:'💧', yin:'☯', yang:'☀' };

const SHAPE = {
  bolt:  { k:0.95, name:'Bolt' },
  beam:  { k:1.00, name:'Beam' },
  cone:  { k:1.10, name:'Cone' },
  wave:  { k:1.20, name:'Wave' },
  wall:  { k:1.25, name:'Wall' },
  dome:  { k:1.35, name:'Dome' },
  pillar:{ k:1.05, name:'Pillar' },
  field: { k:1.45, name:'Field' },
  trap:  { k:1.50, name:'Seal Trap' }
};

function mixKekkei(a,b){
  if (!a||!b||a===b) return '';
  const s = new Set([a,b]);
  if (s.has('water') && s.has('wind')) return 'Ice (Hyōton)';
  if (s.has('earth') && s.has('water')) return 'Wood (Mokuton)';
  if (s.has('fire')  && s.has('earth')) return 'Lava (Yōton)';
  if (s.has('wind')  && s.has('light')) return 'Storm (Ranton)';
  if (s.has('earth') && s.has('light')) return 'Magnet (Jiton)';
  if (s.has('wind')  && s.has('fire'))  return 'Scorch (Shakuton)';
  return '—';
}

function envModFor(nature){
  let m = 1.0;
  if (envWet.checked){ if (nature==='water') m*=0.9; if (nature==='fire') m*=1.1; }
  if (envHot.checked){ if (nature==='fire') m*=0.9; if (nature==='water') m*=1.1; }
  if (envWind.checked){ if (nature==='wind') m*=0.9; }
  if (envRock.checked){ if (nature==='earth') m*=0.9; }
  if (envStorm.checked){ if (nature==='light') m*=0.9; }
  return m;
}

function compute(){
  const c = +ctl.value/100, p = +out.value/100, b = +br.value/100, ch = +chan.value/100;
  const pri = prim.value, se = sec.value || null, sh = SHAPE[shape.value];
  const rng = +range.value, ar = +area.value;

  let natureK = NATURE_BASE[pri]; if (se) natureK += 0.3;
  const kekkei = mixKekkei(pri,se);
  let shapeK = sh.k * (1 + (rng/50)*0.25 + (ar/15)*0.35);
  if (weapon.checked && (shape.value==='bolt' || shape.value==='beam')) shapeK *= 0.9;
  if (onehand.checked) shapeK *= 1.12; if (noseal.checked) shapeK *= 1.35;

  const controlEff = (0.55*c + 0.45*b) * (0.8 + 0.2*ch);
  const leakage = Math.max(0, 1 - controlEff) * (0.6 + 0.4*p);
  const cast = (0.9 + 0.6*natureK + 0.8*shapeK) * (1.15 - 0.6*controlEff);
  const envK = envModFor(pri);
  const anchorK = anchor.checked? 0.85 : 1.0;

  let cost = 8 + 28*p + 6*natureK + 8*shapeK; cost *= envK * anchorK; cost *= (1 + leakage*0.6);
  cost = Math.max(4, Math.round(cost)); 
  const potency = Math.round( (35*p) * (1 + (1-natureK/1.3)) * (1 + (shapeK-1)) );

  let stab = controlEff / (0.7 + 0.25*p + 0.25*(natureK-1) + 0.25*(shapeK-1));
  stab = Math.max(0, Math.min(1, stab));
  const risk = 1-stab;

  setChakra(chakra);

  vNature.textContent = natureK.toFixed(2);
  vShape.textContent  = shapeK.toFixed(2);
  vKekkei.textContent = kekkei || '—';
  vStab.textContent   = labelStability(stab);
  vLeak.textContent   = (leakage*100).toFixed(0) + '%';
  vCast.textContent   = (cast).toFixed(1) + ' tics';
  vCost.textContent   = cost + ' ⚝';
  vPot.textContent    = potency;
  vRisk.textContent   = labelRisk(risk);

  big.textContent = NATURE_ICON[pri] || '📜';

  return {pri,se,sh:shape.value,kekkei,cost,potency,stab,leakage,cast,envK,natureK,shapeK,p,b,ch,anchor:anchor.checked,weapon:weapon.checked,rng,ar};
}

function labelStability(x){
  if (x>=0.8) return 'Excellent';
  if (x>=0.6) return 'Stable';
  if (x>=0.4) return 'Unstable';
  return 'Fragile';
}
function labelRisk(x){
  if (x<=0.2) return 'Low';
  if (x<=0.4) return 'Moderate';
  if (x<=0.7) return 'High';
  return 'Severe';
}
function setChakra(val){ chakraFill.style.transform = `scaleX(${Math.max(0, Math.min(1, val/100))})`; }

document.querySelectorAll('input,select').forEach(el=> el.addEventListener('input', compute));

explainBtn.addEventListener('click', ()=>{
  const m = compute();
  const lines = [];
  lines.push(`You molded a ${m.kekkei && m.kekkei!=='—' ? m.kekkei : `${NATURE_ICON[m.pri]} ${m.pri.charAt(0).toUpperCase()+m.pri.slice(1)}`} ${m.sh} with range ${m.rng}m and radius ${m.ar}m.`);
  lines.push(`Nature complexity ${m.natureK.toFixed(2)} × shape complexity ${m.shapeK.toFixed(2)} set the baseline difficulty.`);
  if (m.weapon) lines.push('Channeling through a weapon smoothed delivery (−10% shape difficulty).');
  if (onehand.checked) lines.push('One‑hand seal penalty applied (+12% shape difficulty).');
  if (noseal.checked) lines.push('No‑seal execution greatly increased difficulty (+35%).');
  if (m.anchor) lines.push('A prepared fūinjutsu anchor discounted this cast (−15% cost).');
  lines.push(`Your control/focus produced ${( (1-m.leakage)*100).toFixed(0)}% efficiency; leakage ${(m.leakage*100).toFixed(0)}%.`);
  lines.push(`Stability rated ${labelStability(m.stab)} with ${labelRisk(1-m.stab)} backfire risk.`);
  lines.push(`Chakra cost ≈ ${m.cost} ⚝ for potency ${m.potency}.`);
  explainBox.innerHTML = lines.map(l=>`<div>• ${escapeHtml(l)}</div>`).join('');
});

resetBtn.addEventListener('click', ()=>{
  document.querySelectorAll('input[type=checkbox]').forEach(c=> c.checked=false);
  ctl.value=60; out.value=55; br.value=70; chan.value=65;
  prim.value='fire'; sec.value=''; shape.value='bolt'; range.value=15; area.value=4;
  chakra=100; setChakra(chakra); compute();
});

setChakra(chakra); compute();

function escapeHtml(x){ return String(x).replace(/[&<>\"']/g, m=>({\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",\"\\\"\":\"&quot;\",\"'\":\"&#39;\"}[m])); }
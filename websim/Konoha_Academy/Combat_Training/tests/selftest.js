import { waveConfig } from '../src/waves.js';
import { clamp, dist2, lerp, clamp01, makeRNG, angleTo, vecFromAngle } from '../src/utils.js';

const out = document.getElementById('out');
const log = (m) => out.textContent += '\n' + m;
out.textContent = 'Running...';

try {
  const w1 = waveConfig(1);
  const w5 = waveConfig(5);
  if (!(w1.count === 20 && w5.count > w1.count)) throw new Error('waveConfig should start at 20 and grow per wave');
  log('✓ waveConfig count scales');

  if (clamp(5,0,2) !== 2 || clamp(-3,0,2) !== 0) throw new Error('clamp incorrect');
  log('✓ clamp works');

  if (dist2(0,0,3,4) !== 25) throw new Error('dist2 incorrect');
  log('✓ dist2 works');

  if (lerp(0, 10, 0.5) !== 5 || lerp(5, 15, 0) !== 5 || lerp(5, 15, 1) !== 15) throw new Error('lerp incorrect');
  log('✓ lerp works');
  if (clamp01(-0.2) !== 0 || clamp01(1.5) !== 1) throw new Error('clamp01 incorrect');
  log('✓ clamp01 works');
  const r1 = makeRNG(123), r2 = makeRNG(123);
  const a1 = [r1(), r1(), r1()], a2 = [r2(), r2(), r2()];
  if (!a1.every((v,i)=>v===a2[i] && v>=0 && v<1)) throw new Error('makeRNG not deterministic/in-range');
  log('✓ makeRNG deterministic');
  const ang = angleTo(0,0, 1,0);
  const v = vecFromAngle(Math.PI/2, 1);
  if (Math.abs(ang) > 1e-9 || Math.abs(v.x) > 1e-6 || Math.abs(v.y - 1) > 1e-6) throw new Error('angle/vector helpers incorrect');
  log('✓ angleTo/vecFromAngle work');

  log('All tests passed.');
} catch (e) {
  log('Test failed: ' + e.message);
}
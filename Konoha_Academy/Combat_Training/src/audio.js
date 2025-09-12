export function createAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let muted = false;
  let bgOsc = null, bgGain = null;

  function beep({ f=440, t=0.06, type='square', v=0.06 }) {
    if (muted) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    o.connect(g).connect(ctx.destination);
    o.start(now); o.stop(now + t);
  }

  function ensureBG() {
    if (bgOsc) return;
    bgOsc = ctx.createOscillator(); bgOsc.type = 'triangle'; bgOsc.frequency.value = 96;
    bgGain = ctx.createGain(); bgGain.gain.value = muted ? 0 : 0.012;
    bgOsc.connect(bgGain).connect(ctx.destination); bgOsc.start();
  }

  function sweep({ f1=440, f2=660, t=0.08, type='square', v=0.05 }) {
    if (muted) return;
    const n = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, n); o.frequency.exponentialRampToValueAtTime(f2, n + t);
    g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(0.0001, n + t);
    o.connect(g).connect(ctx.destination); o.start(n); o.stop(n + t);
  }

  function noise({ t=0.12, v=0.06 } = {}) {
    if (muted) return;
    const n = ctx.currentTime, len = Math.floor(ctx.sampleRate * t);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random()*2 - 1) * (1 - i/len);
    const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(0.0001, n + t);
    s.buffer = buf; s.connect(g).connect(ctx.destination); s.start(n);
  }

  return {
    ctx,
    shoot: () => {
      const rnd = 820 + Math.random()*120;
      sweep({ f1: rnd, f2: rnd*1.25, t: 0.05, type: 'square', v: 0.05 });
    },
    pop:   () => sweep({ f1: 420, f2: 180, t: 0.08, type: 'triangle', v: 0.06 }),
    hit:   () => { noise({ t: 0.10, v: 0.07 }); sweep({ f1: 160, f2: 110, t: 0.06, type: 'sawtooth', v: 0.04 }); },
    lose:  () => { sweep({ f1: 200, f2: 150, t: 0.12, type:'sine', v:0.05 }); setTimeout(()=>sweep({f1:150,f2:110,t:0.16,type:'sine',v:0.05}), 90); },
    toggleMute: () => { muted = !muted; if (bgGain) bgGain.gain.value = muted ? 0 : 0.012; return muted; },
    resume: async () => { if (ctx.state !== 'running') await ctx.resume(); ensureBG(); },
    isMuted: () => muted,
  };
}
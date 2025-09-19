export function makeEngine({ update, draw }) {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const baseW = Number(canvas.getAttribute('width'))||canvas.width, baseH = Number(canvas.getAttribute('height'))||canvas.height;
  function resize(){ const dpr=Math.min(2,window.devicePixelRatio||1); canvas.style.width='100%'; canvas.style.height='auto'; canvas.width=Math.round(baseW*dpr); canvas.height=Math.round(baseH*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  let raf=0,last=0; function frame(t){ const now=t/1000, dt=last?Math.min(0.05,now-last):0; last=now; update&&update(dt); draw&&draw(ctx); raf=requestAnimationFrame(frame); }
  window.addEventListener('resize', resize); resize();
  return { canvas, start(){ if(!raf) raf=requestAnimationFrame(frame); }, stop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } } };
}
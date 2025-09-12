export function makeConcrete(size){
  const c = document.createElement('canvas'); c.width=c.height=size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9AA0A5'; ctx.fillRect(0,0,size,size);
  for(let i=0;i<1200;i++){
    const x = Math.random()*size, y = Math.random()*size, r = Math.random()*2+0.2;
    const a = Math.random()*0.08;
    ctx.fillStyle = `rgba(40,45,50,${a})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const grad = ctx.createRadialGradient(size*.52, size*.52, size*.1, size*.5, size*.5, size*.7);
  grad.addColorStop(0,'rgba(255,255,255,.06)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(size*.5,size*.5,size*.7,0,Math.PI*2); ctx.fill();
  return c;
}

export function makeHokagePanel(w,h){
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  const grd = ctx.createLinearGradient(0,0,0,h);
  grd.addColorStop(0,'#E3CBA1'); grd.addColorStop(.5,'#D6B88A'); grd.addColorStop(1,'#C9A774');
  ctx.fillStyle = grd; ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(w*0.52, h*0.55);
  ctx.rotate(-0.02);
  ctx.lineWidth = Math.max(10, w*0.02);
  ctx.strokeStyle = '#C9412E';
  ctx.beginPath();
  const turns = 1.2;
  for (let a=0; a<Math.PI*2*turns; a+=0.05){
    const r = 34 + a*10;
    ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.lineTo(120, -8);
  ctx.stroke();
  ctx.restore();

  ctx.globalAlpha = .9;
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w*0.18, h*0.28); ctx.lineTo(w*0.18, h*0.74); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.18, h*0.28); ctx.lineTo(w*0.30, h*0.34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.28, h*0.52); ctx.lineTo(w*0.42, h*0.60); ctx.stroke();

  for (let i=0;i<240;i++){
    const x = Math.random()*w, y = Math.random()*h, a=.08+Math.random()*.08;
    ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(x,y,1,1);
  }
  return c;
}


export function makeCarpet(size){
  const c = document.createElement('canvas'); c.width=c.height=size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8eb07a'; ctx.fillRect(0,0,size,size);
  for(let i=0;i<1400;i++){
    const x=Math.random()*size,y=Math.random()*size;
    const r=1+Math.random()*3, a=.06+Math.random()*.07;
    ctx.fillStyle=`rgba(40,70,30,${a})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=.25;
  for(let y=0;y<size;y+=6){
    ctx.fillStyle = (y%18? '#95b985':'#a2c493');
    ctx.fillRect(0,y,size,1);
  }
  ctx.globalAlpha=1;
  return c;
}

export function makeBanner(w,h){
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#111'; ctx.lineWidth=14; ctx.lineCap='round';
  const strokes = [
    [[w*0.45, h*0.18],[w*0.45,h*0.80]],
    [[w*0.22, h*0.32],[w*0.70,h*0.40]],
    [[w*0.30, h*0.55],[w*0.60,h*0.65]],
  ];
  strokes.forEach(seg=>{
    ctx.beginPath(); ctx.moveTo(seg[0][0],seg[0][1]); ctx.lineTo(seg[1][0],seg[1][1]); ctx.stroke();
  });
  return c;
}
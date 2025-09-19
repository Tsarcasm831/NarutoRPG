import { W, H, svg, dLayer, rLayer, pLayer, hLayer, wLayer, tip } from './constants.js';
import { MODEL, state } from './model.js';
import { pct, mk, clear, autosave } from './utils.js';
import { select, startDragVertex, startDragWhole, startDragPOI } from './interactions.js';
import { dumpJSON } from './export-utils.js';

function isSelected(kind,key){ return state.selected && state.selected.kind===kind && state.selected.key===key; }
const getToggle = (id, def=true) => { const el = document.getElementById(id); return el ? !!el.checked : def; };

export function drawAll(){
  drawGrass(); drawForest(); drawMountains();
  drawRoads(); drawDistricts(); drawWalls(); drawPOI(); drawHandles(); updateForm();
}

function drawDistricts(){
  clear(dLayer);
  if(state.mode==='draw-road') return; // hide districts when focusing on roads
  if(!getToggle('toggleDistricts')) return;
  const locked = !!state.locks?.districtsLocked;
  for(const k in MODEL.districts){
    const d=MODEL.districts[k];
    const pts=d.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    const col = d.color || '#22d3ee';
    const poly=mk('polygon',{class:'district '+(isSelected('district',k)?'selected':''),'data-id':k,points:pts, style:`--dist-stroke:${col};--dist-fill:${col}55`});
    poly.addEventListener('mouseenter',e=>showTip(e,{id: d.id || k, name:d.name, desc:d.desc}));
    poly.addEventListener('mousemove',moveTip);
    poly.addEventListener('mouseleave',hideTip);
    poly.addEventListener('mousedown',e=>{
      e.stopPropagation();
      if(locked) return; // locked: no select/edit
      if(state.mode==='select'){
        select('district',k);
        if(e.altKey){ startDragWhole(e,'district',k); }
        else if(window.__openDistrictModal){ window.__openDistrictModal(k); }
      }
    });
    dLayer.append(poly);
  }
}

function drawRoads(){
  clear(rLayer);
  if(!getToggle('toggleRoads')) return;
  const drawMode = state.mode==='draw-road';
  for(let i=0;i<MODEL.roads.length;i++){
    const r=MODEL.roads[i];
    const d=r.points.map(p=>[p[0]*W/100,p[1]*H/100].join(',')).join(' ');
    const baseWidth = Math.max(4, Number(r.width ?? 4) || 4);
    const attrs = {class:`road ${r.type} ${drawMode?'draw-mode ':''}${isSelected('road',i)?'selected':''}`.trim(),'data-i':i,points:d,'stroke-width':drawMode ? baseWidth + 4 : baseWidth};
    // Use secondary road texture for 'street' and 'avenue' types when not in draw focus
    const rtype = (r.type||'').toLowerCase();
    if(!drawMode && (rtype==='street' || rtype==='avenue')){
      attrs.stroke = 'url(#roadSecondaryTex)';
    } else if(rtype==='canal'){
      attrs.stroke = drawMode ? '#38bdf8' : 'var(--canal)';
    } else if(drawMode){
      attrs.stroke = '#f8fafc';
    }
    const pl=mk('polyline', attrs);
    pl.addEventListener('mouseenter',e=>showTip(e,{name:r.name||r.id||'road',desc:r.type+` (${r.width||3}px)`}));
    pl.addEventListener('mousemove',moveTip);
    pl.addEventListener('mouseleave',hideTip);
    pl.addEventListener('mousedown',e=>{
      e.stopPropagation();
      if(state.mode==='select'){ select('road',i); if(e.altKey){ startDragWhole(e,'road',i);} }
    });
    pl.addEventListener('wheel', e => {
      if(state.mode!=='select') return;
      e.preventDefault();
      select('road', i);
      const r = MODEL.roads[i];
      const step = (e.deltaY < 0 ? 1 : -1);
      r.width = Math.max(1, Math.min(24, (r.width ?? 4) + step));
      drawAll(); dumpJSON(); autosave(MODEL);
    });
    rLayer.append(pl);
  }
}

function drawRivers(){
  const layer = document.getElementById('riverLayer');
  clear(layer);
  return; // rivers removed
}

function drawGrass(){
  const layer = document.getElementById('grassLayer');
  clear(layer);
  if(!getToggle('toggleGrass') || !Array.isArray(MODEL.grass)) return;
  layer.append(mk('rect',{class:'grass-base',x:0,y:0,width:W,height:H}));
  for(const g of MODEL.grass){
    const d=g.points.map(p=>[p[0]*W/100,p[1]*H/100].join(',')).join(' ');
    layer.append(mk('polyline',{class:'grass',points:d,'stroke-width':g.width||50}));
  }
}

function drawForest(){
  const layer = document.getElementById('forestLayer');
  clear(layer);
  if(!getToggle('toggleForest') || !Array.isArray(MODEL.forest)) return;
  for(const f of MODEL.forest){
    const d=f.points.map(p=>[p[0]*W/100,p[1]*H/100].join(',')).join(' ');
    layer.append(mk('polygon',{class:'forest-area',points:d}));
  }
}

function drawMountains(){
  const layer = document.getElementById('mountainLayer');
  clear(layer);
  if(!getToggle('toggleMountains') || !Array.isArray(MODEL.mountains)) return;
  for(const m of MODEL.mountains){
    const d=m.points.map(p=>[p[0]*W/100,p[1]*H/100].join(',')).join(' ');
    if(m.shape==='triangle'){
      layer.append(mk('polygon',{class:'mountain-tri',points:d}));
    }else{
      layer.append(mk('polyline',{class:'mountain',points:d,'stroke-width':m.width||10}));
    }
  }
}

function drawWalls(){
  clear(wLayer);
  if(!getToggle('toggleWalls') || !Array.isArray(MODEL.walls)) return;
  for(let i=0;i<MODEL.walls.length;i++){
    const w=MODEL.walls[i], c=mk('circle',{class:`wall ${isSelected('wall',i)?'selected':''}`,'data-i':i,
      cx:w.cx*W/100, cy:w.cy*H/100, r:w.r*W/100, 'stroke-width':w.width||8});
    c.addEventListener('mouseenter',e=>showTip(e,{name:w.name||w.id||'Wall',desc:w.desc||''}));
    c.addEventListener('mousemove',moveTip); c.addEventListener('mouseleave',hideTip);
    c.addEventListener('mousedown',e=>{ e.stopPropagation(); if(state.mode==='select'){ select('wall',i); if(e.altKey){ startDragWhole(e,'wall',i);} }});
    wLayer.append(c);
  }
}

function drawPOI(){
  clear(pLayer);
  if(!getToggle('togglePOI')) return;
  const locked = !!state.locks?.poiLocked;
  for(let i=0;i<MODEL.poi.length;i++){
    const p=MODEL.poi[i];
    const g=mk('g',{'data-i':i});
    const r=0.88, size=(W*(r*2))/100, cx=p.x*W/100, cy=p.y*H/100;
    let icon=null;
    if(/^(?:[1-9]|1[0-2])$/.test(String(p.id))) icon=String(p.id);
    else if(/^[A-E]$/.test(String(p.id))) icon=String(p.id);
    else if(p.type==='park') icon='C'; else if(p.type==='gate') icon='E';
    else if(/^[A-E]/.test(String(p.id))) icon=String(p.id)[0];
    const img = mk('image',{href:`assets/icons/${icon||'A'}.png`,x:cx-size/2,y:cy-size/2,width:size,height:size});
    g.append(img);
    g.addEventListener('mouseenter',e=>showTip(e,p));
    g.addEventListener('mousemove',moveTip);
    g.addEventListener('mouseleave',hideTip);
    g.addEventListener('mousedown',e=>{
      e.stopPropagation();
      if(locked) return; // locked: no select/move
      if(state.mode==='select'){ select('poi',i); startDragPOI(e,i); }
    });
    if(isSelected('poi',i)) g.classList.add('selected');
    pLayer.append(g);
  }
}

function drawHandles(){
  clear(hLayer);
  if(!state.selected) return;
  if(state.selected.kind==='district'){
    if(state.locks?.districtsLocked) return; // locked: no handles for districts
    const d=MODEL.districts[state.selected.key];
    d.points.forEach(([x,y],idx)=>{
      const h=mk('circle',{class:'handle',r:6,cx:x*W/100,cy:y*H/100,'data-i':idx});
      h.addEventListener('mousedown',e=>startDragVertex(e,'district',state.selected.key,idx));
      hLayer.append(h);
    });
  } else if(state.selected.kind==='road'){
    const r=MODEL.roads[state.selected.key];
    r.points.forEach(([x,y],idx)=>{
      const h=mk('circle',{class:'handle',r:6,cx:x*W/100,cy:y*H/100,'data-i':idx});
      h.addEventListener('mousedown',e=>startDragVertex(e,'road',state.selected.key,idx));
      hLayer.append(h);
    });
  }
}

function showTip(evt,obj){
  tip.hidden=false; tip.innerHTML=`<h3>${obj.name||obj.id||'Item'}</h3><p>${obj.desc||''}</p>`;
  moveTip(evt);
}
function moveTip(evt){
  const r=svg.getBoundingClientRect();
  tip.style.left=(evt.clientX-r.left+10)+'px';
  tip.style.top=(evt.clientY-r.top+10)+'px';
}
function hideTip(){ tip.hidden=true; }

function updateForm(){
  const sel=state.selected;
  document.getElementById('selNone').hidden=!!sel; document.getElementById('selForm').hidden=!sel;
  if(!sel) return;
  const obj = sel.kind==='district' ? MODEL.districts[sel.key]
            : sel.kind==='road' ? MODEL.roads[sel.key]
            : MODEL.poi[sel.key];
  document.getElementById('sType').value = sel.kind;
  document.getElementById('sId').value   = obj.id ?? sel.key;
  document.getElementById('sName').value = obj.name ?? '';
  document.getElementById('sDesc').value = obj.desc ?? '';
  const isRoad = sel.kind==='road';
  document.getElementById('roadExtras').hidden = !isRoad;
  if(isRoad){ document.getElementById('sRoadType').value=obj.type||'street'; document.getElementById('sRoadW').value=Math.max(4, obj.width||4); }
}

export { showTip, moveTip, hideTip };

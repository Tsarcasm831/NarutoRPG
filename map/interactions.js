import { svg } from './constants.js';
import { MODEL, state } from './model.js';
import { clamp, screenToPct, autosave } from './utils.js';
import { dumpJSON } from './export-utils.js';
import { drawAll } from './render.js';
import { W, H, hLayer } from './constants.js';

export function select(kind,key){ state.selected={kind,key}; drawAll(); }

export function startDragVertex(e,kind,key,idx){
  e.preventDefault(); e.stopPropagation();
  const move=(ev)=>{
    const [x,y]=screenToPct(ev.clientX,ev.clientY);
    if(kind==='district') MODEL.districts[key].points[idx]=[x,y];
    else MODEL.roads[key].points[idx]=[x,y];
    drawAll();
  };
  const up=()=>{window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
    dumpJSON(); autosave(MODEL);
  };
  window.addEventListener('mousemove',move); window.addEventListener('mouseup',up,{once:true});
}

export function startDragWhole(e,kind,key){
  e.preventDefault(); e.stopPropagation();
  if(kind==='district' && state.locks?.districtsLocked) return; // locked: block district moves
  const ref=screenToPct(e.clientX,e.clientY);
  const move=(ev)=>{
    const [nx,ny]=screenToPct(ev.clientX,ev.clientY);
    const dx=nx-ref[0], dy=ny-ref[1];
    if(kind==='district'){
      MODEL.districts[key].points = MODEL.districts[key].points.map(([x,y])=>[clamp(+((x+dx)).toFixed(2),0,100), clamp(+((y+dy)).toFixed(2),0,100)]);
    }else if(kind==='road'){
      MODEL.roads[key].points = MODEL.roads[key].points.map(([x,y])=>[clamp(+((x+dx)).toFixed(2),0,100), clamp(+((y+dy)).toFixed(2),0,100)]);
    }else if(kind==='wall'){
      const w=MODEL.walls[key]; w.cx=clamp(+((w.cx+dx)).toFixed(2),0,100); w.cy=clamp(+((w.cy+dy)).toFixed(2),0,100);
    }
    drawAll();
  };
  const up=()=>{window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
    dumpJSON(); autosave(MODEL);
  };
  window.addEventListener('mousemove',move); window.addEventListener('mouseup',up,{once:true});
}

export function startDragPOI(e,i){
  e.preventDefault(); e.stopPropagation();
  if(state.locks?.poiLocked) return; // locked: block POI moves
  const move=(ev)=>{
    const [x,y]=screenToPct(ev.clientX,ev.clientY);
    MODEL.poi[i].x=x; MODEL.poi[i].y=y; drawAll();
  };
  const up=()=>{window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
    dumpJSON(); autosave(MODEL);
  };
  window.addEventListener('mousemove',move); window.addEventListener('mouseup',up,{once:true});
}

export function canvasDown(e){
  const [x,y]=screenToPct(e.clientX,e.clientY);
  // Handle placing a new POI: first click chooses location, then modal opens for details
  if(state.addingPOI){
    state._pendingPOI = {x,y};
    const modal = document.getElementById('poiModal');
    if(modal) modal.hidden=false;
    return;
  }
  if(state.mode==='select'){
    const onDistrict = e.target && typeof e.target.closest==='function' ? e.target.closest('.district') : null;
    if(!onDistrict){ state.selected=null; drawAll(); }
    return;
  }
  if(state.mode==='draw-district'){
    if(!state.drawing){ state.drawing={kind:'district',points:[[x,y]]}; drawGhost(); }
    else{ state.drawing.points.push([x,y]); drawGhost(); }
  } else if(state.mode==='draw-road'){
    if(!state.drawing){ state.drawing={kind:'road',points:[[x,y]]}; drawGhost(true); }
    else{ state.drawing.points.push([x,y]); drawGhost(true); }
  } else if(state.mode==='draw-river'){
    if(!state.drawing){
      state.drawing={kind:'river',points:[[x,y]]};
      drawGhost(true);
      const move=(ev)=>{
        const [mx,my]=screenToPct(ev.clientX,ev.clientY);
        const last=state.drawing.points[state.drawing.points.length-1];
        if(!last || Math.hypot(mx-last[0], my-last[1])>0.3){
          state.drawing.points.push([mx,my]); drawGhost(true);
        }
      };
      const up=()=>{
        window.removeEventListener('mousemove',move);
        finishDrawing();
      };
      window.addEventListener('mousemove',move);
      window.addEventListener('mouseup',up,{once:true});
    }
  } else if(state.mode==='draw-forest'){
    if(!state.drawing){ state.drawing={kind:'forest',points:[[x,y]]}; drawGhost(); }
    else{ state.drawing.points.push([x,y]); drawGhost(); }
  } else if(state.mode==='draw-mountain'){
    if(state.brush.mountain.shape==='triangle'){
      state.drawing={kind:'mountain',center:[x,y],r:0};
      const move=(ev)=>{ const [mx,my]=screenToPct(ev.clientX,ev.clientY);
        const dx=mx-x, dy=my-y; state.drawing.r=Math.hypot(dx,dy)*(state.brush.mountain.triSize/10); drawGhost(true); };
      state._mountMove=move; window.addEventListener('mousemove',move);
      const up=()=>{ window.removeEventListener('mousemove',move); finishDrawing(); };
      window.addEventListener('mouseup',up,{once:true});
      return;
    }
    if(!state.drawing){
      state.drawing={kind:'mountain', points:[[x,y]]};
      drawGhost();
      const move=(ev)=>{
        const [mx,my]=screenToPct(ev.clientX,ev.clientY);
        const last=state.drawing.points[state.drawing.points.length-1];
        if(!last || Math.hypot(mx-last[0], my-last[1])>0.3){
          state.drawing.points.push([mx,my]); drawGhost();
        }
      };
      const up=()=>{ window.removeEventListener('mousemove',move); finishDrawing(); };
      window.addEventListener('mousemove',move); window.addEventListener('mouseup',up,{once:true});
    }
  } else if(state.mode==='draw-wall'){
    if(!state.drawing){
      state.drawing={kind:'wall',center:[x,y],r:0};
      const move=(ev)=>{ const [mx,my]=screenToPct(ev.clientX,ev.clientY);
        const dx=mx-x, dy=my-y; state.drawing.r=Math.hypot(dx,dy); drawGhost(false,true); };
      state._wallMove=move; window.addEventListener('mousemove',move);
    } else {
      finishDrawing();
    }
  }
}

export function drawGhost(isRoad=false,isWall=false){
  const pts = state.drawing?.points?.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
  clearLayer(hLayer);
  const kind = state.drawing?.kind;
  const el = isWall || kind==='wall'
    ? mkEl('circle',{class:'wall ghost',cx:state.drawing.center[0]*W/100,cy:state.drawing.center[1]*H/100,r:state.drawing.r*W/100,strokeWidth:8})
    : (kind==='mountain' && state.drawing?.center && state.brush.mountain.shape==='triangle')
    ? (()=>{ const [cx,cy]=state.drawing.center, r=state.drawing.r;
        const tri=trianglePts(cx,cy,r).map(([px,py])=>[px*W/100,py*H/100].join(',')).join(' ');
        return mkEl('polygon',{class:'mountain-tri ghost',points:tri});
      })()
    : (isRoad || kind==='road' || kind==='river' || kind==='mountain')
    ? mkEl('polyline',{class:(kind==='river'?'river':'mountain')+' ghost',
        points:pts,strokeWidth:(kind==='river'? (state.brush.river.width||7)
                               : kind==='mountain'? (state.brush.mountain.width||10)
                               : (state.brush.road.width||3))})
    : mkEl('polygon',{class: (kind==='forest' ? 'forest-area ghost' : 'district ghost'), points:pts});
  hLayer.append(el);
}

export function finishDrawing(){
  if(!state.drawing) return;
  const isRoad = state.drawing.kind==='road';
  const isRiver = state.drawing.kind==='river';
  const isWall = state.drawing.kind==='wall';
  const isForest = state.drawing.kind==='forest';
  const isMountain = state.drawing.kind==='mountain';
  if(isWall){
    if(state._wallMove){ window.removeEventListener('mousemove',state._wallMove); state._wallMove=null; }
    if(!MODEL.walls) MODEL.walls=[];
    const {center:[cx,cy],r}=state.drawing;
    if(r<=0){ cancelDrawing(); return; }
    MODEL.walls.push({id:'wall-'+(MODEL.walls.length+1),name:'',desc:'',cx,cy,r,width:8});
    state.drawing=null; select('wall',MODEL.walls.length-1); dumpJSON(); autosave(MODEL); return;
  }
  if(state.drawing.points.length < ((isRoad||isRiver)?2 : (isForest?3 : (isMountain?2 : 3)))){ cancelDrawing(); return;}
  if(!isRoad && !isRiver && !isWall && !isForest && !isMountain){
    let idx=1; while(MODEL.districts['residential'+idx]) idx++;
    const id='residential'+idx;
    MODEL.districts[id]={id,name:id,desc:'',points:state.drawing.points};
    select('district',id);
  }else if(isRoad){
    const id='road-'+(MODEL.roads.length+1);
    MODEL.roads.push({id,name:'',type:state.brush.road.type||'street',width:state.brush.road.width||4,points:state.drawing.points});
    select('road',MODEL.roads.length-1);
  }else if(isRiver){
    if(!Array.isArray(MODEL.rivers)) MODEL.rivers=[];
    MODEL.rivers.push({id:'river-'+(MODEL.rivers.length+1),points:state.drawing.points,width:state.brush.river.width||7});
  }else if(isForest){
    if(!Array.isArray(MODEL.forest)) MODEL.forest=[];
    MODEL.forest.push({id:'forest-'+(MODEL.forest.length+1),points:state.drawing.points});
  }else if(isMountain){
    if(state._mountMove){ window.removeEventListener('mousemove',state._mountMove); state._mountMove=null; }
    if(!Array.isArray(MODEL.mountains)) MODEL.mountains=[];
    if(state.drawing.center && (state.brush.mountain.shape==='triangle')){ 
      const [cx,cy]=state.drawing.center, r=state.drawing.r||6;
      const pts=trianglePts(cx,cy,r);
      MODEL.mountains.push({id:'mountain-'+(MODEL.mountains.length+1),points:pts,shape:'triangle'});
    } else {
      MODEL.mountains.push({id:'mountain-'+(MODEL.mountains.length+1),points:state.drawing.points,width:state.brush.mountain.width||10});
    }
  }
  state.drawing=null; drawAll(); dumpJSON(); autosave(MODEL);
}

export function cancelDrawing(){ 
  if(state._wallMove){ window.removeEventListener('mousemove',state._wallMove); state._wallMove=null; }
  state.drawing=null; drawAll(); 
}

/* lightweight helpers to avoid importing heavy modules here */
function mkEl(tag,attrs){const ns='http://www.w3.org/2000/svg';const el=document.createElementNS(ns,tag);for(const k in attrs)el.setAttribute(k,attrs[k]);return el;}
function clearLayer(el){ while(el && el.firstChild) el.removeChild(el.firstChild); }

/* helper to compute an upright triangle in pct units */
function trianglePts(cx,cy,r){
  const h = r*1.732; // height for equilateral from side ≈ r*2 -> adjust scale for prominence
  return [
    [cx, cy - h/2],           // top
    [cx - r, cy + h/2],       // bottom-left
    [cx + r, cy + h/2]        // bottom-right
  ];
}
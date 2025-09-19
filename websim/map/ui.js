import { svg, $, W, H } from './constants.js';
import { MODEL, state } from './model.js';
import { download, autosave } from './utils.js';
import { drawAll } from './render.js';
import { dumpJSON, buildExportSVG, buildDefaultModelJS } from './export-utils.js';
import { canvasDown, finishDrawing, cancelDrawing, select } from './interactions.js';

function wireUI(){
  document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',e=>{
    state.mode=e.target.value; state.drawing=null; document.body.dataset.mode=state.mode; drawAll(); updateBrushPanel();
  }));
  document.getElementById('edit').addEventListener('change',e=>{ state.edit=e.target.checked; drawAll(); });
  document.getElementById('snap').addEventListener('change',e=>{ state.snap=e.target.checked; });
  const onToggle=id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change',drawAll); };
  ['toggleDistricts','toggleRoads','toggleWalls','togglePOI','toggleRivers','toggleGrass','toggleForest','toggleMountains'].forEach(onToggle);

  // POI modal wiring
  document.getElementById('addPoiBtn').addEventListener('click', ()=>{
    if(state.locks?.poiLocked){ alert('POIs are locked. Unlocking is disabled in this build.'); return; }
    state.addingPOI=true;
    // do not open modal yet; wait for map click to choose location
  });
  document.getElementById('poiCancel').addEventListener('click', ()=>{
    state.addingPOI=false;
    state._pendingPOI=null;
    document.getElementById('poiModal').hidden=true;
  });

  // District modal wiring
  const dModal = document.getElementById('districtModal');
  const dmId = document.getElementById('dmId');
  const dmName = document.getElementById('dmName');
  const dmDesc = document.getElementById('dmDesc');
  const dmColor = document.getElementById('dmColor');
  let currentDistrictKey = null;
  function openDistrictModal(key){
    currentDistrictKey = key;
    const d = MODEL.districts[key];
    dmId.value = d.id || key;
    dmName.value = d.name || '';
    dmDesc.value = d.desc || '';
    dmColor.value = d.color || '#22d3ee';
    dModal.hidden = false;
  }
  window.__openDistrictModal = openDistrictModal;
  document.getElementById('dmCancel').addEventListener('click', ()=>{ dModal.hidden = true; });
  document.getElementById('dmApply').addEventListener('click', ()=>{
    if(!currentDistrictKey) return;
    const old = MODEL.districts[currentDistrictKey];
    const newId = (dmId.value||'').trim() || currentDistrictKey;
    const updated = {...old, id:newId, name:dmName.value, desc:dmDesc.value, color:dmColor.value};
    delete MODEL.districts[currentDistrictKey];
    MODEL.districts[newId] = updated;
    dModal.hidden = true;
    drawAll(); dumpJSON(); autosave(MODEL);
  });

  svg.addEventListener('dblclick',finishDrawing);
  svg.addEventListener('mousedown',canvasDown);
  svg.addEventListener('wheel', onWheelZoom, { passive:false }); // scroll to zoom
  window.addEventListener('keydown',e=>{
    const t=e.target, tag=(t?.tagName||'').toUpperCase();
    if(['INPUT','TEXTAREA','SELECT'].includes(tag) || t?.isContentEditable) return;
    if(e.key==='Escape'){ 
      cancelDrawing(); 
      if(state.addingPOI){ state.addingPOI=false; state._pendingPOI=null; document.getElementById('poiModal').hidden=true; }
    }
    if(e.key==='Enter' && state.drawing){ e.preventDefault(); finishDrawing(); }
    if(e.key.toLowerCase()==='e'){ document.getElementById('edit').click(); }
    if(e.key.toLowerCase()==='h'){ document.querySelector('#wrap').style.gridTemplateColumns=
      getComputedStyle(document.querySelector('#wrap')).gridTemplateColumns==='1fr 348px'?'1fr':'1fr 348px'; }
  });

  document.getElementById('apply').addEventListener('click',()=>{
    if(!state.selected) return;
    const sel=state.selected;
    if(sel.kind==='district' && state.locks?.districtsLocked){ alert('Districts are locked.'); return; }
    if(sel.kind==='poi' && state.locks?.poiLocked){ alert('POIs are locked.'); return; }
    if(sel.kind==='district'){
      const d=MODEL.districts[sel.key];
      delete MODEL.districts[sel.key];
      const newId=document.getElementById('sId').value.trim()||sel.key;
      MODEL.districts[newId]={...d,id:newId,name:document.getElementById('sName').value,desc:document.getElementById('sDesc').value};
      select('district',newId);
    } else if(sel.kind==='road'){
      const r=MODEL.roads[sel.key];
      r.id=document.getElementById('sId').value; r.name=document.getElementById('sName').value; r.desc=document.getElementById('sDesc').value;
      r.type=document.getElementById('sRoadType').value; r.width=parseInt(document.getElementById('sRoadW').value,10)||3;
    } else {
      const p=MODEL.poi[sel.key];
      p.id=document.getElementById('sId').value; p.name=document.getElementById('sName').value; p.desc=document.getElementById('sDesc').value;
    }
    drawAll(); dumpJSON(); autosave(MODEL);
  });
  document.getElementById('delete').addEventListener('click',()=>{
    if(!state.selected) return;
    const s=state.selected;
    if((s.kind==='district' && state.locks?.districtsLocked) || (s.kind==='poi' && state.locks?.poiLocked)){
      alert('This item type is locked.'); return;
    }
    if(s.kind==='district') delete MODEL.districts[s.key];
    if(s.kind==='road') MODEL.roads.splice(s.key,1);
    if(s.kind==='poi') MODEL.poi.splice(s.key,1);
    if(s.kind==='wall') MODEL.walls.splice(s.key,1);
    state.selected=null; drawAll(); dumpJSON(); autosave(MODEL);
  });

  document.getElementById('copyJson').addEventListener('click', async ()=>{
    const txt = document.getElementById('json').value;
    try{
      if(document.hasFocus() && window.isSecureContext && navigator.clipboard){
        await navigator.clipboard.writeText(txt);
      } else { throw new Error('fallback'); }
    }catch{
      const ta=document.createElement('textarea');
      ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); } finally{ document.body.removeChild(ta); }
    }
  });
  document.getElementById('downloadJson').addEventListener('click',()=> download('konoha-map.json', document.getElementById('json').value));
  document.getElementById('exportSvg').addEventListener('click',()=>{
    const svgStr = buildExportSVG();
    download('konoha-overlay.svg', svgStr, 'image/svg+xml');
  });
  const btnJs = document.getElementById('downloadJsModel');
  if(btnJs){ btnJs.addEventListener('click', ()=>{
    const js = buildDefaultModelJS();
    download('full-default-model.js', js, 'application/javascript');
  });}
  const btnSaveDef = document.getElementById('saveAsDefault');
  if(btnSaveDef){
    btnSaveDef.addEventListener('click', ()=>{
      const obj = {
        districts: MODEL.districts || {},
        roads: MODEL.roads || [],
        poi: MODEL.poi || [],
        walls: MODEL.walls || [],
        rivers: MODEL.rivers || [],
        grass: MODEL.grass || [],
        forest: MODEL.forest || [],
        mountains: MODEL.mountains || []
      };
      try{
        localStorage.setItem('konoha-default-model', JSON.stringify(obj));
        alert('Saved current map as the default. Reload to use it.');
      }catch(e){
        alert('Failed to save default (storage full or blocked).');
      }
    });
  }
  document.getElementById('importFile').addEventListener('change',async (e)=>{
    const file=e.target.files[0]; if(!file) return;
    const text=await file.text();
    try{
      const data=JSON.parse(text);
      // new split format support (with backward compatibility)
      const districts = data.districts ?? MODEL.districts;
      const roads = data.roads ?? [];
      const poi = data.poi ?? MODEL.poi;
      const walls = data.walls ?? [];
      const rivers = data.rivers ?? data.river ?? []; // accept legacy typo if any
      const terrain = data.terrain || {};
      const grass = terrain.grass ?? data.grass ?? MODEL.grass ?? [];
      const forest = terrain.forest ?? data.forest ?? MODEL.forest ?? [];
      const mountains = terrain.mountains ?? data.mountains ?? MODEL.mountains ?? [];

      if(!state.locks?.districtsLocked) MODEL.districts = districts;
      MODEL.roads = roads;
      if(!state.locks?.poiLocked) MODEL.poi = poi;
      MODEL.walls = walls;
      MODEL.rivers = rivers;
      MODEL.grass = grass;
      MODEL.forest = forest;
      MODEL.mountains = mountains;

      drawAll(); dumpJSON(); autosave(MODEL);
    }catch(err){ alert('Invalid JSON'); }
  });
  document.getElementById('loadAutosave').addEventListener('click',()=>{
    const txt=localStorage.getItem('konoha-map'); if(!txt){ alert('No autosave found'); return; }
    try{
      const data=JSON.parse(txt);
      if(!state.locks?.districtsLocked) MODEL.districts=data.districts||MODEL.districts;
      MODEL.roads=data.roads||[];
      if(!state.locks?.poiLocked) MODEL.poi=data.poi||MODEL.poi;
      MODEL.walls=data.walls||[];
      drawAll(); dumpJSON();
    } catch { alert('Autosave corrupt'); }
  });
  document.getElementById('clearAll').addEventListener('click',()=>{
    if(!confirm('Clear roads and overlays? Districts/POIs are locked and will be preserved.')) return;
    MODEL.roads=[];
    // preserve districts when locked
    if(!state.locks?.districtsLocked) MODEL.districts={};
    MODEL.walls=[]; drawAll(); dumpJSON(); autosave(MODEL);
  });

  // Create POI from modal after map placement
  document.getElementById('poiCreate').addEventListener('click', ()=>{
    if(state.locks?.poiLocked){ alert('POIs are locked.'); return; }
    const pos = state._pendingPOI; if(!state.addingPOI || !pos) return;
    const type = document.getElementById('poiType').value;
    const inId = (document.getElementById('poiId').value||'').trim();
    const name = (document.getElementById('poiName').value||'').trim();
    const desc = (document.getElementById('poiDesc').value||'').trim();
    const idx = (MODEL.poi?.length||0)+1;
    const autoId = (type==='gate' ? `gate-${idx}` : type==='park' ? `C${idx}` : type==='letter' ? String.fromCharCode(64 + ((idx%26)||26)) : `poi-${idx}`);
    if(!Array.isArray(MODEL.poi)) MODEL.poi=[];
    MODEL.poi.push({id: inId || autoId, name, type, x: pos.x, y: pos.y, desc});
    state.addingPOI=false; state._pendingPOI=null; document.getElementById('poiModal').hidden=true;
    select('poi', MODEL.poi.length-1); dumpJSON(); autosave(MODEL);
  });

  // Brush controls
  const $r=t=>document.getElementById(t);
  $r('brRoadType').addEventListener('change',e=>state.brush.road.type=e.target.value);
  $r('brRoadW').addEventListener('change',e=>state.brush.road.width=parseInt(e.target.value,10)||3);
  $r('brRiverW').addEventListener('change',e=>state.brush.river.width=parseInt(e.target.value,10)||7);
  $r('brForestW').addEventListener('change',e=>state.brush.forest.width=parseInt(e.target.value,10)||40);
  $r('brMountainShape').addEventListener('change',e=>{
    state.brush.mountain.shape=e.target.value;
    $r('brMountainWWrap').hidden = e.target.value==='triangle';
    $r('brMountainTriWrap').hidden = e.target.value!=='triangle';
  });
  $r('brMountainW').addEventListener('change',e=>state.brush.mountain.width=parseInt(e.target.value,10)||10);
  $r('brMountainTri').addEventListener('change',e=>state.brush.mountain.triSize=parseInt(e.target.value,10)||8);
}

function migrateDefaults(){
  /* force all districts to sequential residential ids/names each load */
  const nd={}, list=Object.values(MODEL.districts); let n=1;
  for(const d of list){ const id=`residential${n++}`; nd[id]={...d, id, name:id, desc:''}; }
  MODEL.districts = nd;
}

function updateBrushPanel(){
  document.querySelectorAll('#brushPanel [data-for]').forEach(row=>{
    row.hidden = row.getAttribute('data-for') !== state.mode || row.getAttribute('data-for')==='draw-forest';
  });
  const shp=document.getElementById('brMountainShape').value;
  document.getElementById('brMountainWWrap').hidden = shp==='triangle';
  document.getElementById('brMountainTriWrap').hidden = shp!=='triangle';
}

// Zoom helpers
function parseViewBox() {
  const vb = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
  return (vb.length===4 && vb.every(n=>!Number.isNaN(n))) ? { x:vb[0], y:vb[1], w:vb[2], h:vb[3] } : { x:0, y:0, w:W, h:H };
}
function setViewBox(vb){ svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
function onWheelZoom(e){
  e.preventDefault();
  const vb = parseViewBox();
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const minW = W/6, minH = H/6, maxW = W, maxH = H;
  const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1; // in=0.9, out=1.1
  const newW = Math.min(maxW, Math.max(minW, vb.w * zoomFactor));
  const newH = Math.min(maxH, Math.max(minH, vb.h * zoomFactor));
  const tx = (p.x - vb.x) / vb.w;
  const ty = (p.y - vb.y) / vb.h;
  let nx = p.x - tx * newW;
  let ny = p.y - ty * newH;
  nx = Math.max(0, Math.min(W - newW, nx));
  ny = Math.max(0, Math.min(H - newH, ny));
  setViewBox({ x:nx, y:ny, w:newW, h:newH });
}

function updatePieceView(){
  const sel = document.getElementById('viewPiece');
  const ta = document.getElementById('piece');
  if(!sel || !ta) return;
  const key = sel.value;
  const src = key==='districts' ? MODEL.districts
            : key==='roads' ? MODEL.roads
            : key==='poi' ? MODEL.poi
            : key==='walls' ? MODEL.walls
            : key==='rivers' ? MODEL.rivers
            : key==='forest' ? MODEL.forest
            : key==='grass' ? MODEL.grass
            : key==='mountains' ? MODEL.mountains
            : {};
  ta.value = JSON.stringify(src ?? {}, null, 2);
}

export function initUI(){
  wireUI();
  document.body.dataset.mode=state.mode;
  // Ensure starting at max zoom-out
  setViewBox({ x:0, y:0, w:W, h:H });
  drawAll(); dumpJSON(); updateBrushPanel();
  // piece analyzer wiring
  const vp=document.getElementById('viewPiece');
  const cp=document.getElementById('copyPiece');
  if(vp){ vp.addEventListener('change', updatePieceView); }
  if(cp){ cp.addEventListener('click', async ()=>{
    const txt = (document.getElementById('piece')||{}).value || '';
    try{ await navigator.clipboard.writeText(txt); }catch{
      const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); } finally{ document.body.removeChild(ta); }
    }
  });}
  window.addEventListener('json:updated', updatePieceView);
  updatePieceView();
}
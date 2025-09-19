import { DEFAULT_MODEL } from './user-defaults.js';
let BASE_MODEL = DEFAULT_MODEL;
try{
  const saved = localStorage.getItem('konoha-default-model');
  if(saved){ BASE_MODEL = JSON.parse(saved); }
}catch{}
export const MODEL = BASE_MODEL;

export const state = {
  mode:'select', edit:false, snap:false,
  selected:null, 
  drawing:null, 
  addingPOI:false,
  brush:{
    road:{type:'street', width:4},
    river:{width:7},
    forest:{width:40},
    mountain:{shape:'line', width:10, triSize:8}
  },
  locks:{ districtsLocked:false, poiLocked:true } // lock POIs & districts
};

// ensure rivers array exists for new feature
// remove all rivers
MODEL.rivers = [];
// delete district-9 from defaults if present
if (MODEL?.districts && MODEL.districts['district-9']) { delete MODEL.districts['district-9']; }
// ensure paint layers exist
if(!Array.isArray(MODEL.grass)) MODEL.grass = [];
if(!Array.isArray(MODEL.forest)) MODEL.forest = [];
if(!Array.isArray(MODEL.mountains)) MODEL.mountains = [];
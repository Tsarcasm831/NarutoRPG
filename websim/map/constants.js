export const W = 1018, H = 968; // viewBox

export const svg = document.getElementById('map');
export const dLayer = document.getElementById('districtLayer');
export const rLayer = document.getElementById('roadLayer');
export const riverLayer = document.getElementById('riverLayer');
export const pLayer = document.getElementById('poiLayer');
export const hLayer = document.getElementById('handleLayer');
export const wLayer = document.getElementById('wallLayer');
export const tip = document.getElementById('tip');
export const out = document.getElementById('json');

export const $ = sel => document.querySelector(sel);

/* add paint layers */
export const grassLayer = document.getElementById('grassLayer');
export const forestLayer = document.getElementById('forestLayer');
export const mountainLayer = document.getElementById('mountainLayer');
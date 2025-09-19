// Kitbash palettes adapted from the demo
export const KITBASH_PALETTES = [
  { name: "Konoha Day", roof: ["#d24a2e", "#ff8a00", "#f4d03f", "#ff5d73"], wall: ["#dde4e9", "#f3efe6", "#e8f0f2", "#f7efe1"], trim: ["#345", "#465", "#674"], win: "#88d8ff" },
  { name: "Leaf At Dusk", roof: ["#cf3c3c", "#f07f2f", "#dcbc3d", "#4cae50"], wall: ["#ebe7de", "#e9efe6", "#e7e7f2", "#f2e8de"], trim: ["#233", "#454", "#664"], win: "#a6e3ff" },
  { name: "Festival", roof: ["#ff3b3b", "#ff6f00", "#ffd000", "#36c46b", "#00bcd4"], wall: ["#fff0e5", "#f2f6f7", "#f9f6ef", "#f3f0f6"], trim: ["#314", "#443", "#553", "#224"], win: "#bcefff" },
  { name: "Muted Clay", roof: ["#b04a34", "#c06e3b", "#c7a23a", "#6d9e4e"], wall: ["#e8e2d9", "#ebe8e0", "#e1e7e5", "#efe9db"], trim: ["#3a3a3a", "#4b463f", "#5b4d3f", "#2b3b3b"], win: "#9ad8ff" },
];

export const pick = (arr, rnd = Math.random) => arr[(arr.length * rnd()) | 0];


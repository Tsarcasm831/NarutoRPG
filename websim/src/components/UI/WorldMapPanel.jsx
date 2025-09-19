import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useRef, useState } from "react";
import { WORLD_SIZE } from "../../scene/terrain.js";
import { drawRoads, drawRiver, drawDistricts, drawWalls } from "../../components/game/objects/konoha_roads.js";
import { getBiomeAt, getTerrainTextureForBiome, TEXTURE_WORLD_UNITS, TILE_SIZE } from "../../scene/terrain.js";
const WORLD_MAP_INITIAL_ZOOM = 1;
const WORLD_MAP_MIN_ZOOM = 0.2;
const WORLD_MAP_MAX_ZOOM = 20;
const WORLD_MAP_ZOOM_STEP = 0.1;
const WORLD_MAP_DRAW_WALLS = true;
const WORLD_MAP_WALL_ALPHA = 0.9;
const WORLD_MAP_WALL_STROKE_SCALE = 2;
const WORLD_MAP_WALL_COLOR = "#bfc0c2";
const WORLD_MAP_UPDATE_FPS = 12;
const WORLD_MAP_PRERENDER_OVERLAYS = true;
const WorldMapPanel = ({ playerPosition, onClose, worldObjects = [] }) => {
  const canvasRef = useRef(null);
  const worldMinimapCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const MAP_VIEW_SIZE = 360;
  const GRID_ALPHA = 0.3;
  const OBJ_DOT_R = 2;
  const OBJ_DOT_ALPHA = 0.95;
  const [zoom, setZoom] = useState(WORLD_MAP_INITIAL_ZOOM);
  const handleZoomIn = () => setZoom((z) => Math.min(WORLD_MAP_MAX_ZOOM, +(z + WORLD_MAP_ZOOM_STEP).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(WORLD_MAP_MIN_ZOOM, +(z - WORLD_MAP_ZOOM_STEP).toFixed(2)));
  useEffect(() => {
    const buildWorldCanvas = async () => {
      const worldSize = WORLD_SIZE;
      const numTiles = worldSize / TILE_SIZE;
      const canvas = document.createElement("canvas");
      canvas.width = worldSize;
      canvas.height = worldSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const biomes = ["grass", "sand", "dirt", "rocky", "snow", "forest"];
      const uniqueSrcs = new Set(biomes.map((b) => getTerrainTextureForBiome(b)));
      const imageMap = /* @__PURE__ */ new Map();
      const loadImage = (src) => new Promise((resolve) => {
        const img = new Image();
        img.src = `/${src}`;
        img.onload = () => resolve({ src, img });
        img.onerror = () => resolve({ src, img: null });
      });
      const loaded = await Promise.all([...uniqueSrcs].map(loadImage));
      loaded.forEach(({ src, img }) => {
        if (img) imageMap.set(src, img);
      });
      for (let i = 0; i < numTiles; i++) {
        for (let j = 0; j < numTiles; j++) {
          const x = (i - numTiles / 2) * TILE_SIZE + TILE_SIZE / 2;
          const z = (j - numTiles / 2) * TILE_SIZE + TILE_SIZE / 2;
          const cx = x + worldSize / 2 - TILE_SIZE / 2;
          const cy = z + worldSize / 2 - TILE_SIZE / 2;
          const biome = getBiomeAt(x, z);
          const texFile = getTerrainTextureForBiome(biome);
          const img = imageMap.get(texFile);
          if (!img) {
            ctx.fillStyle = "#2d6a4f";
            ctx.fillRect(cx, cy, TILE_SIZE, TILE_SIZE);
            continue;
          }
          const pcan = document.createElement("canvas");
          pcan.width = TEXTURE_WORLD_UNITS;
          pcan.height = TEXTURE_WORLD_UNITS;
          const pctx = pcan.getContext("2d");
          pctx.drawImage(img, 0, 0, pcan.width, pcan.height);
          const pat = ctx.createPattern(pcan, "repeat");
          if (pat) {
            ctx.save();
            ctx.fillStyle = pat;
            ctx.translate(cx, cy);
            ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            ctx.restore();
          } else {
            ctx.drawImage(img, cx, cy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      if (WORLD_MAP_PRERENDER_OVERLAYS) {
        const scale = 1, cx = WORLD_SIZE / 2, cy = WORLD_SIZE / 2;
        await drawDistricts(ctx, scale, cx, cy, { alpha: 0.15, stroke: "#ffffff", lineWidth: 1, fill: "#ffffff" });
        if (WORLD_MAP_DRAW_WALLS) {
          await drawWalls(ctx, scale, cx, cy, { alpha: WORLD_MAP_WALL_ALPHA, strokeScale: WORLD_MAP_WALL_STROKE_SCALE, color: WORLD_MAP_WALL_COLOR });
        }
        await drawRoads(ctx, scale, cx, cy, { alpha: 0.9, wPrimary: 3, wSecondary: 2, wTertiary: 1.2 });
        drawRiver(ctx, scale, cx, cy);
      }
      worldMinimapCanvasRef.current = canvas;
    };
    buildWorldCanvas();
  }, []);
  useEffect(() => {
    let last = 0;
    let mounted = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastCanvasW = -1, lastCanvasH = -1;
    const render = async (ts = 0) => {
      if (!mounted) return;
      rafRef.current = requestAnimationFrame(render);
      if (ts - last < 1e3 / WORLD_MAP_UPDATE_FPS) return;
      last = ts;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = parent.clientWidth, h = parent.clientHeight;
      const needResize = canvas.width !== Math.max(1, Math.floor(w * dpr)) || canvas.height !== Math.max(1, Math.floor(h * dpr));
      if (needResize) {
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        lastCanvasW = canvas.width;
        lastCanvasH = canvas.height;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const worldCanvas = worldMinimapCanvasRef.current;
      const viewSize = MAP_VIEW_SIZE;
      const scaleBase = Math.min(w, h) / viewSize;
      const scale = scaleBase * zoom;
      const half = viewSize / 2;
      const px = playerPosition.x, pz = playerPosition.z;
      if (worldCanvas) {
        const sx = px + WORLD_SIZE / 2 - viewSize / zoom / 2;
        const sy = pz + WORLD_SIZE / 2 - viewSize / zoom / 2;
        ctx.drawImage(
          worldCanvas,
          sx,
          sy,
          viewSize / zoom,
          viewSize / zoom,
          (w - viewSize * scaleBase) / 2,
          (h - viewSize * scaleBase) / 2,
          viewSize * scaleBase,
          viewSize * scaleBase
        );
      } else {
        ctx.fillStyle = "#1b4332";
        ctx.fillRect((w - viewSize * scale) / 2, (h - viewSize * scale) / 2, viewSize * scale, viewSize * scale);
      }
      ctx.save();
      ctx.globalAlpha = GRID_ALPHA;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 0.5;
      const cell = viewSize * scale / 8;
      const left = (w - viewSize * scale) / 2, top = (h - viewSize * scale) / 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(left + i * cell, top);
        ctx.lineTo(left + i * cell, top + 8 * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(left, top + i * cell);
        ctx.lineTo(left + 8 * cell, top + i * cell);
        ctx.stroke();
      }
      ctx.restore();
      const cx = w / 2 - px * scale;
      const cy = h / 2 - pz * scale;
      await drawDistricts(ctx, scale, cx, cy, {
        alpha: 0.15,
        stroke: "#ffffff",
        lineWidth: 1,
        fill: "#ffffff"
      });
      if (WORLD_MAP_DRAW_WALLS) {
        await drawWalls(ctx, scale, cx, cy, {
          alpha: WORLD_MAP_WALL_ALPHA,
          strokeScale: WORLD_MAP_WALL_STROKE_SCALE,
          color: WORLD_MAP_WALL_COLOR
        });
      }
      await drawRoads(ctx, scale, cx, cy, {
        /* @tweakable primary road color on world map */
        primaryColor: "#e9d7b8",
        /* @tweakable secondary road color on world map */
        secondaryColor: "#c8b79d",
        /* @tweakable tertiary road color on world map */
        tertiaryColor: "#a89880",
        /* @tweakable road opacity on world map */
        alpha: 0.9,
        /* @tweakable primary road width (px) on world map */
        wPrimary: 3,
        /* @tweakable secondary road width (px) on world map */
        wSecondary: 2,
        /* @tweakable tertiary road width (px) on world map */
        wTertiary: 1.2
      });
      drawRiver(ctx, scale, cx, cy);
      ctx.save();
      ctx.globalAlpha = OBJ_DOT_ALPHA;
      const toCanvas = (x, z) => ({ x: w / 2 + (x - px) * scale, y: h / 2 + (z - pz) * scale });
      for (let i = 0; i < worldObjects.length; i++) {
        const o = worldObjects[i];
        const p = toCanvas(o.position.x, o.position.z);
        ctx.fillStyle = `#${o.color || "ffffff"}`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, OBJ_DOT_R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      const PLAYER_COLOR = "#ff4d4d";
      const PLAYER_R = 4;
      ctx.save();
      ctx.fillStyle = PLAYER_COLOR;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    rafRef.current = requestAnimationFrame(render);
    const onResize = () => {
    };
    window.addEventListener("resize", onResize);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [playerPosition.x, playerPosition.z, worldObjects.length, zoom]);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-95 border-2 border-yellow-600 rounded-lg p-6 w-96 h-96 text-white shadow-2xl", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold text-yellow-400", children: "World Map" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 158,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          { onClick: handleZoomOut, className: "px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded", children: "\u2013" },
          void 0,
          false
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          { onClick: handleZoomIn, className: "px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded", children: "+" },
          void 0,
          false
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "text-red-400 hover:text-red-300 text-xl font-bold",
            children: "\xD7"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 159,
            columnNumber: 9
          }
        )
      ] }, void 0, true)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 157,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative w-full h-64 bg-green-800 border-2 border-gray-600 rounded overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full pointer-events-none" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 168,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 opacity-30", children: [
        Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxDEV("div", { className: "absolute w-full border-t border-gray-400", style: { top: `${i * 10}%` } }, `h-${i}`, false, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 13
        })),
        Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxDEV("div", { className: "absolute h-full border-l border-gray-400", style: { left: `${i * 10}%` } }, `v-${i}`, false, {
          fileName: "<stdin>",
          lineNumber: 175,
          columnNumber: 13
        }))
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 170,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-2 right-2 text-xs", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          "X: ",
          playerPosition.x
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 180,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          "Z: ",
          playerPosition.z
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 181,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 179,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 166,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 156,
    columnNumber: 5
  });
};
export {
  WorldMapPanel
};

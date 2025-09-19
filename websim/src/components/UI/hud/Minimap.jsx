import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useMinimap } from "../../../hooks/useMinimap.js";
const Minimap = ({ playerRef, worldObjects, zoomRef, minimapSettings }) => {
  const opts = {
    size: minimapSettings?.size ?? 128,
    showGrid: minimapSettings?.showGrid ?? true
  };
  const {
    minimapState,
    minimapCanvasRef,
    posXRef,
    posZRef,
    zoomLevelRef,
    biomeRef,
    districtRef,
    roadRef
  } = useMinimap({ playerRef, worldObjects, zoomRef, options: opts });
  if (minimapSettings && minimapSettings.enabled === false) return null;
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        position: "absolute",
        right: "16px",
        top: "16px",
        width: `${minimapState.width}px`,
        opacity: minimapSettings?.opacity ?? 0.9
      },
      className: "z-10 flex flex-col shadow-2xl pointer-events-auto",
      children: [
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: { height: `${minimapState.height}px` },
            className: "bg-black bg-opacity-70 border-2 border-b-0 border-gray-600 rounded-t overflow-hidden relative",
            children: /* @__PURE__ */ jsxDEV("canvas", { ref: minimapCanvasRef, width: minimapState.width, height: minimapState.height, className: "w-full h-full" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 38,
              columnNumber: 17
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 34,
            columnNumber: 13
          }
        ),
        (minimapSettings?.showInfo ?? true) && /* @__PURE__ */ jsxDEV("div", { className: "bg-black bg-opacity-70 text-white p-2 rounded-b text-sm border-2 border-t-0 border-gray-600", children: [
          /* @__PURE__ */ jsxDEV("div", { ref: posXRef, children: "X: 0" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: posZRef, children: "Z: 0" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 45,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: zoomLevelRef, children: "Zoom Level: 1" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 46,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: biomeRef, children: "Biome: Unknown" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 47,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: districtRef, children: "District: Unknown" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 48,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { ref: roadRef, children: "Road: \u2013" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 49,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 43,
          columnNumber: 15
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 23,
      columnNumber: 9
    }
  );
};
export {
  Minimap
};

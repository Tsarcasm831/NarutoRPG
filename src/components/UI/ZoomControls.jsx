import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const ZoomControls = ({ onZoomIn, onZoomOut }) => /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center gap-2 mb-2", children: [
  /* @__PURE__ */ jsxDEV(
    "button",
    {
      onTouchStart: onZoomIn,
      onMouseDown: onZoomIn,
      className: "w-12 h-12 rounded-full border-2 bg-black/60 text-white border-gray-400 shadow-xl active:scale-95 transition-transform font-bold text-xl",
      "aria-label": "Zoom In",
      title: "Zoom In",
      children: "\uFF0B"
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 5,
      columnNumber: 5
    }
  ),
  /* @__PURE__ */ jsxDEV(
    "button",
    {
      onTouchStart: onZoomOut,
      onMouseDown: onZoomOut,
      className: "w-12 h-12 rounded-full border-2 bg-black/60 text-white border-gray-400 shadow-xl active:scale-95 transition-transform font-bold text-xl",
      "aria-label": "Zoom Out",
      title: "Zoom Out",
      children: "\uFF0D"
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 14,
      columnNumber: 5
    }
  )
] }, void 0, true, {
  fileName: "<stdin>",
  lineNumber: 4,
  columnNumber: 3
});
var stdin_default = ZoomControls;
export {
  stdin_default as default
};

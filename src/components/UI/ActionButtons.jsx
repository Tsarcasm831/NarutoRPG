import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const ActionButtons = ({
  holdRun,
  onRunDown,
  onRunUp,
  onInteract,
  onJump,
  onAttack,
  onDodge
}) => /* @__PURE__ */ jsxDEV(Fragment, { children: [
  /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onTouchStart: onRunDown,
        onTouchEnd: onRunUp,
        onMouseDown: onRunDown,
        onMouseUp: onRunUp,
        className: `w-16 h-16 rounded-full border-2 ${holdRun ? "bg-yellow-400 text-black border-yellow-300" : "bg-black/60 text-yellow-300 border-yellow-500"} shadow-xl active:scale-95 transition-transform font-bold`,
        "aria-label": "Run (hold)",
        children: "Run"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 14,
        columnNumber: 7
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onTouchStart: onInteract,
        onMouseDown: onInteract,
        className: "w-16 h-16 rounded-full border-2 bg-black/60 text-blue-300 border-blue-500 shadow-xl active:scale-95 transition-transform font-bold",
        "aria-label": "Interact",
        children: "F"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 24,
        columnNumber: 7
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 13,
    columnNumber: 5
  }),
  /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onTouchStart: onJump,
        onMouseDown: onJump,
        className: "w-16 h-16 rounded-full border-2 bg-black/60 text-green-300 border-green-500 shadow-xl active:scale-95 transition-transform font-bold",
        "aria-label": "Jump",
        children: "\u2934\uFE0E"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 7
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onTouchStart: onAttack,
        onMouseDown: onAttack,
        className: "w-20 h-20 rounded-full border-2 bg-black/70 text-red-300 border-red-500 shadow-2xl active:scale-95 transition-transform font-bold text-xl",
        "aria-label": "Attack",
        children: "\u2694\uFE0F"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 42,
        columnNumber: 7
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onTouchStart: onDodge,
        onMouseDown: onDodge,
        className: "w-16 h-16 rounded-full border-2 bg-black/60 text-purple-300 border-purple-500 shadow-xl active:scale-95 transition-transform font-bold",
        "aria-label": "Dodge",
        children: "\u21F2"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 50,
        columnNumber: 7
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 33,
    columnNumber: 5
  })
] }, void 0, true, {
  fileName: "<stdin>",
  lineNumber: 12,
  columnNumber: 3
});
var stdin_default = ActionButtons;
export {
  stdin_default as default
};

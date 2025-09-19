import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const PAUSE_TITLE = "Paused";
const PAUSE_RESUME_LABEL = "Resume";
const PAUSE_OPTIONS_LABEL = "Options";
const PAUSE_EXIT_LABEL = "Exit to Menu";
const PAUSE_BACKDROP_OPACITY = 0.6;
const PauseMenu = ({ onResume, onOptions, onExitToMenu }) => {
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-40 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "absolute inset-0",
        style: { background: `rgba(0,0,0,${PAUSE_BACKDROP_OPACITY})` },
        "aria-hidden": "true"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 17,
        columnNumber: 7
      }
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[360px]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "px-5 py-3 bg-gray-800 border-b border-gray-700 rounded-t-xl", children: /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold text-xl", children: PAUSE_TITLE }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 24,
        columnNumber: 11
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "p-5 flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onResume,
            className: "w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg shadow",
            children: PAUSE_RESUME_LABEL
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 27,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onOptions,
            className: "w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg shadow",
            children: PAUSE_OPTIONS_LABEL
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 33,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onExitToMenu,
            className: "w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg shadow",
            children: PAUSE_EXIT_LABEL
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 39,
            columnNumber: 11
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 22,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 16,
    columnNumber: 5
  });
};
var stdin_default = PauseMenu;
export {
  stdin_default as default
};

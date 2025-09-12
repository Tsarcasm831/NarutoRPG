import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const LoadingScreen = ({ progress }) => {
  return /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full relative", children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "absolute inset-0 bg-cover bg-center",
        style: { backgroundImage: "url('/loading1.png')" }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 7,
        columnNumber: 13
      }
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black bg-opacity-60" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative z-10 w-full h-full flex flex-col items-center justify-center text-white", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl font-bold text-yellow-400 mb-4", children: "Loading Game Assets..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 16,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-1/2 max-w-2xl bg-gray-700 rounded-full h-8 border-2 border-gray-600", children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "bg-yellow-500 h-full rounded-full text-center text-black font-bold leading-8 transition-all duration-500 ease-out",
          style: { width: `${progress}%` },
          children: [
            progress,
            "%"
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 18,
          columnNumber: 21
        }
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 17,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "mt-4 text-gray-200", children: "Please wait, this may take a moment." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-300 mt-2 opacity-80", children: "Tip: If performance is low, lower Render Scale in Settings." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 5,
    columnNumber: 9
  });
};
var stdin_default = LoadingScreen;
export {
  LoadingScreen,
  stdin_default as default
};

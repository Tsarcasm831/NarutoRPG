import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const PlayerInfo = ({ playerStats }) => /* @__PURE__ */ jsxDEV("div", { className: "bg-black bg-opacity-70 text-white p-4 rounded-lg", children: [
  /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-yellow-400 mb-2", children: playerStats.name }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 5,
    columnNumber: 9
  }),
  /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-sm", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsxDEV("span", { children: "HP:" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 8,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-20 bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "bg-red-500 h-2 rounded-full",
          style: { width: `${playerStats.health / playerStats.maxHealth * 100}%` }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 21
        }
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 9,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs", children: [
        playerStats.health,
        "/",
        playerStats.maxHealth
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsxDEV("span", { children: "Chakra:" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-20 bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "bg-blue-500 h-2 rounded-full",
          style: { width: `${playerStats.chakra / playerStats.maxChakra * 100}%` }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 20,
          columnNumber: 21
        }
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 19,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs", children: [
        playerStats.chakra,
        "/",
        playerStats.maxChakra
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 17,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-yellow-300", children: [
      "Level ",
      playerStats.level
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 27,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-yellow-300", children: [
      "Gold: ",
      playerStats.gold
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 6,
    columnNumber: 9
  })
] }, void 0, true, {
  fileName: "<stdin>",
  lineNumber: 4,
  columnNumber: 5
});
export {
  PlayerInfo
};

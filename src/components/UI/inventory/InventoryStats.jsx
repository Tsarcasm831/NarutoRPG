import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const InventoryStats = ({ inventory }) => {
  const weight = 127;
  const maxWeight = 200;
  const value = 2847;
  return /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 bg-opacity-70 border border-yellow-500 rounded-lg p-3", children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-yellow-300 mb-1", children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Weight:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 14,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("span", { children: [
          weight,
          "/",
          maxWeight
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 13,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-blue-500 h-2 rounded-full", style: { width: `${weight / maxWeight * 100}%` } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 17,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-yellow-300 mb-1", children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Value:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 23,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("span", { children: [
          value,
          " Gold"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 24,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 22,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400", children: "Total inventory worth" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 21,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-yellow-300 mb-1", children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Quality:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("span", { children: "Good" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 29,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400", children: "Average item condition" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 11,
    columnNumber: 11
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 10,
    columnNumber: 9
  });
};
export {
  InventoryStats
};

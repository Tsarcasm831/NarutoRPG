import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useRef } from "react";
import { getTextRarityColor, getDurabilityColor } from "./utils.js";
const ItemTooltip = ({ item, position }) => {
  const tooltipRef = useRef(null);
  if (!item) return null;
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      ref: tooltipRef,
      className: "fixed z-[60] bg-gray-900 border-2 border-yellow-500 rounded-lg p-3 max-w-xs shadow-2xl pointer-events-none",
      style: {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateY(-50%)"
      },
      children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", children: item.icon }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 20,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: `font-bold ${getTextRarityColor(item.rarity)}`, children: item.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 22,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-400 capitalize", children: [
              item.rarity || "Common",
              " ",
              item.type || "Item"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 23,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 21,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 19,
          columnNumber: 11
        }),
        item.description && /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-gray-300 italic border-t border-gray-600 pt-2", children: item.description }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 13
        }),
        item.stats && /* @__PURE__ */ jsxDEV("div", { className: "border-t border-gray-600 pt-2", children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-1 text-xs", children: Object.entries(item.stats).map(([stat, value]) => /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-gray-400 capitalize", children: [
            stat.replace("_", " "),
            ":"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("span", { className: "text-white", children: [
            "+",
            value
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 39,
            columnNumber: 21
          })
        ] }, stat, true, {
          fileName: "<stdin>",
          lineNumber: 37,
          columnNumber: 19
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 34,
          columnNumber: 13
        }),
        item.durability && /* @__PURE__ */ jsxDEV("div", { className: "border-t border-gray-600 pt-2", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs mb-1", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-gray-400", children: "Durability:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 49,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "text-white", children: [
              item.durability.current,
              "/",
              item.durability.max
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 50,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 48,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-1", children: /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: `h-1 rounded-full ${getDurabilityColor(item.durability.current, item.durability.max)}`,
              style: { width: `${item.durability.current / item.durability.max * 100}%` }
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 53,
              columnNumber: 17
            }
          ) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 52,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 47,
          columnNumber: 13
        }),
        item.effect && /* @__PURE__ */ jsxDEV("div", { className: "border-t border-gray-600 pt-2", children: /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-green-400", children: item.effect }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 63,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 62,
          columnNumber: 13
        }),
        item.count && item.count > 1 && /* @__PURE__ */ jsxDEV("div", { className: "border-t border-gray-600 pt-2", children: /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-400", children: [
          "Quantity: ",
          item.count
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 69,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 13
        }),
        item.type && (item.type === "health" || item.type === "chakra" || item.type === "special") && /* @__PURE__ */ jsxDEV("div", { className: "border-t border-gray-600 pt-2", children: /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-400 italic", children: "Right-click to use." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 75,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 74,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 9
      })
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 9,
      columnNumber: 7
    }
  );
};
export {
  ItemTooltip
};

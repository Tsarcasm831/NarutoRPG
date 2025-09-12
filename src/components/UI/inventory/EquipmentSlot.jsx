import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { getSlotRarityColor } from "./utils.js";
const EquipmentSlot = ({ slotName, item, position, size = "w-16 h-16", onMouseEnter, onMouseLeave, onDrop, onDragStart }) => /* @__PURE__ */ jsxDEV("div", { className: `${position} group`, children: /* @__PURE__ */ jsxDEV(
  "div",
  {
    className: `${size} bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${item ? getSlotRarityColor(item.rarity) : "border-gray-600"} rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-all duration-200 relative overflow-hidden`,
    onMouseEnter: (e) => onMouseEnter(item, e),
    onMouseLeave,
    onDrop: (e) => onDrop(e, "equipment", slotName),
    onDragOver: (e) => e.preventDefault(),
    children: [
      item ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            draggable: true,
            onDragStart: (e) => onDragStart(e, item, "equipment", slotName),
            className: "text-3xl cursor-move hover:scale-110 transition-transform duration-200 relative z-10",
            title: item.name,
            children: item.icon
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 17,
            columnNumber: 13
          }
        ),
        item.durability && item.durability.current < item.durability.max * 0.3 && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 26,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 16,
        columnNumber: 11
      }) : /* @__PURE__ */ jsxDEV("div", { className: "text-gray-500 text-xs text-center font-semibold uppercase tracking-wider", children: slotName }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 30,
        columnNumber: 11
      }),
      item && (item.rarity === "epic" || item.rarity === "legendary") && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-10 animate-pulse" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 11
      })
    ]
  },
  void 0,
  true,
  {
    fileName: "<stdin>",
    lineNumber: 6,
    columnNumber: 7
  }
) }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 5,
  columnNumber: 5
});
export {
  EquipmentSlot
};

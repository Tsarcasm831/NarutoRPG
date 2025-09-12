import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import PropTypes from "prop-types";
import { getSlotRarityColor } from "./utils.js";
const StorageSlotBase = ({ item, index, onMouseEnter, onMouseLeave, onDrop, onDragStart }) => /* @__PURE__ */ jsxDEV(
  "div",
  {
    className: `w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 border ${item ? `${getSlotRarityColor(item.rarity)} hover:border-yellow-400` : "border-gray-600 hover:border-gray-500"} rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 relative group`,
    onMouseEnter: (e) => onMouseEnter(item, e),
    onMouseLeave,
    onDrop: (e) => onDrop(e, "storage", index),
    onDragOver: (e) => e.preventDefault(),
    children: item ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          draggable: true,
          onDragStart: (e) => onDragStart(e, item, "storage", index),
          role: "button",
          tabIndex: 0,
          "aria-label": `${item?.name || "Item"} slot ${index + 1}. Drag to move`,
          className: "text-2xl cursor-move hover:scale-110 transition-transform duration-200 relative z-10",
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
            }
          },
          children: item.icon
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 16,
          columnNumber: 11
        }
      ),
      item.count > 1 && /* @__PURE__ */ jsxDEV("div", { className: "absolute -bottom-1 -right-1 bg-gray-900 text-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-yellow-600", children: item.count > 999 ? "999+" : item.count }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 24,
        columnNumber: 13
      }),
      item.rarity === "legendary" && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-br from-yellow-400 to-transparent opacity-20 rounded-md animate-pulse" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 9
    }) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full rounded-md bg-gradient-to-br from-gray-800 to-gray-900" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 9
    })
  },
  void 0,
  false,
  {
    fileName: "<stdin>",
    lineNumber: 5,
    columnNumber: 5
  }
);
StorageSlotBase.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    icon: PropTypes.node,
    rarity: PropTypes.string,
    count: PropTypes.number
  }),
  index: PropTypes.number.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func,
  onDrop: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired
};
const StorageSlot = React.memo(StorageSlotBase);
export {
  StorageSlot
};

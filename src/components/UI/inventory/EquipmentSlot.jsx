import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import { getSlotRarityColor } from "./utils.js";
const EquipmentSlot = ({
  slotName,
  item,
  position,
  size = "w-16 h-16",
  onMouseEnter,
  onMouseLeave,
  onDrop,
  onDragStart,
  onDragOver,
  onDragLeave,
  canDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const isInvalidTarget = isDragOver && canDrop === false;
  const borderColorClass = isInvalidTarget ? "border-red-500" : item ? getSlotRarityColor(item.rarity) : "border-gray-600";
  const invalidDropClasses = isInvalidTarget ? "invalid-drop-shake" : "";
  const invalidDropStyle = isInvalidTarget ? { boxShadow: "0 0 14px rgba(248, 113, 113, 0.55)" } : void 0;
  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
    if (onDragOver) {
      onDragOver(e);
    }
  };
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsDragOver(false);
    if (onDragLeave) {
      onDragLeave(e);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, "equipment", slotName);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: `${position} group`, children: /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: `${size} bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${borderColorClass} ${invalidDropClasses} rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-all duration-200 relative overflow-hidden`,
      style: invalidDropStyle,
      onMouseEnter: (e) => onMouseEnter(item, e),
      onMouseLeave,
      onDrop: handleDrop,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
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
              lineNumber: 45,
              columnNumber: 13
            }
          ),
          item.durability && item.durability.current < item.durability.max * 0.3 && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 54,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 44,
          columnNumber: 11
        }) : /* @__PURE__ */ jsxDEV("div", { className: "text-gray-500 text-xs text-center font-semibold uppercase tracking-wider", children: slotName }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 58,
          columnNumber: 11
        }),
        item && (item.rarity === "epic" || item.rarity === "legendary") && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-10 animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 65,
          columnNumber: 11
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 36,
      columnNumber: 7
    }
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 35,
    columnNumber: 5
  });
};
export {
  EquipmentSlot
};

import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { EquipmentSlot } from "./inventory/EquipmentSlot.jsx";
import { PotionSlot } from "./inventory/PotionSlot.jsx";
import { StorageSlot } from "./inventory/StorageSlot.jsx";
import { ItemTooltip } from "./inventory/ItemTooltip.jsx";
import { DraggedItemCursor } from "./inventory/DraggedItemCursor.jsx";
import { InventoryStats } from "./inventory/InventoryStats.jsx";
const validItemTypesForSlot = {
  helmet: ["helmet"],
  armor: ["armor"],
  weapon: ["weapon"],
  shield: ["shield"],
  gloves: ["gloves"],
  boots: ["boots"],
  ring1: ["ring"],
  ring2: ["ring"],
  amulet: ["amulet"]
};
const InventoryPanel = ({ inventory, setInventory, onClose }) => {
  const [draggedItemInfo, setDraggedItemInfo] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [canDrop, setCanDrop] = useState(true);
  const handleDragStart = (e, item, source, slot) => {
    setDraggedItemInfo({ item, source, slot });
    e.dataTransfer.effectAllowed = "move";
    const emptyImage = new Image();
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
  };
  const handleDragOver = (e, destination, slot) => {
    e.preventDefault();
    if (!draggedItemInfo) return;
    const { item: draggedItem } = draggedItemInfo;
    let isDropAllowed = true;
    if (destination === "equipment") {
      const targetSlotType = validItemTypesForSlot[slot];
      const draggedItemType = draggedItem.slot;
      if (!targetSlotType.includes(draggedItemType)) {
        isDropAllowed = false;
      }
    }
    setCanDrop(isDropAllowed);
  };
  const handleDrop = (e, destination, slot) => {
    e.preventDefault();
    setCanDrop(true);
    if (!draggedItemInfo) return;
    const { item: draggedItem, source: fromSource, slot: fromSlot } = draggedItemInfo;
    if (fromSource === destination && fromSlot === slot) {
      setDraggedItemInfo(null);
      return;
    }
    const newInventory = JSON.parse(JSON.stringify(inventory));
    let itemAtTarget = null;
    if (destination === "equipment") {
      itemAtTarget = newInventory.equipment[slot];
    } else if (destination === "storage") {
      itemAtTarget = newInventory.storage[slot];
    }
    if (destination === "equipment") {
      const requiredType = validItemTypesForSlot[slot];
      if (!requiredType.includes(draggedItem.slot)) {
        setDraggedItemInfo(null);
        return;
      }
    }
    if (itemAtTarget && fromSource === "equipment") {
      const requiredTypeForOriginSlot = validItemTypesForSlot[fromSlot];
      if (!requiredTypeForOriginSlot.includes(itemAtTarget.slot)) {
        setDraggedItemInfo(null);
        return;
      }
    }
    if (fromSource === "equipment") {
      newInventory.equipment[fromSlot] = null;
    } else if (fromSource === "storage") {
      newInventory.storage[fromSlot] = null;
    }
    if (itemAtTarget) {
      if (fromSource === "equipment") {
        newInventory.equipment[fromSlot] = itemAtTarget;
      } else if (fromSource === "storage") {
        newInventory.storage[fromSlot] = itemAtTarget;
      }
    }
    if (destination === "equipment") {
      newInventory.equipment[slot] = draggedItem;
    } else if (destination === "storage") {
      newInventory.storage[slot] = draggedItem;
    }
    setInventory(newInventory);
    setDraggedItemInfo(null);
  };
  const onItemUse = (potion) => {
    console.log("Using potion:", potion.name);
    const newInventory = JSON.parse(JSON.stringify(inventory));
    const potionIndex = newInventory.potions.findIndex((p) => p.id === potion.id);
    if (potionIndex !== -1) {
      newInventory.potions[potionIndex].count--;
      if (newInventory.potions[potionIndex].count <= 0) {
        newInventory.potions.splice(potionIndex, 1);
      }
      setInventory(newInventory);
    }
  };
  const handleMouseEnter = (item, event) => {
    if (item) {
      setHoveredItem(item);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 10,
        y: rect.top
      });
    }
  };
  const handleMouseLeave = () => {
    setHoveredItem(null);
    setCanDrop(true);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm", children: /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 border-4 border-yellow-500 rounded-xl shadow-2xl relative overflow-hidden flex flex-col",
      style: { width: "min(1000px, 95vw)", height: "min(750px, 95vh)" },
      children: [
        /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-yellow-300 rounded-tl-lg" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 163,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-yellow-300 rounded-tr-lg" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 164,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-yellow-300 rounded-bl-lg" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 165,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-yellow-300 rounded-br-lg" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 166,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-6 border-b-2 border-yellow-600 flex-shrink-0", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-3xl font-bold text-yellow-200 font-serif tracking-wider drop-shadow-lg", children: "INVENTORY" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 170,
            columnNumber: 11
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: onClose,
              className: "text-red-400 hover:text-red-300 text-3xl font-bold bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center border-2 border-red-500 hover:border-red-400 transition-all duration-200",
              children: "\u2715"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 173,
              columnNumber: 11
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 169,
          columnNumber: 9
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "flex p-6 gap-6 flex-1 overflow-y-auto", onDragOver: (e) => {
          e.preventDefault();
          setCanDrop(false);
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-80 space-y-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-900 bg-opacity-40 border-2 border-yellow-600 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-yellow-300 font-bold text-lg mb-4 text-center", children: "EQUIPMENT" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 188,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "relative h-72", children: [
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "helmet",
                    item: inventory.equipment.helmet,
                    position: "absolute top-0 left-1/2 transform -translate-x-1/2",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "helmet")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 192,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "weapon",
                    item: inventory.equipment.weapon,
                    position: "absolute top-20 left-4",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "weapon")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 198,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "shield",
                    item: inventory.equipment.shield,
                    position: "absolute top-20 right-4",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "shield")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 202,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "armor",
                    item: inventory.equipment.armor,
                    position: "absolute top-20 left-1/2 transform -translate-x-1/2",
                    size: "w-20 h-20",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "armor")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 208,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "gloves",
                    item: inventory.equipment.gloves,
                    position: "absolute top-44 left-4",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "gloves")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 214,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "boots",
                    item: inventory.equipment.boots,
                    position: "absolute top-44 right-4",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "boots")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 218,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "ring1",
                    item: inventory.equipment.ring1,
                    position: "absolute top-44 left-20",
                    size: "w-12 h-12",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "ring1")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 224,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "ring2",
                    item: inventory.equipment.ring2,
                    position: "absolute top-44 right-20",
                    size: "w-12 h-12",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "ring2")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 228,
                    columnNumber: 17
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  EquipmentSlot,
                  {
                    slotName: "amulet",
                    item: inventory.equipment.amulet,
                    position: "absolute bottom-0 left-1/2 transform -translate-x-1/2",
                    size: "w-14 h-14",
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                    onDrop: handleDrop,
                    onDragStart: handleDragStart,
                    onDragOver: (e) => handleDragOver(e, "equipment", "amulet")
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 234,
                    columnNumber: 17
                  }
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 189,
                columnNumber: 15
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 187,
              columnNumber: 13
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-900 bg-opacity-40 border-2 border-yellow-600 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-yellow-300 font-bold text-lg mb-3 text-center", children: "POTIONS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 243,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-2", children: inventory.potions.map((potion, index) => /* @__PURE__ */ jsxDEV(PotionSlot, { potion, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onItemUse }, potion.id, false, {
                fileName: "<stdin>",
                lineNumber: 246,
                columnNumber: 19
              })) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 244,
                columnNumber: 15
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 242,
              columnNumber: 13
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 184,
            columnNumber: 11
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "flex-1 bg-gray-900 bg-opacity-40 border-2 border-yellow-600 rounded-lg p-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-yellow-300 font-bold text-lg", children: "STORAGE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 255,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-300", children: [
                inventory.storage.filter((item) => item !== null).length,
                "/",
                inventory.storage.length,
                " slots"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 256,
                columnNumber: 15
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 254,
              columnNumber: 13
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-8 gap-2 mb-4", style: { height: "380px", alignContent: "start" }, onDragOver: (e) => handleDragOver(e, "storage", null), children: inventory.storage.map((item, index) => /* @__PURE__ */ jsxDEV(StorageSlot, { item, index, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onDrop: handleDrop, onDragStart: handleDragStart }, index, false, {
              fileName: "<stdin>",
              lineNumber: 263,
              columnNumber: 17
            })) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 261,
              columnNumber: 13
            }),
            /* @__PURE__ */ jsxDEV(InventoryStats, { inventory }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 268,
              columnNumber: 13
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 253,
            columnNumber: 11
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 181,
          columnNumber: 9
        }),
        hoveredItem && /* @__PURE__ */ jsxDEV(ItemTooltip, { item: hoveredItem, position: tooltipPosition }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 273,
          columnNumber: 25
        }),
        draggedItemInfo && /* @__PURE__ */ jsxDEV(DraggedItemCursor, { item: draggedItemInfo.item, canDrop }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 276,
          columnNumber: 29
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 159,
      columnNumber: 7
    }
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 158,
    columnNumber: 5
  });
};
var stdin_default = InventoryPanel;
export {
  InventoryPanel,
  stdin_default as default
};

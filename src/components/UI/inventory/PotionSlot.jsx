import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import PropTypes from "prop-types";
const PotionSlotBase = ({ potion, onMouseEnter, onMouseLeave, onItemUse }) => /* @__PURE__ */ jsxDEV(
  "div",
  {
    className: "relative group",
    onMouseEnter: (e) => onMouseEnter(potion, e),
    onMouseLeave,
    onContextMenu: (e) => {
      e.preventDefault();
      onItemUse(potion);
    },
    children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          role: "button",
          tabIndex: 0,
          "aria-label": `Potion ${potion?.type || ""} (${potion?.color || ""}). Right-click to use`,
          className: "w-14 h-18 bg-gradient-to-b from-gray-700 to-gray-800 border-2 border-yellow-600 rounded-lg flex flex-col items-center justify-end cursor-pointer hover:border-yellow-400 transition-all duration-200 relative overflow-hidden",
          onClick: () => console.log("Left-click on potion. Hint: Right-click to use."),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onItemUse(potion);
            }
          },
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: `w-10 h-14 rounded-b-full border border-gray-600 ${potion.color === "red" ? "bg-gradient-to-b from-red-400 to-red-600" : potion.color === "blue" ? "bg-gradient-to-b from-blue-400 to-blue-600" : "bg-gradient-to-b from-purple-400 to-purple-600"} mb-1 shadow-inner`, children: /* @__PURE__ */ jsxDEV("div", { className: `w-8 h-2 mx-auto mt-1 rounded-full ${potion.color === "red" ? "bg-red-300" : potion.color === "blue" ? "bg-blue-300" : "bg-purple-300"} opacity-70` }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 19,
              columnNumber: 11
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 14,
              columnNumber: 9
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "w-6 h-1 bg-amber-700 rounded-full -mt-1 border border-amber-800" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 27,
              columnNumber: 9
            })
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 7
        }
      ),
      potion.count > 0 && /* @__PURE__ */ jsxDEV("div", { className: "absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-yellow-300 shadow-lg", children: potion.count }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 9
      }),
      potion.type === "special" && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 animate-pulse", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-ping" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 39,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-2 left-1 w-1 h-1 bg-white rounded-full animate-ping", style: { animationDelay: "0.5s" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 40,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 38,
        columnNumber: 9
      })
    ]
  },
  void 0,
  true,
  {
    fileName: "<stdin>",
    lineNumber: 4,
    columnNumber: 5
  }
);
PotionSlotBase.propTypes = {
  potion: PropTypes.shape({
    type: PropTypes.string,
    color: PropTypes.string,
    count: PropTypes.number
  }).isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func,
  onItemUse: PropTypes.func.isRequired
};
const PotionSlot = React.memo(PotionSlotBase);
export {
  PotionSlot
};

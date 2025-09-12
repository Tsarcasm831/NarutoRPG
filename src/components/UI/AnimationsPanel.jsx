import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { playAnimation } from "../../game/player/animations.js";
const AnimationsPanel = ({ playerRef, onClose }) => {
  const [query, setQuery] = useState("");
  const [looping, setLooping] = useState(false);
  const animations = useMemo(() => {
    const player = playerRef?.current;
    if (!player || !player.userData || !player.userData.animations) return [];
    return Object.keys(player.userData.animations).sort();
  }, [playerRef]);
  const filtered = useMemo(() => {
    if (!query) return animations;
    const q = query.toLowerCase();
    return animations.filter((name) => name.toLowerCase().includes(q));
  }, [animations, query]);
  const handlePlay = (name) => {
    const player = playerRef?.current;
    if (!player) return;
    if (looping && player.userData.animations[name]) {
      try {
        const action = player.userData.animations[name];
        action.setLoop(THREE.LoopRepeat);
      } catch (_) {
      }
    }
    playAnimation(player, name);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black bg-opacity-60", onClick: onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden w-[70vw] h-[70vh] flex flex-col", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold text-xl", children: "Player Animations" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 39,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "text-red-400 hover:text-red-300 text-2xl font-bold w-8 h-8 flex items-center justify-center",
            "aria-label": "Close animations list",
            title: "Close",
            children: "\xD7"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 40,
            columnNumber: 11
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 38,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "px-5 py-3 bg-gray-850 border-b border-gray-700 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "Search animations...",
            className: "px-3 py-2 rounded bg-gray-800 border border-gray-600 w-72 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 52,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: looping,
              onChange: (e) => setLooping(e.target.checked),
              className: "form-checkbox h-4 w-4 text-yellow-500 bg-gray-700 border-gray-500 rounded focus:ring-yellow-500"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 60,
              columnNumber: 13
            }
          ),
          "Loop preview"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 59,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400 ml-auto", children: "Tip: Press B to toggle this panel." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 51,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [
        filtered.map((name) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => handlePlay(name),
            className: "text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500 rounded-lg px-3 py-2 transition-all duration-150",
            title: name,
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "text-yellow-300 font-semibold truncate", children: name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 82,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: "Click to play" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 83,
                columnNumber: 15
              })
            ]
          },
          name,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 76,
            columnNumber: 13
          }
        )),
        filtered.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "col-span-full text-center text-gray-400", children: "No animations found." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 74,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 36,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 34,
    columnNumber: 5
  });
};
var stdin_default = AnimationsPanel;
export {
  stdin_default as default
};

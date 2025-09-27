import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";

// Simple two-portrait dialog modal used for NPC interactions
// Props: { onClose, npcName, npcImage, playerName, playerImage, lines }
// lines: array of { speaker: 'npc' | 'player', text: string }
const NpcInteractionModal = ({ onClose, npcName, npcImage, playerName, playerImage, lines = [] }) => {
  const [index, setIndex] = React.useState(0);
  const current = lines[index] || null;

  const advance = () => {
    if (index + 1 < lines.length) setIndex(index + 1);
    else onClose?.();
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.code === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, lines.length, onClose]);

  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000]", children: /* @__PURE__ */ jsxDEV("div", { className: "relative w-[95vw] max-w-[980px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-6 text-white", children: [
    /* @__PURE__ */ jsxDEV("button", { onClick: onClose, className: "absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded", children: "Close" }, void 0, false, { fileName: "<stdin>", lineNumber: 24, columnNumber: 5 }),
    /* Header: portraits + names */
    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-4", children: [
      /* Left: NPC */
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("img", { src: npcImage, alt: npcName, className: "w-32 h-32 object-contain rounded-md border border-gray-700 bg-black/30" }, void 0, false, { fileName: "<stdin>", lineNumber: 28, columnNumber: 9 }),
        /* @__PURE__ */ jsxDEV("div", { className: "text-xl font-semibold", children: npcName || "NPC" }, void 0, false, { fileName: "<stdin>", lineNumber: 29, columnNumber: 9 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 27, columnNumber: 7 }),
      /* Right: Player */
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4 justify-end", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-right text-xl font-semibold", children: playerName || "You" }, void 0, false, { fileName: "<stdin>", lineNumber: 32, columnNumber: 9 }),
        /* @__PURE__ */ jsxDEV("img", { src: playerImage, alt: playerName, className: "w-32 h-32 object-contain rounded-md border border-gray-700 bg-black/30" }, void 0, false, { fileName: "<stdin>", lineNumber: 33, columnNumber: 9 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 31, columnNumber: 7 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 26, columnNumber: 5 }),
    /* Body: dialog bubble */
    /* @__PURE__ */ jsxDEV("div", { className: "min-h-[180px] bg-gray-800 border border-gray-700 rounded-md p-5 text-base leading-relaxed", children: current ? /* @__PURE__ */ jsxDEV("div", { className: (current.speaker === 'npc' ? "text-left" : "text-right") + " whitespace-pre-line", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-amber-400 text-sm mb-1", children: current.speaker === 'npc' ? npcName || "NPC" : playerName || "You" }, void 0, false, { fileName: "<stdin>", lineNumber: 40, columnNumber: 9 }),
      /* @__PURE__ */ jsxDEV("div", { children: current.text }, void 0, false, { fileName: "<stdin>", lineNumber: 41, columnNumber: 9 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 39, columnNumber: 7 }) : /* @__PURE__ */ jsxDEV("div", { className: "text-gray-400", children: "..." }, void 0, false, { fileName: "<stdin>", lineNumber: 43, columnNumber: 7 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 38, columnNumber: 5 }),
    /* Controls */
    /* @__PURE__ */ jsxDEV("div", { className: "mt-5 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400", children: "Enter/Space: Next \u2022 Esc: Close" }, void 0, false, { fileName: "<stdin>", lineNumber: 47, columnNumber: 7 }),
      /* @__PURE__ */ jsxDEV("button", { onClick: advance, className: "bg-amber-600 hover:bg-amber-500 text-white px-4 py-1 rounded", children: index + 1 < lines.length ? "Next" : "Close" }, void 0, false, { fileName: "<stdin>", lineNumber: 48, columnNumber: 7 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 46, columnNumber: 5 })
  ] }, void 0, true, { fileName: "<stdin>", lineNumber: 23, columnNumber: 3 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 22, columnNumber: 1 });
};

var stdin_default = NpcInteractionModal;
export {
  stdin_default as default
};

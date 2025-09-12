import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const KitbashBuildingModal = ({ onClose, details }) => {
  const name = details?.name || "Kitbash Building";
  const palette = details?.palette || "custom";
  return /* @__PURE__ */ jsxDEV("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  }, children: /* @__PURE__ */ jsxDEV("div", { style: {
    width: 420,
    maxWidth: "90vw",
    background: "#0b0b0b",
    color: "#e5e7eb",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    position: "relative"
  }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: 18, fontWeight: 600 }, children: name }, void 0, false, { fileName: "<stdin>", lineNumber: 24, columnNumber: 9 }),
      /* @__PURE__ */ jsxDEV("button", { onClick: onClose, style: { background: "#111", color: "#fff", border: "1px solid #555", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }, children: "Close" }, void 0, false, { fileName: "<stdin>", lineNumber: 25, columnNumber: 9 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 23, columnNumber: 7 }),
    /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 14, lineHeight: 1.5 }, children: [
      /* @__PURE__ */ jsxDEV("p", { children: "You discover a distinct, kitbashed structure." }, void 0, false, { fileName: "<stdin>", lineNumber: 28, columnNumber: 9 }),
      /* @__PURE__ */ jsxDEV("p", { children: ["Palette: ", /* @__PURE__ */ jsxDEV("strong", { children: palette }, void 0, false, { fileName: "<stdin>", lineNumber: 29, columnNumber: 22 })] }, void 0, true, { fileName: "<stdin>", lineNumber: 29, columnNumber: 9 }),
      /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }, children: [
        /* @__PURE__ */ jsxDEV("button", { style: { background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", padding: "8px 10px", borderRadius: 6, cursor: "pointer", textAlign: "left" }, onClick: () => alert("Inspecting architecture..."), children: "Inspect Architecture" }, void 0, false, { fileName: "<stdin>", lineNumber: 31, columnNumber: 11 }),
        /* @__PURE__ */ jsxDEV("button", { style: { background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", padding: "8px 10px", borderRadius: 6, cursor: "pointer", textAlign: "left" }, onClick: () => alert("Talk to local..."), children: "Talk to Local" }, void 0, false, { fileName: "<stdin>", lineNumber: 32, columnNumber: 11 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 30, columnNumber: 9 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 27, columnNumber: 7 })
  ] }, void 0, true, { fileName: "<stdin>", lineNumber: 14, columnNumber: 5 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 8, columnNumber: 3 });
};
var stdin_default = KitbashBuildingModal;
export {
  stdin_default as default
};

import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const HokageOfficeModal = ({ onClose }) => {
  const [showInterior, setShowInterior] = React.useState(false);
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === "openHokageInterior") setShowInterior(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  }, children: /* @__PURE__ */ jsxDEV("div", { style: {
    width: "99vw",
    height: "99vh",
    background: "#000",
    position: "relative",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    border: "1px solid #333"
  }, children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        onClick: onClose,
        style: {
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1001,
          background: "#000",
          color: "#fff",
          border: "1px solid #666",
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer"
        },
        "aria-label": "Close Hokage Office",
        children: "Close"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 22,
        columnNumber: 9
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "iframe",
      {
        title: "Hokage Office Top Floor",
        src: "./hokage/office_top_floor/index.html",
        style: { width: "100%", height: "100%", border: "none" }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 9
      }
    ),
    showInterior && /* @__PURE__ */ jsxDEV("div", { style: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1002, background: "rgba(0,0,0,0.85)" }, children: /* @__PURE__ */ jsxDEV("div", { style: { width: "99vw", height: "99vh", background: "#000", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.6)", border: "1px solid #333" }, children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setShowInterior(false),
          style: { position: "absolute", top: 12, right: 12, zIndex: 1003, background: "#000", color: "#fff", border: "1px solid #666", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
          "aria-label": "Close Hokage Office Interior",
          children: "Close"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 41,
          columnNumber: 15
        }
      ),
      /* @__PURE__ */ jsxDEV("iframe", { title: "Hokage Office Interior", src: "./hokage/office_interior/index.html", style: { width: "100%", height: "100%", border: "none" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 46,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 40,
      columnNumber: 13
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 11
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 18,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 14,
    columnNumber: 5
  });
};
var stdin_default = HokageOfficeModal;
export {
  stdin_default as default
};

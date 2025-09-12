import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const Label = ({ children }) => /* @__PURE__ */ jsxDEV("label", { className: "text-sm text-gray-200", children }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 3,
  columnNumber: 33
});
const Row = ({ children }) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2", children }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 4,
  columnNumber: 31
});
const Select = (props) => /* @__PURE__ */ jsxDEV("select", { ...props, className: "bg-black/60 border border-gray-600 text-white px-2 py-1 rounded ml-3" }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 5,
  columnNumber: 27
});
const Input = (props) => /* @__PURE__ */ jsxDEV("input", { ...props, className: "bg-black/60 border border-gray-600 text-white px-2 py-1 rounded ml-3 w-24" }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 6,
  columnNumber: 26
});
function SettingsPanel({ settings, setSettings, onClose }) {
  const s = settings || {};
  const mm = s.minimap || {};
  const update = (patch) => setSettings({ ...s, ...patch });
  const updateMM = (patch) => update({ minimap: { ...mm, ...patch } });
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/60", onClick: onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 16,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "relative w-full max-w-xl bg-black text-white border border-gray-700 rounded-xl shadow-2xl p-6", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold", children: "Settings" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 19,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: onClose, className: "px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-gray-600", children: "Close" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 20,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("section", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-md font-semibold mb-2 text-gray-300", children: "Graphics" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 25,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Shadows" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 27,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!s.shadows, onChange: (e) => update({ shadows: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 28,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 26,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Shadow Quality" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 31,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(Select, { value: s.shadowQuality || "low", onChange: (e) => update({ shadowQuality: e.target.value }), children: [
              /* @__PURE__ */ jsxDEV("option", { value: "low", children: "Low" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 33,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "medium", children: "Medium" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 34,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "high", children: "High" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 35,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 32,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 30,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Antialiasing" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 39,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!s.antialiasing, onChange: (e) => update({ antialiasing: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 40,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "World Grid" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 43,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!s.grid, onChange: (e) => update({ grid: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 44,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 42,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Object Density" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 47,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(Select, { value: s.objectDensity || "medium", onChange: (e) => update({ objectDensity: e.target.value }), children: [
              /* @__PURE__ */ jsxDEV("option", { value: "low", children: "Low" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 49,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "medium", children: "Medium" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 50,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "high", children: "High" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 51,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 48,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 46,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "FPS Limit" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 55,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(Select, { value: s.fpsLimit || "60 FPS", onChange: (e) => update({ fpsLimit: e.target.value }), children: [
              /* @__PURE__ */ jsxDEV("option", { value: "30 FPS", children: "30 FPS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 57,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "60 FPS", children: "60 FPS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 58,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "120 FPS", children: "120 FPS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 59,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("option", { value: "Unlimited", children: "Unlimited" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 60,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 56,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 54,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Render Scale" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 64,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(
              Input,
              {
                type: "number",
                step: "0.1",
                min: "0.5",
                max: "2",
                value: s.maxPixelRatio ?? 1,
                onChange: (e) => update({ maxPixelRatio: Math.max(0.5, Math.min(2, parseFloat(e.target.value) || 1)) })
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 65,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 63,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 24,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("section", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-md font-semibold mb-2 text-gray-300", children: "Minimap" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 71,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Enabled" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 73,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!mm.enabled, onChange: (e) => updateMM({ enabled: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 74,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 72,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Show Grid" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 77,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!mm.showGrid, onChange: (e) => updateMM({ showGrid: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 78,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 76,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Show Info" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 81,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: !!mm.showInfo, onChange: (e) => updateMM({ showInfo: e.target.checked }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 82,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 80,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Opacity" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 85,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(
              Input,
              {
                type: "range",
                min: "0.4",
                max: "1",
                step: "0.05",
                value: mm.opacity ?? 0.9,
                onChange: (e) => updateMM({ opacity: parseFloat(e.target.value) })
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 86,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 84,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(Row, { children: [
            /* @__PURE__ */ jsxDEV(Label, { children: "Size" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 90,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(
              Input,
              {
                type: "number",
                min: "64",
                max: "256",
                step: "16",
                value: mm.size ?? 128,
                onChange: (e) => updateMM({ size: Math.max(64, Math.min(256, parseInt(e.target.value) || 128)) })
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 91,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 89,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 70,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 17,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 15,
    columnNumber: 5
  }, this);
}
export {
  SettingsPanel as default
};

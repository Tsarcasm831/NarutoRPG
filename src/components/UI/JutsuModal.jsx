import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const JutsuModal = ({ onClose }) => {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("./src/components/json/jutsu_flat.json");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.items || [];
        setItems(arr);
      } catch (e) {
        console.warn("Failed to load jutsu list", e);
        setItems([]);
      }
    })();
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl w-[90vw] max-w-[600px] max-h-[80vh] overflow-y-auto text-white relative p-6", children: [
    /* @__PURE__ */ jsxDEV("button", { onClick: onClose, className: "absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded", "aria-label": "Close Jutsu Modal", children: "Close" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 7,
      columnNumber: 11
    }),
    /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-bold mb-4 text-center", children: "Jutsu List" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 8,
      columnNumber: 11
    }),
    /* @__PURE__ */ jsxDEV("ul", { className: "space-y-2", children: items.map((name, idx) => /* @__PURE__ */ jsxDEV("li", { className: "border-b border-gray-700 pb-1", children: name }, idx, false, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 15
    })) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 9,
      columnNumber: 11
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 6,
    columnNumber: 9
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 5,
    columnNumber: 7
  });
};
var stdin_default = JutsuModal;
export {
  stdin_default as default
};

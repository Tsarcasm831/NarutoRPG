var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
class ErrorBoundary extends React.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { hasError: false, error: null });
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("UI ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) return /* @__PURE__ */ jsxDEV("div", { style: { padding: 16, background: "#111", color: "#fff", border: "2px solid #b91c1c", borderRadius: 8 }, children: "Something went wrong." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 8,
      columnNumber: 37
    }, this);
    return this.props.children;
  }
}
var stdin_default = ErrorBoundary;
export {
  stdin_default as default
};

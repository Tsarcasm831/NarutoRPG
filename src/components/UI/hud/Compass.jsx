import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useRef, useState } from "react";
const Compass = ({ playerRef }) => {
  const rafRef = useRef(null);
  const [bearingDeg, setBearingDeg] = useState(0);
  const [dir, setDir] = useState("N");
  const bearingToLabel = (deg) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const idx = Math.round(deg % 360 / 45) % 8;
    return dirs[(idx + 8) % 8];
  };
  useEffect(() => {
    const update = () => {
      if (playerRef?.current?.userData?.model) {
        const yaw = playerRef.current.userData.model.rotation.y || 0;
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        let deg = Math.atan2(fx, -fz) * 180 / Math.PI;
        if (deg < 0) deg += 360;
        setBearingDeg(deg);
        setDir(bearingToLabel(deg));
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerRef]);
  return /* @__PURE__ */ jsxDEV("div", { className: "absolute top-4 left-1/2 -translate-x-1/2 z-10", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "relative w-28 h-28 rounded-full bg-black bg-opacity-60 border-2 border-gray-600 shadow-2xl", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 left-1/2 -translate-x-1/2 text-red-400 font-bold", children: "N" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-1 left-1/2 -translate-x-1/2 text-yellow-300 font-semibold", children: "S" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1/2 -translate-y-1/2 left-1 text-yellow-300 font-semibold", children: "W" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 45,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1/2 -translate-y-1/2 right-1 text-yellow-300 font-semibold", children: "E" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 46,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "absolute inset-0 flex items-center justify-center",
          "aria-label": `Compass bearing ${Math.round(bearingDeg)} degrees (${dir})`,
          title: `Bearing: ${Math.round(bearingDeg)}\xB0 (${dir})`,
          children: /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: "relative",
              style: { transform: `rotate(${bearingDeg}deg)` },
              children: [
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "mx-auto",
                    style: {
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: "36px solid #f59e0b"
                      // amber-500
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 59,
                    columnNumber: 15
                  }
                ),
                /* @__PURE__ */ jsxDEV("div", { className: "w-1 h-6 bg-amber-700 opacity-80 mx-auto -mt-1 rounded-b" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 70,
                  columnNumber: 15
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 54,
              columnNumber: 13
            }
          )
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 49,
          columnNumber: 11
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 41,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "mt-2 px-2 py-1 rounded bg-black bg-opacity-70 border border-gray-600 text-white text-xs font-mono", children: [
      dir,
      " \u2022 ",
      Math.round(bearingDeg),
      "\xB0"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 76,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "mt-1 text-[10px] text-gray-300 opacity-70", children: "(-z=N \u2022 +z=S \u2022 -x=W \u2022 +x=E)" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 81,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 39,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 38,
    columnNumber: 5
  });
};
var stdin_default = Compass;
export {
  Compass,
  stdin_default as default
};

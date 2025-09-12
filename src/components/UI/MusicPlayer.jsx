import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useState } from "react";
import { musicSubscribe, musicToggle, musicNext, musicPrev, musicState, musicPlay, musicSetVolume } from "/src/utils/musicManager.js";
const MusicPlayer = () => {
  const [state, setState] = useState(() => musicState());
  const [now, setNow] = useState({ currentTime: 0, duration: 0 });
  useEffect(() => {
    const unsub = musicSubscribe((s) => {
      setState(s);
      setNow({ currentTime: s.currentTime || 0, duration: s.duration || 0 });
    });
    const id = setInterval(() => {
      const s = musicState();
      setNow({ currentTime: s.currentTime || 0, duration: s.duration || 0 });
    }, 500);
    return () => {
      unsub?.();
      clearInterval(id);
    };
  }, []);
  const format = (t) => {
    if (!t || !Number.isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const pct = now.duration > 0 ? Math.min(100, Math.max(0, now.currentTime / now.duration * 100)) : 0;
  const blocked = state.ready && !state.isPlaying && now.currentTime === 0;
  return /* @__PURE__ */ jsxDEV("div", { className: "pointer-events-auto select-none fixed bottom-4 left-4 z-40", children: [
    /* container */
    /* @__PURE__ */ jsxDEV("div", { className: "bg-black/70 backdrop-blur-md text-white rounded-xl shadow-lg w-80 overflow-hidden border border-white/10", children: [
      /* title row */
      /* @__PURE__ */ jsxDEV("div", { className: "px-4 pt-3 pb-1 flex items-center justify-between", children: [
        /* track title */
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-semibold truncate pr-2", title: state?.track?.title || "Music", children: state?.track?.title || "Music" }, void 0, false),
        /* status */
        /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] uppercase tracking-wide text-yellow-300/90", children: state.ready ? state.isPlaying ? "Playing" : "Paused" : "Loading" }, void 0, false)
      ] }, void 0, true),
      /* progress bar */
      /* @__PURE__ */ jsxDEV("div", { className: "px-4 py-2", children: [
        /* bar */
        /* @__PURE__ */ jsxDEV("div", {
          className: "w-full h-2 bg-white/15 rounded-full overflow-hidden",
          children: /* @__PURE__ */ jsxDEV("div", { className: "h-full bg-yellow-400", style: { width: `${pct}%` } }, void 0, false)
        }, void 0, false),
        /* time */
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-[10px] text-white/70 mt-1", children: [
          /* @__PURE__ */ jsxDEV("span", { children: format(now.currentTime) }, void 0, false),
          /* @__PURE__ */ jsxDEV("span", { children: format(now.duration) }, void 0, false)
        ] }, void 0, true)
      ] }, void 0, true),
      /* controls */
      /* @__PURE__ */ jsxDEV("div", { className: "px-2 pb-2 flex items-center justify-center gap-2", children: [
        /* prev */
        /* @__PURE__ */ jsxDEV("button", { className: "px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30", onClick: () => musicPrev(), children: "\u23EE" }, void 0, false),
        /* play/pause */
        /* @__PURE__ */ jsxDEV("button", { className: "px-4 py-2 rounded-md bg-yellow-400 text-black font-bold hover:bg-yellow-300 active:bg-yellow-200", onClick: () => musicToggle(), children: state.isPlaying ? "\u23F8" : "\u25B6\uFE0F" }, void 0, false),
        /* next */
        /* @__PURE__ */ jsxDEV("button", { className: "px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30", onClick: () => musicNext(), children: "\u23ED" }, void 0, false)
      ] }, void 0, true),
      /* volume */
      /* @__PURE__ */ jsxDEV("div", { className: "px-4 pb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-white/70", children: "\u{1F50A}" }, void 0, false),
        /* @__PURE__ */ jsxDEV("input", { type: "range", min: 0, max: 100, step: 1, value: Math.round((state.volume ?? 0) * 100), onChange: (e) => musicSetVolume((Number(e.target.value) || 0) / 100), className: "w-full accent-yellow-400" }, void 0, false),
        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-white/70 w-10 text-right", children: `${Math.round((state.volume ?? 0) * 100)}%` }, void 0, false)
      ] }, void 0, true),
      blocked && /* @__PURE__ */ jsxDEV("div", { className: "px-4 pb-3 -mt-2 text-[11px] text-yellow-300/90 text-center", children: "Tap play to start music" }, void 0, false)
    ] }, void 0, true)
  ] }, void 0, true);
};
var stdin_default = MusicPlayer;
export {
  MusicPlayer,
  stdin_default as default
};

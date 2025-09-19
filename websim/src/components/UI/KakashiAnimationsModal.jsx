import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const KakashiAnimationsModal = ({ onClose }) => {
  const [animations, setAnimations] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [filter, setFilter] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const mountRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("./src/components/json/kakashiAnimations.json");
        const data = await res.json();
        if (!cancelled) {
          setAnimations(data.files || []);
          if (data.files && data.files[0]) setCurrentUrl(data.files[0]);
        }
      } catch (e) {
        console.error("Failed to load Kakashi animations", e);
      }
      if (!cancelled) setLoadingList(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!currentUrl || !mountRef.current) return;
    let renderer, scene, camera, mixer, frameId, model;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1, 3);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    const light = new THREE.HemisphereLight(16777215, 4473924, 1);
    scene.add(light);
    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    loader.load(currentUrl, (gltf) => {
      model = gltf.scene;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.play();
      }
      animate();
    });
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (model) scene.remove(model);
      mixer && mixer.stopAllAction();
    };
  }, [currentUrl]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation?.();
        onClose();
      }
      if (!animations.length) return;
      const filtered = filteredAnimations;
      if (!filtered.length) return;
      const idx = filtered.indexOf(currentUrl);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = filtered[(Math.max(0, idx) + 1) % filtered.length];
        setCurrentUrl(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = filtered[(idx > 0 ? idx : filtered.length) - 1];
        setCurrentUrl(prev);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [animations, currentUrl, onClose, filter]);
  const filteredAnimations = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return animations;
    return animations.filter((url) => url.toLowerCase().includes(q) || url.substring(url.lastIndexOf("/") + 1).toLowerCase().includes(q));
  }, [animations, filter]);
  const currentName = useMemo(() => currentUrl ? currentUrl.substring(currentUrl.lastIndexOf("/") + 1) : "", [currentUrl]);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black bg-opacity-60", onClick: onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 5
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border border-yellow-500/60 rounded-2xl shadow-2xl overflow-hidden w-[92vw] max-w-[1100px] h-[85vh] flex flex-col", role: "dialog", "aria-modal": "true", children: [
      /* Header */
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-5 py-3 bg-gray-800/80 border-b border-gray-700", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" }, void 0, false),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold tracking-wide", children: "Kakashi Animations" }, void 0, false)
        ] }, void 0, true),
        /* @__PURE__ */ jsxDEV("button", { onClick: onClose, className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm border border-gray-600", "aria-label": "Close", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base leading-none", children: "\xD7" }, void 0, false),
          " Close"
        ] }, void 0, true)
      ] }, void 0, true),
      /* Body */
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex min-h-0", children: [
        /* Left: list + search */
        /* @__PURE__ */ jsxDEV("aside", { className: "w-64 md:w-80 lg:w-96 border-r border-gray-800 flex flex-col", children: [
          /* Search */
          /* @__PURE__ */ jsxDEV("div", { className: "p-3 border-b border-gray-800 bg-gray-900/60", children: /* @__PURE__ */ jsxDEV("input", { type: "text", value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Search animations...", className: "w-full px-3 py-2 rounded-md bg-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50" }, void 0, false) }, void 0, false),
          /* List */
          /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-2 space-y-1", children: loadingList ? /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-400 px-2 py-2", children: "Loading animations..." }, void 0, false) : filteredAnimations.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-400 px-2 py-2", children: ['No matches for "', filter, '"'] }, void 0, true) : filteredAnimations.map((url) => {
            const name = url.substring(url.lastIndexOf("/") + 1);
            const selected = url === currentUrl;
            return /* @__PURE__ */ jsxDEV("button", { onClick: () => setCurrentUrl(url), className: `${selected ? "bg-gray-800 text-yellow-300 ring-1 ring-yellow-600/40" : "hover:bg-gray-800/60 text-gray-200"} block w-full text-left px-3 py-2 rounded-md transition truncate`, title: url, children: name }, url, false);
          }) }, void 0, false)
        ] }, void 0, false),
        /* Right: viewer */
        /* @__PURE__ */ jsxDEV("section", { className: "flex-1 relative bg-gradient-to-b from-black to-gray-900", children: [
          /* Canvas mount */
          /* @__PURE__ */ jsxDEV("div", { ref: mountRef, className: "absolute inset-0" }, void 0, false),
          /* Filename badge */
          currentUrl && /* @__PURE__ */ jsxDEV("div", { className: "absolute left-3 bottom-3 px-2.5 py-1.5 text-xs rounded-md bg-black/70 border border-gray-700 text-gray-200", children: currentName }, void 0, false)
        ] }, void 0, true)
      ] }, void 0, true)
    ] }, void 0, true)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 66,
    columnNumber: 3
  });
};
var stdin_default = KakashiAnimationsModal;
export {
  stdin_default as default
};

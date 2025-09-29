import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const MAP_EDITOR_URL = "map/index.html";
const MAP_BUTTON_LABEL = "Map Editor";
const MAP_MODAL_WIDTH_PCT = 98;
const MAP_MODAL_HEIGHT_PCT = 98;
const MAP_MODAL_BACKDROP_OPACITY = 0.6;
const MAP_EDITOR_ENABLED = true;
const WELCOME_DISMISSED_KEY = "narutoRPG.welcomeDismissed";
const safeGetWelcomeFlag = () => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(WELCOME_DISMISSED_KEY) === "true";
  } catch (error) {
    return false;
  }
};
const safeSetWelcomeFlag = () => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
  } catch (error) {
  }
};
const buildShowcaseDisplayName = (filename) => {
  if (!filename || typeof filename !== "string") return "Showcase Image";
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  try {
    const decoded = decodeURIComponent(withoutExtension);
    const normalized = decoded.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return normalized || decoded || "Showcase Image";
  } catch (error) {
    const fallback = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return fallback || withoutExtension || "Showcase Image";
  }
};
const STATIC_SHOWCASE_IMAGES = (() => {
  const results = [];
  const seen = new Set();
  const patterns = typeof import.meta !== "undefined" && import.meta && typeof import.meta.glob === "function" ? [
    "../../assets/images/showcase/*.{png,jpg,jpeg,gif,webp,avif,bmp,svg}",
    "../../assets/images/showcase/**/*.{png,jpg,jpeg,gif,webp,avif,bmp,svg}",
    "../../../showcase/*.{png,jpg,jpeg,gif,webp,avif,bmp,svg}",
    "../../../showcase/**/*.{png,jpg,jpeg,gif,webp,avif,bmp,svg}"
  ] : [];
  for (const pattern of patterns) {
    try {
      const modules = import.meta.glob(pattern, { eager: true, as: "url" });
      for (const [filePath, url] of Object.entries(modules)) {
        const dedupeKey = `${filePath}::${url}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const filename = filePath.split("/").pop() || url;
        results.push({
          url,
          name: buildShowcaseDisplayName(filename),
          filename
        });
      }
    } catch (error) {
      if (typeof console !== "undefined" && typeof console.warn === "function") {
        console.warn("[MainMenu] Showcase glob failed:", pattern, error);
      }
    }
  }
  if (!results.length && typeof import.meta !== "undefined" && import.meta && import.meta.url) {
    const fallbackFiles = [
      "../../assets/images/showcase/animation_viewer.png",
      "../../assets/images/showcase/hokage_monument.png",
      "../../assets/images/showcase/inventory.png",
      "../../assets/images/showcase/map_template.png",
      "../../assets/images/showcase/world_2025-09-01.png"
    ];
    for (const filePath of fallbackFiles) {
      try {
        const url = new URL(filePath, import.meta.url).href;
        const filename = filePath.split("/").pop() || url;
        const dedupeKey = `${filename}::${url}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push({
          url,
          name: buildShowcaseDisplayName(filename),
          filename
        });
      } catch (error) {
        if (typeof console !== "undefined" && typeof console.warn === "function") {
          console.warn("[MainMenu] Showcase fallback failed:", filePath, error);
        }
      }
    }
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
})();
const MainMenu = ({ onStart, onOptions, onChangelog, onCredits, version }) => {
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(() => !safeGetWelcomeFlag());
  const [showHints, setShowHints] = React.useState(false);
  const [showShowcase, setShowShowcase] = React.useState(false);
  const [showcaseImages, setShowcaseImages] = React.useState(() => STATIC_SHOWCASE_IMAGES);
  const [isLoadingShowcase, setIsLoadingShowcase] = React.useState(false);
  const [showcaseError, setShowcaseError] = React.useState(null);
  const mapButtonRef = React.useRef(null);
  const mapCloseButtonRef = React.useRef(null);
  const mapModalContentRef = React.useRef(null);
  const previouslyFocusedElementRef = React.useRef(null);
  const showcaseButtonRef = React.useRef(null);
  const showcaseCloseButtonRef = React.useRef(null);
  const showcaseModalContentRef = React.useRef(null);
  const showcasePreviouslyFocusedElementRef = React.useRef(null);
  const hasAttemptedDynamicShowcaseFetchRef = React.useRef(STATIC_SHOWCASE_IMAGES.length > 0);
  React.useEffect(() => {
    if (!showMapModal || !mapModalContentRef.current) return;
    const modalNode = mapModalContentRef.current;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = activeElement;
    } else {
      previouslyFocusedElementRef.current = null;
    }
    if (mapCloseButtonRef.current) {
      mapCloseButtonRef.current.focus();
    }
    const focusableSelectors = "button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex='-1'])";
    const getFocusableElements = () => {
      return Array.from(modalNode.querySelectorAll(focusableSelectors)).filter((element) => {
        if (element.hasAttribute("disabled")) return false;
        if (element.getAttribute("tabindex") === "-1") return false;
        return element.getAttribute("aria-hidden") !== "true";
      });
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }
      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }
      const [firstElement] = focusableElements;
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentFocus = document.activeElement;
      if (event.shiftKey) {
        if (currentFocus === firstElement || !modalNode.contains(currentFocus)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }
      if (currentFocus === lastElement || !modalNode.contains(currentFocus)) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowMapModal(false);
      }
    };
    modalNode.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      modalNode.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);
      const mapButton = mapButtonRef.current;
      const previouslyFocused = previouslyFocusedElementRef.current;
      previouslyFocusedElementRef.current = null;
      if (mapButton && typeof mapButton.focus === "function") {
        mapButton.focus();
        return;
      }
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [showMapModal]);
  React.useEffect(() => {
    if (!showShowcase || !showcaseModalContentRef.current) return;
    const modalNode = showcaseModalContentRef.current;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      showcasePreviouslyFocusedElementRef.current = activeElement;
    } else {
      showcasePreviouslyFocusedElementRef.current = null;
    }
    if (showcaseCloseButtonRef.current) {
      showcaseCloseButtonRef.current.focus();
    }
    const focusableSelectors = "button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex='-1'])";
    const getFocusableElements = () => {
      return Array.from(modalNode.querySelectorAll(focusableSelectors)).filter((element) => {
        if (element.hasAttribute("disabled")) return false;
        if (element.getAttribute("tabindex") === "-1") return false;
        return element.getAttribute("aria-hidden") !== "true";
      });
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }
      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }
      const [firstElement] = focusableElements;
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentFocus = document.activeElement;
      if (event.shiftKey) {
        if (currentFocus === firstElement || !modalNode.contains(currentFocus)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }
      if (currentFocus === lastElement || !modalNode.contains(currentFocus)) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowShowcase(false);
      }
    };
    modalNode.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      modalNode.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);
      const showcaseButton = showcaseButtonRef.current;
      const previouslyFocused = showcasePreviouslyFocusedElementRef.current;
      showcasePreviouslyFocusedElementRef.current = null;
      if (showcaseButton && typeof showcaseButton.focus === "function") {
        showcaseButton.focus();
        return;
      }
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [showShowcase]);
  const mapModalWasOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (!showShowcase) return;
    if (showcaseImages.length > 0) return;
    if (hasAttemptedDynamicShowcaseFetchRef.current) return;
    let isActive = true;
    const fetchManifest = async () => {
      hasAttemptedDynamicShowcaseFetchRef.current = true;
      setIsLoadingShowcase(true);
      setShowcaseError(null);
      const candidates = [
        "src/assets/images/showcase/index.json",
        "src/assets/images/showcase/manifest.json",
        "src/assets/images/showcase/showcase.json",
        "assets/images/showcase/index.json",
        "assets/images/showcase/manifest.json",
        "assets/images/showcase/showcase.json",
        "showcase/index.json",
        "showcase/manifest.json",
        "showcase/showcase.json"
      ];
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, { cache: "no-store" });
          if (!response.ok) continue;
          const payload = await response.json();
          const rawList = Array.isArray(payload) ? payload : Array.isArray(payload?.images) ? payload.images : [];
          if (!Array.isArray(rawList) || !rawList.length) continue;
          const seen = new Set();
          const deduped = [];
          for (const entry of rawList) {
            if (!entry) continue;
            const value = typeof entry === "string" ? entry : typeof entry?.path === "string" ? entry.path : null;
            if (!value) continue;
            const trimmed = value.trim();
            if (!trimmed) continue;
            let normalized = trimmed.replace(/^(\.\/)+/, "");
            const isExternal = /^https?:/i.test(normalized);
            if (!isExternal) {
              normalized = normalized.replace(/^\//, "");
              if (!normalized.toLowerCase().startsWith("showcase/")) {
                normalized = `showcase/${normalized}`;
              }
            }
            if (seen.has(normalized)) continue;
            seen.add(normalized);
            const filename = normalized.split("/").pop() || normalized;
            const url = isExternal ? normalized : normalized.startsWith("src/") ? normalized.replace(/^src\//, "") : `./${normalized}`;
            deduped.push({
              url,
              name: buildShowcaseDisplayName(filename),
              filename
            });
          }
          if (deduped.length) {
            if (!isActive) return;
            deduped.sort((a, b) => a.name.localeCompare(b.name));
            setShowcaseImages(deduped);
            setIsLoadingShowcase(false);
            setShowcaseError(null);
            return;
          }
        } catch (error) {
          if (typeof console !== "undefined" && typeof console.warn === "function") {
            console.warn("[MainMenu] Showcase manifest fetch failed:", candidate, error);
          }
        }
      }
      if (!isActive) return;
      setIsLoadingShowcase(false);
      setShowcaseError("No showcase images found. Add files to src/assets/images/showcase/ or provide a showcase manifest JSON file.");
    };
    fetchManifest();
    return () => {
      isActive = false;
    };
  }, [showShowcase, showcaseImages.length]);
  const dismissWelcome = React.useCallback(() => {
    setShowWelcome(false);
    safeSetWelcomeFlag();
  }, []);
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (showMapModal) {
        setShowMapModal(false);
        return;
      }
      if (showWelcome) {
        setShowWelcome(false);
        return;
      }
      if (showShowcase) {
        setShowShowcase(false);
        return;
      }
      if (showHints) {
        setShowHints(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showMapModal, showWelcome, showShowcase, showHints]);
  React.useEffect(() => {
    if (showMapModal) {
      if (mapCloseButtonRef.current) mapCloseButtonRef.current.focus();
    } else if (mapModalWasOpenRef.current) {
      if (mapButtonRef.current) mapButtonRef.current.focus();
    }
    mapModalWasOpenRef.current = showMapModal;
  }, [showMapModal]);

  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "w-full h-full bg-cover bg-center flex flex-col items-center justify-center text-white",
      // Use relative path so hosting under subpaths works
      style: { backgroundImage: "url('./menu.png')" },
      children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setShowHints(true),
            "aria-label": "Open hints",
            className: "absolute bottom-6 left-6 cursor-pointer",
            children: /* @__PURE__ */ jsxDEV("img", { src: "./devs.png", alt: "Developers", className: "w-28 opacity-95 select-none hover:opacity-100 transition" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 35,
              columnNumber: 15
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 30,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-black bg-opacity-60 p-12 rounded-xl shadow-2xl border-2 border-yellow-500 flex flex-col items-center gap-6 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300 -mt-4", children: version }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-4 w-64", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onStart,
                className: "bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Start Game"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 40,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onOptions,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Options"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 46,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onChangelog,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Changelog"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 52,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onCredits,
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Credits"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 58,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                ref: showcaseButtonRef,
                onClick: () => {
                  setShowcaseError(null);
                  setShowShowcase(true);
                },
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: "Showcase"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 64,
                columnNumber: 21
              }
            ),
            MAP_EDITOR_ENABLED && /* @__PURE__ */ jsxDEV(
              "button",
              {
                ref: mapButtonRef,
                onClick: () => setShowMapModal(true),
                className: "bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200",
                children: MAP_BUTTON_LABEL
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 65,
                columnNumber: 23
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 39,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 37,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: "https://websim.com/@LordTsarcasm",
            target: "_blank",
            rel: "noreferrer",
            className: "absolute bottom-4 right-4 text-yellow-300 hover:text-yellow-200 hover:underline bg-black/50 px-3 py-1 rounded border border-yellow-600 text-sm",
            title: "View profile",
            children: "@LordTsarcasm"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 75,
            columnNumber: 13
          }
        ),
        MAP_EDITOR_ENABLED && showMapModal && /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "fixed inset-0 z-50 flex items-center justify-center",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "map-editor-title",
            children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "absolute inset-0",
                  style: { background: `rgba(0,0,0,${MAP_MODAL_BACKDROP_OPACITY})` },
                  onClick: () => setShowMapModal(false)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 92,
                  columnNumber: 17
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  ref: mapModalContentRef,
                  className: "relative border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden bg-black",
                  style: {
                    width: `${MAP_MODAL_WIDTH_PCT}vw`,
                    height: `${MAP_MODAL_HEIGHT_PCT}vh`
                  },
                  children: [
                    /* @__PURE__ */ jsxDEV("h2", { id: "map-editor-title", className: "sr-only", children: "Map Editor" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 100,
                      columnNumber: 21
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "absolute top-2 right-2 z-10", children: /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        ref: mapCloseButtonRef,
                        onClick: () => setShowMapModal(false),
                        className: "px-3 py-1 rounded bg-black/70 text-white border border-gray-400 hover:bg-black/80",
                        title: "Close map editor (Esc)",
                        children: "Close"
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 105,
                        columnNumber: 21
                      }
                    ) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 104,
                      columnNumber: 19
                    }),
                    /* @__PURE__ */ jsxDEV(
                      "iframe",
                      {
                        title: "Konoha Map Editor",
                        src: MAP_EDITOR_URL,
                        className: "w-full h-full",
                        style: { border: "none" }
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 113,
                        columnNumber: 19
                      }
                    )
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 97,
                  columnNumber: 17
                }
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 15
          }
        ),
        showShowcase && /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "fixed inset-0 z-50 flex items-center justify-center",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "showcase-dialog-title",
            children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "absolute inset-0 bg-black/70",
                  onClick: () => setShowShowcase(false)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 120,
                  columnNumber: 17
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  ref: showcaseModalContentRef,
                  className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[95vw] max-w-[960px] max-h-[90vh] flex flex-col",
                  children: [
                    /* @__PURE__ */ jsxDEV(
                      "div",
                      {
                        className: "flex items-center justify-between border-b border-yellow-600/40 px-5 py-3",
                        children: [
                          /* @__PURE__ */ jsxDEV("h2", { id: "showcase-dialog-title", className: "text-yellow-400 font-bold text-xl", children: "Showcase Gallery" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 127,
                            columnNumber: 23
                          }),
                          /* @__PURE__ */ jsxDEV(
                            "button",
                            {
                              ref: showcaseCloseButtonRef,
                              onClick: () => setShowShowcase(false),
                              className: "text-red-400 hover:text-red-300 text-2xl font-bold",
                              "aria-label": "Close showcase",
                              children: "\xD7"
                            },
                            void 0,
                            false,
                            {
                              fileName: "<stdin>",
                              lineNumber: 130,
                              columnNumber: 25
                            }
                          )
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "<stdin>",
                        lineNumber: 126,
                        columnNumber: 21
                      }
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "div",
                      {
                        className: "flex-1 overflow-y-auto px-5 py-4 space-y-4",
                        children: [
                          showcaseError && /* @__PURE__ */ jsxDEV(
                            "div",
                            {
                              className: "bg-red-900/60 border border-red-500/70 text-red-200 px-4 py-2 rounded",
                              role: "alert",
                              children: showcaseError
                            },
                            void 0,
                            false,
                            {
                              fileName: "<stdin>",
                              lineNumber: 141,
                              columnNumber: 27
                            }
                          ),
                          isLoadingShowcase ? /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300", children: "Loading showcase images..." }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 144,
                            columnNumber: 27
                          }) : showcaseImages.length ? /* @__PURE__ */ jsxDEV(
                            "div",
                            {
                              className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
                              children: showcaseImages.map((item) => /* @__PURE__ */ jsxDEV(
                                "div",
                                {
                                  className: "bg-black/60 border border-yellow-600/30 rounded-lg overflow-hidden shadow-md flex flex-col",
                                  children: [
                                    /* @__PURE__ */ jsxDEV(
                                      "img",
                                      {
                                        src: item.url,
                                        alt: item.name,
                                        className: "w-full h-48 object-cover bg-black",
                                        loading: "lazy"
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName: "<stdin>",
                                        lineNumber: 152,
                                        columnNumber: 35
                                      }
                                    ),
                                    /* @__PURE__ */ jsxDEV(
                                      "div",
                                      {
                                        className: "flex items-center justify-between px-3 py-2 text-sm text-gray-200 bg-black/40 border-t border-yellow-600/30 gap-3",
                                        children: [
                                          /* @__PURE__ */ jsxDEV("span", { className: "truncate", title: item.filename, children: item.name }, void 0, false, {
                                            fileName: "<stdin>",
                                            lineNumber: 156,
                                            columnNumber: 39
                                          }),
                                          /* @__PURE__ */ jsxDEV(
                                            "a",
                                            {
                                              href: item.url,
                                              target: "_blank",
                                              rel: "noreferrer",
                                              className: "text-yellow-300 hover:text-yellow-200 underline text-xs flex-shrink-0",
                                              children: "Open"
                                            },
                                            void 0,
                                            false,
                                            {
                                              fileName: "<stdin>",
                                              lineNumber: 158,
                                              columnNumber: 39
                                            }
                                          )
                                        ]
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName: "<stdin>",
                                        lineNumber: 155,
                                        columnNumber: 37
                                      }
                                    )
                                  ]
                                },
                                item.url,
                                true,
                                {
                                  fileName: "<stdin>",
                                  lineNumber: 150,
                                  columnNumber: 33
                                }
                              ))
                            },
                            void 0,
                            false,
                            {
                              fileName: "<stdin>",
                              lineNumber: 148,
                              columnNumber: 29
                            }
                          ) : /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300", children: "No showcase images available yet." }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 166,
                            columnNumber: 27
                          })
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "<stdin>",
                        lineNumber: 139,
                        columnNumber: 23
                      }
                    )
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 123,
                  columnNumber: 19
                }
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 118,
            columnNumber: 15
          }
        ),

        showWelcome && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", role: "dialog", "aria-modal": "true", "aria-labelledby": "welcome-dialog-title", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/70", onClick: () => setShowWelcome(false) }, void 0, false, {

            fileName: "<stdin>",
            lineNumber: 124,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[95vw] max-w-[700px] p-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxDEV("h2", { id: "welcome-dialog-title", className: "text-yellow-400 font-bold text-xl", children: "Welcome to Naruto RPG \u2014 Early Alpha" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 127,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("button", { onClick: dismissWelcome, className: "text-red-400 hover:text-red-300 text-2xl font-bold", "aria-label": "Close", children: "\xD7" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 128,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 126,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 text-sm text-gray-200", children: [
              /* @__PURE__ */ jsxDEV("p", { children: "Thank you for trying this early alpha. It currently showcases core foundations: exploration, basic movement, UI panels, and a few interactive scenes." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 131,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("p", { className: "text-yellow-300", children: "Development focus: most progress is built and tested on desktop. Mobile support is planned, but without test help it isn\u2019t a priority yet. Apologies to mobile players\u2014your patience is appreciated." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 132,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("p", { children: "This is a solo project. Updates will be incremental; thoughtful feedback and bug reports directly shape the roadmap." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 133,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300", children: "All assets are AI\u2011generated and used for non\u2011commercial, transformative purposes. No copyright infringement is intended." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 134,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 130,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxDEV("button", { onClick: dismissWelcome, className: "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg border border-yellow-600", children: "Continue" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 137,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 136,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 125,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 123,
          columnNumber: 15
        }),
        showHints && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", role: "dialog", "aria-modal": "true", "aria-labelledby": "hints-dialog-title", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/70", onClick: () => setShowHints(false) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 144,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[90vw] max-w-[520px] p-5", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxDEV("h2", { id: "hints-dialog-title", className: "text-yellow-400 font-bold", children: "Download" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 146,
                columnNumber: 75
              }),
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowHints(false), "aria-label": "Close", className: "text-red-400 text-2xl font-bold", children: "\xD7" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 146,
                columnNumber: 127
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 146,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-200 space-y-3", children: [
              /* @__PURE__ */ jsxDEV("p", { children: "You can download NarutoRPG at:" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 147,
                columnNumber: 68
              }),
              /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("a", { href: "https://github.com/Tsarcasm831/NarutoRPG", target: "_blank", rel: "noreferrer", className: "text-yellow-300 hover:text-yellow-200 underline", children: "https://github.com/Tsarcasm831/NarutoRPG" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 147,
                columnNumber: 118
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 147,
                columnNumber: 100
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 147,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 145,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 143,
          columnNumber: 15
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 26,
      columnNumber: 9
    }
  );
};
var stdin_default = MainMenu;
export {
  MainMenu,
  stdin_default as default
};

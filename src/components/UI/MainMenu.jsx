import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const MAP_EDITOR_URL = "map/index.html";
const MAP_BUTTON_LABEL = "Map Editor";
const MAP_MODAL_WIDTH_PCT = 98;
const MAP_MODAL_HEIGHT_PCT = 98;
const MAP_MODAL_BACKDROP_OPACITY = 0.6;
const MAP_EDITOR_ENABLED = true;
const MainMenu = ({ onStart, onOptions, onChangelog, onCredits, version }) => {
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(true);
  const [showHints, setShowHints] = React.useState(false);
  const mapButtonRef = React.useRef(null);
  const mapCloseButtonRef = React.useRef(null);
  const mapModalContentRef = React.useRef(null);
  const mapModalWasOpenRef = React.useRef(false);
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowMapModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  React.useEffect(() => {
    if (showMapModal) {
      if (mapCloseButtonRef.current) mapCloseButtonRef.current.focus();
    } else if (mapModalWasOpenRef.current) {
      if (mapButtonRef.current) mapButtonRef.current.focus();
    }
    mapModalWasOpenRef.current = showMapModal;
  }, [showMapModal]);
  React.useEffect(() => {
    if (!showMapModal || !mapModalContentRef.current) return;
    const modalNode = mapModalContentRef.current;
    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const focusableSelectors = "button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex='-1'])";
      const focusableElements = Array.from(modalNode.querySelectorAll(focusableSelectors)).filter((element) => {
        if (element.hasAttribute("disabled")) return false;
        if (element.getAttribute("tabindex") === "-1") return false;
        return element.getAttribute("aria-hidden") !== "true";
      });
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }
      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey) {
        if (activeElement === firstElement || !modalNode.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }
      if (activeElement === lastElement || !modalNode.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    modalNode.addEventListener("keydown", handleKeyDown);
    return () => {
      modalNode.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMapModal]);
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "w-full h-full bg-cover bg-center flex flex-col items-center justify-center text-white",
      style: { backgroundImage: "url('/menu.png')" },
      children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setShowHints(true),
            "aria-label": "Open hints",
            className: "absolute bottom-6 left-6 cursor-pointer",
            children: /* @__PURE__ */ jsxDEV("img", { src: "/devs.png", alt: "Developers", className: "w-28 opacity-95 select-none hover:opacity-100 transition" }, void 0, false, {
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
            "aria-label": "Map Editor",
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
        showWelcome && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/70", onClick: () => setShowWelcome(false) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 124,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[95vw] max-w-[700px] p-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold text-xl", children: "Welcome to Naruto RPG \u2014 Early Alpha" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 127,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowWelcome(false), className: "text-red-400 hover:text-red-300 text-2xl font-bold", "aria-label": "Close", children: "\xD7" }, void 0, false, {
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
            /* @__PURE__ */ jsxDEV("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowWelcome(false), className: "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg border border-yellow-600", children: "Continue" }, void 0, false, {
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
        showHints && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/70", onClick: () => setShowHints(false) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 144,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl w-[90vw] max-w-[520px] p-5", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold", children: "Hints" }, void 0, false, {
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
              /* @__PURE__ */ jsxDEV("p", { className: "text-yellow-300 font-semibold pt-2 border-t border-gray-700", children: "Dev tips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 147,
                columnNumber: 68
              }),
              /* @__PURE__ */ jsxDEV("ul", { className: "space-y-1 list-disc pl-5", children: [
                /* @__PURE__ */ jsxDEV("li", { children: "Keep repos lean: store large asset URLs in a JSON manifest; fetch/cache them at runtime." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 147,
                  columnNumber: 196
                }),
                /* @__PURE__ */ jsxDEV("li", { children: "Use GitHub for versioning/PRs/Issues; pair with GPT Codex and Windsurf for rapid iteration." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 147,
                  columnNumber: 293
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 147,
                columnNumber: 155
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

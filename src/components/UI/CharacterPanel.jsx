import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const CharacterPanel = ({ playerStats, onClose }) => {
  const defaultStats = {
    name: "Adventurer",
    level: 1,
    experience: 0,
    maxExperience: 1e3,
    strength: 10,
    dexterity: 10,
    vitality: 10,
    energy: 10,
    health: 50,
    maxHealth: 50,
    chakra: 20,
    maxChakra: 20,
    stamina: 80,
    maxStamina: 80,
    attackRating: 5,
    minDamage: 1,
    maxDamage: 2,
    defense: 5,
    fireResist: 0,
    coldResist: 0,
    lightResist: 0,
    poisonResist: 0,
    statPoints: 0,
    skillPoints: 0
  };
  const stats = { ...defaultStats, ...playerStats };
  const StatRow = ({ label, value, maxValue = null, showPlus = false }) => /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center py-1 text-sm", children: [
    /* @__PURE__ */ jsxDEV("span", { className: "text-gray-300", children: label }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 37,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-white font-mono", children: maxValue ? `${value}/${maxValue}` : value }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 39,
        columnNumber: 9
      }),
      showPlus && stats.statPoints > 0 && /* @__PURE__ */ jsxDEV("button", { className: "ml-2 w-4 h-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded border border-gray-400 flex items-center justify-center", children: "+" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 38,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 36,
    columnNumber: 5
  });
  const StatBlock = ({ title, children }) => /* @__PURE__ */ jsxDEV("div", { className: "mb-4", children: [
    /* @__PURE__ */ jsxDEV("h4", { className: "text-yellow-400 font-bold text-sm mb-2 border-b border-gray-600 pb-1", children: title }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 53,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 56,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 52,
    columnNumber: 5
  });
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-98 border-2 border-gray-600 rounded-lg shadow-2xl z-50", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-700 px-4 py-2 rounded-t-lg border-b border-gray-600 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-yellow-400 font-bold text-lg", children: "Character" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 66,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "text-red-400 hover:text-red-300 text-xl font-bold w-6 h-6 flex items-center justify-center",
          children: "\xD7"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 67,
          columnNumber: 9
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 65,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "flex", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-64 p-4 bg-gray-900", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-center mb-4", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-white font-bold text-xl", children: stats.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 80,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "text-yellow-400 text-sm mt-1", children: [
            "Level ",
            stats.level
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 81,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "text-gray-300 text-xs", children: [
            "Experience: ",
            stats.experience
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 84,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "text-gray-300 text-xs", children: [
            "Next Level: ",
            stats.maxExperience
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 87,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 79,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Attributes", children: [
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Strength", value: stats.strength, showPlus: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 94,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Dexterity", value: stats.dexterity, showPlus: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 95,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Vitality", value: stats.vitality, showPlus: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 96,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Energy", value: stats.energy, showPlus: true }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 97,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 93,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Available Points", children: [
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Stat Points", value: stats.statPoints }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 102,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Skill Points", value: stats.skillPoints }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 103,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 101,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 77,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-64 p-4 bg-gray-850", children: [
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Vitals", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-gray-300", children: "Health" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 114,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "text-white font-mono", children: [
                stats.health,
                "/",
                stats.maxHealth
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 115,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 113,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2 mt-1", children: /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "bg-red-500 h-2 rounded-full transition-all duration-300",
                style: { width: `${stats.health / stats.maxHealth * 100}%` }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 118,
                columnNumber: 19
              }
            ) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 117,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 112,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-gray-300", children: "Chakra" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 126,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "text-white font-mono", children: [
                stats.chakra,
                "/",
                stats.maxChakra
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 127,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 125,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2 mt-1", children: /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "bg-blue-500 h-2 rounded-full transition-all duration-300",
                style: { width: `${stats.chakra / stats.maxChakra * 100}%` }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 130,
                columnNumber: 19
              }
            ) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 129,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 124,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-gray-300", children: "Stamina" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 138,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "text-white font-mono", children: [
                stats.stamina,
                "/",
                stats.maxStamina
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 139,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 137,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-700 rounded-full h-2 mt-1", children: /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "bg-yellow-500 h-2 rounded-full transition-all duration-300",
                style: { width: `${stats.stamina / stats.maxStamina * 100}%` }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 142,
                columnNumber: 19
              }
            ) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 141,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 136,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 111,
          columnNumber: 13
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 110,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Attack", children: [
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Attack Rating", value: stats.attackRating }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 153,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Damage", value: `${stats.minDamage}-${stats.maxDamage}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 154,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 152,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Defense", children: /* @__PURE__ */ jsxDEV(StatRow, { label: "Defense", value: stats.defense }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 159,
          columnNumber: 13
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 158,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(StatBlock, { title: "Resistances", children: [
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Fire", value: `${stats.fireResist}%` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 164,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Cold", value: `${stats.coldResist}%` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 165,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Lightning", value: `${stats.lightResist}%` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 166,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV(StatRow, { label: "Poison", value: `${stats.poisonResist}%` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 167,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 163,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 108,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 75,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-700 px-4 py-2 rounded-b-lg border-t border-gray-600", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs text-gray-300 mb-1", children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Experience" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 175,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("span", { children: [
          stats.experience,
          " / ",
          stats.maxExperience
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 176,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 174,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-gray-800 rounded-full h-2", children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "bg-green-500 h-2 rounded-full transition-all duration-300",
          style: { width: `${stats.experience / stats.maxExperience * 100}%` }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 179,
          columnNumber: 11
        }
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 178,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 173,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 63,
    columnNumber: 5
  });
};
var stdin_default = CharacterPanel;
export {
  CharacterPanel,
  stdin_default as default
};

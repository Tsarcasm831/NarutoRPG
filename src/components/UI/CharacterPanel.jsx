import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./CharacterPanel.css";
const DEFAULT_STATS = {
  name: "Adventurer",
  level: 1,
  experience: 0,
  maxExperience: 1e3,
  strength: 10,
  dexterity: 10,
  vitality: 10,
  energy: 10,
  stamina: 80,
  maxStamina: 80,
  health: 50,
  maxHealth: 50,
  chakra: 20,
  maxChakra: 20,
  attackRating: 5,
  minDamage: 1,
  maxDamage: 2,
  defense: 5,
  fireResist: 0,
  coldResist: 0,
  lightResist: 0,
  poisonResist: 0,
  statPoints: 5,
  skillPoints: 0,
  guild: "Hidden Leaf",
  guildTag: "SUNCL",
  title: "No Title"
};
const ATTRIBUTE_CONFIG = [
  { key: "strength", label: "Strength" },
  { key: "dexterity", label: "Dexterity" },
  { key: "vitality", label: "Vitality" },
  { key: "energy", label: "Intelligence" },
  { key: "stamina", label: "Stamina" }
];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const CharacterPanel = ({ playerStats, onClose }) => {
  const stats = useMemo(() => ({ ...DEFAULT_STATS, ...playerStats || {} }), [playerStats]);
  const buildAttributesFromStats = (source) => ATTRIBUTE_CONFIG.map((attr) => {
    const rawValue = source == null ? void 0 : source[attr.key];
    const value = typeof rawValue === "number" ? rawValue : 10;
    return {
      ...attr,
      value: Math.round(value),
      baseValue: Math.round(value)
    };
  });
  const [attributes, setAttributes] = useState(() => buildAttributesFromStats(stats));
  const [basePoints, setBasePoints] = useState(() => {
    var _a;
    return Math.max(0, (_a = stats.statPoints) != null ? _a : 0);
  });
  const [availablePoints, setAvailablePoints] = useState(() => {
    var _a;
    return Math.max(0, (_a = stats.statPoints) != null ? _a : 0);
  });
  useEffect(() => {
    var _a;
    const merged = { ...DEFAULT_STATS, ...playerStats || {} };
    setAttributes(buildAttributesFromStats(merged));
    const nextBasePoints = Math.max(0, (_a = merged.statPoints) != null ? _a : 0);
    setBasePoints(nextBasePoints);
    setAvailablePoints(nextBasePoints);
  }, [playerStats]);
  const attributeMap = useMemo(() => {
    const map = {};
    attributes.forEach(({ key, value }) => {
      map[key] = value;
    });
    return map;
  }, [attributes]);
  const displayStats = useMemo(
    () => ({
      ...stats,
      ...attributeMap,
      statPoints: availablePoints
    }),
    [stats, attributeMap, availablePoints]
  );
  const experienceRatio = displayStats.maxExperience ? clamp(displayStats.experience / displayStats.maxExperience, 0, 1) : 0;
  const combatPower = useMemo(() => {
    var _a, _b;
    const attrContribution = attributes.reduce((sum, attr) => sum + attr.value * 2, 0);
    const defenseContribution = ((_a = displayStats.defense) != null ? _a : 0) * 0.35;
    const attackContribution = ((_b = displayStats.attackRating) != null ? _b : 0) * 0.4;
    return Math.round(300 + attrContribution + defenseContribution + attackContribution);
  }, [attributes, displayStats.defense, displayStats.attackRating]);
  const detailRows = useMemo(
    () => [
      { label: "Base ATK", value: `${displayStats.minDamage}~${displayStats.maxDamage}` },
      { label: "Attack Rating", value: displayStats.attackRating },
      { label: "Defense", value: displayStats.defense },
      { label: "Max HP", value: displayStats.maxHealth },
      { label: "Max Chakra", value: displayStats.maxChakra },
      { label: "Stamina", value: `${displayStats.stamina}/${displayStats.maxStamina}` },
      { label: "Current HP", value: `${displayStats.health}/${displayStats.maxHealth}` },
      { label: "Current Chakra", value: `${displayStats.chakra}/${displayStats.maxChakra}` },
      {
        label: "Fire Resistance",
        value: `${displayStats.fireResist}%`,
        trend: displayStats.fireResist
      },
      {
        label: "Cold Resistance",
        value: `${displayStats.coldResist}%`,
        trend: displayStats.coldResist
      },
      {
        label: "Lightning Resistance",
        value: `${displayStats.lightResist}%`,
        trend: displayStats.lightResist
      },
      {
        label: "Poison Resistance",
        value: `${displayStats.poisonResist}%`,
        trend: displayStats.poisonResist
      },
      { label: "Skill Points", value: displayStats.skillPoints },
      { label: "Available Stat Points", value: availablePoints }
    ],
    [displayStats, availablePoints]
  );
  const adjustAttribute = (index, delta) => {
    setAttributes((prevAttrs) => {
      const attr = prevAttrs[index];
      if (!attr) {
        return prevAttrs;
      }
      const nextValue = attr.value + delta;
      if (delta > 0 && availablePoints <= 0) {
        return prevAttrs;
      }
      if (delta < 0 && nextValue < attr.baseValue) {
        return prevAttrs;
      }
      const updated = prevAttrs.map(
        (item, i) => i === index ? { ...item, value: nextValue } : item
      );
      setAvailablePoints((prev) => prev - delta);
      return updated;
    });
  };
  const handleReset = () => {
    setAttributes((prevAttrs) => prevAttrs.map((attr) => ({ ...attr, value: attr.baseValue })));
    setAvailablePoints(basePoints);
  };
  const guildLabel = stats.guildTag || "SUNCL";
  const guildName = stats.guild || "Hidden Leaf";
  const title = stats.title || "No Title";
  return /* @__PURE__ */ React.createElement("div", { className: "character-panel-overlay", role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ React.createElement("div", { className: "character-panel-card" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "character-panel-close",
      "aria-label": "Close character panel",
      onClick: onClose
    },
    "\xD7"
  ), /* @__PURE__ */ React.createElement("section", { className: "panel left" }, /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement("div", { className: "tab" }, "Character Info"), /* @__PURE__ */ React.createElement("div", { className: "tab" }, "Socket"), /* @__PURE__ */ React.createElement("div", { className: "tab" }, "Fame")), /* @__PURE__ */ React.createElement("div", { className: "header" }, /* @__PURE__ */ React.createElement("div", { className: "badge" }, /* @__PURE__ */ React.createElement("div", { className: "icon", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "label" }, "Guild"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)" } }, guildLabel))), /* @__PURE__ */ React.createElement("div", { className: "badge" }, /* @__PURE__ */ React.createElement("div", { className: "icon title-medal", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "label" }, "Title"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)" } }, title)))), /* @__PURE__ */ React.createElement("div", { className: "body" }, /* @__PURE__ */ React.createElement("div", { className: "portrait" }, /* @__PURE__ */ React.createElement("div", { className: "halo" }), /* @__PURE__ */ React.createElement("div", { className: "silhouette", title: `${displayStats.name} portrait placeholder` }), /* @__PURE__ */ React.createElement("div", { className: "portrait-meta" }, /* @__PURE__ */ React.createElement("h3", null, displayStats.name), /* @__PURE__ */ React.createElement("span", null, "Level ", displayStats.level, " \xB7 ", guildName))), /* @__PURE__ */ React.createElement("aside", { className: "attrs", "aria-labelledby": "bonus-points-heading" }, /* @__PURE__ */ React.createElement("h4", { id: "bonus-points-heading" }, "Bonus Points"), /* @__PURE__ */ React.createElement("div", { className: "bonus" }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)" } }, "Available"), /* @__PURE__ */ React.createElement("span", { className: "points" }, availablePoints)), /* @__PURE__ */ React.createElement("div", { className: "scroll", "aria-live": "polite" }, attributes.map((attr, index) => /* @__PURE__ */ React.createElement("div", { className: "stat", key: attr.key }, /* @__PURE__ */ React.createElement("div", { className: "name" }, attr.label), /* @__PURE__ */ React.createElement("div", { className: "controls" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "icon",
      onClick: () => adjustAttribute(index, -1),
      disabled: attr.value <= attr.baseValue,
      "aria-label": `Decrease ${attr.label}`
    },
    "-"
  ), /* @__PURE__ */ React.createElement("div", { className: "value", "aria-live": "off" }, attr.value), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "icon",
      onClick: () => adjustAttribute(index, 1),
      disabled: availablePoints <= 0,
      "aria-label": `Increase ${attr.label}`
    },
    "+"
  ))))), /* @__PURE__ */ React.createElement("div", { className: "reset" }, /* @__PURE__ */ React.createElement("small", { style: { color: "var(--muted)" } }, "Reset allocation"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleReset }, "Reset")))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "details-btn" }, "Details")), /* @__PURE__ */ React.createElement("section", { className: "panel right" }, /* @__PURE__ */ React.createElement("div", { className: "cp" }, /* @__PURE__ */ React.createElement("h3", null, "Combat Power"), /* @__PURE__ */ React.createElement("div", { className: "score" }, combatPower)), /* @__PURE__ */ React.createElement("div", { className: "stats" }, /* @__PURE__ */ React.createElement("header", null, "Detailed Stats"), /* @__PURE__ */ React.createElement("div", { className: "scroll" }, detailRows.map((row) => {
    const effectClass = typeof row.trend === "number" ? row.trend > 0 ? "pos" : row.trend < 0 ? "neg" : "" : "";
    return /* @__PURE__ */ React.createElement("div", { className: "row", key: row.label }, /* @__PURE__ */ React.createElement("div", { className: "opt" }, row.label), /* @__PURE__ */ React.createElement("div", { className: `eff ${effectClass}`.trim() }, row.value));
  })), /* @__PURE__ */ React.createElement("div", { className: "experience-track" }, /* @__PURE__ */ React.createElement("div", { className: "meta" }, /* @__PURE__ */ React.createElement("span", null, "Experience"), /* @__PURE__ */ React.createElement("span", null, displayStats.experience, " / ", displayStats.maxExperience)), /* @__PURE__ */ React.createElement("div", { className: "bar" }, /* @__PURE__ */ React.createElement("span", { style: { width: `${Math.round(experienceRatio * 100)}%` } })))))));
};
CharacterPanel.propTypes = {
  playerStats: PropTypes.object,
  onClose: PropTypes.func
};
CharacterPanel.defaultProps = {
  playerStats: void 0,
  onClose: () => {
  }
};
var CharacterPanel_default = CharacterPanel;
export {
  CharacterPanel_default as default
};

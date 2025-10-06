import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./CharacterPanel.css";

const DEFAULT_STATS = {
  name: "Adventurer",
  level: 1,
  experience: 0,
  maxExperience: 1_000,
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
  const stats = useMemo(() => ({ ...DEFAULT_STATS, ...(playerStats || {}) }), [playerStats]);

  const buildAttributesFromStats = (source) =>
    ATTRIBUTE_CONFIG.map((attr) => {
      const rawValue = source?.[attr.key];
      const value = typeof rawValue === "number" ? rawValue : 10;
      return {
        ...attr,
        value: Math.round(value),
        baseValue: Math.round(value)
      };
    });

  const [attributes, setAttributes] = useState(() => buildAttributesFromStats(stats));
  const [basePoints, setBasePoints] = useState(() => Math.max(0, stats.statPoints ?? 0));
  const [availablePoints, setAvailablePoints] = useState(() => Math.max(0, stats.statPoints ?? 0));

  useEffect(() => {
    const merged = { ...DEFAULT_STATS, ...(playerStats || {}) };
    setAttributes(buildAttributesFromStats(merged));
    const nextBasePoints = Math.max(0, merged.statPoints ?? 0);
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

  const experienceRatio = displayStats.maxExperience
    ? clamp(displayStats.experience / displayStats.maxExperience, 0, 1)
    : 0;

  const combatPower = useMemo(() => {
    const attrContribution = attributes.reduce((sum, attr) => sum + attr.value * 2, 0);
    const defenseContribution = (displayStats.defense ?? 0) * 0.35;
    const attackContribution = (displayStats.attackRating ?? 0) * 0.4;
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

      const updated = prevAttrs.map((item, i) =>
        i === index ? { ...item, value: nextValue } : item
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

  return (
    <div className="character-panel-overlay" role="dialog" aria-modal="true">
      <div className="character-panel-card">
        <button
          type="button"
          className="character-panel-close"
          aria-label="Close character panel"
          onClick={onClose}
        >
          ×
        </button>

        <section className="panel left">
          <div className="tabs">
            <div className="tab">Character Info</div>
            <div className="tab">Socket</div>
            <div className="tab">Fame</div>
          </div>

          <div className="header">
            <div className="badge">
              <div className="icon" aria-hidden="true" />
              <div>
                <div className="label">Guild</div>
                <div style={{ color: "var(--muted)" }}>{guildLabel}</div>
              </div>
            </div>
            <div className="badge">
              <div className="icon title-medal" aria-hidden="true" />
              <div>
                <div className="label">Title</div>
                <div style={{ color: "var(--muted)" }}>{title}</div>
              </div>
            </div>
          </div>

          <div className="body">
            <div className="portrait">
              <div className="halo" />
              <div className="silhouette" title={`${displayStats.name} portrait placeholder`} />
              <div className="portrait-meta">
                <h3>{displayStats.name}</h3>
                <span>
                  Level {displayStats.level} · {guildName}
                </span>
              </div>
            </div>

            <aside className="attrs" aria-labelledby="bonus-points-heading">
              <h4 id="bonus-points-heading">Bonus Points</h4>
              <div className="bonus">
                <span style={{ color: "var(--muted)" }}>Available</span>
                <span className="points">{availablePoints}</span>
              </div>

              <div className="scroll" aria-live="polite">
                {attributes.map((attr, index) => (
                  <div className="stat" key={attr.key}>
                    <div className="name">{attr.label}</div>
                    <div className="controls">
                      <button
                        type="button"
                        className="icon"
                        onClick={() => adjustAttribute(index, -1)}
                        disabled={attr.value <= attr.baseValue}
                        aria-label={`Decrease ${attr.label}`}
                      >
                        -
                      </button>
                      <div className="value" aria-live="off">
                        {attr.value}
                      </div>
                      <button
                        type="button"
                        className="icon"
                        onClick={() => adjustAttribute(index, 1)}
                        disabled={availablePoints <= 0}
                        aria-label={`Increase ${attr.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="reset">
                <small style={{ color: "var(--muted)" }}>Reset allocation</small>
                <button type="button" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </aside>
          </div>

          <button type="button" className="details-btn">
            Details
          </button>
        </section>

        <section className="panel right">
          <div className="cp">
            <h3>Combat Power</h3>
            <div className="score">{combatPower}</div>
          </div>

          <div className="stats">
            <header>Detailed Stats</header>
            <div className="scroll">
              {detailRows.map((row) => {
                const effectClass =
                  typeof row.trend === "number"
                    ? row.trend > 0
                      ? "pos"
                      : row.trend < 0
                      ? "neg"
                      : ""
                    : "";
                return (
                  <div className="row" key={row.label}>
                    <div className="opt">{row.label}</div>
                    <div className={`eff ${effectClass}`.trim()}>{row.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="experience-track">
              <div className="meta">
                <span>Experience</span>
                <span>
                  {displayStats.experience} / {displayStats.maxExperience}
                </span>
              </div>
              <div className="bar">
                <span style={{ width: `${Math.round(experienceRatio * 100)}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

CharacterPanel.propTypes = {
  playerStats: PropTypes.object,
  onClose: PropTypes.func
};

CharacterPanel.defaultProps = {
  playerStats: undefined,
  onClose: () => {}
};

export default CharacterPanel;

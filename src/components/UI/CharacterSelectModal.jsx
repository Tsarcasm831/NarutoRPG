import React from "react";

const CharacterSelectModal = ({ options = [], selectedKey, lockedKeys = [], errorMessage = null, onSelect, onConfirm, onCancel }) => {
  const selected = options.find((option) => option.key === selectedKey);
  const lockedSet = React.useMemo(() => {
    if (!Array.isArray(lockedKeys)) return new Set();
    return new Set(
      lockedKeys
        .filter((key) => typeof key === "string" && key.trim().length)
        .map((key) => key.toLowerCase())
    );
  }, [lockedKeys]);
  const handleSelect = (key) => {
    if (typeof onSelect === "function") {
      onSelect(key);
    }
  };

  const renderTags = (option) => {
    if (!Array.isArray(option.tags) || option.tags.length === 0) {
      return null;
    }
    return React.createElement(
      "div",
      { className: "flex flex-wrap gap-2" },
      option.tags.map((tag) =>
        React.createElement(
          "span",
          {
            key: tag,
            className: "rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200"
          },
          tag
        )
      )
    );
  };

  const optionCards = options.map((option) => {
    const isSelected = option.key === selectedKey;
    const normalizedKey = typeof option.key === "string" ? option.key.toLowerCase() : "";
    const isLocked = lockedSet.has(normalizedKey) && !isSelected;
    const portrait = option.mugshot || "/src/assets/images/mugshots/kakashi.png";
    const baseClasses = "group flex h-full items-start gap-4 rounded-xl border p-4 text-left transition";
    const stateClass = isSelected
      ? "border-yellow-400/80 bg-yellow-500/10 shadow-lg"
      : `border-gray-700 bg-gray-900/60 ${isLocked ? "opacity-60 cursor-not-allowed" : "hover:border-yellow-600 hover:bg-gray-900/80"}`;

    return React.createElement(
      "button",
      {
        key: option.key,
        type: "button",
        onClick: () => {
          if (isLocked) return;
          handleSelect(option.key);
        },
        disabled: isLocked,
        className: `${baseClasses} ${stateClass}`
      },
      React.createElement("img", {
        src: portrait,
        alt: option.name,
        className: "h-20 w-20 flex-shrink-0 rounded-lg border border-gray-700 object-cover"
      }),
      React.createElement(
        "div",
        { className: "flex flex-col gap-2" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "p",
            { className: "text-xs uppercase tracking-widest text-yellow-400" },
            option.codename
          ),
          React.createElement(
            "p",
            { className: "text-lg font-semibold text-white" },
            option.name
          )
        ),
        React.createElement(
          "p",
          { className: "text-sm leading-snug text-gray-300" },
          option.description
        ),
        renderTags(option),
        isLocked
          ? React.createElement(
              "span",
              {
                className: "inline-flex w-fit items-center gap-1 rounded-full border border-red-500/60 bg-red-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-200"
              },
              "Taken"
            )
          : null
      )
    );
  });

  const footerText = selected
    ? `Ready to deploy as ${selected.name}.`
    : "Select a shinobi to begin the mission.";

  const confirmButtonClass = selected
    ? "rounded-lg px-4 py-2 text-sm font-semibold bg-yellow-500 text-black transition hover:bg-yellow-400"
    : "rounded-lg px-4 py-2 text-sm font-semibold cursor-not-allowed bg-gray-700 text-gray-400";

  return React.createElement(
    "div",
    { className: "absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-6" },
    React.createElement(
      "div",
      {
        className:
          "w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-yellow-500/60 bg-gray-950/95 p-6 shadow-2xl"
      },
      React.createElement(
        "div",
        { className: "mb-6" },
        React.createElement(
          "h2",
          { className: "text-2xl font-bold tracking-wide text-yellow-300" },
          "Choose Your Shinobi"
        ),
        React.createElement(
          "p",
          { className: "mt-1 text-sm text-gray-300" },
          "Begin your mission as one of Konoha's elite. Each hero comes with unique strengths and starting attributes."
        )
      ),
      React.createElement(
        "div",
        { className: "grid gap-4 md:grid-cols-2" },
        optionCards
      ),
      React.createElement(
        "div",
        { className: "mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between" },
        React.createElement(
          "div",
          { className: "flex flex-col gap-1 text-xs text-gray-400" },
          footerText,
          errorMessage
            ? React.createElement(
                "span",
                { className: "text-sm font-semibold text-red-300" },
                errorMessage
              )
            : null
        ),
        React.createElement(
          "div",
          { className: "flex justify-end gap-3" },
          React.createElement(
            "button",
            {
              type: "button",
              onClick: onCancel,
              className: "rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-400 hover:text-white"
            },
            "Cancel"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: onConfirm,
              disabled: !selected,
              className: confirmButtonClass
            },
            selected ? `Start as ${selected.name}` : "Select a shinobi"
          )
        )
      )
    )
  );
};

export default CharacterSelectModal;

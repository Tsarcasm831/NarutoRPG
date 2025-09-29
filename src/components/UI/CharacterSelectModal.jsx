import React from "react";

const CharacterSelectModal = ({ options = [], selectedKey, onSelect, onConfirm, onCancel }) => {
  const selected = options.find((option) => option.key === selectedKey);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-yellow-500/60 bg-gray-950/95 p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-wide text-yellow-300">Choose Your Shinobi</h2>
          <p className="mt-1 text-sm text-gray-300">
            Begin your mission as one of Konoha&apos;s elite. Each hero comes with unique strengths and starting attributes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option) => {
            const isSelected = option.key === selectedKey;
            const portrait = option.mugshot || "/src/assets/images/mugshots/kakashi.png";
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect && onSelect(option.key)}
                className={`group flex h-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-yellow-400/80 bg-yellow-500/10 shadow-lg"
                    : "border-gray-700 bg-gray-900/60 hover:border-yellow-600 hover:bg-gray-900/80"
                }`}
              >
                <img
                  src={portrait}
                  alt={option.name}
                  className="h-20 w-20 flex-shrink-0 rounded-lg border border-gray-700 object-cover"
                />
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-yellow-400">{option.codename}</p>
                    <p className="text-lg font-semibold text-white">{option.name}</p>
                  </div>
                  <p className="text-sm leading-snug text-gray-300">
                    {option.description}
                  </p>
                  {Array.isArray(option.tags) && option.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {option.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-gray-400">
            {selected ? `Ready to deploy as ${selected.name}.` : "Select a shinobi to begin the mission."}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selected}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "cursor-not-allowed bg-gray-700 text-gray-400"
              }`}
            >
              {selected ? `Start as ${selected.name}` : "Select a shinobi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectModal;

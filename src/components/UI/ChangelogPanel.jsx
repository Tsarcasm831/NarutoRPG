import React from "react";

// Derive latest version from the HTML title or file name, mirroring MainMenu logic.
// Returns a version string WITHOUT the leading 'v' so that other UI can prefix it as needed.
const deriveLatestVersion = () => {
  try {
    const title = typeof document !== "undefined" ? (document.title || "") : "";
    // Prefer a token starting with 'v' followed by a digit, then strip the leading 'v'.
    let m = title.match(/\bv\d[\w\.\-\s\[\]\(\)]+/i);
    if (m && m[0]) return m[0].replace(/^\s*v/i, "").trim();
    // Fallback: parse from the file name (e.g., Naruto RPG v0.010.000 [Alpha].html)
    const file = (typeof location !== "undefined" ? (location.pathname.split("/").pop() || "") : "").replace(/\.(html?)$/i, "");
    m = file.match(/\bv\d[\w\.\-\s\[\]\(\)]+/i);
    if (m && m[0]) return m[0].replace(/^\s*v/i, "").trim();
    // Final attempt: bare x.y.z pattern (plus optional suffixes)
    const m2 = (title || file).match(/\d+\.\d+\.\d+(?:[\w\.\-\s\[\]\(\)]*)?/);
    if (m2 && m2[0]) return m2[0].trim();
  } catch (_) {}
  // Fallback to previous default if nothing found
  return "0.009.000 [Alpha]";
};

const LATEST_VERSION = deriveLatestVersion();

// Keep newest entry first so OpenWorldGame can read the latest version
export const changelogData = [
  {
    version: "0.012",
    date: "2025-10-05",
    changes: [
      "Main Menu: Added shinobi picker alongside new Showcase gallery and Planned Improvements modal.",
      "Multiplayer: Synced party spawns/movement through Websim presence so friends load into the same world.",
      "NPCs: Introduced Orochimaru and Neji with expanded wander/dialog flows and local mugshots.",
      "Movement/Collision: Tightened strafe displacement, scaled actors, and matched FPV eye height to new proportions.",
      "Loading: Spawn squadmates together, keep pointer lock during dialog, and streamline the progress overlay.",
      "Audio: Added the 'Akatsuki Theme' to the background music rotation.",
      "Docs: Expanded README guidance covering setup, features, and contributor workflow."
    ]
  },
  // Previous (kept intact): 2025-09-27
  {
    version: "0.011.000",
    date: "2025-09-27",
    changes: [
      "NPC Models: Updated assets/rigging; standardized scale and origin for consistent placement.",
      "NPC Interactions: Improved context-sensitive prompts and fixed cases where prompts failed to appear/dismiss.",
      "NPC Wander: Added/refined idle→roam→pause states with smoother pathing and waypoint jitter reduction; area bounds to keep NPCs in-zone.",
      "Camera: Fixed rotation when exiting FPV so the camera no longer snaps ~180° off the expected facing."
    ]
  },
  // Previous (kept intact): 2025-09-19
  {
    version: LATEST_VERSION,
    date: "2025-09-19",
    changes: [
      "Defaulted controls and UI to desktop-first experience.",
      "Switched Hospital model to local asset to resolve CORS issues.",
      "Updated version labels across UI for consistency.",
      "Pause menu Backquote toggle now exits pointer lock, sets a global pause flag, and suppresses gameplay input while paused.",
      "Map: Named and color-coded Market/Guard districts; added several residential presets.",
      "Map: Increased street widths (3 → 4) and corrected SVG attribute usage (stroke-width).",
      "Map: Secondary road pattern now uses dirt path texture (rotated) for better visual flow.",
      "Roads (Canvas): Dynamic width/color mapping by road tier; texture overlay blended for depth.",
      "Assets: Added src/assets/textures/dirt_path_texture.png and new district building JSON files.",
      ".htaccess: SPA routing fallback and CORS headers for common static assets and preflight.",
      "Inventory: New inventoryUtils computes live total weight/value and average condition.",
      "Inventory: Equipment/Storage slots show invalid-drop feedback (shake + red glow); better DnD handling.",
      "Inventory: Weight bar and currency formatting improved; quality/condition display added.",
      "Potions: Left-click now uses a potion (keyboard accessible via Enter/Space).",
      "HUD: Controls hint visibility persists via localStorage; auto-hide respects current state.",
      "Main Menu: Welcome dismissal persists; Map modal gains focus trap, Escape behavior, and focus restore.",
      "Loading: Respects prefers-reduced-motion; progress bar transitions are reduced when requested.",
      "Controls: Opening panels releases pointer lock to free the cursor in gameplay.",
      "Styles: Added inventory-slot-shake keyframes and invalid-drop-shake utility class.",
      "Misc: Minor UI polish and consistency updates across panels."
    ]
  },
  { version: "0.007.5", date: "2025-08-16", changes: [
    "Version set to 0.007.5.",
    "Changelog updated with latest changes.",
    "UI version label is now tweakable (VERSION_PREFIX / OVERRIDE_VERSION)."
  ] },
  { version: "0.007.4", date: "2025-08-15", changes: [
    "Collision: Round Konoha buildings now use precise spherical colliders.",
    "Credits: Added cooroinuzuka (DeviantArt) link to Credits and Special Thanks.",
    "Mobile: Fixed joystick vertical inversion and restored free-look; no longer forces south.",
    "FPV: Corrected mouse-look direction and preserved facing when entering/exiting FPV.",
    "UX: Version and changelog updated."
  ] },
  { version: "0.006.1", date: "2025-08-14", changes: [
    "Walls: South opening cut cleanly and Konoha Gates placed; sealed stray gaps on the East side.",
    "Movement: WASD made camera-relative in both 3rd and 1st person; right-click drag (desktop) and cam pad (mobile) control yaw/pitch.",
    "Feature: First-person view toggle (V) with pointer lock; auto-hide player model in FPV.",
    "UX: Nearby object tooltips (pooled sprites) and on-screen interaction prompt (F).",
    "Performance: Grid labels virtualized, bound to terrain, fixed 5u cells; wall details instanced; FPS limit + render scale cap.",
    "Assets: Loader caches only essential player animations and core images for faster startup.",
    "World: Hokage Palace, Hokage Monument, Ichiraku, Town cluster integrated with precise colliders.",
    "Mobile: Pinch-to-zoom, refined joystick smoothing; improved camera pad responsiveness."
  ] },
  { version: "0.004.0", date: "2025-08-11", changes: [
    "Movement: W now always moves the player forward relative to the direction they are facing.",
    "Movement: A and D are strafe-only and no longer rotate the player.",
    "Movement: Player now faces the direction of travel; fixed D moving opposite/right issues.",
    "Camera: Player rotation and camera orbit are unified to feel consistent.",
    "Feature: First-person view toggle (V). Uses pointer lock with mouse-look.",
    "UX: Interaction prompt shows ‘Press F to interact (Name)’ for nearby objects.",
    "World: Ichiraku Ramen is now placed in the world at LF480 (with collider).",
    "World: Hokage Palace placed at KN182 with detailed colliders.",
    "World: Hokage Monument GLB placed at KN129 and scaled up."
  ] },
  { version: "0.003.9", date: "2025-08-11", changes: [
    "Version bump to 0.003.9.",
    "Added Ichiraku Ramen shop prototype (ichiraku.js) — file only, not yet integrated into the world."
  ] },
  { version: "0.002.51", date: "2025-08-09", changes: [
    "Performance: Capped renderer pixel ratio via Settings → Render Scale (default 1.25x).",
    "Performance: Minimap/HUD updates throttled to ~12 FPS.",
    "Performance: Central wall details (crenellations, buttresses) converted to InstancedMesh (massive draw-call reduction).",
    "Performance: Slightly reduced wall segment count for smoother rendering.",
    "Quality: Settings panel exposes Render Scale control."
  ] },
  { version: "0.002.5", date: "2025-08-09", changes: [
    "Version bump and new changelog entry.",
    "Jump animation now immediately transitions to walk/run/idle upon landing.",
    "Grid labels are bound to terrain height and grid cell size is locked.",
    "Second loading overlay stays visible until the 3D scene and player are fully ready.",
    "Prevented scene re-initialization when moving (no reload on movement).",
    "Updated splash and main menu backgrounds; added Credits modal."
  ] },
  { version: "0.002.1", date: "Upcoming", changes: [
    "Added basic combat moves: Attack (F) and Dodge (Ctrl).",
    "Animation system now handles one-shot actions, preventing movement during attacks/dodges.",
    "Integrated a wider range of animations to make the player more dynamic."
  ] },
  { version: "0.001.6", date: "Upcoming", changes: [
    "Added Main Menu with game start, options, and changelog.",
    "Implemented asset pre-loading for smoother game start."
  ] },
  { version: "0.001.5", date: "2024-05-22", changes: [
    "Implemented asset downloader and caching system.",
    "Added diverse terrain types (sand, snow, rocky, forest).",
    "Player can now jump with Spacebar and gravity feels more responsive."
  ] },
  { version: "0.001.4", date: "2024-05-21", changes: [
    "Added mobile joystick controls (toggle with Z key).",
    "Unified movement speed for both keyboard and joystick.",
    "Fixed inverted vertical axis on joystick."
  ] },
  { version: "0.001.3", date: "2024-05-20", changes: [
    "Renamed MP to Chakra across all UI elements.",
    "Added character panel (C), inventory (I), map (M), and settings (P) panels."
  ] }
];

const CHANGELOG_SOURCE_CANDIDATES = [
  "changes.md",
  "./changes.md",
  "/changes.md"
];

const ChangelogPanel = ({ onClose }) => {
  const h = React.createElement;
  const [content, setContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [sourceUrl, setSourceUrl] = React.useState(null);

  React.useEffect(() => {
    let isActive = true;
    const loadChanges = async () => {
      setIsLoading(true);
      setError(null);
      let lastError = null;
      for (const candidate of CHANGELOG_SOURCE_CANDIDATES) {
        try {
          const response = await fetch(candidate, { cache: "no-store" });
          if (!response.ok) {
            lastError = new Error(`Request failed with status ${response.status}`);
            continue;
          }
          const text = await response.text();
          if (!isActive) {
            return;
          }
          setContent(text.replace(/\r\n/g, "\n"));
          setSourceUrl(candidate);
          setIsLoading(false);
          return;
        } catch (fetchError) {
          lastError = fetchError;
        }
      }
      if (!isActive) {
        return;
      }
      setError(lastError || new Error("Unable to load changes.md"));
      setIsLoading(false);
    };

    loadChanges();
    return () => {
      isActive = false;
    };
  }, []);

  const renderBody = () => {
    if (isLoading) {
      return h(
        "div",
        { className: "flex items-center justify-center h-full text-gray-300" },
        "Loading changes.md…"
      );
    }

    if (error) {
      return h(
        "div",
        { className: "space-y-3" },
        [
          h(
            "p",
            { key: "error", className: "text-red-300" },
            "We couldn't load changes.md right now."
          ),
          h(
            "p",
            { key: "details", className: "text-sm text-gray-300" },
            error?.message || "Unknown error"
          )
        ]
      );
    }

    return h(
      "article",
      {
        className:
          "font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-100 bg-gray-900/60 border border-gray-700 rounded-lg p-4"
      },
      content.trimEnd()
    );
  };

  const footerLink = sourceUrl
    ? h(
        "a",
        {
          key: "open",
          href: sourceUrl,
          target: "_blank",
          rel: "noreferrer",
          className: "text-sm text-yellow-300 hover:text-yellow-200 underline"
        },
        "Open changes.md in a new tab"
      )
    : null;

  return h(
    "div",
    { className: "fixed inset-0 z-50 flex items-center justify-center" },
    [
      h("div", { key: "backdrop", className: "absolute inset-0 bg-black bg-opacity-60", onClick: onClose }),
      h(
        "div",
        {
          key: "panel",
          className:
            "relative bg-gray-900 text-white border-2 border-yellow-600 rounded-xl shadow-2xl overflow-hidden w-[95vw] max-w-[720px] h-[80vh]"
        },
        [
          h(
            "div",
            { key: "header", className: "flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700" },
            [
              h("h2", { key: "title", className: "text-yellow-400 font-bold text-xl" }, "changes.md"),
              h(
                "button",
                {
                  key: "close",
                  onClick: onClose,
                  className: "text-red-400 hover:text-red-300 text-2xl font-bold w-10 h-10 -mr-2 flex items-center justify-center",
                  "aria-label": "Close changes.md",
                  title: "Close"
                },
                "\u00D7"
              )
            ]
          ),
          h(
            "div",
            { key: "content", className: "p-5 h-[calc(80vh-56px)] overflow-y-auto" },
            [renderBody(), footerLink
              ? h(
                  "div",
                  { key: "footer", className: "mt-4" },
                  footerLink
                )
              : null]
          )
        ]
      )
    ]
  );
};

export default ChangelogPanel;

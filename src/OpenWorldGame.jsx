import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from "/map/defaults/full-default-model.js";
import { initialPlayerStats, initialInventory } from "./game/initialState.js";
import { addExperience, ensureExperienceConsistency, xpForLevel } from "./game/experience.js";
import { useThreeScene } from "./hooks/useThreeScene.js";
import { usePlayerControls } from "./hooks/usePlayerControls.js";
import { useWorldEvents } from "./hooks/useWorldEvents.js";
import { initializeAssetLoader, startCaching } from "./utils/assetLoader.js";
import { loadDistrictLayouts } from "./utils/districtLayouts.js";
import { prefetchLocationAssets } from "../scripts/prefetchLocationAssets.js";
import { MainMenu } from "./components/UI/MainMenu.jsx";
import { LoadingScreen } from "./components/UI/LoadingScreen.jsx";
import MusicPlayer from "./components/UI/MusicPlayer.jsx";
import CharacterPanel from "./components/UI/CharacterPanel.jsx";
import { InventoryPanel } from "./components/UI/InventoryPanel.jsx";
import { WorldMapPanel } from "./components/UI/WorldMapPanel.jsx";
import { HUD } from "./components/UI/HUD.jsx";
import { WorldEventOverlay } from "./components/UI/world/WorldEventOverlay.jsx";
import NpcInteractionModal from "./components/UI/NpcInteractionModal.jsx";
import QuestLogPanel from "./components/UI/QuestLogPanel.jsx";
import { createInitialQuests } from "./game/quests.js";
import SettingsPanel from "./components/UI/SettingsPanel.jsx";
import ChangelogPanel from "./components/UI/ChangelogPanel.jsx";
import ErrorBoundary from "./components/UI/ErrorBoundary.jsx";
import { MobileControls } from "./components/UI/MobileControls.jsx";
import CreditsPanel from "./components/UI/CreditsPanel.jsx";
import AnimationsPanel from "./components/UI/AnimationsPanel.jsx";
import KakashiAnimationsModal from "./components/UI/KakashiAnimationsModal.jsx";
import { changelogData } from "./components/UI/ChangelogPanel.jsx";
import PauseMenu from "./components/UI/PauseMenu.jsx";
import HokageOfficeModal from "./components/UI/HokageOfficeModal.jsx";
import KitbashBuildingModal from "./components/UI/KitbashBuildingModal.jsx";
import JutsuModal from "./components/UI/JutsuModal.jsx";
import { preloadMusic, musicPlay, musicPause, musicState } from "./utils/musicManager.js";
import { useGameTime } from "./hooks/useGameTime.js";
const VERSION_PREFIX = "v";
const OVERRIDE_VERSION = null;
const OpenWorldGame = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState("MainMenu");
  const [timeResetKey, setTimeResetKey] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [version, setVersion] = useState("");
  const [gameReady, setGameReady] = useState(false);
  useEffect(() => {
    // Prefer version derived from the HTML page title (e.g., "Naruto RPG v0.010.000 [Alpha]")
    let label = "";
    try {
      const title = typeof document !== "undefined" ? (document.title || "") : "";
      // Extract a token that starts with 'v' followed by a digit, and then allow common version suffix characters
      // Example matches: "v0.010.000", "v0.010.000 [Alpha]", "v1.2.3-beta"
      let m = title.match(/\bv\d[\w\.\-\s\[\]\(\)]+/i);
      if (m && m[0]) {
        label = m[0].trim();
      } else {
        // Try to parse from the file name (e.g., Naruto RPG v0.010.000 [Alpha].html)
        const file = (typeof location !== "undefined" ? (location.pathname.split("/").pop() || "") : "").replace(/\.(html?)$/i, "");
        m = file.match(/\bv\d[\w\.\-\s\[\]\(\)]+/i);
        if (m && m[0]) {
          label = m[0].trim();
        } else {
          // Fallback: try to find a bare x.y.z pattern and prefix with 'v'
          const m2 = (title || file).match(/\d+\.\d+\.\d+(?:[\w\.\-\s\[\]\(\)]*)?/);
          if (m2 && m2[0]) label = `${VERSION_PREFIX}${m2[0].trim()}`;
        }
      }
    } catch (_) {}
    if (!label) {
      // Final fallback: use the latest entry from the changelog (preserves previous behavior)
      const latest = changelogData?.[0]?.version || "";
      label = OVERRIDE_VERSION != null && OVERRIDE_VERSION !== "" ? OVERRIDE_VERSION : latest ? `${VERSION_PREFIX}${latest}` : "";
    }
    setVersion(label);
  }, []);
  const [playerStats, setPlayerStats] = useState(() => ensureExperienceConsistency(initialPlayerStats));
  const [inventory, setInventory] = useState(initialInventory);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 0 });
  const [worldObjects, setWorldObjects] = useState([]);
  const [settings, setSettings] = useState({
    // Defaults tuned for performance; you can raise these in Settings if your device allows
    shadows: false,
    shadowQuality: "low",
    antialiasing: true,
    grid: false,
    objectDensity: "medium",
    fpsLimit: "60 FPS",
    // Lower default render scale for better FPS; adjustable in Settings
    maxPixelRatio: 1,
    // Minimap settings
    minimap: { enabled: true, showGrid: true, showInfo: true, opacity: 0.9, size: 128 }
  });
  const [showCharacter, setShowCharacter] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAnimations, setShowAnimations] = useState(false);
  const [showKakashi, setShowKakashi] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showHokageOffice, setShowHokageOffice] = useState(false);
  const [showKitbashModal, setShowKitbashModal] = useState(false);
  const [kitbashDetails, setKitbashDetails] = useState(null);
  const [showJutsuModal, setShowJutsuModal] = useState(false);
  const [quests, setQuests] = useState(() => createInitialQuests());
  // In-game time must be computed before passing to world events
  const { timeOfDayHours, formattedTime: gameClock } = useGameTime({ isRunning: gameState === "Playing", initialHour: 8, resetKey: timeResetKey });
  const { worldState, eventOverlay, acknowledgeEvent, dismissEventOverlay, activeEvent, upcomingEvent, nextEventCountdownMs } = useWorldEvents({ gameState, timeOfDayHours });
  const uiState = {
    setShowCharacter,
    setShowInventory,
    setShowWorldMap,
    setShowSettings,
    setShowMobileControls,
    setShowAnimations,
    setShowJutsuModal,
    setShowKakashi,
    setShowQuests,
    gameState,
    setSettings,
    /* NEW: expose pause setter to controls */
    setShowPause: setShowPauseMenu
  };
  const xpMultiplier = Math.max(0, Number(worldState?.buffs?.xpMultiplier) || 1);
  const gainExperience = useCallback((amount) => {
    const effective = Math.max(0, Math.round((Number(amount) || 0) * xpMultiplier));
    if (effective <= 0) return;
    setPlayerStats((prev) => {
      const { stats } = addExperience(prev, effective);
      return stats;
    });
  }, [xpMultiplier]);
  const keysRef = usePlayerControls({ ...uiState, onGainExperience: gainExperience });
  const joystickRef = useRef(null);
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const { playerRef, zoomRef, cameraOrbitRef, cameraPitchRef } = useThreeScene({ mountRef, keysRef, joystickRef, setPlayerPosition, settings, setWorldObjects, isPlaying: gameState === "Playing", onReady: useCallback(() => setGameReady(true), []), worldState, timeOfDayHours });
  const musicWasPlayingRef = useRef(false);
  const [showNpcDialog, setShowNpcDialog] = useState(false);
  const [npcDialogData, setNpcDialogData] = useState(null);
  const releasePauseMenu = useCallback(() => {
    const wasPausedBefore = window.__pauseMenuWasPausedBefore;
    delete window.__pauseMenuActive;
    if (!wasPausedBefore) {
      window.__gamePaused = false;
    }
    delete window.__pauseMenuWasPausedBefore;
  }, []);
  useEffect(() => {
    const open = () => {
      window.__gamePaused = true;
      setShowHokageOffice(true);
      try {
        if (document.pointerLockElement) document.exitPointerLock();
      } catch (_) {
      }
      try {
        musicWasPlayingRef.current = !!musicState().isPlaying;
        musicPause();
      } catch (_) {
      }
    };
    window.addEventListener("open-hokage-office", open);
    const openKit = (e) => {
      window.__gamePaused = true;
      setKitbashDetails(e?.detail || null);
      setShowKitbashModal(true);
    };
    window.addEventListener("open-kitbash-building", openKit);
    const openNpc = (e) => {
      // Do not pause the game or music for NPC dialog
      setNpcDialogData(e?.detail || null);
      setShowNpcDialog(true);
      try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
    };
    window.addEventListener("open-npc-dialog", openNpc);
    return () => {
      window.removeEventListener("open-hokage-office", open);
      window.removeEventListener("open-kitbash-building", openKit);
      window.removeEventListener("open-npc-dialog", openNpc);
    };
  }, []);
  const handleStartGame = async () => {
    setTimeResetKey((key) => key + 1);
    setGameReady(false);
    setGameState("Loading");
    if (!window.assetLoaderInitialized) {
      await initializeAssetLoader();
      window.assetLoaderInitialized = true;
    }
    const seg = (start, span) => (p) => {
      const v = Math.max(0, Math.min(100, Number(p) || 0));
      const mapped = Math.round(start + v / 100 * span);
      setLoadingProgress(mapped);
    };
    setLoadingProgress(0);
    try {
      await prefetchLocationAssets(seg(0, 30));
    } catch (e) {
      // Ensure progress advances even if prefetch fails (e.g., no Cache API)
      try { seg(0, 30)(100); } catch (_) {}
    }
    try {
      await startCaching(seg(30, 50));
    } catch (e) {
      // Ensure progress advances even if caching fails
      try { seg(30, 50)(100); } catch (_) {}
    }
    try {
      await preloadMusic(seg(80, 20));
    } catch (_) {
    }
    try {
      const ids = Object.keys(MAP_DEFAULT_MODEL?.districts || {}).filter((id) => {
        const low = String(id).toLowerCase();
        return low.startsWith("district") || low.startsWith("residential") || low.startsWith("hyuuga");
      });
      await loadDistrictLayouts(ids);
    } catch (_) {
    }
    setGameState("Playing");
    try {
      musicPlay();
    } catch (_) {
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "relative w-full h-screen overflow-hidden bg-black", children: [
    gameState === "MainMenu" && /* @__PURE__ */ jsxDEV(MainMenu, { version, onStart: handleStartGame, onOptions: () => setShowSettings(true), onChangelog: () => setShowChangelog(true), onCredits: () => setShowCredits(true) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 54,
      columnNumber: 9
    }),
    gameState === "Playing" && showQuests && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(QuestLogPanel, { quests, setQuests, onClose: () => setShowQuests(false), setPlayerStats, setInventory, addExperience: gainExperience }, void 0, false, { fileName: "<stdin>", lineNumber: 65, columnNumber: 44 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 65, columnNumber: 27 }),
    // Show initial asset caching progress
    gameState === "Loading" && /* @__PURE__ */ jsxDEV(LoadingScreen, { progress: loadingProgress }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 55,
      columnNumber: 9
    }),
    // Mount the 3D scene
    gameState === "Playing" && /* @__PURE__ */ jsxDEV("div", { ref: mountRef, className: "w-full h-full" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 58,
      columnNumber: 9
    }),
    // Keep a second loading overlay visible until the scene/player is fully ready
    gameState === "Playing" && !gameReady && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 z-30", children: /* @__PURE__ */ jsxDEV(LoadingScreen, { progress: 100 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 61,
      columnNumber: 62
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 61,
      columnNumber: 27
    }),
    gameState === "Playing" && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(HUD, { playerStats, playerRef, worldObjects, zoomRef, settings, worldState, activeEvent, upcomingEvent, nextEventCountdownMs, timeOfDayHours, gameClock }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 63,
      columnNumber: 38
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 63,
      columnNumber: 9
    }),
    gameState === "Playing" && /* @__PURE__ */ jsxDEV(MusicPlayer, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 64,
      columnNumber: 9
    }),
    /* NEW: Pause Menu overlay */
    gameState === "Playing" && showPauseMenu && /* @__PURE__ */ jsxDEV(PauseMenu, {
      onResume: () => {
        releasePauseMenu();
        setShowPauseMenu(false);
      },
      onOptions: () => {
        setShowSettings(true);
      },
      onExitToMenu: () => {
        releasePauseMenu();
        setShowPauseMenu(false);
        setShowSettings(false);
        setShowCharacter(false);
        setShowInventory(false);
        setShowWorldMap(false);
        setShowAnimations(false);
        setGameState("MainMenu");
      }
    }, void 0, false),
    gameState === "Playing" && (isTouchDevice || showMobileControls) && /* @__PURE__ */ jsxDEV(MobileControls, {
      joystickRef,
      keysRef,
      zoomRef,
      cameraOrbitRef,
      cameraPitchRef,
      onOpenInventory: () => setShowInventory(true),
      onOpenCharacter: () => setShowCharacter(true)
    }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 62,
      columnNumber: 27
    }),
    gameState === "Playing" && showCharacter && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(CharacterPanel, { playerStats, onClose: () => setShowCharacter(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 65,
      columnNumber: 44
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 65,
      columnNumber: 27
    }),
    gameState === "Playing" && showInventory && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(InventoryPanel, { inventory, setInventory, onClose: () => setShowInventory(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 66,
      columnNumber: 44
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 66,
      columnNumber: 27
    }),
    gameState === "Playing" && showWorldMap && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(WorldMapPanel, { playerPosition, onClose: () => setShowWorldMap(false), worldObjects }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 43
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 26
    }),
    showSettings && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(SettingsPanel, { settings, setSettings, onClose: () => setShowSettings(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 69,
      columnNumber: 36
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 69,
      columnNumber: 21
    }),
    showChangelog && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(ChangelogPanel, { onClose: () => setShowChangelog(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 70,
      columnNumber: 38
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 70,
      columnNumber: 23
    }),
    showCredits && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(CreditsPanel, { onClose: () => setShowCredits(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 71,
      columnNumber: 36
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 71,
      columnNumber: 21
    }),
    gameState === "Playing" && showAnimations && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(AnimationsPanel, { playerRef, onClose: () => setShowAnimations(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 72,
      columnNumber: 51
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 72,
      columnNumber: 34
    }),
    gameState === "Playing" && showKakashi && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(KakashiAnimationsModal, { onClose: () => setShowKakashi(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 73,
      columnNumber: 56
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 73,
      columnNumber: 39
    }),
    /* NEW: Hokage Office Modal */
    gameState === "Playing" && showHokageOffice && /* @__PURE__ */ jsxDEV(HokageOfficeModal, { onClose: () => {
      window.__gamePaused = false;
      setShowHokageOffice(false);
      try {
        if (musicWasPlayingRef.current) {
          musicPlay();
        }
      } catch (_) {
      }
      musicWasPlayingRef.current = false;
    } }, void 0, false),
    /* NEW: Kitbash Building Modal */
    gameState === "Playing" && showKitbashModal && /* @__PURE__ */ jsxDEV(KitbashBuildingModal, { details: kitbashDetails, onClose: () => {
      window.__gamePaused = false;
      setShowKitbashModal(false);
      setKitbashDetails(null);
    } }, void 0, false),
    /* NEW: Jutsu Modal */
    gameState === "Playing" && showJutsuModal && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(JutsuModal, { onClose: () => setShowJutsuModal(false) }, void 0, false) }, void 0, false),
    /* NEW: NPC Interaction Modal */
    gameState === "Playing" && showNpcDialog && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(NpcInteractionModal, { onClose: () => {
      // Close NPC dialog without touching global pause/music
      setShowNpcDialog(false);
      setNpcDialogData(null);
      // Release interaction lock if set
      try { if (window.__npcInteracting) { window.__npcInteracting.userData.interacting = false; delete window.__npcInteracting; } } catch (_) {}
    }, npcName: (npcDialogData == null ? void 0 : npcDialogData.npc) || "NPC", npcImage: (npcDialogData == null ? void 0 : npcDialogData.npcImage) || "", playerName: (npcDialogData == null ? void 0 : npcDialogData.player) || "You", playerImage: (npcDialogData == null ? void 0 : npcDialogData.playerImage) || "", lines: (npcDialogData == null ? void 0 : npcDialogData.lines) || [] }, void 0, false) }, void 0, false),
    eventOverlay && /* @__PURE__ */ jsxDEV(WorldEventOverlay, { overlay: eventOverlay, onConfirm: acknowledgeEvent, onDismiss: dismissEventOverlay }, void 0, false)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 52,
    columnNumber: 5
  });
};
var stdin_default = OpenWorldGame;
export {
  stdin_default as default
};

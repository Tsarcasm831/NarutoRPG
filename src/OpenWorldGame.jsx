import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from "/map/defaults/full-default-model.js";
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
import CharacterSelectModal from "./components/UI/CharacterSelectModal.jsx";
import { PLAYER_CHARACTERS, getCharacterByKey, getDefaultCharacter, buildStatsForCharacter, buildInventoryForCharacter } from "./game/player/characterCatalog.js";
import { setPlayerIdentity } from "./game/player/identity.js";
import { multiplayerManager } from "./network/multiplayerManager.js";
const VERSION_PREFIX = "v";
const OVERRIDE_VERSION = null;
const OpenWorldGame = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState("MainMenu");
  const [timeResetKey, setTimeResetKey] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [version, setVersion] = useState("");
  const [gameReady, setGameReady] = useState(false);
  const defaultCharacter = React.useMemo(() => getDefaultCharacter(), []);
  const [selectedCharacterKey, setSelectedCharacterKey] = useState(defaultCharacter.key);
  const [characterChoice, setCharacterChoice] = useState(defaultCharacter.key);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
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
  useEffect(() => {
    setPlayerIdentity(defaultCharacter);
  }, [defaultCharacter]);
  useEffect(() => {
    let cleaned = false;
    multiplayerManager.connect();
    return () => {
      if (!cleaned) {
        cleaned = true;
        multiplayerManager.cleanup();
      }
    };
  }, []);
  const [playerStats, setPlayerStats] = useState(() => ensureExperienceConsistency(buildStatsForCharacter(defaultCharacter.key)));
  const [inventory, setInventory] = useState(() => buildInventoryForCharacter(defaultCharacter.key));
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
  const updateLoadingStep = useCallback((id, partial = {}) => {
    setLoadingSteps((steps) => {
      if (!Array.isArray(steps) || steps.length === 0) return steps;
      let changed = false;
      const next = steps.map((step) => {
        if (step.id !== id) return step;
        changed = true;
        return { ...step, ...partial };
      });
      return changed ? next : steps;
    });
  }, []);
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
  const reportBootStatus = useCallback((stepId, status, payload) => {
    if (stepId !== 'squad') return;
    const fallbackRoster = ['Naruto', 'Sasuke', 'Sakura', 'Shikamaru', 'Neji', 'Orochimaru'];
    const roster = Array.isArray(payload?.roster) && payload.roster.length ? payload.roster : fallbackRoster;
    if (status === 'active') {
      const note = roster.length
        ? `Summoning ${roster.join(', ')} nearby...`
        : 'Deploying support squad...';
      updateLoadingStep('squad', { status: 'active', note });
      setLoadingProgress((prev) => Math.max(prev, 99));
      return;
    }
    if (status === 'done') {
      const note = roster.length ? 'Squad assembled.' : 'Ready for deployment.';
      updateLoadingStep('squad', { status: 'done', note });
      setLoadingProgress((prev) => Math.max(prev, 100));
      return;
    }
    if (status === 'error') {
      const rejected = Array.isArray(payload?.rejected) ? payload.rejected : [];
      const failed = rejected.map(({ index }) => roster[index] || `NPC ${index + 1}`).filter(Boolean);
      const note = failed.length ? `Failed to spawn: ${failed.join(', ')}.` : 'One or more squad members failed to spawn.';
      updateLoadingStep('squad', { status: 'error', note });
      setLoadingProgress((prev) => Math.max(prev, 100));
    }
  }, [updateLoadingStep, setLoadingProgress]);
  const handleSceneReady = useCallback(() => {
    setGameReady(true);
  }, []);
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const { playerRef, zoomRef, cameraOrbitRef, cameraPitchRef } = useThreeScene({ mountRef, keysRef, joystickRef, setPlayerPosition, settings, setWorldObjects, isPlaying: gameState === "Playing", onReady: handleSceneReady, worldState, timeOfDayHours, reportBootStatus });
  useEffect(() => {
    const identity = getCharacterByKey(selectedCharacterKey);
    multiplayerManager.setIdentity(identity.key, identity.name);
  }, [selectedCharacterKey]);
  useEffect(() => {
    if (gameState !== "Playing") {
      return;
    }

    let cancelled = false;
    let frameId = null;

    const attemptRegister = () => {
      if (cancelled) return;
      const player = playerRef.current;
      if (!player || !player.userData?.assetsReady) {
        frameId = requestAnimationFrame(attemptRegister);
        return;
      }

      const identity = getCharacterByKey(selectedCharacterKey);
      multiplayerManager.registerLocalPlayer(player, identity.key, identity.name);
    };

    frameId = requestAnimationFrame(attemptRegister);

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [gameState, selectedCharacterKey, playerRef]);
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
      // Keep FPV active: do NOT release pointer lock here so interacting in FPV doesn't dump to third-person.
      setNpcDialogData(e?.detail || null);
      setShowNpcDialog(true);
    };
    window.addEventListener("open-npc-dialog", openNpc);
    return () => {
      window.removeEventListener("open-hokage-office", open);
      window.removeEventListener("open-kitbash-building", openKit);
      window.removeEventListener("open-npc-dialog", openNpc);
    };
  }, []);
  const getInitialLoadingSteps = React.useCallback(() => ([
    {
      id: 'prefetch',
      label: 'Surveying village terrain',
      description: 'Prefetching location caches and terrain metadata around Konoha.',
      status: 'pending'
    },
    {
      id: 'cache',
      label: 'Stocking asset cache',
      description: 'Streaming character models, props, and textures into local memory.',
      status: 'pending'
    },
    {
      id: 'audio',
      label: 'Priming soundtrack',
      description: 'Buffering key music tracks so the score can start immediately.',
      status: 'pending'
    },
    {
      id: 'layouts',
      label: 'Organizing districts',
      description: 'Loading district layout plans for Hidden Leaf neighborhoods.',
      status: 'pending'
    },
    {
      id: 'squad',
      label: 'Summoning your squad',
      description: 'Positioning Naruto, Sasuke, Sakura, Shikamaru, Neji, and Orochimaru nearby.',
      status: 'pending'
    }
  ]), []);

  const handleStartGameRequest = useCallback(() => {
    setLoadingSteps(getInitialLoadingSteps());
    setLoadingProgress(0);
    setGameReady(false);
    setCharacterChoice(selectedCharacterKey);
    setGameState("Loading");
    setShowCharacterSelect(true);
  }, [getInitialLoadingSteps, selectedCharacterKey]);

  const runGameLoading = useCallback(async (characterKey) => {
    setSelectedCharacterKey(characterKey);
    setTimeResetKey((key) => key + 1);
    setGameReady(false);
    setLoadingProgress(0);
    setLoadingSteps(getInitialLoadingSteps());

    if (!window.assetLoaderInitialized) {
      await initializeAssetLoader();
      window.assetLoaderInitialized = true;
    }

    const seg = (start, span) => (p) => {
      const v = Math.max(0, Math.min(100, Number(p) || 0));
      const mapped = Math.round(start + v / 100 * span);
      setLoadingProgress(mapped);
    };

    updateLoadingStep('prefetch', { status: 'active', note: 'Prefetching terrain tiles and location caches...' });
    try {
      await prefetchLocationAssets(seg(0, 30));
      updateLoadingStep('prefetch', { status: 'done', note: 'Terrain caches staged.' });
    } catch (e) {
      try { seg(0, 30)(100); } catch (_) {}
      updateLoadingStep('prefetch', { status: 'error', note: 'Unable to prefetch terrain; will stream live.' });
    }

    updateLoadingStep('cache', { status: 'active', note: 'Caching character rigs, props, and textures...' });
    try {
      await startCaching(seg(30, 50));
      updateLoadingStep('cache', { status: 'done', note: 'Asset cache ready.' });
    } catch (e) {
      try { seg(30, 50)(100); } catch (_) {}
      updateLoadingStep('cache', { status: 'error', note: 'Asset caching skipped; loading will continue on demand.' });
    }

    updateLoadingStep('audio', { status: 'active', note: 'Buffering soundtrack for immediate playback...' });
    try {
      await preloadMusic(seg(80, 15));
      updateLoadingStep('audio', { status: 'done', note: 'Music primed.' });
    } catch (_) {
      try { seg(80, 15)(100); } catch (_) {}
      updateLoadingStep('audio', { status: 'error', note: 'Music will stream as needed.' });
    }

    updateLoadingStep('layouts', { status: 'active', note: 'Deploying Hidden Leaf district layouts...' });
    try {
      const ids = Object.keys(MAP_DEFAULT_MODEL?.districts || {}).filter((id) => {
        const low = String(id).toLowerCase();
        return low.startsWith("district") || low.startsWith("residential") || low.startsWith("hyuuga");
      });
      await loadDistrictLayouts(ids);
      updateLoadingStep('layouts', { status: 'done', note: 'District plans applied.' });
      setLoadingProgress((prev) => Math.max(prev, 97));
    } catch (_) {
      updateLoadingStep('layouts', { status: 'error', note: 'Using fallback district layout.' });
      setLoadingProgress((prev) => Math.max(prev, 97));
    }

    setGameState("Playing");
    try {
      musicPlay();
    } catch (_) {}
  }, [getInitialLoadingSteps, updateLoadingStep]);

  const handleCharacterConfirm = useCallback(async () => {
    const chosen = getCharacterByKey(characterChoice);
    const identity = setPlayerIdentity(chosen);
    setCharacterChoice(identity.key);
    setPlayerStats(ensureExperienceConsistency(buildStatsForCharacter(identity.key)));
    setInventory(buildInventoryForCharacter(identity.key));
    setShowCharacterSelect(false);

    try {
      await runGameLoading(identity.key);
    } catch (error) {
      console.error('Failed to start game', error);
      setLoadingProgress(0);
      setLoadingSteps([]);
      setGameState('MainMenu');
    }
  }, [characterChoice, runGameLoading]);

  const handleCharacterCancel = useCallback(() => {
    setShowCharacterSelect(false);
    setCharacterChoice(selectedCharacterKey);
    setLoadingSteps([]);
    setLoadingProgress(0);
    setGameState("MainMenu");
  }, [selectedCharacterKey]);
  return /* @__PURE__ */ jsxDEV("div", { className: "relative w-full h-screen overflow-hidden bg-black", children: [
    gameState === "MainMenu" && /* @__PURE__ */ jsxDEV(MainMenu, { version, onStart: handleStartGameRequest, onOptions: () => setShowSettings(true), onChangelog: () => setShowChangelog(true), onCredits: () => setShowCredits(true) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 54,
      columnNumber: 9
    }),
    gameState === "Playing" && showQuests && /* @__PURE__ */ jsxDEV(ErrorBoundary, { children: /* @__PURE__ */ jsxDEV(QuestLogPanel, { quests, setQuests, onClose: () => setShowQuests(false), setPlayerStats, setInventory, addExperience: gainExperience }, void 0, false, { fileName: "<stdin>", lineNumber: 65, columnNumber: 44 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 65, columnNumber: 27 }),
    // Show initial asset caching progress
    gameState === "Loading" && /* @__PURE__ */ jsxDEV(LoadingScreen, { progress: loadingProgress, steps: loadingSteps }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 55,
      columnNumber: 9
    }),
    gameState === "Loading" && showCharacterSelect && /* @__PURE__ */ jsxDEV(CharacterSelectModal, { options: PLAYER_CHARACTERS, selectedKey: characterChoice, onSelect: (key) => setCharacterChoice(key), onConfirm: handleCharacterConfirm, onCancel: handleCharacterCancel }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 56,
      columnNumber: 9
    }),
    // Mount the 3D scene
    gameState === "Playing" && /* @__PURE__ */ jsxDEV("div", { ref: mountRef, className: "w-full h-full" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 58,
      columnNumber: 9
    }),
    // Keep a second loading overlay visible until the scene/player is fully ready
    gameState === "Playing" && !gameReady && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 z-30", children: /* @__PURE__ */ jsxDEV(LoadingScreen, { progress: loadingProgress, steps: loadingSteps }, void 0, false, {
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
        setLoadingSteps([]);
        setLoadingProgress(0);
        setGameReady(false);
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

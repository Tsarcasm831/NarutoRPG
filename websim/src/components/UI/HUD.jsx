import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PlayerInfo } from "./hud/PlayerInfo.jsx";
import { ControlsInfo } from "./hud/ControlsInfo.jsx";
import { Minimap } from "./hud/Minimap.jsx";
import { Compass } from "./hud/Compass.jsx";
const HUDComponent = ({ playerStats, playerRef, worldObjects, zoomRef, settings }) => {
  const [showControlsInfo, setShowControlsInfo] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowControlsInfo(false), 1e4);
    return () => clearTimeout(t);
  }, []);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* Left top cluster */
    /* Player info + Controls modal */
    /* Add a small toggle button to bring Controls back when hidden */
    /* Controls modal will auto-hide after 10 seconds */
    /* The mobile controls (joystick/buttons) are unaffected */
    /* and remain visible unless manually toggled within MobileControls */
    /* per the user's clarification */
    /* Player block */
    /* Controls block (conditional) + toggle button */
    /* Other HUD widgets remain the same */
    jsxDEV("div", { className: "absolute top-4 left-4 flex flex-col space-y-2 z-10", children: [
      jsxDEV(PlayerInfo, { playerStats }, void 0, false, { fileName: "<stdin>", lineNumber: 10, columnNumber: 17 }),
      showControlsInfo ? jsxDEV(ControlsInfo, {}, void 0, false, { fileName: "<stdin>", lineNumber: 11, columnNumber: 17 }) : jsxDEV("button", {
        onClick: () => setShowControlsInfo(true),
        className: "self-start px-2 py-1 rounded bg-black/70 text-white border border-gray-600 text-xs hover:bg-black/80",
        title: "Show controls help",
        children: "Show Controls"
      }, void 0, false, { fileName: "<stdin>", lineNumber: 12, columnNumber: 17 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 9, columnNumber: 13 }),
    /* Compass in top-center */
    jsxDEV(Compass, { playerRef }, void 0, false, { fileName: "<stdin>", lineNumber: 15, columnNumber: 13 }),
    /* Minimap pinned to top-right */
    jsxDEV(Minimap, { playerRef, worldObjects, zoomRef, minimapSettings: settings?.minimap }, void 0, false, { fileName: "<stdin>", lineNumber: 18, columnNumber: 13 })
  ] }, void 0, true, { fileName: "<stdin>", lineNumber: 8, columnNumber: 9 });
};
HUDComponent.propTypes = {
  playerStats: PropTypes.object.isRequired,
  playerRef: PropTypes.shape({ current: PropTypes.any }),
  worldObjects: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.object,
      color: PropTypes.string
    })
  ),
  zoomRef: PropTypes.shape({ current: PropTypes.any })
};
const HUD = React.memo(HUDComponent);
export {
  HUD
};

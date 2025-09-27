import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PlayerInfo } from './hud/PlayerInfo.jsx';
import { ControlsInfo } from './hud/ControlsInfo.jsx';
import { Minimap } from './hud/Minimap.jsx';
import { Compass } from './hud/Compass.jsx';
import { formatCountdownMs } from '../../utils/time.js';

const CONTROLS_STORAGE_KEY = 'hud.showControlsInfo';

function HUDComponent({
  playerStats,
  playerRef,
  worldObjects,
  zoomRef,
  settings,
  worldState,
  activeEvent,
  upcomingEvent,
  nextEventCountdownMs,
  timeOfDayHours,
  gameClock
}) {
  const [showControlsInfo, setShowControlsInfo] = useState(() => {
    if (typeof window === 'undefined') return true;
    const storedValue = window.localStorage.getItem(CONTROLS_STORAGE_KEY);
    return storedValue === null ? true : storedValue === 'true';
  });
  const [eventRemainingMs, setEventRemainingMs] = useState(null);

  const activeEventInfo = activeEvent || (worldState && worldState.activeEvent) || null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONTROLS_STORAGE_KEY, showControlsInfo ? 'true' : 'false');
  }, [showControlsInfo]);

  useEffect(() => {
    if (!showControlsInfo) return;
    const t = setTimeout(() => setShowControlsInfo(false), 10000);
    return () => clearTimeout(t);
  }, [showControlsInfo]);

  useEffect(() => {
    if (!(activeEventInfo && activeEventInfo.endsAt)) {
      setEventRemainingMs(null);
      return;
    }
    const update = () => setEventRemainingMs(Math.max(0, activeEventInfo.endsAt - Date.now()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeEventInfo && activeEventInfo.id, activeEventInfo && activeEventInfo.endsAt]);

  const upcomingInfo = (!activeEventInfo && upcomingEvent && upcomingEvent.event) ? upcomingEvent : null;

  const periodLabel = React.useMemo(() => {
    if (typeof timeOfDayHours !== 'number') return 'Unknown';
    const hour = ((timeOfDayHours % 24) + 24) % 24;
    if (hour >= 5.5 && hour < 8) return 'Sunrise';
    if (hour >= 8 && hour < 17.5) return 'Day';
    if (hour >= 17.5 && hour < 20) return 'Sunset';
    return 'Night';
  }, [timeOfDayHours]);

  const h = React.createElement;
  return h(React.Fragment, null,
    h('div', { className: 'absolute top-4 left-4 flex flex-col space-y-2 z-10' },
      h(PlayerInfo, { playerStats }),
      showControlsInfo
        ? h(ControlsInfo)
        : h('button', {
            onClick: () => setShowControlsInfo(true),
            className: 'self-start px-2 py-1 rounded bg-black/70 text-white border border-gray-600 text-xs hover:bg-black/80',
            title: 'Show controls help'
          }, 'Show Controls'),
      activeEventInfo && h('div', { className: 'bg-black/70 border border-yellow-600 rounded-lg p-3 text-xs space-y-1' },
        h('div', { className: 'flex items-center justify-between text-yellow-300 uppercase tracking-wide' },
          h('span', null, 'World Event'),
          h('span', null, formatCountdownMs(eventRemainingMs))
        ),
        h('div', { className: 'text-sm font-semibold text-yellow-200' }, activeEventInfo.label),
        activeEventInfo.description && h('div', { className: 'text-xs text-yellow-100/80' }, activeEventInfo.description)
      ),
      upcomingInfo && h('div', { className: 'bg-black/60 border border-gray-700 rounded-lg p-3 text-xs space-y-1' },
        h('div', { className: 'flex items-center justify-between text-gray-300 uppercase tracking-wide' },
          h('span', null, 'Next Event'),
          h('span', null, formatCountdownMs(nextEventCountdownMs))
        ),
        h('div', { className: 'text-sm font-semibold text-gray-100' }, upcomingInfo.event.label),
        upcomingInfo.event.description && h('div', { className: 'text-xs text-gray-300/80' }, upcomingInfo.event.description)
      )
    ),
    h('div', {
        className: 'absolute flex flex-col items-end space-y-2 z-10',
        style: {
          top: '16px',
          // Position left of minimap if it's enabled, otherwise stick to 16px from right
          right: `${(settings && settings.minimap && settings.minimap.enabled !== false)
            ? (16 + (settings.minimap.size ?? 128) + 12) // 12px gap from minimap
            : 16}px`
        }
      },
      h('div', { className: 'px-3 py-2 rounded-lg bg-black/70 border border-blue-500/60 shadow-lg min-w-[110px]' },
        h('div', { className: 'text-xs uppercase tracking-wide text-blue-200/80' }, 'Time'),
        h('div', { className: 'text-lg font-mono text-blue-50' }, gameClock || '--:--'),
        h('div', { className: 'text-[11px] uppercase tracking-wide text-blue-300/70' }, periodLabel)
      )
    ),
    h(Compass, { playerRef }),
    h(Minimap, { playerRef, worldObjects, zoomRef, minimapSettings: settings && settings.minimap })
  );
}

HUDComponent.propTypes = {
  playerStats: PropTypes.object.isRequired,
  playerRef: PropTypes.shape({ current: PropTypes.any }),
  worldObjects: PropTypes.arrayOf(PropTypes.shape({ position: PropTypes.object, color: PropTypes.string })),
  zoomRef: PropTypes.shape({ current: PropTypes.any }),
  settings: PropTypes.object,
  worldState: PropTypes.object,
  activeEvent: PropTypes.object,
  upcomingEvent: PropTypes.shape({ event: PropTypes.object, eta: PropTypes.number }),
  nextEventCountdownMs: PropTypes.number,
  timeOfDayHours: PropTypes.number,
  gameClock: PropTypes.string
};

const HUD = React.memo(HUDComponent);

export { HUD };

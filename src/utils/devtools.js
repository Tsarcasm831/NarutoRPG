import { formatGameClock, SECONDS_PER_HOUR } from './time.js';

const TIME_PRESETS = {
  dawn: { hour: 6, label: 'Dawn' },
  midday: { hour: 12, label: 'Midday' },
  dusk: { hour: 18.5, label: 'Dusk' },
  night: { hour: 23, label: 'Night' }
};

const TIME_KEYS = [
  'setHour',
  'getHour',
  'current',
  'setPreset',
  'dawn',
  'midday',
  'dusk',
  'night',
  'presets',
  'help'
];

const ensureDevtoolsRoot = () => {
  if (typeof window === 'undefined') return null;
  if (!window.Devtools || typeof window.Devtools !== 'object') {
    window.Devtools = {};
  }
  return window.Devtools;
};

export const registerTimeDevtools = ({ getTimeOfDayHours, setTimeOfDayHours }) => {
  if (typeof window === 'undefined') return () => {};
  if (typeof setTimeOfDayHours !== 'function' || typeof getTimeOfDayHours !== 'function') {
    return () => {};
  }

  const root = ensureDevtoolsRoot();
  if (!root) return () => {};

  const timeApi = root.time || (root.time = {});
  const previous = {};

  TIME_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(timeApi, key)) {
      previous[key] = timeApi[key];
    }
  });

  const describeHour = (hour) => {
    const seconds = hour * SECONDS_PER_HOUR;
    return `${formatGameClock(seconds)} (${hour.toFixed(2)}h)`;
  };

  const applyHour = (value) => {
    const normalized = setTimeOfDayHours(value);
    const currentHour = getTimeOfDayHours();
    const resolved = Number.isFinite(normalized) ? normalized : currentHour;
    const display = Number.isFinite(resolved) ? describeHour(resolved) : 'unknown';
    try {
      console.info(`[Devtools.time] Time set to ${display}.`);
    } catch (_) {}
    return resolved;
  };

  const applyPreset = (name) => {
    if (typeof name !== 'string') {
      return applyHour(name);
    }
    const key = name.toLowerCase();
    const preset = TIME_PRESETS[key];
    if (!preset) {
      const available = Object.keys(TIME_PRESETS).join(', ');
      try {
        console.warn(`[Devtools.time] Unknown preset "${name}". Available presets: ${available}.`);
      } catch (_) {}
      return getTimeOfDayHours();
    }
    try {
      console.info(`[Devtools.time] Applying preset ${preset.label}.`);
    } catch (_) {}
    return applyHour(preset.hour);
  };

  timeApi.setHour = (value) => applyHour(value);
  timeApi.getHour = () => getTimeOfDayHours();
  timeApi.current = timeApi.getHour;
  timeApi.setPreset = (name) => applyPreset(name);
  timeApi.dawn = () => applyPreset('dawn');
  timeApi.midday = () => applyPreset('midday');
  timeApi.dusk = () => applyPreset('dusk');
  timeApi.night = () => applyPreset('night');
  timeApi.presets = { ...TIME_PRESETS };
  timeApi.help = () => {
    const names = Object.keys(TIME_PRESETS).join(', ');
    return `Devtools.time controls: setHour(number), setPreset(name), presets: ${names}. Shortcut methods available for each preset.`;
  };

  return () => {
    TIME_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(previous, key)) {
        timeApi[key] = previous[key];
      } else {
        delete timeApi[key];
      }
    });
    if (Object.keys(timeApi).length === 0 && root.time === timeApi) {
      delete root.time;
    }
  };
};

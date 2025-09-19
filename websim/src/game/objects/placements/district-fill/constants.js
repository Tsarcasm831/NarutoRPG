// Centralized tunables and defaults for district filling

// choose building pool for district fill: 'kitbash' | 'slice' | 'mixed'
export const DISTRICT_FILL_SOURCE = 'mixed';
// target coverage fraction of district area (0..1) [currently unused]
export const DISTRICT_TARGET_COVERAGE = 0.75;
// alleyway spacing between buildings (world units)
export const DISTRICT_ALLEY_CLEARANCE = 2;
// near-border band width to prioritize (world units) [currently unused]
export const DISTRICT_BORDER_BAND_WIDTH = 52;
// step spacing along district edges for border placement (world units)
export const DISTRICT_BORDER_STEP = 40;
// per-building area heuristic fallback when target coverage would place too few buildings
export const DISTRICT_AREA_PER_BUILDING = 90000;
// min/max buildings to try to place (safety clamps)
export const DISTRICT_MIN_BUILDINGS = 10;
export const DISTRICT_MAX_BUILDINGS = 120;
// candidate uniform scales (relative to template scale)
export const DISTRICT_SCALES = [1.0, 0.85, 0.7, 0.55, 0.42, 0.34, 0.28];
// random rotation jitter range (radians) [currently unused]
export const DISTRICT_ROT_JITTER = 0.6;
// max total attempts per placement loop
export const DISTRICT_MAX_ATTEMPTS = 1800;
// persist placements to localStorage to avoid recomputing
export const DISTRICT_ENABLE_LOCALSTORAGE = false;
export const DISTRICT_PERSIST_KEY_PREFIX = 'konoha-district-layout:';
// default share of non-primary building templates (0..1)
export const DISTRICT_DEFAULT_VARIETY_RATIO = 0.2;

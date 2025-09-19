// Kitbash placement constants, extracted from kitbash.js
import * as THREE from 'three';

/* @tweakable origin for Kitbash neighborhood (world units) */
export const KITBASH_ORIGIN = new THREE.Vector3(0, 0, 0);
/* @tweakable layout: rows x cols */
export const KITBASH_ROWS = 5;
export const KITBASH_COLS = 7;
/* @tweakable spacing between buildings (pre-scale, in world units) */
export const KITBASH_SPACING_X = 320;
export const KITBASH_SPACING_Z = 300;
/* @tweakable global scale for Kitbash buildings (bigger to keep player small) */
export const KITBASH_SCALE = 0.35;
/* @tweakable jitter rotation range (radians) */
export const KITBASH_JITTER_ROT = 0.25;
/* @tweakable max nudge attempts to avoid overlapping CitySlice */
export const KITBASH_MAX_NUDGE = 50;
/* @tweakable nudge step (world units) */
export const KITBASH_NUDGE_STEP = 4;

/* @tweakable enforce district containment using map/ districts */
export const KITBASH_DISTRICT_ENFORCE = true;
/* @tweakable nudge step (world units) toward nearest district */
export const KITBASH_DISTRICT_NUDGE_STEP = 12;
/* @tweakable max nudge attempts */
export const KITBASH_DISTRICT_MAX_ATTEMPTS = 80;
/* @tweakable drop buildings failing containment after nudging */
export const KITBASH_DROP_IF_FAIL = false;

// Area-based targets (combined with citySlice) per district
/* @tweakable world-units^2 per building target (kitbash will backfill to reach this total, counting citySlice too) */
export const KITBASH_AREA_PER_BUILDING = 120000; // smaller than citySlice, since kitbash will fill gaps
/* @tweakable min/max total buildings per district (slice + kitbash) */
export const KITBASH_MIN_TOTAL_PER_DISTRICT = 2;
export const KITBASH_MAX_TOTAL_PER_DISTRICT = 8;

// Minimum scale enforcement (uniform), to keep buildings reasonably large
// This avoids odd vertical-only stretching and maintains believable proportions.
export const KITBASH_MIN_LOCAL_SCALE = 0.28;


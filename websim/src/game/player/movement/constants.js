export const walkSpeed = 25; // Units per second for walking
export const runSpeed = 50;  // Units per second for running
export const flySpeed = 60;  // Flight speed
export const GRAVITY = 140;
export const JUMP_FORCE = 70;

// Dynamic ground parameters
export const BASE_GROUND_Y = 0;

/* @tweakable percentage of WORLD_SIZE used for the central wall radius (0..1) */
export const MAP_WALL_RADIUS_PCT = 0.3561;
/* @tweakable additive offset (world units) applied to the computed wall radius */
export const WALL_RADIUS_OFFSET = 0;

// Central wall parameters (must match objects/index.js)
/* @tweakable recompute the wall radius after tweakables initialize */
export const WALL_RADIUS = Math.round(WORLD_SIZE * MAP_WALL_RADIUS_PCT + WALL_RADIUS_OFFSET);
export const WALL_THICKNESS = 5;
export const WALL_HEIGHT = 30;

// Player collision radius on XZ plane
export const PLAYER_RADIUS = 2;

import { WORLD_SIZE } from '/src/scene/terrain.js';
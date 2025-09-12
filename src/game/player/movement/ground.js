import { BASE_GROUND_Y, WALL_RADIUS, WALL_THICKNESS, WALL_HEIGHT } from './constants.js';
// @tweakable treat the old wall ring as a raised, walkable surface (disable while walls are removed)
const WALL_GROUND_ENABLED = false;

/**
 * Checks whether the given XZ position is over the top of the central wall.
 */
export function isOverWallTop(x, z) {
    const r = Math.sqrt(x * x + z * z);
    const inner = WALL_RADIUS - WALL_THICKNESS / 2;
    const outer = WALL_RADIUS + WALL_THICKNESS / 2;
    return r >= inner && r <= outer;
}

/**
 * Computes the ground Y at a given XZ position, accounting for wall surfaces.
 */
export function getGroundYAt(x, z) {
    if (WALL_GROUND_ENABLED && isOverWallTop(x, z)) {
        return WALL_HEIGHT;
    }
    return BASE_GROUND_Y;
}
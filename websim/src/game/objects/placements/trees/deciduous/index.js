export { buildOakTree } from './oak.js';
export { buildMapleTree } from './maple.js';
export { buildBirchTree } from './birch.js';
export { buildElmTree } from './elm.js';
export { buildBeechTree } from './beech.js';

import { buildOakTree } from './oak.js';
import { buildMapleTree } from './maple.js';
import { buildBirchTree } from './birch.js';
import { buildElmTree } from './elm.js';
import { buildBeechTree } from './beech.js';

export const DECIDUOUS_BUILDERS = [
  buildOakTree,
  buildMapleTree,
  buildBirchTree,
  buildElmTree,
  buildBeechTree,
];


import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  PLAYER_CHARACTERS,
  getCharacterByKey,
  buildStatsForCharacter,
  buildInventoryForCharacter,
} from '../../src/game/player/characterCatalog.js';
import { initialPlayerStats, initialInventory } from '../../src/game/initialState.js';

test('getCharacterByKey returns deep clones for each lookup', () => {
  const sourceNaruto = PLAYER_CHARACTERS.find((character) => character.key === 'naruto');
  const narutoClone = getCharacterByKey('naruto');

  assert.notStrictEqual(narutoClone, sourceNaruto, 'resolved character should be cloned');
  assert.deepEqual(narutoClone, sourceNaruto, 'clone should match catalog data');

  // Mutating the clone should not leak into the catalog definition.
  narutoClone.name = 'Mutated Naruto';
  narutoClone.animation.essential.push('Animation_Test');

  assert.equal(sourceNaruto.name, 'Naruto Uzumaki');
  assert.equal(sourceNaruto.animation.essential.includes('Animation_Test'), false);

  const fallbackClone = getCharacterByKey('unknown-key');
  const defaultCharacter = PLAYER_CHARACTERS[0];

  assert.notStrictEqual(fallbackClone, defaultCharacter, 'fallback should also be cloned');
  assert.deepEqual(fallbackClone, defaultCharacter, 'fallback clone should mirror default data');
});

test('buildStatsForCharacter merges overrides onto cloned base stats', () => {
  const kakashiStats = buildStatsForCharacter('kakashi');
  assert.notStrictEqual(kakashiStats, initialPlayerStats);
  assert.equal(kakashiStats.name, 'Kakashi Hatake');
  kakashiStats.name = 'Modified Kakashi';
  assert.equal(initialPlayerStats.name, 'Kakashi', 'initial stats remain untouched after mutation');

  const narutoStats = buildStatsForCharacter('naruto');
  assert.equal(narutoStats.name, 'Naruto Uzumaki');
  assert.equal(narutoStats.vitality, 13);
  assert.equal(narutoStats.strength, 11);
  assert.equal(narutoStats.stamina, 130);
  assert.equal(narutoStats.maxStamina, 150);
  assert.equal(narutoStats.chakra, 320);
  assert.equal(narutoStats.maxChakra, 320);
  assert.equal(narutoStats.attackRating, 148);
  assert.equal(narutoStats.minDamage, 11);
  assert.equal(narutoStats.maxDamage, 17);
});

test('buildInventoryForCharacter returns isolated deep clones', () => {
  const narutoInventory = buildInventoryForCharacter('naruto');
  const sasukeInventory = buildInventoryForCharacter('sasuke');

  assert.deepEqual(narutoInventory, initialInventory, 'starter inventory should match baseline');
  assert.notStrictEqual(narutoInventory, initialInventory, 'inventory should be cloned from baseline');
  assert.notStrictEqual(narutoInventory.equipment, initialInventory.equipment, 'nested objects are also cloned');
  assert.notStrictEqual(narutoInventory.potions, initialInventory.potions, 'arrays are cloned');
  assert.notStrictEqual(narutoInventory.storage, initialInventory.storage, 'storage array is cloned');
  assert.notStrictEqual(narutoInventory, sasukeInventory, 'separate calls should return unique objects');

  narutoInventory.equipment.weapon.name = 'Rusty Kunai';
  narutoInventory.equipment.weapon.durability.current = 5;
  narutoInventory.potions.pop();
  narutoInventory.storage[0] = { name: 'Special Scroll', icon: '📜' };

  assert.equal(initialInventory.equipment.weapon.name, 'Enchanted Steel Sword');
  assert.equal(initialInventory.equipment.weapon.durability.current, 78);
  assert.equal(initialInventory.potions.length, 5);
  assert.equal(initialInventory.storage[0].name, 'Gold Coins');

  assert.equal(sasukeInventory.equipment.weapon.name, 'Enchanted Steel Sword');
  assert.equal(sasukeInventory.potions.length, 5);
  assert.equal(sasukeInventory.storage[0].name, 'Gold Coins');
});

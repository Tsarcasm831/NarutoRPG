import { test } from 'vitest';
import assert from 'node:assert/strict';

import { applyQuestRewards } from '../../src/game/quests.js';

function createState(initialStats = {}, initialInventory = {}, addExperienceImpl = () => {}) {
  let stats = structuredClone(initialStats);
  let inventory = structuredClone(initialInventory);
  const statCalls = [];
  const inventoryCalls = [];
  const addExpCalls = [];

  const setPlayerStats = updater => {
    statCalls.push(updater);
    stats = updater(stats);
  };

  const setInventory = updater => {
    inventoryCalls.push(updater);
    inventory = updater(inventory);
  };

  const addExperience = amount => {
    addExpCalls.push(amount);
    addExperienceImpl(amount);
  };

  return {
    setPlayerStats,
    setInventory,
    addExperience,
    getStats: () => stats,
    getInventory: () => inventory,
    statCalls,
    inventoryCalls,
    addExpCalls,
  };
}

test('applyQuestRewards applies XP and gold rewards via setters', () => {
  const state = createState({ gold: 10 }, { storage: [] }, () => {});

  applyQuestRewards(
    [
      { type: 'xp', amount: 150 },
      { type: 'gold', amount: 50 },
    ],
    state,
  );

  assert.deepEqual(state.addExpCalls, [150]);
  assert.equal(state.getStats().gold, 60);
  assert.equal(state.statCalls.length, 1, 'gold updates use setter callback');
});

test('applyQuestRewards inserts items into the first available storage slot', () => {
  const state = createState({}, { storage: [null, { name: 'Scroll' }] }, () => {});
  const rewardItem = { name: 'Chakra Potion', icon: '🧪' };

  applyQuestRewards(
    [
      { type: 'item', item: rewardItem },
    ],
    state,
  );

  const inventory = state.getInventory();
  assert.equal(inventory.storage[0]?.name, 'Chakra Potion');
  assert.equal(inventory.storage[1]?.name, 'Scroll');
  assert.equal(state.inventoryCalls.length, 1, 'inventory setter invoked once');
});

test('applyQuestRewards upgrades equipped items when gear exists', () => {
  const initialInventory = {
    equipment: {
      weapon: {
        name: 'Kunai',
        rarity: 'common',
        stats: { attack: 10 },
        durability: { current: 80, max: 100 },
      },
    },
    storage: [],
  };

  const state = createState({}, initialInventory, () => {});

  applyQuestRewards(
    [
      {
        type: 'upgrade',
        slot: 'weapon',
        modifiers: {
          rarity: 'rare',
          nameSuffix: '+1',
          stats: { attack: 5, agility: 2 },
          durability: { current: 10, max: 20 },
        },
      },
    ],
    state,
  );

  const upgraded = state.getInventory().equipment.weapon;
  assert.equal(upgraded.rarity, 'rare');
  assert.equal(upgraded.name, 'Kunai +1');
  assert.equal(upgraded.stats.attack, 15);
  assert.equal(upgraded.stats.agility, 2);
  assert.equal(upgraded.durability.max, 120);
  assert.equal(upgraded.durability.current, 90);
  assert.equal(state.getInventory().storage.length, 0);
});

test('applyQuestRewards creates storage item when upgrading empty slot', () => {
  const state = createState(
    {},
    {
      equipment: { weapon: null },
      storage: [undefined, { name: 'Shuriken' }],
    },
    () => {},
  );

  applyQuestRewards(
    [
      { type: 'upgrade', slot: 'weapon', modifiers: { rarity: 'epic', stats: { attack: 7 } } },
    ],
    state,
  );

  const storage = state.getInventory().storage;
  assert.equal(storage[0].slot, 'weapon');
  assert.equal(storage[0].rarity, 'epic');
  assert.equal(storage[0].stats.attack, 7);
  assert.equal(storage[1].name, 'Shuriken');
});

test('applyQuestRewards safely ignores unknown reward types and empty lists', () => {
  const state = createState({ gold: 5 }, { storage: [] }, () => {});
  let warnMessages = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnMessages.push(args.join(' '));
  };

  try {
    applyQuestRewards([], state);
    applyQuestRewards([{ type: 'mystery', amount: 10 }], state);
    applyQuestRewards(null, state);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(state.statCalls.length, 0, 'no setters triggered for ignored rewards');
  assert.equal(state.inventoryCalls.length, 0, 'inventory untouched for ignored rewards');
  assert.equal(state.addExpCalls.length, 0, 'experience untouched for ignored rewards');
  assert.ok(warnMessages.some(msg => msg.includes('Unknown reward type')));
});

import { test } from 'vitest';
import assert from 'node:assert/strict';

import { xpForLevel, ensureExperienceConsistency, addExperience } from '../../src/game/experience.js';

test('xpForLevel enforces minimums and scales linearly', () => {
  assert.equal(xpForLevel(1), 250);
  assert.equal(xpForLevel(12), 3000);
  assert.equal(xpForLevel(0), 250, 'levels below 1 clamp to level 1 baseline');
  assert.equal(xpForLevel(-5), 250, 'negative levels use baseline requirement');
  assert.equal(xpForLevel(100), 25000, 'high level still follows linear growth');
});

test('ensureExperienceConsistency clamps experience and maxExperience', () => {
  const input = {
    level: 5,
    experience: 9999,
    maxExperience: 10,
  };

  const result = ensureExperienceConsistency(input);

  assert.notEqual(result, input, 'should return a cloned stats object');
  assert.equal(result.maxExperience, xpForLevel(5));
  assert.equal(result.experience, xpForLevel(5) - 1, 'experience clamps to just below the level cap');

  const negative = ensureExperienceConsistency({ level: 3, experience: -50 });
  assert.equal(negative.experience, 0, 'negative experience resets to zero');
  assert.equal(negative.maxExperience, xpForLevel(3));
});

test('addExperience handles multi-level ups, stat growth, and refills vitals', () => {
  const original = {
    level: 1,
    experience: 200,
    maxExperience: xpForLevel(1),
    maxHealth: 100,
    health: 40,
    maxChakra: 80,
    chakra: 10,
    maxStamina: 60,
    stamina: 5,
    attackRating: 15,
    defense: 12,
    minDamage: 3,
    maxDamage: 7,
    statPoints: 0,
    skillPoints: 0,
  };

  const { stats, leveledUp, levelsGained } = addExperience(original, 600);

  assert.equal(levelsGained, 2);
  assert.equal(leveledUp, true);
  assert.equal(stats.level, 3);
  assert.equal(stats.experience, 50);
  assert.equal(stats.maxExperience, xpForLevel(3));
  assert.equal(stats.maxHealth, 120);
  assert.equal(stats.health, stats.maxHealth, 'health refills to new maximum');
  assert.equal(stats.maxChakra, 100);
  assert.equal(stats.chakra, stats.maxChakra, 'chakra refills to new maximum');
  assert.equal(stats.maxStamina, 70);
  assert.equal(stats.stamina, stats.maxStamina, 'stamina refills to new maximum');
  assert.equal(stats.attackRating, 19);
  assert.equal(stats.defense, 16);
  assert.equal(stats.minDamage, 5);
  assert.equal(stats.maxDamage, 9);
  assert.equal(stats.statPoints, 10);
  assert.equal(stats.skillPoints, 2);

  assert.deepEqual(original, {
    level: 1,
    experience: 200,
    maxExperience: xpForLevel(1),
    maxHealth: 100,
    health: 40,
    maxChakra: 80,
    chakra: 10,
    maxStamina: 60,
    stamina: 5,
    attackRating: 15,
    defense: 12,
    minDamage: 3,
    maxDamage: 7,
    statPoints: 0,
    skillPoints: 0,
  }, 'input stats remain unchanged');
});

test('addExperience clamps invalid experience gain requests', () => {
  const base = {
    level: 2,
    experience: -10,
    maxExperience: 10,
  };

  const { stats, leveledUp, levelsGained } = addExperience(base, -50);

  assert.equal(leveledUp, false);
  assert.equal(levelsGained, 0);
  assert.equal(stats.experience, 0);
  assert.equal(stats.level, 2);
  assert.equal(stats.maxExperience, xpForLevel(2));
});

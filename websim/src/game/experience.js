// Simple experience/leveling system
// - xpForLevel(level): XP needed to reach next level
// - addExperience(stats, amount): returns { stats, leveledUp, levelsGained }

export function xpForLevel(level) {
  // Linear curve tuned to match existing maxExperience=3000 at level 12
  // 250 * level: L1=250, L12=3000
  return Math.max(50, Math.round(250 * Math.max(1, level)));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function ensureExperienceConsistency(statsIn) {
  const stats = clone(statsIn);
  const targetMax = xpForLevel(stats.level || 1);
  stats.maxExperience = targetMax;
  // Clamp in-level experience to current level range
  if (typeof stats.experience !== 'number' || stats.experience < 0) stats.experience = 0;
  if (stats.experience >= stats.maxExperience) stats.experience = stats.maxExperience - 1;
  return stats;
}

export function addExperience(statsIn, amount) {
  const stats = ensureExperienceConsistency(statsIn);
  const delta = Math.floor(Number(amount) || 0);
  if (delta <= 0) return { stats, leveledUp: false, levelsGained: 0 };

  let exp = (stats.experience || 0) + delta;
  let level = stats.level || 1;
  let maxExp = xpForLevel(level);
  let levelsGained = 0;

  while (exp >= maxExp) {
    exp -= maxExp;
    level += 1;
    levelsGained += 1;
    maxExp = xpForLevel(level);
    // Apply per-level growths
    stats.maxHealth = (stats.maxHealth || 0) + 10;
    stats.maxChakra = (stats.maxChakra || 0) + 10;
    stats.maxStamina = (stats.maxStamina || 0) + 5;
    stats.attackRating = (stats.attackRating || 0) + 2;
    stats.defense = (stats.defense || 0) + 2;
    stats.minDamage = (stats.minDamage || 0) + 1;
    stats.maxDamage = (stats.maxDamage || 0) + 1;
    stats.statPoints = (stats.statPoints || 0) + 5;
    stats.skillPoints = (stats.skillPoints || 0) + 1;
  }

  // Update level/xp and refill vitals on level-up
  stats.level = level;
  stats.experience = exp;
  stats.maxExperience = maxExp;
  if (levelsGained > 0) {
    stats.health = stats.maxHealth;
    stats.chakra = stats.maxChakra;
    stats.stamina = stats.maxStamina;
  }

  return { stats, leveledUp: levelsGained > 0, levelsGained };
}


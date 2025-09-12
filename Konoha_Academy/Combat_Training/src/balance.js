// Placeholder for future dynamic difficulty tweaks.
export function difficultyForWave(w) {
  w = Math.max(1, w|0);
  const lin = 1 + w * 0.08;
  const dim = 1 + Math.log2(1 + w) * 0.6;
  return 0.5 * lin + 0.5 * dim;
}

// utility scalers
export const scaleStat = (base, wave) => base * difficultyForWave(wave);
export const scaleIntStat = (base, wave) => Math.round(scaleStat(base, wave));
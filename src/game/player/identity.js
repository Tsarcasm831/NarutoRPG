import { getCharacterByKey, getDefaultCharacter } from './characterCatalog.js';

let currentCharacter = getDefaultCharacter();

export const getPlayerIdentity = () => currentCharacter;

export const setPlayerIdentity = (characterOrKey) => {
  const character = typeof characterOrKey === 'string'
    ? getCharacterByKey(characterOrKey)
    : characterOrKey;

  currentCharacter = character || getDefaultCharacter();

  try {
    if (typeof window !== 'undefined') {
      window.__playerIdentity = currentCharacter;
      window.__playerName = currentCharacter?.name || 'Kakashi Hatake';
      window.__playerPortrait = currentCharacter?.mugshot || '/src/assets/images/mugshots/kakashi.png';
    }
  } catch (_) {
    // Ignore window assignment errors in non-browser contexts
  }

  return currentCharacter;
};

export const getPlayerName = () => (getPlayerIdentity()?.name || 'Kakashi Hatake');

export const getPlayerMugshot = () => (getPlayerIdentity()?.mugshot || '/src/assets/images/mugshots/kakashi.png');

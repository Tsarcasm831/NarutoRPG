const ABSOLUTE_URL_REGEX = /^(?:https?:)?\/\//i;

const FALLBACK_BASE = 'temp/';

const CHARACTER_BASES = {
  naruto: 'temp/Naruto/biped/',
  sasuke: 'temp/Sasuke/',
  sakura: 'temp/Sakura/biped/',
  shikamaru: 'temp/Shikamaru/',
  neji: 'temp/Neji/biped/',
  orochimaru: 'temp/Orochimaru/biped/',
  kakashi: 'temp/Kakashi_Jonin/',
  hashirama: 'temp/hashirama/biped/',
  jiraiya: 'temp/jiraiya/biped/',
  killerbee: 'temp/killerbee/biped/',
  killer: 'temp/killerbee/biped/',
  bee: 'temp/killerbee/biped/',
  rocklee: 'temp/rocklee/biped/',
  rock: 'temp/rocklee/biped/',
  lee: 'temp/rocklee/biped/',
  tsunade: 'temp/tsunade/biped/'
};

const TRIM_REGEX = /\s+/g;

export const extractFileName = (url) => {
  if (typeof url !== 'string') return '';
  const normalized = url.trim();
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
};

export const localBaseFor = (name = '') => {
  const normalized = name.trim().toLowerCase().replace(TRIM_REGEX, ' ');
  const firstToken = normalized.split(' ')[0];
  if (!firstToken) return FALLBACK_BASE;
  return CHARACTER_BASES[firstToken] || FALLBACK_BASE;
};

export const normalizeNpcAssetUrl = (value, characterName = '') => {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url) return '';
  if (
    ABSOLUTE_URL_REGEX.test(url) ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/')) return url;
  if (url.startsWith('temp/')) return url;
  if (url.startsWith('./') || url.startsWith('../')) return url;
  const fileName = extractFileName(url);
  const base = localBaseFor(characterName);
  return `${base}${fileName}`;
};

export const buildLocalNpcUrls = (urls, characterName = '') => {
  if (!Array.isArray(urls)) return [];
  const base = localBaseFor(characterName);
  const seen = new Set();
  const results = [];
  for (const entry of urls) {
    const fileName = extractFileName(entry);
    if (!fileName) continue;
    const candidate = `${base}${fileName}`;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    results.push(candidate);
  }
  return results;
};

export { ABSOLUTE_URL_REGEX };

import { fetchWithTimeout } from './assetLoader.js';
import {
  ABSOLUTE_URL_REGEX,
  extractFileName,
  normalizeNpcAssetUrl
} from './npcAssetPaths.js';

const DEFAULT_TIMEOUT = 10000;

const inflight = new Map();

const statusPayload = ({ url, index, total, characterName, fileName, attempt, source }) => ({
  url,
  index,
  total,
  fileName,
  characterName,
  attempt,
  source
});

async function fetchGlb(url, timeoutMs) {
  const baseInit = { cache: 'no-store', credentials: 'omit' };
  if (ABSOLUTE_URL_REGEX.test(url)) {
    const request = new Request(url, { ...baseInit, mode: 'no-cors' });
    const response = await fetchWithTimeout(request, undefined, timeoutMs);
    if (response && response.ok && typeof response.arrayBuffer === 'function') {
      await response.arrayBuffer();
    }
    return;
  }
  const response = await fetchWithTimeout(url, baseInit, timeoutMs);
  if (!response?.ok) {
    throw new Error(`Failed to fetch asset: ${url} (${response?.status || 'unknown'})`);
  }
  if (typeof response.arrayBuffer === 'function') {
    await response.arrayBuffer();
  }
}

export function preloadNpcManifestAssets(manifestPath, options = {}) {
  const { characterName = '', timeoutMs = DEFAULT_TIMEOUT, onAssetStart, onAssetComplete } = options;
  if (!manifestPath || typeof manifestPath !== 'string') {
    return Promise.reject(new Error('Manifest path is required to preload NPC assets.'));
  }
  const cacheKey = `${characterName || 'unknown'}::${manifestPath}`;
  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const task = (async () => {
    const manifestResponse = await fetchWithTimeout(manifestPath, { cache: 'no-store', credentials: 'omit' }, timeoutMs);
    if (!manifestResponse?.ok) {
      throw new Error(`Unable to load NPC manifest at ${manifestPath}: ${manifestResponse?.status || 'unknown'} ${manifestResponse?.statusText || ''}`);
    }
    const manifestData = await manifestResponse.json();
    const manifestFiles = Array.isArray(manifestData?.files) ? manifestData.files : [];
    const glbFiles = manifestFiles.filter((entry) => typeof entry === 'string' && entry.trim().toLowerCase().endsWith('.glb'));
    if (!glbFiles.length) {
      return { total: 0, failed: 0 };
    }

    const total = glbFiles.length;
    let failed = 0;

    await Promise.all(
      glbFiles.map(async (originalUrl, index) => {
        const fileName = extractFileName(originalUrl);
        const candidates = [];

        const localCandidate = normalizeNpcAssetUrl(fileName, characterName);
        if (localCandidate) {
          candidates.push({ url: localCandidate, source: 'local' });
        }

        const normalized = normalizeNpcAssetUrl(originalUrl, characterName);
        if (normalized && !candidates.some((candidate) => candidate.url === normalized)) {
          const source = ABSOLUTE_URL_REGEX.test(normalized) ? 'remote' : 'manifest';
          candidates.push({ url: normalized, source });
        }

        if (!candidates.length) {
          const source = ABSOLUTE_URL_REGEX.test(originalUrl) ? 'remote' : 'manifest';
          candidates.push({ url: originalUrl, source });
        }

        let success = false;
        let lastError = null;

        for (let attempt = 0; attempt < candidates.length; attempt += 1) {
          const candidate = candidates[attempt];
          const payload = statusPayload({
            url: candidate.url,
            index,
            total,
            characterName,
            fileName,
            attempt: attempt + 1,
            source: candidate.source
          });
          try {
            onAssetStart?.(payload);
          } catch (_) {}
          try {
            await fetchGlb(candidate.url, timeoutMs);
            success = true;
            onAssetComplete?.({ ...payload, ok: true, final: true });
            break;
          } catch (error) {
            lastError = error;
            const finalAttempt = attempt === candidates.length - 1;
            onAssetComplete?.({ ...payload, ok: false, error, final: finalAttempt });
          }
        }

        if (!success) {
          failed += 1;
          if (lastError) {
            console.warn(`[NPC] Failed to preload ${fileName} (${characterName}):`, lastError);
          }
        }
      })
    );

    return { total, failed };
  })().finally(() => {
    inflight.delete(cacheKey);
  });

  inflight.set(cacheKey, task);
  return task;
}

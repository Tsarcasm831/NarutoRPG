const LOCATION_JSON_URL = 'src/components/game/json/location.json';
const LOCATION_CACHE_NAME = 'location-assets-v1';
const REQUEST_TIMEOUT_MS = 8000; // avoid infinite hangs on slow/unreachable hosts

function fetchWithTimeout(input, init = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort('timeout'), timeoutMs);
  const merged = { ...init, signal: controller.signal };
  return fetch(input, merged).finally(() => clearTimeout(id));
}

/**
 * Fetches the list of asset URLs from cache/by_group/location.json.
 * @returns {Promise<string[]>} Array of absolute/relative URLs to prefetch.
 */
async function loadLocationAssetList() {
  try {
    const res = await fetchWithTimeout(LOCATION_JSON_URL, { credentials: 'omit' }, 6000);
    if (!res.ok) throw new Error(`Failed to fetch ${LOCATION_JSON_URL}: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('location.json format unexpected. Expected an array of URLs.');
      return [];
    }
    // Deduplicate while preserving order
    const seen = new Set();
    return data.filter((u) => {
      if (typeof u !== 'string' || !u) return false;
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  } catch (err) {
    console.error('Error loading location asset list:', err);
    return [];
  }
}

/**
 * Downloads and caches all assets listed in location.json.
 * Uses the Cache Storage API; also implicitly warms the HTTP cache.
 * @param {(n:number)=>void} [onProgress] Optional progress callback (0..100).
 */
export async function prefetchLocationAssets(onProgress) {
  const urls = await loadLocationAssetList();
  if (!urls.length) {
    if (onProgress) onProgress(100);
    return;
  }
  try { console.log(`[prefetch] Warming ${urls.length} location assets...`); } catch (_) {}

  // If Cache Storage API is unavailable (e.g., file:// or insecure context),
  // fall back to timed fetches without caching so we still advance progress.
  if (typeof caches === 'undefined') {
    let completed = 0;
    const total = urls.length;
    const update = () => { completed += 1; if (onProgress) onProgress(Math.round((completed / total) * 100)); };
    const CONCURRENCY = 8;
    let index = 0;
    async function worker() {
      while (index < total) {
        const i = index++;
        const url = urls[i];
        try {
          if (/^https?:\/\//i.test(url)) {
            const req = new Request(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
            try { await fetchWithTimeout(req); } catch (_) {}
          } else {
            try { await fetchWithTimeout(url, { credentials: 'omit', cache: 'no-store' }); } catch (_) {}
          }
        } catch (_) {
          // ignore
        } finally {
          update();
        }
      }
    }
    const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
    await Promise.all(workers);
    try { console.log('[prefetch] Location prefetch complete (no Cache API).'); } catch (_) {}
    return;
  }

  const cache = await caches.open(LOCATION_CACHE_NAME);

  let completed = 0;
  const total = urls.length;
  const update = () => {
    completed += 1;
    if (onProgress) onProgress(Math.round((completed / total) * 100));
  };

  // Limit concurrency to avoid overwhelming the network.
  const CONCURRENCY = 8;
  let index = 0;

  async function worker() {
    while (index < total) {
      const i = index++;
      const url = urls[i];
      try {
        // If already cached, skip network
        const hit = await cache.match(url);
        if (!hit) {
          // Perform a timed fetch and then cache.put to avoid indefinite hangs.
          const req = new Request(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
          try {
            const res = await fetchWithTimeout(req);
            if (res && res.type !== 'opaqueredirect') {
              try { await cache.put(req, res.clone()); } catch (_) { /* cache may reject; ignore */ }
            }
          } catch (err) {
            // Fall back to a plain timed fetch to warm HTTP cache even if CacheStorage fails
            try { await fetchWithTimeout(url, { mode: 'no-cors', credentials: 'omit' }); } catch (_) {}
            throw err;
          }
        }
      } catch (e) {
        console.warn('Failed to cache (continuing):', url, e?.message || e);
      } finally {
        update();
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
  await Promise.all(workers);
  try { console.log('[prefetch] Location prefetch complete.'); } catch (_) {}
}

export { LOCATION_JSON_URL, LOCATION_CACHE_NAME };

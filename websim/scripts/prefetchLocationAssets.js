const LOCATION_JSON_URL = 'src/components/game/json/location.json';
const LOCATION_CACHE_NAME = 'location-assets-v1';

/**
 * Fetches the list of asset URLs from cache/by_group/location.json.
 * @returns {Promise<string[]>} Array of absolute/relative URLs to prefetch.
 */
async function loadLocationAssetList() {
  try {
    const res = await fetch(LOCATION_JSON_URL, { credentials: 'omit' });
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
          // Use cache.add which performs a fetch and stores the response.
          // If CORS blocks readable responses, an opaque response may still be stored.
          await cache.add(new Request(url, { mode: 'no-cors', credentials: 'omit' }));
        }
      } catch (e) {
        // Fall back to a plain fetch to warm HTTP cache even if CacheStorage fails
        try { await fetch(url, { mode: 'no-cors', credentials: 'omit' }); } catch (_) {}
        console.warn('Failed to cache (continuing):', url, e);
      } finally {
        update();
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
  await Promise.all(workers);
}

export { LOCATION_JSON_URL, LOCATION_CACHE_NAME };


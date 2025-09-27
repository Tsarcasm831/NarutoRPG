const JSON_DIRECTORY = './src/components/json/';
const CACHE_NAME = 'game-assets-v1';
const REQUEST_TIMEOUT_MS = 8000;

function fetchWithTimeout(input, init = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort('timeout'), timeoutMs);
    const merged = { ...init, signal: controller.signal };
    return fetch(input, merged).finally(() => clearTimeout(id));
}

// This will hold the list of all asset URLs to be downloaded.
let allAssetUrls = [];

const CHARACTER_ANIMATION_JSONS = [
    'kakashiAnimations.json',
    'narutoAnimations.json',
    'sasukeAnimations.json',
    'sakuraAnimations.json',
    'shikamaruAnimations.json'
];

// NEW: Only cache a minimal set of essential animation clips to avoid huge downloads
const ESSENTIAL_ANIMATION_MATCHES = [
    'Animation_Idle_11_withSkin.glb',
    'Animation_Idle_withSkin.glb',
    'Animation_Arise_withSkin.glb',
    'Animation_BeHit_FlyUp_withSkin.glb',
    'Animation_Casual_Walk_withSkin.glb',
    'Animation_Walking_withSkin.glb',
    'Animation_RunFast_withSkin.glb',
    'Animation_Running_withSkin.glb',
    'Animation_Run_03_withSkin.glb',
    'Animation_Unsteady_Walk_withSkin.glb',
    'Animation_Regular_Jump_withSkin.glb',
    'Animation_Fall1_withSkin.glb',
    'Animation_Punch_Combo_1_withSkin.glb',
    'Animation_Roll_Dodge_withSkin.glb',
    'Animation_Skill_01_withSkin.glb',
    'Animation_Listening_Gesture_withSkin.glb',
    'Animation_Boxing_Practice_withSkin.glb',
    'Animation_Dead_withSkin.glb'
];

// NEW: Local image assets to precache during the first loading screen
const IMAGE_ASSETS = [
    // UI and splash screens
    './loading.png',
    './loading1.png',
    './menu.png',

    // Terrain and world textures (some may be swapped by settings/biomes)
    './grass_texture.png',
    './sand_texture.png',
    './dirt_path_texture.png',
    './rocky_ground_texture.png',
    './snow_texture.png',
    './forest_floor_texture.png',
    './ground_texture.png'
];

// NEW: 3D model assets to pre-cache (include external fallback for Hospital)
const MODEL_ASSETS = [
    // Local copies (prefer local for performance when available). Use relative paths so subpath hosting works.
    './src/assets/hokage_office.glb',
    './src/assets/Hokage_Monument.glb',
    './src/assets/Hospital.glb',
    './src/assets/Arena.glb',
    // External fallback (opaque cached via no-cors)
    'https://www.lordtsarcasm.com/assets/NarutoGame/Buildings/Hospital.glb'
];

/**
 * Fetches and parses a JSON file to get a list of asset URLs.
 * @param {string} jsonFileName - The name of the JSON file in the JSON_DIRECTORY.
 * @returns {Promise<string[]>} A promise that resolves with an array of URLs.
 */
async function getAssetUrlsFromJson(jsonFileName) {
    try {
        const response = await fetch(`${JSON_DIRECTORY}${jsonFileName}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${jsonFileName}: ${response.statusText}`);
        }
        const data = await response.json();
        // Assuming the JSON format is { "files": ["url1", "url2", ...] }
        return data.files || [];
    } catch (error) {
        console.error(`Error loading asset list from ${jsonFileName}:`, error);
        return [];
    }
}

/**
 * Initializes the asset loader by collecting all asset URLs from all JSON files in the directory.
 * This function needs to know which JSON files to look for. Since we can't read a directory listing
 * from the browser, we'll have to hardcode the list for now.
 */
export async function initializeAssetLoader() {
    // Hardcoded list of JSON files to check.
    const jsonFiles = CHARACTER_ANIMATION_JSONS; 
    
    console.log('Initializing asset loader...');
    
    const urlPromises = jsonFiles.map(file => getAssetUrlsFromJson(file));
    const urlArrays = await Promise.all(urlPromises);
    
    // Flatten the array of arrays into a single array of URLs
    let urls = urlArrays.flat();

    // NEW: Filter to only essential animations to dramatically reduce bandwidth and memory
    if (urls && urls.length) {
        const essentialUrls = urls.filter((url) =>
            ESSENTIAL_ANIMATION_MATCHES.some((match) => url.includes(match))
        );
        urls = essentialUrls.length ? essentialUrls : urls;
    }

    // Remove duplicates
    allAssetUrls = [...new Set(urls)];

    // Include local image assets and model assets so they are precached during the first loading screen
    allAssetUrls = [...new Set([...allAssetUrls, ...IMAGE_ASSETS, ...MODEL_ASSETS])];
    
    console.log(`Found ${allAssetUrls.length} unique assets to potentially download.`);
}


export async function cacheAssets(urls = [], onProgress) {
    // Fallback path when Cache Storage API is unavailable (e.g., file:// or insecure context)
    if (typeof caches === 'undefined') {
        let completed = 0;
        const total = urls.length || 1;
        for (const url of urls) {
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
                completed += 1;
                if (onProgress) onProgress(Math.round((completed / total) * 100));
            }
        }
        return;
    }

    if (!Array.isArray(urls) || urls.length === 0) {
        if (onProgress) onProgress(100);
        return;
    }

    try {
        const cache = await caches.open(CACHE_NAME);
        let downloadedCount = 0;
        const totalAssets = urls.length;

        // Track progress as each asset finishes downloading.
        const updateProgress = () => {
            downloadedCount++;
            if (onProgress) {
                const progress = Math.round((downloadedCount / totalAssets) * 100);
                onProgress(progress);
            }
        };

        // Process assets in manageable batches to avoid overwhelming the browser.
        const batchSize = 10;
        for (let i = 0; i < totalAssets; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            await Promise.all(batch.map(async (url) => {
                try {
                    const cachedResponse = await cache.match(url);
                    if (!cachedResponse) {
                        if (/^https?:\/\//i.test(url)) {
                            // Cross-origin: prefer fetch(no-cors) + cache.put; fall back silently if blocked.
                            try {
                                const req = new Request(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
                                const res = await fetchWithTimeout(req);
                                // Store opaque responses when available; some browsers reject opaqueredirect.
                                if (res && res.type !== 'opaqueredirect') {
                                    try { await cache.put(req, res.clone()); } catch (_) { /* ignore */ }
                                }
                            } catch (e) {
                                // Non-fatal; remote prefetch is best-effort only.
                                console.warn(`Skipping cross-origin cache for: ${url} (${e?.message || e})`);
                            }
                        } else {
                            // Local assets: still guard against indefinite hangs
                            try {
                                const res = await fetchWithTimeout(url, { credentials: 'omit', cache: 'no-store' });
                                try { await cache.put(url, res.clone()); } catch (_) { /* ignore */ }
                            } catch (e) {
                                console.warn(`Skipping local cache for: ${url} (${e?.message || e})`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to cache asset: ${url}`, error);
                } finally {
                    updateProgress();
                }
            }));
        }

        console.log('All assets have been processed for caching.');
    } catch (error) {
        console.error('Error opening cache or caching assets:', error);
    }
}


/**
 * Starts the process of downloading and caching all the assets.
 * @param {function(number): void} [onProgress] - Optional callback to report progress (0 to 100).
 * @returns {Promise<void>} A promise that resolves when all assets have been processed.
 */
export async function startCaching(onProgress) {
    if (allAssetUrls.length === 0) {
        console.warn('Asset list is empty. Calling initializeAssetLoader() first.');
        await initializeAssetLoader();
    }

    if (allAssetUrls.length === 0) {
        console.error('Still no assets to cache after initialization.');
        if (onProgress) onProgress(100);
        return;
    }

    console.log(`Starting to cache ${allAssetUrls.length} assets...`);

    await cacheAssets(allAssetUrls, onProgress);
}

/**
 * A utility function to check if all assets are cached.
 * @returns {Promise<boolean>} True if all assets are in the cache, false otherwise.
 */
export async function areAllAssetsCached() {
    if (allAssetUrls.length === 0) {
        await initializeAssetLoader();
    }
    
    if (allAssetUrls.length === 0) {
        return true; // No assets to cache.
    }

    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    const cachedUrls = new Set(cachedRequests.map(req => req.url));

    for (const url of allAssetUrls) {
        if (!cachedUrls.has(url)) {
            // console.log(`Asset not found in cache: ${url}`);
            return false;
        }
    }

    return true;
}

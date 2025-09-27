const DEFAULT_PATH_RESOLVERS = [
    (id) => `map/district-buildings/json/${id}.buildings.json`,
    (id) => `/map/district-buildings/json/${id}.buildings.json`,
    (id) => `map/generated/district-buildings/${id}.json`,
    (id) => `/map/generated/district-buildings/${id}.json`
];

async function fetchFirstSuccessful(urls = []) {
    for (const url of urls) {
        try {
            const res = await fetch(url, { credentials: 'omit' });
            if (res && res.ok) {
                return res;
            }
        } catch (err) {
            // continue to next URL; this mirrors the startup loader behaviour
        }
    }
    return null;
}

function normalizeLayoutData(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) {
        return { entries: raw };
    }
    if (typeof raw === 'object') {
        if (Array.isArray(raw.entries)) {
            return raw;
        }
        if (Array.isArray(raw.buildings)) {
            return { entries: raw.buildings, meta: raw.meta || null };
        }
    }
    return null;
}

function ensureLayoutCache(target) {
    if (target) return target;
    if (typeof window !== 'undefined') {
        window.__districtLayouts = window.__districtLayouts || {};
        return window.__districtLayouts;
    }
    return {};
}

export async function loadDistrictLayouts(ids = [], { customSources = [], forceReload = false, target } = {}) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return {};
    }

    const cache = ensureLayoutCache(target);
    const sourceMap = new Map();
    customSources.forEach((entry) => {
        if (!entry || !entry.id) return;
        const urls = Array.isArray(entry.urls) && entry.urls.length > 0 ? entry.urls : null;
        if (urls) {
            sourceMap.set(entry.id, urls);
        }
    });

    const results = {};
    await Promise.all(ids.map(async (id) => {
        if (!id) return;
        if (!forceReload && cache[id]) {
            results[id] = cache[id];
            return;
        }

        const defaultUrls = DEFAULT_PATH_RESOLVERS.map((fn) => fn(id));
        const urls = sourceMap.get(id) || defaultUrls;
        try {
            const res = await fetchFirstSuccessful(urls);
            if (!res) return;
            const data = await res.json();
            const normalized = normalizeLayoutData(data);
            if (normalized) {
                cache[id] = normalized;
                results[id] = normalized;
            }
        } catch (err) {
            console.warn('Failed to load district layout', id, err);
        }
    }));

    return results;
}

export function cloneDistrictLayout(layout) {
    if (!layout) return null;
    try {
        return JSON.parse(JSON.stringify(layout));
    } catch (err) {
        return null;
    }
}

export { normalizeLayoutData };

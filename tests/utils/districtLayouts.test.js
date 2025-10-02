import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadDistrictLayouts, cloneDistrictLayout, normalizeLayoutData } from '/src/utils/districtLayouts';

const ORIGINAL_FETCH = global.fetch;
let originalWindowCache;

describe('districtLayouts utilities', () => {
    beforeEach(() => {
        originalWindowCache = window.__districtLayouts;
        delete window.__districtLayouts;
        vi.restoreAllMocks();
        global.fetch = ORIGINAL_FETCH;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        global.fetch = ORIGINAL_FETCH;
        if (originalWindowCache === undefined) {
            delete window.__districtLayouts;
        } else {
            window.__districtLayouts = originalWindowCache;
        }
    });

    describe('normalizeLayoutData', () => {
        it('wraps arrays in an entries object', () => {
            const entries = [{ id: 1 }];
            expect(normalizeLayoutData(entries)).toEqual({ entries });
        });

        it('returns the object when entries array already present', () => {
            const raw = { entries: [{ id: 'foo' }], meta: { foo: 'bar' } };
            expect(normalizeLayoutData(raw)).toBe(raw);
        });

        it('maps buildings array to entries and preserves meta', () => {
            const raw = { buildings: [{ id: 'a' }], meta: { zone: 'leaf' } };
            expect(normalizeLayoutData(raw)).toEqual({ entries: raw.buildings, meta: raw.meta });
        });

        it('returns null for invalid shapes', () => {
            expect(normalizeLayoutData(null)).toBeNull();
            expect(normalizeLayoutData({})).toBeNull();
            expect(normalizeLayoutData('nope')).toBeNull();
        });
    });

    describe('cloneDistrictLayout', () => {
        it('produces a deep clone and does not mutate the source', () => {
            const source = { entries: [{ id: 1 }], meta: { origin: 'leaf' } };
            const clone = cloneDistrictLayout(source);

            expect(clone).toEqual(source);
            expect(clone).not.toBe(source);

            clone.entries[0].id = 2;
            expect(source.entries[0].id).toBe(1);
        });

        it('returns null for invalid inputs', () => {
            expect(cloneDistrictLayout(null)).toBeNull();
            expect(cloneDistrictLayout(undefined)).toBeNull();
        });
    });

    describe('loadDistrictLayouts', () => {
        const DISTRICT_ID = 'leaf-village';
        const defaultUrls = [
            `map/district-buildings/json/${DISTRICT_ID}.buildings.json`,
            `/map/district-buildings/json/${DISTRICT_ID}.buildings.json`,
            `map/generated/district-buildings/${DISTRICT_ID}.json`,
            `/map/generated/district-buildings/${DISTRICT_ID}.json`
        ];

        it('iterates default URLs until a successful response and caches the result', async () => {
            const successfulData = { entries: [{ id: 'academy' }] };
            const jsonSuccess = vi.fn().mockResolvedValue(successfulData);

            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ ok: false })
                .mockRejectedValueOnce(new Error('Network down'))
                .mockResolvedValueOnce({ ok: true, json: jsonSuccess });

            global.fetch = fetchMock;

            const results = await loadDistrictLayouts([DISTRICT_ID]);
            expect(fetchMock).toHaveBeenCalledTimes(3);
            defaultUrls.slice(0, 3).forEach((url, index) => {
                expect(fetchMock).toHaveBeenNthCalledWith(index + 1, url, { credentials: 'omit' });
            });
            expect(jsonSuccess).toHaveBeenCalledTimes(1);
            expect(results[DISTRICT_ID]).toEqual(successfulData);

            fetchMock.mockClear();
            const second = await loadDistrictLayouts([DISTRICT_ID]);
            expect(fetchMock).not.toHaveBeenCalled();
            expect(second[DISTRICT_ID]).toBe(results[DISTRICT_ID]);

            const reloadedData = { entries: [{ id: 'academy', level: 2 }] };
            const jsonReload = vi.fn().mockResolvedValue(reloadedData);
            fetchMock.mockResolvedValueOnce({ ok: true, json: jsonReload });

            const reloadResults = await loadDistrictLayouts([DISTRICT_ID], { forceReload: true });
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(jsonReload).toHaveBeenCalledTimes(1);
            expect(reloadResults[DISTRICT_ID]).toEqual(reloadedData);
            expect(reloadResults[DISTRICT_ID]).not.toBe(results[DISTRICT_ID]);
        });

        it('respects existing shared window cache entries', async () => {
            const cachedLayout = { entries: [{ id: 'existing' }] };
            window.__districtLayouts = { [DISTRICT_ID]: cachedLayout };
            const fetchMock = vi.fn();
            global.fetch = fetchMock;

            const results = await loadDistrictLayouts([DISTRICT_ID]);
            expect(fetchMock).not.toHaveBeenCalled();
            expect(results[DISTRICT_ID]).toBe(cachedLayout);
            expect(window.__districtLayouts[DISTRICT_ID]).toBe(cachedLayout);
        });

        it('returns empty object when no ids provided', async () => {
            const fetchMock = vi.fn();
            global.fetch = fetchMock;

            const result = await loadDistrictLayouts();
            expect(result).toEqual({});
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});

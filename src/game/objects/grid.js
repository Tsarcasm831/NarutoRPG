export class ObjectGrid {
    constructor(worldSize, cellSize) {
        this.worldSize = worldSize;
        this.cellSize = cellSize;
        this.grid = {};
        this.halfWorldSize = worldSize / 2;
        this.numCells = Math.ceil(worldSize / cellSize);
        this.objectLookup = new WeakMap();
    }

    _getGridCoords(position) {
        const x = Math.floor((position.x + this.halfWorldSize) / this.cellSize);
        const z = Math.floor((position.z + this.halfWorldSize) / this.cellSize);
        return { x, z };
    }

    _getKey(coords) {
        return `${coords.x},${coords.z}`;
    }

    _ensureCell(key) {
        if (!this.grid[key]) this.grid[key] = [];
        return this.grid[key];
    }

    _addToCell(key, object) {
        const cell = this._ensureCell(key);
        if (!cell.includes(object)) {
            cell.push(object);
        }
        this.objectLookup.set(object, key);
    }

    _removeFromCell(key, object) {
        const cell = this.grid[key];
        if (!cell) return;
        const index = cell.indexOf(object);
        if (index !== -1) {
            cell.splice(index, 1);
        }
        if (cell.length === 0) {
            delete this.grid[key];
        }
    }

    _placeObject(object) {
        if (!object?.position) return;
        const coords = this._getGridCoords(object.position);
        const key = this._getKey(coords);
        const previousKey = this.objectLookup.get(object);
        if (previousKey && previousKey !== key) {
            this._removeFromCell(previousKey, object);
        }
        this._addToCell(key, object);
    }

    add(object) {
        this._placeObject(object);
    }

    update(object) {
        this._placeObject(object);
    }

    remove(object) {
        const key = this.objectLookup.get(object);
        if (!key) return;
        this._removeFromCell(key, object);
        this.objectLookup.delete(object);
    }

    getObjectsNear(position, radius) {
        const centerCoords = this._getGridCoords(position);
        const cellRadius = Math.ceil(radius / this.cellSize);
        const nearbyObjects = new Set();

        for (let x = centerCoords.x - cellRadius; x <= centerCoords.x + cellRadius; x++) {
            for (let z = centerCoords.z - cellRadius; z <= centerCoords.z + cellRadius; z++) {
                const key = this._getKey({ x, z });
                if (this.grid[key]) {
                    this.grid[key].forEach(obj => nearbyObjects.add(obj));
                }
            }
        }
        return Array.from(nearbyObjects);
    }

    clear() {
        this.grid = {};
        this.objectLookup = new WeakMap();
    }
}

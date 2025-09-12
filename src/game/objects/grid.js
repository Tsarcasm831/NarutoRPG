export class ObjectGrid {
    constructor(worldSize, cellSize) {
        this.worldSize = worldSize;
        this.cellSize = cellSize;
        this.grid = {};
        this.halfWorldSize = worldSize / 2;
        this.numCells = Math.ceil(worldSize / cellSize);
    }

    _getGridCoords(position) {
        const x = Math.floor((position.x + this.halfWorldSize) / this.cellSize);
        const z = Math.floor((position.z + this.halfWorldSize) / this.cellSize);
        return { x, z };
    }

    _getKey(coords) {
        return `${coords.x},${coords.z}`;
    }

    add(object) {
        const coords = this._getGridCoords(object.position);
        const key = this._getKey(coords);
        if (!this.grid[key]) this.grid[key] = [];
        this.grid[key].push(object);
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
    }
}
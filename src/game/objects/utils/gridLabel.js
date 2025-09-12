import * as THREE from 'three';

// Helper: convert spreadsheet-like letters (A, B, ..., Z, AA, AB, ...) to zero-based column index
export function getColumnIndex(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    const c = letters.charCodeAt(i) - 65; // 'A' -> 0
    n = n * 26 + (c + 1);
  }
  return n - 1;
}

// Helper: parse a grid label like "KD493" into zero-based indices { i, j }
export function parseGridLabel(label) {
  const match = String(label).match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid grid label: ${label}`);
  const letters = match[1].toUpperCase();
  const number = parseInt(match[2], 10);
  return { i: getColumnIndex(letters), j: number - 1 };
}

// Helper: world position (center) for a label cell, using locked 5u cell size like grid labels
export function posForCell(i, j, worldSize) {
  const cellSize = 5;
  const numCells = Math.floor(worldSize / cellSize);
  const x = (i - numCells / 2) * cellSize + cellSize / 2;
  const z = (j - numCells / 2) * cellSize + cellSize / 2;
  return new THREE.Vector3(x, 0, z);
}

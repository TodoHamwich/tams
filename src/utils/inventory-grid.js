/**
 * Shared utilities for the Diablo-style grid inventory.
 * Imported by both actor-sheet.js and inventory-container-app.js.
 */

/**
 * Canonical cell lists for each shape (before any rotation/flip).
 * Each entry is an array of [col, row] offsets from the top-left anchor.
 */
export const SHAPE_CELLS = {
  '1x1': [[0,0]],
  '1x2': [[0,0],[0,1]],
  '1x3': [[0,0],[0,1],[0,2]],
  '1x4': [[0,0],[0,1],[0,2],[0,3]],
  '2x2': [[0,0],[1,0],[0,1],[1,1]],
  '2x3': [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]],
  '2x4': [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3]],
  '3x3': [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
  // L-shape: left column 3 tall, bottom-right cell
  //  X .
  //  X .
  //  X X
  'L': [[0,0],[0,1],[0,2],[1,2]],
  // T-shape: top row 3 wide, middle stem
  //  X X X
  //  . X .
  'T': [[0,0],[1,0],[2,0],[1,1]],
};

/** Legacy size → [w, h] for items that predate gridSize */
export const GRID_FOOTPRINT = { small: [1, 1], medium: [1, 2], large: [2, 3] };

/** Item types that appear in the inventory grid */
export const INVENTORY_TYPES = [
  'weapon', 'equipment', 'armor', 'ammo', 'consumable',
  'tool', 'shield', 'questItem', 'backpack',
];

/** Cell size in pixels (36px cell + 1px gap) */
export const GRID_CELL = 37;

/** Fixed size of an actor's main "stowed" grid (not a per-actor setting — the real capacity
 *  cap is the existing weight/slots encumbrance system; unplaced items just sit in the shelf). */
export const MAIN_GRID_COLS = 10;
export const MAIN_GRID_ROWS = 8;

/**
 * Apply rotation (90° CW) and/or horizontal flip to a cell list.
 * Returns a normalized list starting from (0, 0).
 */
export function transformCells(cells, rotated, flipped) {
  let c = cells.map(([x, y]) => [x, y]);

  if (rotated) {
    const maxY = Math.max(...c.map(([, y]) => y));
    c = c.map(([x, y]) => [maxY - y, x]);
  }

  if (flipped) {
    const maxX = Math.max(...c.map(([x]) => x));
    c = c.map(([x, y]) => [maxX - x, y]);
  }

  // Normalize so min x and min y are 0
  const minX = Math.min(...c.map(([x]) => x));
  const minY = Math.min(...c.map(([, y]) => y));
  return c.map(([x, y]) => [x - minX, y - minY]);
}

/**
 * Return the transformed cell list for an item, respecting gridRotated and gridFlipped.
 */
export function getItemCells(item) {
  const base = SHAPE_CELLS[item.system?.gridSize];
  if (!base) {
    // Legacy fallback: build a full rectangle from the size field
    const [w, h] = GRID_FOOTPRINT[item.system?.size] ?? [1, 1];
    const rect = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rect.push([x, y]);
    return transformCells(rect, item.system?.gridRotated ?? false, item.system?.gridFlipped ?? false);
  }
  return transformCells(base, item.system?.gridRotated ?? false, item.system?.gridFlipped ?? false);
}

/**
 * Return the bounding box [w, h] of an item, respecting rotation and flip.
 */
export function getFootprint(item) {
  const cells = getItemCells(item);
  return [
    Math.max(...cells.map(([x]) => x)) + 1,
    Math.max(...cells.map(([, y]) => y)) + 1,
  ];
}

/**
 * Return the bounding box [w, h] of an item in its canonical (un-rotated, un-flipped) form.
 * Used when computing the new footprint for a pending drag rotation/flip.
 */
export function getBaseFootprint(item) {
  const base = SHAPE_CELLS[item.system?.gridSize];
  if (!base) return GRID_FOOTPRINT[item.system?.size] ?? [1, 1];
  return [
    Math.max(...base.map(([x]) => x)) + 1,
    Math.max(...base.map(([, y]) => y)) + 1,
  ];
}

/**
 * Check whether placing draggedItem at anchor (cx, cy) is collision-free.
 * @param {Actor}       actor
 * @param {object}      draggedItem   Item or item-like object (needs .id and .system)
 * @param {number}      cx            Anchor column (0-based)
 * @param {number}      cy            Anchor row (0-based)
 * @param {Array}       cells         [[dx, dy], ...] of cells to place (relative to anchor)
 * @param {string|null} containerId   null = main stowed grid; backpack ID = container
 * @returns {boolean}
 */
export function gridPlacementValid(actor, draggedItem, cx, cy, cells, containerId) {
  const occupied = new Set(cells.map(([dx, dy]) => `${cx + dx},${cy + dy}`));

  for (const it of actor.items) {
    if (it.id === draggedItem.id) continue;
    if (!INVENTORY_TYPES.includes(it.type)) continue;
    if (it.system.gridX === null || it.system.gridX === undefined) continue;

    const loc = it.system.location;
    const inSameSpace = containerId
      ? loc === containerId
      : (loc === 'stowed' || loc === 'backpack');
    if (!inSameSpace) continue;

    for (const [dx, dy] of getItemCells(it)) {
      if (occupied.has(`${it.system.gridX + dx},${it.system.gridY + dy}`)) return false;
    }
  }
  return true;
}

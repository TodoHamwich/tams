import { SHAPE_CELLS, INVENTORY_TYPES, GRID_CELL, gridPlacementValid, getItemCells, transformCells } from '../utils/inventory-grid.js';


/**
 * Floating window showing a container item's grid sub-inventory.
 * One instance per backpack — the actor sheet de-duplicates opens.
 */
export class TAMSContainerGridApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "div",
    classes: ["tams", "container-grid-app"],
    position: { width: 360, height: 380 },
    window: { resizable: true },
  };

  static PARTS = {
    form: {
      template: "systems/tams/templates/inventory-container.html",
    },
  };

  constructor(options = {}) {
    super(options);
    this._actor = options.actor;
    this._containerId = options.containerId;
    this._currentDragItemId = null;
    this._dragRotated = null;
    this._dragFlipped = null;
    this._lastGridDrop = null;
    this._lastDragOverEv = null;
    this._hookIds = [];
  }

  get title() {
    const bp = this._actor.items.get(this._containerId);
    return bp?.name ?? game.i18n.localize("TAMS.Container");
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const bp = this._actor.items.get(this._containerId);
    if (!bp) {
      this.close();
      return context;
    }

    const gridCols = bp.system.gridCols ?? 8;
    const gridRows = bp.system.gridRows ?? 6;

    const gridItems = [];
    const unplacedItems = [];

    for (const item of this._actor.items) {
      if (!INVENTORY_TYPES.includes(item.type)) continue;
      if (item.system.location !== this._containerId) continue;
      const cells = getItemCells(item);
      const bw = Math.max(...cells.map(([x]) => x)) + 1;
      const bh = Math.max(...cells.map(([, y]) => y)) + 1;
      if (item.system.gridX !== null && item.system.gridX !== undefined) {
        gridItems.push({ item, cells: cells.map(([dx, dy]) => ({ dx, dy })), bw, bh });
      } else {
        unplacedItems.push({ item, gridW: bw, gridH: bh });
      }
    }

    context.gridCols = gridCols;
    context.gridRows = gridRows;
    context.gridItems = gridItems;
    context.unplacedItems = unplacedItems;
    context.containerId = this._containerId;

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this._setupDragDrop();
    this._registerHooks();
  }

  /** @override */
  async _onClose(options) {
    for (const [type, id] of this._hookIds) Hooks.off(type, id);
    this._hookIds = [];
    return super._onClose(options);
  }

  _registerHooks() {
    for (const [type, id] of this._hookIds) Hooks.off(type, id);
    this._hookIds = [];

    const rerender = (item) => {
      if (item.parent?.id === this._actor.id) this.render();
    };
    this._hookIds.push(
      ["updateItem", Hooks.on("updateItem", rerender)],
      ["createItem", Hooks.on("createItem", rerender)],
      ["deleteItem", Hooks.on("deleteItem", rerender)],
    );
  }

  _setupDragDrop() {
    const el = this.element;
    if (!el) return;

    // Grid item cells: hover coordination + drag
    el.querySelectorAll(".grid-item-cell[data-item-id]").forEach((node) => {
      const itemId = node.dataset.itemId;
      node.addEventListener("mouseenter", () => {
        el.querySelectorAll(`.grid-item-cell[data-item-id="${itemId}"]`).forEach(c => c.classList.add("hovered"));
      });
      node.addEventListener("mouseleave", (e) => {
        if (e.relatedTarget?.closest(`.grid-item-cell[data-item-id="${itemId}"]`)) return;
        el.querySelectorAll(`.grid-item-cell[data-item-id="${itemId}"]`).forEach(c => c.classList.remove("hovered"));
      });
      node.addEventListener("dragstart", (ev) => this._onItemDragStart(ev, node));
    });

    // Shelf items: drag only
    el.querySelectorAll(".shelf-item[data-item-id]").forEach((node) => {
      node.addEventListener("dragstart", (ev) => this._onItemDragStart(ev, node));
    });

    const gridEl = el.querySelector(".tams-inventory-grid");
    if (gridEl) {
      gridEl.addEventListener("dragover", (ev) => this._onGridDragOver(ev, gridEl));
      gridEl.addEventListener("dragleave", (ev) => this._onGridDragLeave(ev, gridEl));
      gridEl.addEventListener("drop", (ev) => this._onGridDrop(ev, gridEl));
    }

    const shelf = el.querySelector(".unplaced-shelf");
    if (shelf) {
      shelf.addEventListener("dragover", (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; });
      shelf.addEventListener("drop", (ev) => this._onShelfDrop(ev));
    }
  }

  _onItemDragStart(ev, node) {
    const itemId = node.dataset.itemId;
    const item = this._actor.items.get(itemId);
    if (!item) return;
    this._currentDragItemId = itemId;
    this._dragRotated = item.system.gridRotated ?? false;
    this._dragFlipped = item.system.gridFlipped ?? false;

    const keyHandler = (kev) => {
      const gEl = this.element?.querySelector(".tams-inventory-grid");
      if (kev.key === "r" || kev.key === "R") {
        kev.preventDefault();
        this._dragRotated = !this._dragRotated;
        if (gEl && this._lastDragOverEv) this._onGridDragOver(this._lastDragOverEv, gEl);
      } else if (kev.key === "f" || kev.key === "F") {
        kev.preventDefault();
        this._dragFlipped = !this._dragFlipped;
        if (gEl && this._lastDragOverEv) this._onGridDragOver(this._lastDragOverEv, gEl);
      }
    };
    document.addEventListener("keydown", keyHandler);
    node.addEventListener("dragend", () => {
      this._currentDragItemId = null;
      this._dragRotated = null;
      this._dragFlipped = null;
      this._lastDragOverEv = null;
      document.removeEventListener("keydown", keyHandler);
    }, { once: true });

    const dragData = item.toDragData();
    if (dragData) {
      const json = JSON.stringify(dragData);
      ev.dataTransfer.setData("text/plain", json);
      ev.dataTransfer.setData("application/json", json);
    }
  }

  _onGridDragOver(ev, gridEl) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";

    this._lastDragOverEv = ev;

    const rect = gridEl.getBoundingClientRect();
    const cx = Math.floor((ev.clientX - rect.left) / GRID_CELL);
    const cy = Math.floor((ev.clientY - rect.top) / GRID_CELL);
    const cols = parseInt(gridEl.dataset.cols);
    const rows = parseInt(gridEl.dataset.rows);

    const localItem = this._currentDragItemId
      ? this._actor.items.get(this._currentDragItemId)
      : null;

    const rotated = this._dragRotated ?? localItem?.system.gridRotated ?? false;
    const flipped = this._dragFlipped ?? localItem?.system.gridFlipped ?? false;
    const baseCells = (localItem && SHAPE_CELLS[localItem.system?.gridSize]) ?? [[0, 0]];
    const cells = transformCells(baseCells, rotated, flipped);

    gridEl.querySelectorAll(".grid-preview").forEach(el => el.remove());

    const outOfBounds = cells.some(([dx, dy]) => {
      const px = cx + dx, py = cy + dy;
      return px < 0 || py < 0 || px >= cols || py >= rows;
    });
    const valid = !outOfBounds &&
      (!localItem || gridPlacementValid(this._actor, localItem, cx, cy, cells, this._containerId));

    for (const [dx, dy] of cells) {
      const px = cx + dx, py = cy + dy;
      const cellOob = px < 0 || py < 0 || px >= cols || py >= rows;
      const preview = document.createElement("div");
      preview.className = `grid-preview ${(valid && !cellOob) ? "valid" : "invalid"}`;
      preview.style.setProperty("--gx", px);
      preview.style.setProperty("--gy", py);
      preview.style.setProperty("--gw", 1);
      preview.style.setProperty("--gh", 1);
      gridEl.appendChild(preview);
    }

    this._lastGridDrop = outOfBounds ? null : { cx, cy };
  }

  _onGridDragLeave(ev, gridEl) {
    if (!gridEl.contains(ev.relatedTarget)) {
      gridEl.querySelectorAll(".grid-preview").forEach(el => el.remove());
      this._lastGridDrop = null;
    }
  }

  async _onGridDrop(ev, gridEl) {
    ev.preventDefault();
    gridEl.querySelectorAll(".grid-preview").forEach(el => el.remove());

    const targetCell = this._lastGridDrop;
    this._lastGridDrop = null;
    if (!targetCell) return;

    const data = TextEditor.getDragEventData(ev);
    if (data.type !== "Item") return;

    let item;
    try {
      item = await Item.fromDropData(data);
    } catch {
      return;
    }
    if (!item) return;

    const { cx, cy } = targetCell;
    const rotated = this._dragRotated ?? item.system.gridRotated ?? false;
    const flipped = this._dragFlipped ?? item.system.gridFlipped ?? false;
    const baseCells = SHAPE_CELLS[item.system?.gridSize] ?? [[0, 0]];
    const cells = transformCells(baseCells, rotated, flipped);

    const cols = parseInt(gridEl.dataset.cols);
    const rows = parseInt(gridEl.dataset.rows);

    const outOfBounds = cells.some(([dx, dy]) => {
      const px = cx + dx, py = cy + dy;
      return px < 0 || py < 0 || px >= cols || py >= rows;
    });
    if (outOfBounds) {
      ui.notifications.warn(game.i18n.localize("TAMS.InvalidPlacement"));
      return;
    }

    if (!gridPlacementValid(this._actor, item, cx, cy, cells, this._containerId)) {
      ui.notifications.warn(game.i18n.localize("TAMS.InvalidPlacement"));
      return;
    }

    if (item.parent?.uuid === this._actor.uuid) {
      await item.update({
        "system.location": this._containerId,
        "system.gridX": cx,
        "system.gridY": cy,
        "system.gridRotated": rotated,
        "system.gridFlipped": flipped,
      });
    } else if (this._actor.isOwner) {
      const itemData = item.toObject();
      itemData.system.location = this._containerId;
      itemData.system.gridX = cx;
      itemData.system.gridY = cy;
      itemData.system.gridRotated = rotated;
      itemData.system.gridFlipped = flipped;
      delete itemData._id;
      await this._actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }

  async _onShelfDrop(ev) {
    ev.preventDefault();
    const data = TextEditor.getDragEventData(ev);
    if (data.type !== "Item") return;

    let item;
    try {
      item = await Item.fromDropData(data);
    } catch {
      return;
    }
    if (!item) return;

    // Move to this container (unplaced — null gridX/gridY)
    if (item.parent?.uuid === this._actor.uuid) {
      await item.update({
        "system.location": this._containerId,
        "system.gridX": null,
        "system.gridY": null,
      });
    } else if (this._actor.isOwner) {
      const itemData = item.toObject();
      itemData.system.location = this._containerId;
      itemData.system.gridX = null;
      itemData.system.gridY = null;
      delete itemData._id;
      await this._actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }
}

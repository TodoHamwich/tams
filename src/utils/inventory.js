/**
 * Pure inventory helper functions for the TAMS system.
 *
 * These helpers contain no Foundry dependencies so they can be unit tested in
 * isolation and shared between the data model and the actor sheet.
 */

/** Base "weight" of an item by size, expressed in medium-unit equivalents. */
export const SIZE_WEIGHTS = { small: 1, medium: 10, large: 50 };

/** Default and bounds for how many slots a large item occupies in slot mode. */
export const LARGE_SLOTS_DEFAULT = 2;
export const LARGE_SLOTS_MIN = 2;
export const LARGE_SLOTS_MAX = 10;

/** How many small items stack into a single slot in slot mode. */
export const SMALL_STACK_PER_SLOT = 10;

/**
 * Clamp a configured large-item slot cost into the supported range.
 * @param {number} value The raw configured slot cost.
 * @returns {number} A value within [LARGE_SLOTS_MIN, LARGE_SLOTS_MAX].
 */
export function clampLargeSlots(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return LARGE_SLOTS_DEFAULT;
  return Math.min(LARGE_SLOTS_MAX, Math.max(LARGE_SLOTS_MIN, Math.round(n)));
}

/**
 * The "weight" (medium-unit) cost of a single unit of an item, before any
 * container modifier is applied.
 * @param {string} size One of "small" | "medium" | "large".
 * @returns {number} The weight of one unit.
 */
export function unitWeight(size) {
  return SIZE_WEIGHTS[size] ?? 0;
}

/**
 * The number of slots a stack of items occupies in slot mode.
 * - small items stack: every {@link SMALL_STACK_PER_SLOT} share a slot.
 * - medium items take one slot each.
 * - large items take a configurable number of slots each.
 * @param {string} size One of "small" | "medium" | "large".
 * @param {number} quantity How many of the item are present.
 * @param {number} [largeSlots] Slot cost for a single large item.
 * @returns {number} Total slots occupied.
 */
export function stackSlots(size, quantity, largeSlots = LARGE_SLOTS_DEFAULT) {
  const qty = Math.max(0, Number(quantity) || 0);
  if (qty === 0) return 0;
  switch (size) {
    case "small": return Math.ceil(qty / SMALL_STACK_PER_SLOT);
    case "medium": return qty;
    case "large": return qty * clampLargeSlots(largeSlots);
    default: return 0;
  }
}

/**
 * Resolve whether a container (and its full parent chain) is actively carried,
 * i.e. every backpack in the chain up to the body is equipped.
 * @param {object} item The item whose carry state is being resolved.
 * @param {Map|object} itemsById A lookup providing `.get(id)` for items.
 * @returns {{carried: boolean, container: object|null}} carried state and the
 *   immediate container item (if the item lives inside a backpack).
 */
export function resolveCarryChain(item, itemsById) {
  const get = (id) => (typeof itemsById?.get === "function" ? itemsById.get(id) : itemsById?.[id]);
  let location = item?.system?.location;
  let immediateContainer = null;
  let guard = 0;

  while (location && location !== "stowed" && location !== "hand" && location !== "backpack") {
    const container = get(location);
    if (!container || container.type !== "backpack") break;
    if (guard === 0) immediateContainer = container;
    if (!container.system?.equipped) return { carried: false, container: immediateContainer };
    // Walk up to the container's own location (nested bags).
    location = container.system?.location;
    if (++guard > 25) break; // safety against cycles
  }

  return { carried: true, container: immediateContainer };
}

/**
 * Compute the encumbrance figures for an actor's carried items.
 *
 * @param {Iterable<object>} items All items on the actor.
 * @param {object} options Computation options.
 * @param {Map|object} options.itemsById Lookup providing `.get(id)`.
 * @param {number} options.endurance The actor's total Endurance.
 * @param {"weight"|"slots"} [options.mode="weight"] Capacity mode.
 * @param {string} [options.equippedBackpackId] Currently equipped primary backpack id.
 * @param {number} [options.largeSlots] Default slot cost for large items.
 * @returns {{used: number, max: number, isEncumbered: boolean, mode: string}}
 */
export function computeEncumbrance(items, {
  itemsById,
  endurance = 0,
  mode = "weight",
  equippedBackpackId = "",
  largeSlots = LARGE_SLOTS_DEFAULT
} = {}) {
  const get = (id) => (typeof itemsById?.get === "function" ? itemsById.get(id) : itemsById?.[id]);
  const allBackpackIds = new Set();
  for (const it of items) if (it.type === "backpack") allBackpackIds.add(it.id);

  let used = 0;
  for (const item of items) {
    const system = item.system || {};
    const location = system.location;

    // Only items that are actually carried count toward capacity.
    const carried = location === "stowed" || location === "hand" ||
      location === "backpack" || allBackpackIds.has(location);
    if (!carried) continue;

    const quantity = Math.max(0, Number(system.quantity) || 0);
    let cost = mode === "slots"
      ? stackSlots(system.size, quantity, system.slots ?? largeSlots)
      : unitWeight(system.size) * quantity;

    // Apply container modifier (weight mode) / carry-state (both modes).
    if (location === "backpack") {
      const bp = equippedBackpackId ? get(equippedBackpackId) : null;
      if (bp && bp.system?.equipped) {
        if (mode === "weight") cost *= (bp.system.modifier ?? 0.5);
      }
    } else if (allBackpackIds.has(location) && item.id !== equippedBackpackId) {
      const { carried: chainCarried, container } = resolveCarryChain(item, itemsById);
      if (!chainCarried) {
        cost = 0; // stored in an unequipped bag -> not carried
      } else if (mode === "weight" && container && container.type === "backpack") {
        cost *= (container.system?.modifier ?? 0.5);
      }
    }

    used += cost;
  }

  let max;
  if (mode === "slots") {
    max = Math.max(0, Math.floor(5 + endurance));
    const bp = equippedBackpackId ? get(equippedBackpackId) : null;
    if (bp && bp.system?.equipped) max += (bp.system.capacity || 0);
  } else {
    const baseCapacity = Math.max(0, Math.floor(endurance / 10)) * 100;
    const bp = equippedBackpackId ? get(equippedBackpackId) : null;
    const backpackExtra = (bp && bp.system?.equipped) ? ((bp.system.capacity || 0) * 10) : 0;
    max = baseCapacity + backpackExtra;
  }

  return { used, max, isEncumbered: used > max, mode };
}

/**
 * Compute the outcome of an armor repair check for a single covered zone.
 *
 * Difficulty equals the divisor times the number of missing points
 * (divisor is 5 normally, 10 when alternate armour is in use). For every full
 * "divisor" the roll falls short of the difficulty, the zone permanently loses
 * one point of max HP. The zone's current value is then set to the (possibly
 * reduced) max.
 *
 * @param {object} params Inputs for the calculation.
 * @param {number} params.value Current armor value for the zone.
 * @param {number} params.max Current max armor for the zone.
 * @param {number} params.rollTotal The final roll total of the repair check.
 * @param {boolean} [params.alternate=false] Whether alternate armour is enabled.
 * @returns {{missing:number, divisor:number, difficulty:number, shortfall:number,
 *   maxLost:number, newMax:number, newValue:number, success:boolean}}
 */
export function computeArmorRepair({ value, max, rollTotal, alternate = false }) {
  const divisor = alternate ? 10 : 5;
  const curMax = Math.max(0, Number(max) || 0);
  const curVal = Math.max(0, Number(value) || 0);
  const missing = Math.max(0, curMax - curVal);
  const difficulty = divisor * missing;
  const total = Number(rollTotal) || 0;

  const shortfall = Math.max(0, difficulty - total);
  let maxLost = Math.ceil(shortfall / divisor);
  if (maxLost > missing) maxLost = missing; // cannot lose more than was missing

  const newMax = Math.max(0, curMax - maxLost);
  const newValue = newMax; // repaired up to the (possibly reduced) max

  return {
    missing,
    divisor,
    difficulty,
    shortfall,
    maxLost,
    newMax,
    newValue,
    success: shortfall === 0
  };
}

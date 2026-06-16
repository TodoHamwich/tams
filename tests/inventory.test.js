import { describe, it, expect } from 'vitest';
import {
  clampLargeSlots,
  stackSlots,
  unitWeight,
  computeEncumbrance,
  computeArmorRepair
} from '../src/utils/inventory.js';

/** Build an item lookup with a Foundry-like `.get(id)`. */
function makeItems(list) {
  const arr = [...list];
  arr.get = (id) => arr.find(i => i.id === id);
  return arr;
}

describe('clampLargeSlots', () => {
  it('defaults invalid values to 2', () => {
    expect(clampLargeSlots(0)).toBe(2);
    expect(clampLargeSlots(undefined)).toBe(2);
    expect(clampLargeSlots(-5)).toBe(2);
  });
  it('clamps into [2, 10]', () => {
    expect(clampLargeSlots(1)).toBe(2);
    expect(clampLargeSlots(5)).toBe(5);
    expect(clampLargeSlots(50)).toBe(10);
  });
});

describe('unitWeight', () => {
  it('maps sizes to weights', () => {
    expect(unitWeight('small')).toBe(1);
    expect(unitWeight('medium')).toBe(10);
    expect(unitWeight('large')).toBe(50);
    expect(unitWeight('unknown')).toBe(0);
  });
});

describe('stackSlots', () => {
  it('stacks small items 10 per slot', () => {
    expect(stackSlots('small', 1)).toBe(1);
    expect(stackSlots('small', 10)).toBe(1);
    expect(stackSlots('small', 11)).toBe(2);
    expect(stackSlots('small', 20)).toBe(2);
  });
  it('medium items take one slot each', () => {
    expect(stackSlots('medium', 3)).toBe(3);
  });
  it('large items take configurable slots each', () => {
    expect(stackSlots('large', 1, 2)).toBe(2);
    expect(stackSlots('large', 2, 3)).toBe(6);
    expect(stackSlots('large', 1, 99)).toBe(10); // clamped
  });
  it('zero quantity uses no slots', () => {
    expect(stackSlots('large', 0, 5)).toBe(0);
  });
});

describe('computeEncumbrance - weight mode', () => {
  it('sums weights by size and quantity', () => {
    const items = makeItems([
      { id: 'i1', system: { location: 'stowed', size: 'small', quantity: 5 } },
      { id: 'i2', system: { location: 'stowed', size: 'medium', quantity: 2 } },
      { id: 'i3', system: { location: 'stowed', size: 'large', quantity: 1 } }
    ]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'weight' });
    expect(res.used).toBe(75);
    expect(res.max).toBe(100);
    expect(res.isEncumbered).toBe(false);
  });

  it('applies the immediate bag modifier and counts the bag itself', () => {
    const bp = { id: 'bp1', type: 'backpack', system: { equipped: true, modifier: 0.5, capacity: 10, location: 'stowed', size: 'medium', quantity: 1 } };
    const item = { id: 'i1', system: { location: 'bp1', size: 'large', quantity: 1 } };
    const items = makeItems([bp, item]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'weight', equippedBackpackId: 'bp1' });
    // bag medium=10, large in bag 50*0.5=25 -> 35
    expect(res.used).toBe(35);
    expect(res.max).toBe(200); // 100 base + capacity 10 * 10
  });

  it('does not count items inside an unequipped bag', () => {
    const bp = { id: 'bp1', type: 'backpack', system: { equipped: false, modifier: 0.5, location: 'stowed', size: 'medium', quantity: 1 } };
    const item = { id: 'i1', system: { location: 'bp1', size: 'large', quantity: 1 } };
    const items = makeItems([bp, item]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'weight', equippedBackpackId: '' });
    // only the stowed bag itself counts (medium=10); item inside not carried
    expect(res.used).toBe(10);
  });

  it('nested bags do not cascade modifiers (only the direct bag counts)', () => {
    const outer = { id: 'outer', type: 'backpack', system: { equipped: true, modifier: 0.5, capacity: 0, location: 'stowed', size: 'medium', quantity: 1 } };
    const inner = { id: 'inner', type: 'backpack', system: { equipped: true, modifier: 0.5, capacity: 0, location: 'outer', size: 'medium', quantity: 1 } };
    const item = { id: 'i1', system: { location: 'inner', size: 'large', quantity: 1 } };
    const items = makeItems([outer, inner, item]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'weight', equippedBackpackId: 'outer' });
    // outer bag (stowed): medium 10
    // inner bag in outer: medium 10 * 0.5 = 5
    // item in inner: large 50 * 0.5 = 25 (direct bag modifier only, no cascade)
    expect(res.used).toBe(40);
  });
});

describe('computeEncumbrance - slots mode', () => {
  it('computes slots and max from 5 + endurance', () => {
    const items = makeItems([
      { id: 'i1', system: { location: 'stowed', size: 'small', quantity: 11 } }, // 2 slots
      { id: 'i2', system: { location: 'stowed', size: 'medium', quantity: 3 } }, // 3 slots
      { id: 'i3', system: { location: 'stowed', size: 'large', quantity: 1, slots: 4 } } // 4 slots
    ]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'slots' });
    expect(res.used).toBe(9);
    expect(res.max).toBe(15); // 5 + 10
    expect(res.isEncumbered).toBe(false);
  });

  it('adds bag capacity to max slots and ignores modifier for slot cost', () => {
    const bp = { id: 'bp1', type: 'backpack', system: { equipped: true, modifier: 0.5, capacity: 5, location: 'stowed', size: 'medium', quantity: 1 } };
    const item = { id: 'i1', system: { location: 'bp1', size: 'large', quantity: 1, slots: 3 } };
    const items = makeItems([bp, item]);
    const res = computeEncumbrance(items, { itemsById: items, endurance: 10, mode: 'slots', equippedBackpackId: 'bp1' });
    // bag medium = 1 slot, large item = 3 slots (no modifier reduction in slot mode)
    expect(res.used).toBe(4);
    expect(res.max).toBe(20); // 5 + 10 + capacity 5
  });
});

describe('computeArmorRepair', () => {
  it('fully repairs with no max loss on success', () => {
    const r = computeArmorRepair({ value: 4, max: 10, rollTotal: 30, alternate: false });
    expect(r.difficulty).toBe(30); // 5 * 6 missing
    expect(r.maxLost).toBe(0);
    expect(r.newMax).toBe(10);
    expect(r.newValue).toBe(10);
    expect(r.success).toBe(true);
  });

  it('loses 1 max for shortfall of 1-5 (normal)', () => {
    // difficulty 30, roll 29 -> shortfall 1 -> lose 1; roll 25 -> shortfall 5 -> lose 1
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 29 }).maxLost).toBe(1);
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 25 }).maxLost).toBe(1);
    const r = computeArmorRepair({ value: 4, max: 10, rollTotal: 25 });
    expect(r.newMax).toBe(9);
    expect(r.newValue).toBe(9);
  });

  it('loses 2 max for shortfall of 6-10 (normal)', () => {
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 24 }).maxLost).toBe(2);
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 20 }).maxLost).toBe(2);
  });

  it('uses a divisor of 10 for alternate armour', () => {
    // missing 6 -> difficulty 60; roll 51 (shortfall 9) -> lose 1; roll 50 (shortfall 10) -> lose 1
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 51, alternate: true }).maxLost).toBe(1);
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 50, alternate: true }).maxLost).toBe(1);
    expect(computeArmorRepair({ value: 4, max: 10, rollTotal: 49, alternate: true }).maxLost).toBe(2);
  });

  it('never loses more than the missing points', () => {
    const r = computeArmorRepair({ value: 4, max: 10, rollTotal: 0 });
    expect(r.maxLost).toBe(6); // missing
    expect(r.newMax).toBe(4);
    expect(r.newValue).toBe(4);
  });
});

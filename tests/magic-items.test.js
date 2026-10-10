import { describe, it, expect } from 'vitest';
import {
  hasMagicEffects, isItemEquipped, buildRequirementContext, requirementMet, unmetRequirements,
  computeMagicState, curseVisible, identityVisible, publicItemName, bonusDamageComponents, itemAttackBonus
} from '../src/utils/magic-items.js';

const magic = (over = {}) => ({
  requiresEquipped: true, modifiers: [], resistances: [], injuryCheckBonus: 0,
  sizeGrantHP: "", sizeGrantStealth: "", sizeGrantCombat: "", grantedAbilities: [],
  onHitStatusIds: [], bonusDamage: [], requirements: [], identified: true,
  unidentifiedName: "", unidentifiedDescription: "", cursed: false, curseRevealed: false,
  ...over
});
const withMods = (over = {}) => magic({ modifiers: [{ target: "stats.strength.value", value: 5 }], ...over });

function lookup(items) {
  const map = new Map(items.map(i => [i.id, i]));
  return { get: id => map.get(id) };
}

describe('hasMagicEffects', () => {
  it('is false for an empty block and true once anything is set', () => {
    expect(hasMagicEffects(magic())).toBe(false);
    expect(hasMagicEffects(undefined)).toBe(false);
    expect(hasMagicEffects(withMods())).toBe(true);
    expect(hasMagicEffects(magic({ onHitStatusIds: ["burning"] }))).toBe(true);
    expect(hasMagicEffects(magic({ sizeGrantHP: "large" }))).toBe(true);
  });
});

describe('isItemEquipped', () => {
  it('weapons equip by being in hand; worn types by the equipped flag', () => {
    expect(isItemEquipped({ type: "weapon", system: { location: "hand" } })).toBe(true);
    expect(isItemEquipped({ type: "weapon", system: { location: "stowed", equipped: true } })).toBe(false);
    expect(isItemEquipped({ type: "equipment", system: { equipped: true } })).toBe(true);
    expect(isItemEquipped({ type: "armor", system: { equipped: false } })).toBe(false);
    expect(isItemEquipped({ type: "ammo", system: { location: "hand" } })).toBe(false);
  });
});

describe('requirements', () => {
  const items = [
    { type: "trait", name: "Wizard training", system: { isProfession: true, profession: "Wizard", modifiers: [{ target: "allProfessionRolls", value: 15 }] } },
    { type: "race", name: "Elf", system: {} },
    { type: "skill", name: "Arcana", system: {} },
  ];
  const ctx = buildRequirementContext(items, { wisdom: 40, strength: 20 });

  it('stat: total must reach the minimum', () => {
    expect(requirementMet({ type: "stat", key: "wisdom", value: 40 }, ctx)).toBe(true);
    expect(requirementMet({ type: "stat", key: "strength", value: 25 }, ctx)).toBe(false);
  });

  it('profession: name match (case-insensitive) and minimum rank', () => {
    expect(requirementMet({ type: "profession", key: "wizard", value: 0 }, ctx)).toBe(true);
    expect(requirementMet({ type: "profession", key: "Wizard", value: 3 }, ctx)).toBe(true);
    expect(requirementMet({ type: "profession", key: "Wizard", value: 4 }, ctx)).toBe(false);
    expect(requirementMet({ type: "profession", key: "Cleric", value: 0 }, ctx)).toBe(false);
  });

  it('race and skill: name match', () => {
    expect(requirementMet({ type: "race", key: "elf" }, ctx)).toBe(true);
    expect(requirementMet({ type: "race", key: "Dwarf" }, ctx)).toBe(false);
    expect(requirementMet({ type: "skill", key: "ARCANA" }, ctx)).toBe(true);
    expect(requirementMet({ type: "skill", key: "Stealth" }, ctx)).toBe(false);
  });

  it('an empty key is ignored', () => {
    expect(requirementMet({ type: "race", key: "" }, ctx)).toBe(true);
  });

  it('unmetRequirements lists only the failing ones', () => {
    const m = magic({ requirements: [{ type: "stat", key: "wisdom", value: 10 }, { type: "race", key: "Dwarf" }] });
    expect(unmetRequirements(m, ctx)).toEqual([{ type: "race", key: "Dwarf" }]);
  });
});

describe('computeMagicState', () => {
  const ctx = buildRequirementContext([], { wisdom: 30 });

  it('requires equipped: passive only while equipped, on-use regardless', () => {
    const ring = { id: "r", type: "equipment", system: { equipped: false, location: "stowed", magic: withMods() } };
    let state = computeMagicState([ring], ctx, lookup([ring]));
    expect(state.r).toEqual({ requirementsMet: true, passive: false, onUse: true });
    ring.system.equipped = true;
    state = computeMagicState([ring], ctx, lookup([ring]));
    expect(state.r.passive).toBe(true);
  });

  it('carried-only items work from a worn bag but not from an unequipped one', () => {
    const bag = { id: "b", type: "backpack", system: { equipped: true, location: "stowed", magic: magic() } };
    const charm = { id: "c", type: "equipment", system: { equipped: false, location: "b", magic: withMods({ requiresEquipped: false }) } };
    expect(computeMagicState([bag, charm], ctx, lookup([bag, charm])).c.passive).toBe(true);
    bag.system.equipped = false;
    expect(computeMagicState([bag, charm], ctx, lookup([bag, charm])).c.passive).toBe(false);
  });

  it('unmet requirements switch everything off', () => {
    const staff = { id: "s", type: "weapon", system: { location: "hand",
      magic: withMods({ requirements: [{ type: "stat", key: "wisdom", value: 40 }] }) } };
    expect(computeMagicState([staff], ctx, lookup([staff])).s).toEqual({ requirementsMet: false, passive: false, onUse: false });
  });

  it('ammo ignores requires-equipped; mundane items are skipped', () => {
    const arrows = { id: "a", type: "ammo", system: { location: "stowed", magic: magic({ bonusDamage: [{ damageType: "fire", amount: 3 }] }) } };
    const rope = { id: "x", type: "equipment", system: { location: "stowed", magic: magic() } };
    const state = computeMagicState([arrows, rope], ctx, lookup([arrows, rope]));
    expect(state.a.passive).toBe(true);
    expect(state.x).toBeUndefined();
  });
});

describe('visibility', () => {
  it('curse entries are hidden from players until revealed', () => {
    expect(curseVisible(magic({ cursed: true }), false)).toBe(false);
    expect(curseVisible(magic({ cursed: true }), true)).toBe(true);
    expect(curseVisible(magic({ cursed: true, curseRevealed: true }), false)).toBe(true);
    expect(curseVisible(magic(), false)).toBe(true);
  });

  it('unidentified items hide their identity from players', () => {
    expect(identityVisible(magic({ identified: false }), false)).toBe(false);
    expect(identityVisible(magic({ identified: false }), true)).toBe(true);
    expect(identityVisible(magic(), false)).toBe(true);
  });

  it('publicItemName uses the unidentified name, then the fallback', () => {
    const item = { name: "Flametongue", system: { magic: magic({ identified: false, unidentifiedName: "Warm Sword" }) } };
    expect(publicItemName(item)).toBe("Warm Sword");
    item.system.magic.unidentifiedName = "";
    expect(publicItemName(item, "Unidentified Item")).toBe("Unidentified Item");
    item.system.magic.identified = true;
    expect(publicItemName(item)).toBe("Flametongue");
    expect(publicItemName({ name: "Rope", system: {} })).toBe("Rope");
  });
});

describe('bonusDamageComponents', () => {
  it('floors amounts and drops empty entries', () => {
    expect(bonusDamageComponents(magic({ bonusDamage: [
      { damageType: "fire", amount: 5.7 }, { damageType: "cold", amount: 0 }, { damageType: "", amount: 2 }
    ] }))).toEqual([{ damageType: "fire", damage: 5 }, { damageType: "", damage: 2 }]);
  });
});

describe('itemAttackBonus', () => {
  it('sums only the "Attacks with this item" modifiers, curse entries included', () => {
    expect(itemAttackBonus(magic({ modifiers: [
      { target: "itemAttacks", value: 10 },
      { target: "allRolls", value: 5 },
      { target: "itemAttacks", value: -15, curse: true },
    ] }))).toBe(-5);
    expect(itemAttackBonus(magic())).toBe(0);
    expect(itemAttackBonus(undefined)).toBe(0);
  });
});

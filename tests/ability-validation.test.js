import { describe, it, expect } from 'vitest';
import { getAbilityIssues, mishapEffectCount } from '../src/utils/ability-validation.js';

// A clean, valid ability: cost 1, no attack, no calculator.
function ability(overrides = {}) {
  return {
    cost: 1, resource: "stamina", isApex: false, isPassive: false, passiveBonus: 0,
    isAttack: false, useWeaponDamage: false, damageType: "", damageComponents: [],
    calculatedDamage: 0, inflictsStatusId: "", tags: "",
    uses: { value: 0, max: 0 },
    calculator: { enabled: false, effects: 0, rollBonus: 0, ignoreArmor: 0 },
    rawCalculatedCost: 0,
    ...overrides
  };
}
const keys = (sys, ctx) => getAbilityIssues(sys, ctx).map(i => i.key);
const ON_ACTOR = { onActor: true, customResources: [{ name: "Mana" }], statusIds: ["bleeding", "prone"] };

describe('getAbilityIssues', () => {
  it('a valid ability has no issues', () => {
    expect(getAbilityIssues(ability(), ON_ACTOR)).toEqual([]);
  });

  describe('noDamageType (error)', () => {
    it('flags an attack with no damage type', () => {
      expect(keys(ability({ isAttack: true, calculatedDamage: 5 }), ON_ACTOR)).toContain("noDamageType");
    });
    it('accepts a legacy damageType or a typed component', () => {
      expect(keys(ability({ isAttack: true, calculatedDamage: 5, damageType: "fire" }), ON_ACTOR)).not.toContain("noDamageType");
      expect(keys(ability({ isAttack: true, calculatedDamage: 5, damageComponents: [{ damageType: "fire", amount: 5 }] }), ON_ACTOR)).not.toContain("noDamageType");
    });
    it('skips weapon-damage attacks', () => {
      expect(keys(ability({ isAttack: true, useWeaponDamage: true }), ON_ACTOR)).toEqual([]);
    });
  });

  describe('zeroDamage (error)', () => {
    it('flags an attack dealing 0 on an actor', () => {
      expect(keys(ability({ isAttack: true, damageType: "fire" }), ON_ACTOR)).toContain("zeroDamage");
    });
    it('does not flag positive damage', () => {
      expect(keys(ability({ isAttack: true, damageType: "fire", calculatedDamage: 4 }), ON_ACTOR)).not.toContain("zeroDamage");
    });
    it('is skipped off-actor (damage formula needs the actor) unless components are set', () => {
      expect(keys(ability({ isAttack: true, damageType: "fire" }))).not.toContain("zeroDamage");
      expect(keys(ability({ isAttack: true, damageComponents: [{ damageType: "fire", amount: 0 }] }))).toContain("zeroDamage");
    });
  });

  describe('missingResource (error)', () => {
    it('flags an index past the end of customResources', () => {
      expect(keys(ability({ resource: "3" }), ON_ACTOR)).toContain("missingResource");
    });
    it('accepts stamina and existing indices', () => {
      expect(keys(ability({ resource: "0" }), ON_ACTOR)).not.toContain("missingResource");
    });
    it('is skipped off-actor and for Apex', () => {
      expect(keys(ability({ resource: "3" }))).not.toContain("missingResource");
      expect(keys(ability({ resource: "3", isApex: true }), ON_ACTOR)).not.toContain("missingResource");
    });
  });

  describe('zeroCost (error)', () => {
    it('flags a manual cost of 0', () => {
      expect(keys(ability({ cost: 0 }), ON_ACTOR)).toContain("zeroCost");
    });
    it('skips Apex, passive, uses-limited and calculator abilities', () => {
      expect(keys(ability({ cost: 0, isApex: true }), ON_ACTOR)).not.toContain("zeroCost");
      expect(keys(ability({ cost: 0, isPassive: true, passiveBonus: 5 }), ON_ACTOR)).not.toContain("zeroCost");
      expect(keys(ability({ cost: 0, uses: { value: 3, max: 3 } }), ON_ACTOR)).not.toContain("zeroCost");
      expect(keys(ability({ cost: 0, calculator: { enabled: true, effects: 1 }, rawCalculatedCost: 1 }), ON_ACTOR)).not.toContain("zeroCost");
    });
  });

  describe('passiveNoBonus (error)', () => {
    it('flags a passive with no bonus', () => {
      expect(keys(ability({ isPassive: true }), ON_ACTOR)).toContain("passiveNoBonus");
      expect(keys(ability({ isPassive: true, passiveBonus: 5 }), ON_ACTOR)).not.toContain("passiveNoBonus");
    });
  });

  describe('mishapNoEffects (warning)', () => {
    const calc0 = { enabled: true, effects: 0, rollBonus: 0, ignoreArmor: 0 };
    it('flags a magic-tagged calculator ability with 0 effects', () => {
      const issues = getAbilityIssues(ability({ tags: "Spell, Fire", calculator: calc0, rawCalculatedCost: 1 }), ON_ACTOR);
      expect(issues).toContainEqual({ level: "warning", key: "mishapNoEffects" });
    });
    it('does not flag once effects are set, or for non-magic / calculator-off abilities', () => {
      expect(keys(ability({ tags: "spell", calculator: { ...calc0, effects: 2 }, rawCalculatedCost: 2 }), ON_ACTOR)).not.toContain("mishapNoEffects");
      expect(keys(ability({ tags: "melee", calculator: calc0, rawCalculatedCost: 1 }), ON_ACTOR)).not.toContain("mishapNoEffects");
      expect(keys(ability({ tags: "spell" }), ON_ACTOR)).not.toContain("mishapNoEffects");
    });
  });

  describe('unknownStatus (warning)', () => {
    it('flags an id not in the status list', () => {
      expect(keys(ability({ inflictsStatusId: "frozzen" }), ON_ACTOR)).toContain("unknownStatus");
      expect(keys(ability({ inflictsStatusId: "prone" }), ON_ACTOR)).not.toContain("unknownStatus");
    });
    it('is skipped when no status list is given', () => {
      expect(keys(ability({ inflictsStatusId: "frozzen" }), { onActor: true })).not.toContain("unknownStatus");
    });
  });

  describe('calcCostBelowOne (warning)', () => {
    it('flags a raw calculator cost under 1', () => {
      expect(keys(ability({ calculator: { enabled: true }, rawCalculatedCost: -1 }), ON_ACTOR)).toContain("calcCostBelowOne");
      expect(keys(ability({ calculator: { enabled: true }, rawCalculatedCost: 1 }), ON_ACTOR)).not.toContain("calcCostBelowOne");
    });
  });

  it('sorts errors before warnings', () => {
    const issues = getAbilityIssues(ability({
      tags: "magic", calculator: { enabled: true, effects: 0 }, rawCalculatedCost: 0,
      isPassive: true
    }), ON_ACTOR);
    expect(issues[0].level).toBe("error");
    expect(issues.at(-1).level).toBe("warning");
  });
});

describe('mishapEffectCount', () => {
  it('matches the Mishap Check formula', () => {
    expect(mishapEffectCount({ effects: 2, rollBonus: 12, ignoreArmor: 1 })).toBe(5);
    expect(mishapEffectCount(undefined)).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import {
  professionRank, professionStaminaMultBonus, professionResourceMultBonus
} from '../src/utils/profession.js';
import { TAMSCharacterData } from '../src/models/character.js';

const rankMods = bonus => [{ target: "allProfessionRolls", value: bonus }];

describe('professionRank', () => {
  it('reads the All Profession Rolls modifier 1:1 (+5 per rank)', () => {
    expect(professionRank(rankMods(5))).toBe(1);
    expect(professionRank(rankMods(25))).toBe(5);
    expect(professionRank(rankMods(50))).toBe(10);
  });
  it('ignores other modifiers, floors odd values and clamps to 0–10', () => {
    expect(professionRank([{ target: "allRolls", value: 20 }])).toBe(0);
    expect(professionRank(rankMods(7))).toBe(1);
    expect(professionRank(rankMods(80))).toBe(10);
    expect(professionRank(rankMods(-5))).toBe(0);
    expect(professionRank()).toBe(0);
  });
});

describe('professionStaminaMultBonus', () => {
  it('Basic: +0.25 per rank from rank 1', () => {
    expect(professionStaminaMultBonus("basic", 1)).toBe(0.25);
    expect(professionStaminaMultBonus("basic", 10)).toBe(2.5);
  });
  it('Full caster: none until rank 4', () => {
    expect([1, 2, 3, 4, 5, 10].map(r => professionStaminaMultBonus("full", r)))
      .toEqual([0, 0, 0, 0.25, 0.5, 1.75]);
  });
  it('Half / Three-Quarter caster: none until rank 3', () => {
    for (const type of ["half", "threeQuarter"]) {
      expect([1, 2, 3, 4, 10].map(r => professionStaminaMultBonus(type, r)))
        .toEqual([0, 0, 0.25, 0.5, 2]);
    }
  });
  it('rank 0 gives nothing; unknown type falls back to Basic', () => {
    expect(professionStaminaMultBonus("full", 0)).toBe(0);
    expect(professionStaminaMultBonus("", 2)).toBe(0.5);
  });
});

describe('professionResourceMultBonus', () => {
  it('casters: rank 1 is the base bar, +0.25 per rank after', () => {
    for (const type of ["full", "half", "threeQuarter"]) {
      expect([1, 2, 3, 4, 10].map(r => professionResourceMultBonus(type, r)))
        .toEqual([0, 0.25, 0.5, 0.75, 2.25]);
    }
  });
  it('Basic professions have no resource bar boost', () => {
    expect(professionResourceMultBonus("basic", 5)).toBe(0);
  });
});

describe('TAMSCharacterData profession derivation', () => {
  function makeData(items, customResources = []) {
    const d = new TAMSCharacterData();
    d.stats = { endurance: { total: 20 }, intelligence: { total: 20 } };
    d.stamina = { mult: 1.0, max: 0, fatigue: 0 };
    d.customResources = customResources;
    d.settings = {};
    d.parent = { items };
    return d;
  }
  const trait = (id, professionType, bonus) => ({
    id, type: "trait",
    system: { isProfession: true, profession: id, professionType, modifiers: rankMods(bonus) }
  });

  it('Basic rank 3 raises the Stamina multiplier by 0.75', () => {
    const d = makeData([trait("smith", "basic", 15)]);
    d._prepareTraitModifiers();
    d._prepareStamina();
    expect(d.staminaEffectiveMult()).toBe(1.75);
    expect(d.stamina.max).toBe(35); // floor(20 × 1.75)
  });

  it('Full caster rank 5 boosts its linked resource and Stamina', () => {
    const mana = { name: "Mana", stat: "intelligence", mult: 1.0, bonus: 0, fatigue: 0, professionTraitId: "mage" };
    const unlinked = { name: "Ki", stat: "intelligence", mult: 0.5, bonus: 0, fatigue: 0, professionTraitId: "" };
    const d = makeData([trait("mage", "full", 25)], [mana, unlinked]);
    d._prepareTraitModifiers();
    d._prepareStamina();
    d._prepareCustomResources();
    expect(mana.max).toBe(40);      // 20 × (1 + 1.0)
    expect(unlinked.max).toBe(10);  // untouched: 20 × 0.5
    expect(d.stamina.max).toBe(30); // 20 × (1 + 0.5)
  });

  it('non-profession traits grant nothing', () => {
    const d = makeData([{ id: "x", type: "trait", system: { isProfession: false, modifiers: rankMods(50) } }]);
    d._prepareTraitModifiers();
    expect(d.staminaEffectiveMult()).toBe(1);
  });
});

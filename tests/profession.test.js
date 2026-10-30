import { describe, it, expect } from 'vitest';
import {
  professionRank, rankRewardTarget, distributeProfessionRewards, stampRanksReached
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

const prof = (id, type, rank, extra = {}) => ({ id, type, rank, ...extra });
const ranks = (type, n, picks) => distributeProfessionRewards([prof("p", type, n, { picks })]);

describe('rankRewardTarget', () => {
  it('Basic: Stamina every rank', () => {
    expect([1, 2, 10].map(r => rankRewardTarget("basic", r))).toEqual(["stamina", "stamina", "stamina"]);
  });
  it('casters: rank 1 is the bar, then resource until the pick rank', () => {
    expect([1, 2, 3, 4].map(r => rankRewardTarget("full", r, { 2: "stamina" })))
      .toEqual([null, "resource", "resource", "resource"]);
    expect(rankRewardTarget("full", 5, { 5: "stamina" })).toBe("stamina");
    expect(rankRewardTarget("threeQuarter", 3, { 3: "stamina" })).toBe("resource");
    expect(rankRewardTarget("threeQuarter", 4, { 4: "stamina" })).toBe("stamina");
    expect(rankRewardTarget("half", 3, { 3: "stamina" })).toBe("stamina");
    expect(rankRewardTarget("quarter", 2, { 2: "stamina" })).toBe("stamina");
  });
  it('an unmade pick defaults to the resource', () => {
    expect(rankRewardTarget("quarter", 2)).toBe("resource");
  });
});

describe('distributeProfessionRewards', () => {
  it('Basic rank 3: +0.75 Stamina', () => {
    expect(ranks("basic", 3).staminaMult).toBe(0.75);
  });
  it('Full rank 6: +1.0 resource, rank 6 pick to Stamina', () => {
    const r = ranks("full", 6, { 5: "resource", 6: "stamina" });
    expect(r.resourceMult.p).toBe(1);
    expect(r.staminaMult).toBe(0.25);
  });
  it('Quarter rank 2 picking Stamina gives no resource gain', () => {
    const r = ranks("quarter", 2, { 2: "stamina" });
    expect(r.resourceMult.p).toBeUndefined();
    expect(r.staminaMult).toBe(0.25);
  });
  it('each rank is rewarded once, by whichever profession reached it first', () => {
    // Fighter hit ranks 1–3 first; Mage caught up later and then reached rank 4.
    const fighter = prof("fighter", "basic", 3, { reachedAt: [10, 20, 30] });
    const mage = prof("mage", "half", 4, { reachedAt: [40, 50, 60, 70] });
    const r = distributeProfessionRewards([mage, fighter]);
    expect(r.owners).toEqual({ 1: "fighter", 2: "fighter", 3: "fighter", 4: "mage" });
    expect(r.staminaMult).toBe(0.75);
    expect(r.resourceMult).toEqual({ mage: 0.25 });
  });
  it('unstamped ranks count as earliest; equal stamps fall back to list order', () => {
    const a = prof("a", "basic", 2);
    const b = prof("b", "full", 2, { reachedAt: [5, 5] });
    expect(distributeProfessionRewards([b, a]).owners).toEqual({ 1: "a", 2: "a" });
    expect(distributeProfessionRewards([prof("x", "basic", 1), prof("y", "basic", 1)]).owners[1]).toBe("x");
  });
  it('no professions → nothing', () => {
    expect(distributeProfessionRewards([])).toEqual({ staminaMult: 0, resourceMult: {}, owners: {} });
  });
});

describe('stampRanksReached', () => {
  it('stamps newly reached ranks and keeps older ones', () => {
    expect(stampRanksReached([1, 2], 2, 4, 99)).toEqual([1, 2, 99, 99]);
  });
  it('unstamped older ranks become 0 (earliest)', () => {
    expect(stampRanksReached([], 2, 3, 99)).toEqual([0, 0, 99]);
  });
  it('drops ranks given up, and returns null when the rank is unchanged', () => {
    expect(stampRanksReached([1, 2, 3], 3, 1, 99)).toEqual([1]);
    expect(stampRanksReached([1], 1, 1, 99)).toBeNull();
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

  it('Full caster rank 5 boosts its linked resource, and Stamina only by pick', () => {
    const mana = { name: "Mana", stat: "intelligence", mult: 1.0, bonus: 0, fatigue: 0, professionTraitId: "mage" };
    const unlinked = { name: "Ki", stat: "intelligence", mult: 0.5, bonus: 0, fatigue: 0, professionTraitId: "" };
    const mage = trait("mage", "full", 25);
    mage.system.professionPicks = { 5: "stamina" };
    const d = makeData([mage], [mana, unlinked]);
    d._prepareTraitModifiers();
    d._prepareStamina();
    d._prepareCustomResources();
    expect(mana.max).toBe(35);      // 20 × (1 + 0.75): ranks 2–4
    expect(unlinked.max).toBe(10);  // untouched: 20 × 0.5
    expect(d.stamina.max).toBe(25); // 20 × (1 + 0.25): rank 5 picked Stamina
  });

  it('non-profession traits grant nothing', () => {
    const d = makeData([{ id: "x", type: "trait", system: { isProfession: false, modifiers: rankMods(50) } }]);
    d._prepareTraitModifiers();
    expect(d.staminaEffectiveMult()).toBe(1);
  });
});

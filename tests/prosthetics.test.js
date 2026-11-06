import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fitProsthetics, prostheticAfterDamage, prostheticCondition } from '../src/utils/prosthetics.js';
import { computeMagicState } from '../src/utils/magic-items.js';
import { isLimbHittable, isLimbMissing, locationIsMissing, presentHitWeight } from '../src/utils/limbs.js';
import { TAMSActor } from '../src/documents/actor.js';

const arm = (over = {}) => ({
  id: 'arm', name: 'Arm', type: 'equipment',
  system: { equipped: true, location: 'stowed', prosthetic: { enabled: true, limb: 'leftArm', hp: { value: 10, max: 10 } }, ...over },
});
const lookup = (items) => ({ get: id => items.find(i => i.id === id) });
const fit = (items, limbs = { leftArm: { missing: true } }) => fitProsthetics(items, limbs, lookup(items));

describe('prostheticCondition', () => {
  it.each([
    [1, 10, false, false],
    [0, 10, true, false],
    [-9, 10, true, false],
    [-10, 10, true, true],
  ])('%i / %i', (value, max, broken, destroyed) => {
    expect(prostheticCondition({ value, max })).toEqual({ broken, destroyed });
  });
});

describe('prostheticAfterDamage', () => {
  it('stops at negative max', () => {
    expect(prostheticAfterDamage({ value: 3, max: 10 }, 50)).toEqual({ value: -10, broken: true, destroyed: true });
  });
  it('can go negative without being destroyed', () => {
    expect(prostheticAfterDamage({ value: 3, max: 10 }, 5)).toEqual({ value: -2, broken: true, destroyed: false });
  });
});

describe('fitProsthetics', () => {
  it('fits an equipped prosthetic to a missing limb', () => {
    const r = fit([arm()]);
    expect(r.byItem.arm).toEqual({ fitted: true, active: true, reason: null });
    expect(r.byLimb.leftArm).toMatchObject({ itemId: 'arm', value: 10, max: 10, broken: false });
  });
  it('removing it leaves the limb missing', () => {
    const r = fit([arm({ equipped: false })]);
    expect(r.byLimb.leftArm).toBeUndefined();
    expect(r.byItem.arm.reason).toBeNull();
  });
  it.each([
    ['noLimb', arm({ prosthetic: { enabled: true, limb: '', hp: { value: 5, max: 5 } } }), undefined],
    ['noHp', arm({ prosthetic: { enabled: true, limb: 'leftArm', hp: { value: 0, max: 0 } } }), undefined],
    ['limbPresent', arm(), { leftArm: { missing: false } }],
  ])('reports %s', (reason, item, limbs) => {
    expect(fit([item], limbs).byItem.arm).toEqual({ fitted: false, active: false, reason });
  });
  it('allows one per limb, and a working one beats a destroyed one', () => {
    const dead = { ...arm({ prosthetic: { enabled: true, limb: 'leftArm', hp: { value: -10, max: 10 } } }), id: 'dead' };
    const r = fit([dead, arm()]);
    expect(r.byLimb.leftArm.itemId).toBe('arm');
    expect(r.byItem.dead.reason).toBe('limbTaken');
  });
  it('is not fitted inside an unequipped bag', () => {
    const bag = { id: 'bag', type: 'backpack', system: { equipped: false } };
    const items = [bag, arm({ location: 'bag' })];
    expect(fit(items).byItem.arm.fitted).toBe(false);
  });
  it('a broken one stays fitted but goes inactive', () => {
    const r = fit([arm({ prosthetic: { enabled: true, limb: 'leftArm', hp: { value: 0, max: 10 } } })]);
    expect(r.byItem.arm).toEqual({ fitted: true, active: false, reason: null });
  });
  it('ignores equipment that is not a prosthetic', () => {
    const r = fit([arm({ prosthetic: { enabled: false, limb: 'leftArm', hp: { value: 5, max: 5 } } })]);
    expect(r.byLimb).toEqual({});
  });
});

describe('limb table with a prosthetic', () => {
  it('can be hit while fitted, but is still not a flesh limb', () => {
    const limb = { missing: true, prosthetic: { destroyed: false } };
    expect(isLimbMissing(limb)).toBe(true);
    expect(isLimbHittable(limb)).toBe(true);
    expect(locationIsMissing('Left Arm', { leftArm: limb })).toBe(false);
    expect(presentHitWeight({ leftArm: limb })).toBe(100);
  });
  it('cannot be hit once destroyed', () => {
    const limb = { missing: true, prosthetic: { destroyed: true } };
    expect(isLimbHittable(limb)).toBe(false);
    expect(presentHitWeight({ leftArm: limb })).toBe(90);
  });
});

describe('magic effects of a prosthetic', () => {
  const item = (hp) => arm({
    prosthetic: { enabled: true, limb: 'leftArm', hp },
    magic: { requiresEquipped: true, modifiers: [{ target: 'stats.strength.value', value: 5 }], requirements: [] },
  });
  const state = (it, limbs) => {
    const items = [it];
    return computeMagicState(items, { stats: {}, professions: [], races: [], skills: [] }, lookup(items), fit(items, limbs)).arm;
  };
  it('apply while it works', () => expect(state(item({ value: 1, max: 10 })).passive).toBe(true));
  it('stop when broken', () => expect(state(item({ value: 0, max: 10 })).passive).toBe(false));
  it('stop when the limb is not missing', () => expect(state(item({ value: 5, max: 10 }), { leftArm: {} }).passive).toBe(false));
});

describe('applyTAMSDamage on a prosthetic', () => {
  let actor;
  const setHp = (value, max = 10) => {
    actor.system.limbs.leftArm.missing = true;
    actor.system.limbs.leftArm.prosthetic = { itemId: 'arm', value, max, ...prostheticCondition({ value, max }) };
  };
  const hit = (damage, extra = {}) => actor.applyTAMSDamage([{ damage, location: 'Left Arm', armourPen: 0, ...extra }]);
  const limb = (o = {}) => ({ value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, otherArmor: 0, injured: false, criticallyInjured: false, label: 'L', ...o });

  beforeEach(() => {
    global.game = { i18n: { localize: k => k, format: (k, d) => `${k} ${JSON.stringify(d)}` } };
    actor = new TAMSActor({ name: 'T', system: {
      stats: { endurance: { total: 10 } },
      limbs: { head: limb(), thorax: limb(), stomach: limb(), leftArm: limb(), rightArm: limb(), leftLeg: limb(), rightLeg: limb() },
      hp: { value: 42, max: 42 }, settings: { isNPC: false, alternateArmour: false },
    } });
    actor.items = { get: vi.fn(), filter: vi.fn(() => []) };
    actor.updateEmbeddedDocuments = vi.fn(async () => []);
  });

  it('damages the item, not the limb, with no checks', async () => {
    setHp(10);
    const { pendingChecks } = await hit(4);
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'arm', 'system.prosthetic.hp.value': 6 }]);
    expect(actor.system.limbs.leftArm.value).toBe(7);
    expect(actor.system.limbs.leftArm.injured).toBe(false);
    expect(pendingChecks).toEqual([]);
  });

  it('armour still protects it', async () => {
    setHp(10);
    actor.system.limbs.leftArm.armor = 3;
    await hit(4);
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'arm', 'system.prosthetic.hp.value': 9 }]);
  });

  it('reports breaking once', async () => {
    setHp(2);
    expect((await hit(5)).report).toContain('TAMS.Prosthetic.BrokenReport');
    setHp(-1);
    expect((await hit(1)).report).not.toContain('TAMS.Prosthetic.BrokenReport');
  });

  it('is destroyed at negative max and the excess is lost', async () => {
    setHp(3);
    const { report, pendingChecks } = await hit(100);
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'arm', 'system.prosthetic.hp.value': -10 }]);
    expect(report).toContain('TAMS.Prosthetic.DestroyedReport');
    expect(pendingChecks).toEqual([]);
    expect(actor.system.limbs.thorax.value).toBe(7);
  });

  it('a later hit in the same attack rerolls once it is destroyed', async () => {
    setHp(-9);
    await actor.applyTAMSDamage([
      { damage: 5, location: 'Left Arm', armourPen: 0 },
      { damage: 2, location: 'Left Arm', armourPen: 0 },
    ]);
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'arm', 'system.prosthetic.hp.value': -10 }]);
    const others = ['thorax', 'head', 'stomach', 'rightArm', 'leftLeg', 'rightLeg'].map(k => actor.system.limbs[k].value);
    expect(others.reduce((a, b) => a + b, 0)).toBe(7 * 6 - 2);
  });

  it('a hit on a destroyed one rerolls', async () => {
    setHp(-10);
    const { report } = await hit(3);
    expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
    expect(report).toContain('TAMS.Checks.MissingLimbRerolled');
  });

  it('a healing resistance does not heal it', async () => {
    setHp(5);
    actor.system.effectiveResistances = [{ damageType: 'fire', category: 'healing', value: 2, limbs: [] }];
    await hit(4, { damageType: 'fire' });
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ _id: 'arm', 'system.prosthetic.hp.value': 5 }]);
    expect(actor.system.limbs.leftArm.value).toBe(7);
  });

  it('a damaged prosthetic head starts no dying countdown', async () => {
    actor.system.limbs.head.missing = true;
    actor.system.limbs.head.value = -50;
    actor.system.limbs.head.prosthetic = { itemId: 'h', value: 1, max: 5, broken: false, destroyed: false };
    actor.toggleStatusEffect = vi.fn();
    await actor.applyTAMSDamage([{ damage: 3, location: 'Head', armourPen: 0 }]);
    expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
  });
});
